"use client";

import type * as OBC from "@thatopen/components";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
};

export function SectionCutsPanel({ components, world }: Props) {
  const disabled = !components || !world;

  async function handleCreate() {
    if (disabled) return;
    const { createClippingPlane } = await import("@/lib/thatopen/clipping");
    createClippingPlane(components!, world!);
  }

  async function handleDeleteActive() {
    if (disabled) return;
    const { deleteActiveClippingPlane } = await import("@/lib/thatopen/clipping");
    deleteActiveClippingPlane(components!, world!);
  }

  async function handleDeleteAll() {
    if (disabled) return;
    const { deleteAllClippingPlanes } = await import("@/lib/thatopen/clipping");
    deleteAllClippingPlanes(components!, world!);
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-neutral-300">Section cuts</p>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleCreate}
          disabled={disabled}
          className="rounded bg-blue-700 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          + Add plane
        </button>
        <button
          onClick={handleDeleteActive}
          disabled={disabled}
          className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        >
          Delete selected
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={disabled}
          className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        >
          Delete all
        </button>
      </div>
    </div>
  );
}
