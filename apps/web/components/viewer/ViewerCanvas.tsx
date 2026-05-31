"use client";

import { type RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  containerRef: RefObject<HTMLDivElement>;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  onCanvasClick?: () => void;
};

export function ViewerCanvas({
  containerRef,
  isReady,
  isLoading,
  error,
  onCanvasClick,
}: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a1a1a]">
      {/* That Open mounts its canvas inside this div */}
      <div
        ref={containerRef}
        className="h-full w-full"
        onClick={onCanvasClick}
        aria-label="3D model viewer"
        role="application"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-blue-400" />
            <span className="text-xs text-neutral-400">Loading model…</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border border-red-800 bg-red-950/80 px-6 py-4 text-center">
            <p className="text-sm font-medium text-red-300">Viewer error</p>
            <p className="mt-1 text-xs text-red-400">{error.message}</p>
          </div>
        </div>
      )}

      {/* Init placeholder */}
      {!isReady && !error && !isLoading && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-400" />
            <span className="text-xs text-neutral-500">Initialising renderer…</span>
          </div>
        </div>
      )}
    </div>
  );
}
