"use client";

import { useEffect, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  model?: FragmentsGroup | null;
};

export function SectionCutsPanel({ components, world, model }: Props) {
  const disabled = !components || !world;
  const [count, setCount] = useState(0);

  // Enable clipping (and renderer-side local clipping) while the panel is open;
  // also wire double-click-to-place on the canvas. Clean up on close.
  useEffect(() => {
    if (!components || !world) return;
    let cleanup: (() => void) | null = null;

    (async () => {
      const { enableClipping, createPlaneAtCursor, clipperPlaneCount } =
        await import("@/lib/thatopen/clipping");
      enableClipping(components, world);
      setCount(clipperPlaneCount(components));

      const container = (
        world.renderer as { three?: { domElement?: HTMLElement } } | null
      )?.three?.domElement;

      const onDblClick = () => {
        if (createPlaneAtCursor(components, world)) {
          setCount(clipperPlaneCount(components));
        }
      };
      container?.addEventListener("dblclick", onDblClick);
      cleanup = () => container?.removeEventListener("dblclick", onDblClick);
    })();

    return () => {
      cleanup?.();
    };
  }, [components, world]);

  async function addAxis(axis: "x" | "y" | "z") {
    if (disabled) return;
    const { addAxisPlane, clipperPlaneCount } = await import(
      "@/lib/thatopen/clipping"
    );
    addAxisPlane(components!, world!, axis, model ?? undefined);
    setCount(clipperPlaneCount(components!));
  }

  async function handleDeleteActive() {
    if (disabled) return;
    const { deleteActiveClippingPlane, clipperPlaneCount } = await import(
      "@/lib/thatopen/clipping"
    );
    deleteActiveClippingPlane(components!, world!);
    setCount(clipperPlaneCount(components!));
  }

  async function handleDeleteAll() {
    if (disabled) return;
    const { deleteAllClippingPlanes, clipperPlaneCount } = await import(
      "@/lib/thatopen/clipping"
    );
    deleteAllClippingPlanes(components!);
    setCount(clipperPlaneCount(components!));
  }

  return (
    <div className="w-52 rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-200">Section cuts</p>
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
          {count} plane{count === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
        Add along axis
      </p>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        <AxisBtn label="X" color="#ef4444" disabled={disabled} onClick={() => addAxis("x")} />
        <AxisBtn label="Y" color="#22c55e" disabled={disabled} onClick={() => addAxis("y")} />
        <AxisBtn label="Z" color="#3b82f6" disabled={disabled} onClick={() => addAxis("z")} />
      </div>

      <p className="mb-2 text-[10px] leading-snug text-neutral-500">
        Tip: double-click any surface in the model to place a plane on that face.
        Drag the arrows to move a plane.
      </p>

      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleDeleteActive}
          disabled={disabled || count === 0}
          className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-40"
        >
          Delete plane under cursor
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={disabled || count === 0}
          className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-40"
        >
          Delete all
        </button>
      </div>
    </div>
  );
}

function AxisBtn({
  label,
  color,
  disabled,
  onClick,
}: {
  label: string;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1 rounded bg-neutral-800 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40"
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}
