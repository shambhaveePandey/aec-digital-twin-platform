"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import {
  type IotSource,
  type IotStatus,
  type SensorReading,
  MqttSource,
  SimulatorSource,
  isAlert,
} from "@/lib/twin/iot";

/** Latest reading per "guid|metric" key, plus a per-guid alert flag. */
export type TwinState = {
  /** Most recent reading for each guid+metric pair. */
  readings: Map<string, SensorReading>;
  /** GUIDs currently in an alert condition. */
  alertGuids: Set<string>;
  /** All GUIDs that have ever reported (the "live" sensor set). */
  activeGuids: Set<string>;
};

const EMPTY: TwinState = {
  readings: new Map(),
  alertGuids: new Set(),
  activeGuids: new Set(),
};

/**
 * Owns the active IoT source (simulator or MQTT), accumulates live readings,
 * and tracks which elements are active / in alert. Highlighting in the 3D
 * scene is handled by the panel reacting to `activeGuids` / `alertGuids`.
 */
export function useDigitalTwin(
  components: OBC.Components | null,
  model: FragmentsGroup | null,
) {
  const [status, setStatus] = useState<IotStatus>("disconnected");
  const [detail, setDetail] = useState<string>("");
  const [state, setState] = useState<TwinState>(EMPTY);
  const sourceRef = useRef<IotSource | null>(null);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setStatus("disconnected");
    setState(EMPTY);
  }, []);

  // Tear down on unmount or when the model changes.
  useEffect(() => stop, [stop, model]);

  const wire = useCallback((source: IotSource) => {
    sourceRef.current?.stop();
    sourceRef.current = source;

    source.onStatus((s, d) => {
      setStatus(s);
      if (d) setDetail(d);
    });

    source.onReading((r) => {
      setState((prev) => {
        const readings = new Map(prev.readings);
        readings.set(`${r.guid}|${r.metric}`, r);
        const activeGuids = new Set(prev.activeGuids).add(r.guid);
        const alertGuids = new Set(prev.alertGuids);
        if (isAlert(r)) alertGuids.add(r.guid);
        else alertGuids.delete(r.guid);
        return { readings, activeGuids, alertGuids };
      });
    });

    void source.start();
  }, []);

  /** Start the built-in offline simulator using the loaded model's GUIDs. */
  const startSimulator = useCallback(() => {
    if (!model) return;
    const sim = SimulatorSource.fromModel(model, 8);
    if (!sim) {
      setStatus("error");
      setDetail("Model has no elements to simulate");
      return;
    }
    setState(EMPTY);
    wire(sim);
  }, [model, wire]);

  /** Connect to a live MQTT broker over WebSockets. */
  const startMqtt = useCallback(
    (url: string, topicPrefix: string) => {
      setState(EMPTY);
      wire(new MqttSource(url, topicPrefix));
    },
    [wire],
  );

  return {
    status,
    detail,
    state,
    startSimulator,
    startMqtt,
    stop,
    isRunning: status === "connected" || status === "connecting",
  };
}
