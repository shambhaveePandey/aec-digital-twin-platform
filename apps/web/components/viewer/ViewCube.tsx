"use client";

import { useCallback } from "react";
import type * as OBC from "@thatopen/components";
import type { StandardView } from "@/lib/thatopen/navigation";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  camera: OBC.OrthoPerspectiveCamera | null;
};

/**
 * A lightweight ViewCube + navigation gizmo overlaid on the viewer. Clicking a
 * face snaps the camera to that orthographic view; the surrounding controls
 * handle zoom, fit, and projection toggle. Pure DOM/CSS — no extra 3D deps —
 * so it stays light and works on touch screens.
 */
export function ViewCube({ components, world, camera }: Props) {
  const disabled = !components || !world;

  const setView = useCallback(
    async (view: StandardView) => {
      if (!components || !world) return;
      const { goToStandardView } = await import("@/lib/thatopen/navigation");
      await goToStandardView(components, world, view);
    },
    [components, world],
  );

  const doZoom = useCallback(
    async (factor: number) => {
      if (!camera) return;
      const { zoom } = await import("@/lib/thatopen/navigation");
      await zoom(camera, factor);
    },
    [camera],
  );

  const fit = useCallback(async () => {
    if (!components || !world) return;
    const { fitToScene } = await import("@/lib/thatopen/viewpoints");
    await fitToScene(components, world);
  }, [components, world]);

  const toggleProj = useCallback(async () => {
    if (!camera) return;
    const { toggleProjection } = await import("@/lib/thatopen/navigation");
    await toggleProjection(camera);
  }, [camera]);

  const faceBtn =
    "absolute flex items-center justify-center text-[10px] font-semibold uppercase " +
    "text-neutral-300 bg-neutral-800/90 border border-neutral-600 hover:bg-blue-600 " +
    "hover:text-white transition-colors";

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
      {/* The cube: a 3x3 grid of preset views (T/F/L/R + ISO centre). */}
      <div
        className="pointer-events-auto relative h-[84px] w-[84px] select-none rounded-md bg-neutral-900/70 p-1 shadow-lg backdrop-blur-sm"
        aria-label="View cube"
        role="group"
      >
        {/* Top */}
        <button
          className={`${faceBtn} left-1/2 top-0 h-6 w-7 -translate-x-1/2 rounded-t`}
          title="Top view"
          disabled={disabled}
          onClick={() => setView("top")}
        >
          Top
        </button>
        {/* Left */}
        <button
          className={`${faceBtn} left-0 top-1/2 h-7 w-6 -translate-y-1/2 rounded-l`}
          title="Left view"
          disabled={disabled}
          onClick={() => setView("left")}
        >
          L
        </button>
        {/* Iso (centre) */}
        <button
          className={`${faceBtn} left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded`}
          title="Isometric view"
          disabled={disabled}
          onClick={() => setView("iso")}
        >
          ISO
        </button>
        {/* Right */}
        <button
          className={`${faceBtn} right-0 top-1/2 h-7 w-6 -translate-y-1/2 rounded-r`}
          title="Right view"
          disabled={disabled}
          onClick={() => setView("right")}
        >
          R
        </button>
        {/* Front */}
        <button
          className={`${faceBtn} bottom-0 left-1/2 h-6 w-7 -translate-x-1/2 rounded-b`}
          title="Front view"
          disabled={disabled}
          onClick={() => setView("front")}
        >
          Front
        </button>
      </div>

      {/* Secondary view shortcuts */}
      <div className="pointer-events-auto flex gap-1">
        <NavBtn title="Back view" disabled={disabled} onClick={() => setView("back")}>
          Back
        </NavBtn>
        <NavBtn title="Bottom view" disabled={disabled} onClick={() => setView("bottom")}>
          Bot
        </NavBtn>
      </div>

      {/* Zoom / fit / projection controls */}
      <div className="pointer-events-auto flex flex-col gap-1">
        <div className="flex gap-1">
          <NavBtn title="Zoom in" disabled={!camera} onClick={() => doZoom(0.8)}>
            +
          </NavBtn>
          <NavBtn title="Zoom out" disabled={!camera} onClick={() => doZoom(1.25)}>
            −
          </NavBtn>
        </div>
        <NavBtn title="Fit to view" disabled={disabled} onClick={fit}>
          Fit
        </NavBtn>
        <NavBtn
          title="Toggle perspective / orthographic"
          disabled={!camera}
          onClick={toggleProj}
        >
          ⬚
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 min-w-7 items-center justify-center rounded border border-neutral-700 bg-neutral-900/80 px-2 text-[11px] font-medium text-neutral-300 backdrop-blur-sm transition-colors hover:bg-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
