"use client";

import { useEffect, useState } from "react";
import type { SelectionState } from "@/lib/thatopen/types";

type Sensor = {
  id: string;
  name: string;
  unit: string | null;
  lastValue: number | null;
  status: string;
  thresholdMin: number | null;
  thresholdMax: number | null;
  ifcGuid: string | null;
};

type Props = {
  twinId: string;
  selectedElement: SelectionState;
};

function statusColor(sensor: Sensor): string {
  if (sensor.status === "STALE") return "text-neutral-500";
  if (sensor.status === "ERROR") return "text-red-400";
  if (sensor.lastValue === null) return "text-neutral-500";
  if (sensor.thresholdMax !== null && sensor.lastValue > sensor.thresholdMax)
    return "text-red-400";
  if (sensor.thresholdMin !== null && sensor.lastValue < sensor.thresholdMin)
    return "text-orange-400";
  return "text-green-400";
}

export function SensorOverlayPanel({ twinId, selectedElement }: Props) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/twins/${twinId}/sensors`)
      .then((r) => r.json())
      .then((d) => setSensors((d as { sensors: Sensor[] }).sensors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [twinId]);

  const elementSensors = selectedElement?.ifcGuid
    ? sensors.filter((s) => s.ifcGuid === selectedElement.ifcGuid)
    : sensors;

  return (
    <div className="viewer-panel overflow-y-auto">
      <div className="sticky top-0 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
        <span className="text-xs font-semibold text-neutral-400">
          {selectedElement?.ifcGuid
            ? `${elementSensors.length} bound sensor${elementSensors.length !== 1 ? "s" : ""}`
            : `${sensors.length} sensor${sensors.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border border-neutral-700 border-t-blue-400" />
        </div>
      ) : elementSensors.length === 0 ? (
        <p className="p-4 text-center text-xs text-neutral-600">
          {selectedElement ? "No sensors bound to this element" : "No sensors configured"}
        </p>
      ) : (
        <div className="divide-y divide-neutral-800">
          {elementSensors.map((sensor) => (
            <div key={sensor.id} className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-300">{sensor.name}</span>
                <span className={`text-xs font-mono font-semibold ${statusColor(sensor)}`}>
                  {sensor.lastValue !== null
                    ? `${sensor.lastValue}${sensor.unit ? ` ${sensor.unit}` : ""}`
                    : "—"}
                </span>
              </div>
              {(sensor.thresholdMin !== null || sensor.thresholdMax !== null) && (
                <p className="mt-0.5 text-xs text-neutral-600">
                  Range: {sensor.thresholdMin ?? "−∞"} – {sensor.thresholdMax ?? "+∞"}{" "}
                  {sensor.unit ?? ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
