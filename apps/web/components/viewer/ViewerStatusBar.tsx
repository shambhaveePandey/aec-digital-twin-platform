"use client";

import type { SelectedItem } from "@/lib/thatopen/selection";

type Props = {
  selected: SelectedItem[];
  isLoading: boolean;
  modelName?: string;
};

export function ViewerStatusBar({ selected, isLoading, modelName }: Props) {
  return (
    <div className="flex h-7 flex-shrink-0 items-center justify-between border-t border-neutral-800 bg-neutral-900 px-3 text-xs text-neutral-500">
      <div className="flex items-center gap-4">
        {selected.length === 0 && <span>No selection</span>}
        {selected.length === 1 && (
          <span>
            Selected: expressId{" "}
            <span className="text-neutral-300">{selected[0].expressId}</span>
          </span>
        )}
        {selected.length > 1 && (
          <span>
            <span className="text-neutral-300">{selected.length}</span> elements
            selected
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isLoading && (
          <span className="flex items-center gap-1 text-yellow-500">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
            Loading…
          </span>
        )}
        {modelName && (
          <span className="hidden sm:inline">
            Model <span className="text-neutral-400">{modelName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
