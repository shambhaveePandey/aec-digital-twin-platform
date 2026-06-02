"use client";

import { useEffect, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { SelectedItem } from "@/lib/thatopen/selection";

type Props = {
  components: OBC.Components | null;
  models: FragmentsGroup[];
  /** All currently selected items (0, 1, or many). */
  selected: SelectedItem[];
};

type ElementProps = {
  expressId: number;
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

async function readElementProps(
  models: FragmentsGroup[],
  item: SelectedItem,
): Promise<ElementProps> {
  const model =
    models.find((m) => (m as { uuid?: string }).uuid === item.modelUuid) ??
    models[0];

  const getProps = (
    model as unknown as {
      getProperties?: (
        id: number,
      ) => Promise<Record<string, unknown>> | Record<string, unknown>;
    }
  ).getProperties;

  let raw: Record<string, unknown> | null = null;
  if (typeof getProps === "function") {
    raw = (await getProps.call(model, item.expressId)) ?? null;
  }

  if (!raw) {
    return {
      expressId: item.expressId,
      name: null,
      ifcClass: null,
      attributes: { expressId: String(item.expressId) },
    };
  }

  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const str = readValue(value);
    if (str !== null) attributes[key] = str;
  }

  return {
    expressId: item.expressId,
    name: readValue(raw.Name) ?? null,
    ifcClass: raw.type ? String(raw.type) : null,
    attributes,
  };
}

function ElementCard({ el, defaultOpen }: { el: ElementProps; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {el.name ?? "Unnamed element"}
          </p>
          {el.ifcClass && (
            <p className="truncate text-[11px] text-neutral-500">{el.ifcClass}</p>
          )}
        </div>
        <span className="shrink-0 text-neutral-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="space-y-0.5 border-t border-neutral-800 px-2.5 py-2 text-[11px]">
          {Object.entries(el.attributes).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="truncate text-neutral-500">{k}</span>
              <span className="shrink-0 text-neutral-300">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PropertiesPanel({ components, models, selected }: Props) {
  const [items, setItems] = useState<ElementProps[]>([]);
  const [loading, setLoading] = useState(false);

  // A stable key so the effect only re-runs when the actual selection changes.
  const selectionKey = selected
    .map((s) => `${s.modelUuid}:${s.expressId}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!components || selected.length === 0 || models.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Cap heavy reads for very large multi-selections.
        const MAX = 50;
        const subset = selected.slice(0, MAX);
        const results = await Promise.all(
          subset.map((item) => readElementProps(models, item)),
        );
        if (!cancelled) setItems(results);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, models, selectionKey]);

  if (selected.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center px-4 text-center">
        <p className="text-xs text-neutral-600">
          Click an element to inspect it. Hold Ctrl to select multiple.
        </p>
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

  // Single selection: show the one card expanded.
  if (selected.length === 1) {
    return (
      <div className="viewer-panel h-full overflow-y-auto p-3">
        {items[0] && <ElementCard el={items[0]} defaultOpen />}
      </div>
    );
  }

  // Multi-selection: a header with count + collapsed cards, plus a quick
  // common-attribute summary where values agree across the whole selection.
  const common = computeCommonAttributes(items);

  return (
    <div className="viewer-panel h-full overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-white">
          {selected.length} elements selected
        </p>
      </div>

      {Object.keys(common).length > 0 && (
        <div className="mb-3 rounded border border-neutral-800 bg-neutral-800/40 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Common attributes
          </p>
          <div className="space-y-0.5 text-[11px]">
            {Object.entries(common).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="truncate text-neutral-500">{k}</span>
                <span className="shrink-0 text-neutral-300">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((el) => (
          <ElementCard key={el.expressId} el={el} defaultOpen={false} />
        ))}
        {selected.length > items.length && (
          <p className="px-1 pt-1 text-[11px] text-neutral-600">
            Showing first {items.length} of {selected.length}.
          </p>
        )}
      </div>
    </div>
  );
}

/** Attributes whose value is identical across every selected element. */
function computeCommonAttributes(items: ElementProps[]): Record<string, string> {
  if (items.length === 0) return {};
  const first = items[0].attributes;
  const common: Record<string, string> = {};
  for (const [k, v] of Object.entries(first)) {
    if (items.every((it) => it.attributes[k] === v)) common[k] = v;
  }
  return common;
}
