import type { FragmentsGroup } from "@thatopen/fragments";

/**
 * A single live sensor reading bound to an IFC element by its GlobalId.
 * Brokers publish JSON payloads of this shape on a per-element topic; the
 * built-in simulator emits the same shape so the UI is identical online or
 * offline.
 */
export type SensorReading = {
  /** IFC GlobalId (22-char base64) of the element this reading belongs to. */
  guid: string;
  /** Metric name, e.g. "temperature", "co2", "occupancy". */
  metric: string;
  value: number;
  unit: string;
  /** Epoch milliseconds. */
  ts: number;
};

export type SensorListener = (reading: SensorReading) => void;

/** Status of an IoT source. */
export type IotStatus = "disconnected" | "connecting" | "connected" | "error";

/**
 * Common interface implemented by both the live MQTT source and the offline
 * simulator, so the UI does not care which is active.
 */
export interface IotSource {
  readonly kind: "mqtt" | "simulator";
  start(): Promise<void>;
  stop(): void;
  onReading(listener: SensorListener): () => void;
  onStatus(listener: (status: IotStatus, detail?: string) => void): () => void;
}

abstract class BaseSource implements IotSource {
  abstract readonly kind: "mqtt" | "simulator";
  protected readingListeners = new Set<SensorListener>();
  protected statusListeners = new Set<(s: IotStatus, d?: string) => void>();

  abstract start(): Promise<void>;
  abstract stop(): void;

  onReading(listener: SensorListener): () => void {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  onStatus(listener: (status: IotStatus, detail?: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  protected emitReading(r: SensorReading) {
    for (const l of this.readingListeners) l(r);
  }

  protected emitStatus(s: IotStatus, detail?: string) {
    for (const l of this.statusListeners) l(s, detail);
  }
}

/**
 * Live IoT source backed by an MQTT broker over WebSockets. Works with any
 * public broker that exposes a WS/WSS endpoint (e.g. EMQX `broker.emqx.io:8084`
 * or HiveMQ public broker). Topic convention:
 *
 *   <topicPrefix>/<guid>   payload: SensorReading JSON
 *
 * Subscribing with a `+` wildcard picks up every element's readings.
 */
export class MqttSource extends BaseSource {
  readonly kind = "mqtt" as const;
  private client: import("mqtt").MqttClient | null = null;

  constructor(
    private readonly url: string,
    private readonly topicPrefix: string,
  ) {
    super();
  }

  async start(): Promise<void> {
    this.emitStatus("connecting");
    try {
      const mqtt = await import("mqtt");
      const client = mqtt.connect(this.url, {
        connectTimeout: 8000,
        reconnectPeriod: 0, // we surface failures rather than silently looping
        clientId: `aec-twin-${Math.random().toString(16).slice(2, 10)}`,
      });
      this.client = client;

      const topic = `${this.topicPrefix}/+`;

      client.on("connect", () => {
        client.subscribe(topic, (err) => {
          if (err) this.emitStatus("error", err.message);
          else this.emitStatus("connected", `subscribed ${topic}`);
        });
      });

      client.on("message", (topicName: string, payload: Uint8Array) => {
        try {
          const guidFromTopic = topicName.split("/").pop() ?? "";
          const data = JSON.parse(new TextDecoder().decode(payload));
          const reading: SensorReading = {
            guid: data.guid ?? guidFromTopic,
            metric: data.metric ?? "value",
            value: Number(data.value),
            unit: data.unit ?? "",
            ts: data.ts ?? Date.now(),
          };
          if (reading.guid && Number.isFinite(reading.value)) {
            this.emitReading(reading);
          }
        } catch {
          // Ignore malformed payloads.
        }
      });

      client.on("error", (err: Error) => this.emitStatus("error", err.message));
      client.on("close", () => this.emitStatus("disconnected"));
    } catch (err) {
      this.emitStatus("error", err instanceof Error ? err.message : String(err));
    }
  }

  stop(): void {
    this.client?.end(true);
    this.client = null;
    this.emitStatus("disconnected");
  }
}

/**
 * Offline simulator. Picks a handful of real GlobalIds from the loaded model
 * and emits believable telemetry (temperature, CO2, occupancy) on an interval,
 * so the Digital Twin works with zero external infrastructure — ideal for a
 * static GitHub Pages deployment with no backend.
 */
export class SimulatorSource extends BaseSource {
  readonly kind = "simulator" as const;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly metrics = [
    { metric: "temperature", unit: "°C", base: 21, swing: 3 },
    { metric: "co2", unit: "ppm", base: 600, swing: 250 },
    { metric: "occupancy", unit: "people", base: 4, swing: 6 },
    { metric: "humidity", unit: "%", base: 45, swing: 12 },
  ];

  constructor(
    private readonly guids: string[],
    private readonly intervalMs = 1500,
  ) {
    super();
  }

  /**
   * Builds a simulator from a model by sampling up to `count` of its element
   * GlobalIds. Returns null if the model has no GlobalIds.
   */
  static fromModel(model: FragmentsGroup, count = 8): SimulatorSource | null {
    const all = Array.from(model.globalToExpressIDs.keys());
    if (all.length === 0) return null;
    // Evenly sample across the model so highlighted sensors are spread out.
    const step = Math.max(1, Math.floor(all.length / count));
    const picked: string[] = [];
    for (let i = 0; i < all.length && picked.length < count; i += step) {
      picked.push(all[i]);
    }
    return new SimulatorSource(picked);
  }

  get sensorGuids(): string[] {
    return this.guids;
  }

  async start(): Promise<void> {
    this.emitStatus("connecting");
    if (this.guids.length === 0) {
      this.emitStatus("error", "Model has no elements to simulate");
      return;
    }
    this.emitStatus("connected", `${this.guids.length} simulated sensors`);
    this.timer = setInterval(() => {
      const guid = this.guids[Math.floor(Math.random() * this.guids.length)];
      const m = this.metrics[Math.floor(Math.random() * this.metrics.length)];
      const value =
        m.metric === "occupancy"
          ? Math.max(0, Math.round(m.base + (Math.random() - 0.5) * m.swing))
          : Math.round((m.base + (Math.random() - 0.5) * m.swing) * 10) / 10;
      this.emitReading({
        guid,
        metric: m.metric,
        value,
        unit: m.unit,
        ts: Date.now(),
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emitStatus("disconnected");
  }
}

/**
 * Returns true when a reading should be treated as an alert for the given
 * metric (drives the red highlight in the viewer).
 */
export function isAlert(reading: SensorReading): boolean {
  switch (reading.metric) {
    case "temperature":
      return reading.value > 26 || reading.value < 16;
    case "co2":
      return reading.value > 1000;
    case "humidity":
      return reading.value > 65 || reading.value < 25;
    case "occupancy":
      return reading.value > 8;
    default:
      return false;
  }
}
