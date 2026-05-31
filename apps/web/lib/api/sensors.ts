import type { Sensor, SensorReading } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function apiFetchSensors(twinId: string): Promise<Sensor[]> {
  const res = await fetch(`${BASE}/api/twins/${twinId}/sensors`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetchSensors failed: ${res.status}`);
  const data = (await res.json()) as { sensors: Sensor[] };
  return data.sensors;
}

export async function apiCreateSensor(
  twinId: string,
  data: {
    name: string;
    unit?: string;
    mqttTopic?: string;
    ifcGuid?: string;
    thresholdMin?: number;
    thresholdMax?: number;
  },
): Promise<Sensor> {
  const res = await fetch(`${BASE}/api/twins/${twinId}/sensors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createSensor failed: ${res.status}`);
  return res.json();
}
