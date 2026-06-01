"use client";

import type { SelectionState } from "@/lib/thatopen/types";

type Props = {
  selectedElement: SelectionState;
  isLoading: boolean;
  modelName?: string;
};

export function ViewerStatusBar({ selectedElement, isLoading, modelName }: Props) {
  return (
    <div className="flex h-7 flex-shrink-0 items-center justify-between border-t border-neutral-800 bg-neutral-900 px-3 text-xs text-neutral-500">
      <div className="flex items-center gap-4">
        {selectedElement ? (
          <span>
            Selected: expressId{" "}
            <span className="text-neutral-300">{selectedElement.expressId}</span>
          </span>
        ) : (
          <span>No selection</span>
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
          <span>
            Model <span className="text-neutral-400">{modelName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
