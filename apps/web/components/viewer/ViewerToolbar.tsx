"use client";

import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import { cn } from "@/lib/utils";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  camera: OBC.OrthoPerspectiveCamera | null;
  models: FragmentsGroup[];
  sectionCutsActive?: boolean;
  hasSelection?: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel?: () => void;
  onToggleSectionCuts: () => void;
  onClearSelection?: () => void;
  onSaveViewpoint?: () => void;
};

type ToolButton = {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  hideOnMobile?: boolean;
};

export function ViewerToolbar({
  components,
  world,
  camera,
  models,
  sectionCutsActive,
  hasSelection,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleSectionCuts,
  onClearSelection,
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

  async function handleMeasure() {
    if (!components || !world) return;
    const { enableLengthMeasurement } = await import(
      "@/lib/thatopen/measurements"
    );
    enableLengthMeasurement(components, world);
  }

  const buttons: ToolButton[] = [
    { label: "☰", title: "Toggle model tree", onClick: onToggleLeftPanel },
    { label: "⊡", title: "Fit to scene", onClick: handleFitView, disabled },
    { label: "↺", title: "Reset camera", onClick: handleResetView, disabled },
    {
      label: "✂",
      title: "Section cuts",
      onClick: onToggleSectionCuts,
      disabled,
      active: sectionCutsActive,
    },
    { label: "📏", title: "Measure", onClick: handleMeasure, disabled, hideOnMobile: true },
    ...(onClearSelection
      ? [
          {
            label: "✕",
            title: "Clear selection",
            onClick: onClearSelection,
            disabled: !hasSelection,
          },
        ]
      : []),
    ...(onSaveViewpoint
      ? [{ label: "📸", title: "Save viewpoint", onClick: onSaveViewpoint, disabled, hideOnMobile: true }]
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
            btn.hideOnMobile && "hidden sm:flex",
            btn.disabled
              ? "cursor-not-allowed text-neutral-700"
              : btn.active
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:bg-neutral-700 hover:text-white",
          )}
        >
          {btn.label}
        </button>
      ))}

      {/* Right-panel toggle, shown on small screens where the panel is an overlay */}
      {onToggleRightPanel && (
        <button
          title="Toggle properties panel"
          onClick={onToggleRightPanel}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded text-sm text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white lg:hidden"
        >
          ⊟
        </button>
      )}
    </div>
  );
}
