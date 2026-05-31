"use client";

import { useEffect, useState } from "react";
import type { SelectionState } from "@/lib/thatopen/types";

type Props = {
  twinId: string;
  selectedElement: SelectionState;
};

type PropertySet = Record<string, unknown>;
type PropertiesResponse = {
  ifcGuid: string;
  ifcClass: string;
  name: string | null;
  spatialPath: string | null;
  propertySets: Record<string, PropertySet>;
};

export function PropertiesPanel({ twinId, selectedElement }: Props) {
  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedElement?.ifcGuid) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/twins/${twinId}/properties?ifcGuid=${encodeURIComponent(selectedElement.ifcGuid)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d) => { if (!cancelled) setData(d as PropertiesResponse); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [twinId, selectedElement?.ifcGuid]);

  if (!selectedElement) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-xs text-neutral-600">Select an element to inspect</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border border-neutral-700 border-t-blue-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-3 text-xs text-neutral-500">
        {error ?? "No properties found"}
      </div>
    );
  }

  return (
    <div className="viewer-panel overflow-y-auto p-3 text-xs">
      <div className="mb-3 space-y-1 border-b border-neutral-800 pb-3">
        <p className="font-semibold text-white">{data.name ?? "Unnamed"}</p>
        <p className="text-neutral-400">{data.ifcClass}</p>
        {data.spatialPath && (
          <p className="text-neutral-500">{data.spatialPath}</p>
        )}
      </div>

      {Object.entries(data.propertySets).map(([psetName, props]) => (
        <div key={psetName} className="mb-3">
          <p className="mb-1 font-medium text-neutral-300">{psetName}</p>
          <div className="space-y-0.5 rounded bg-neutral-800/50 p-2">
            {Object.entries(props).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="truncate text-neutral-400">{k}</span>
                <span className="shrink-0 text-neutral-200">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
