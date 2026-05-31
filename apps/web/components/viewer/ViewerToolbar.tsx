"use client";

import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import { cn } from "@/lib/utils";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  camera: OBC.OrthoPerspectiveCamera | null;
  models: FragmentsGroup[];
  onToggleLeftPanel: () => void;
  onToggleSectionCuts: () => void;
  onSaveViewpoint?: () => void;
};

type ToolButton = {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ViewerToolbar({
  components,
  world,
  camera,
  models,
  onToggleLeftPanel,
  onToggleSectionCuts,
  onSaveViewpoint,
}: Props) {
  const disabled = !components || !world;

  async function handleFitView() {
    if (!components || !world) return;
    const { fitToScene } = await import("@/lib/thatopen/viewpoints");
    await fitToScene(components, world);
  }

  async function handleResetView() {
    if (!camera) return;
    camera.controls.reset(true);
  }

  async function handleIsolateSelected() {
    // Placeholder — requires selected element state; handled in IfcViewerShell
  }

  async function handleMeasure() {
    if (!components || !world) return;
    const { enableLengthMeasurement } = await import(
      "@/lib/thatopen/measurements"
    );
    enableLengthMeasurement(components, world);
  }

  const buttons: ToolButton[] = [
    { label: "☰", title: "Toggle tree panel", onClick: onToggleLeftPanel },
    { label: "⊡", title: "Fit to scene", onClick: handleFitView, disabled },
    { label: "↺", title: "Reset camera", onClick: handleResetView, disabled },
    { label: "✂", title: "Section cut", onClick: onToggleSectionCuts, disabled },
    { label: "📏", title: "Measure", onClick: handleMeasure, disabled },
    ...(onSaveViewpoint
      ? [{ label: "📸", title: "Save viewpoint", onClick: onSaveViewpoint, disabled }]
      : []),
  ];

  return (
    <div className="flex h-10 flex-shrink-0 items-center gap-1 border-b border-neutral-800 bg-neutral-900 px-2">
      {buttons.map((btn) => (
        <button
          key={btn.title}
          title={btn.title}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-sm transition-colors",
            btn.disabled
              ? "cursor-not-allowed text-neutral-700"
              : "text-neutral-400 hover:bg-neutral-700 hover:text-white",
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
