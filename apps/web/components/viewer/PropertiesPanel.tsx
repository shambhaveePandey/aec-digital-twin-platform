"use client";

import { useEffect, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { SelectionState } from "@/lib/thatopen/types";

type Props = {
  components: OBC.Components | null;
  models: FragmentsGroup[];
  selectedElement: SelectionState;
};

type FlatProps = {
  name: string | null;
  ifcClass: string | null;
  attributes: Record<string, string>;
};

/** Reads a string-ish value out of a web-ifc property entry. */
function readValue(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && v !== null && "value" in (v as object)) {
    const inner = (v as { value: unknown }).value;
    return inner === null || inner === undefined ? null : String(inner);
  }
  if (typeof v === "object") return null;
  return String(v);
}

export function PropertiesPanel({ components, models, selectedElement }: Props) {
  const [data, setData] = useState<FlatProps | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!components || !selectedElement || models.length === 0) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Find the model the selection belongs to, falling back to the first.
        const model =
          models.find((m) => (m as { uuid?: string }).uuid === selectedElement.modelUuid) ??
          models[0];

        // FragmentsGroup exposes getProperties(expressID) in @thatopen/fragments v2.
        const getProps = (model as unknown as {
          getProperties?: (id: number) => Promise<Record<string, unknown>> | Record<string, unknown>;
        }).getProperties;

        let raw: Record<string, unknown> | null = null;
        if (typeof getProps === "function") {
          raw = (await getProps.call(model, selectedElement.expressId)) ?? null;
        }

        if (cancelled) return;

        if (!raw) {
          setData({
            name: null,
            ifcClass: null,
            attributes: { expressId: String(selectedElement.expressId) },
          });
          return;
        }

        const attributes: Record<string, string> = {};
        for (const [key, value] of Object.entries(raw)) {
          const str = readValue(value);
          if (str !== null) attributes[key] = str;
        }

        setData({
          name: readValue(raw.Name) ?? null,
          ifcClass: (raw.type ? String(raw.type) : null) ?? null,
          attributes,
        });
      } catch {
        if (!cancelled) {
          setData({
            name: null,
            ifcClass: null,
            attributes: { expressId: String(selectedElement.expressId) },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [components, models, selectedElement]);

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

  if (!data) {
    return <div className="p-3 text-xs text-neutral-500">No properties found</div>;
  }

  return (
    <div className="viewer-panel overflow-y-auto p-3 text-xs">
      <div className="mb-3 space-y-1 border-b border-neutral-800 pb-3">
        <p className="font-semibold text-white">{data.name ?? "Unnamed element"}</p>
        {data.ifcClass && <p className="text-neutral-400">{data.ifcClass}</p>}
      </div>

      <div className="space-y-0.5 rounded bg-neutral-800/50 p-2">
        {Object.entries(data.attributes).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="truncate text-neutral-400">{k}</span>
            <span className="shrink-0 text-neutral-200">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
