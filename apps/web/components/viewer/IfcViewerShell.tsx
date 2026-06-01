"use client";

// Fully client-side viewer shell. There is no backend: IFC files are parsed
// in the browser and all panels read from the loaded model in memory.
// Properties read live from the model; Viewpoints are kept in local React state
// for the session. The former Issues and Sensors tabs depended on a server and
// have been removed.

import { useEffect, useRef, useState } from "react";
import { ViewerCanvas } from "./ViewerCanvas";
import { ViewerToolbar } from "./ViewerToolbar";
import { ViewerStatusBar } from "./ViewerStatusBar";
import { ModelTreePanel } from "./ModelTreePanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { ViewpointsPanel } from "./ViewpointsPanel";
import { SectionCutsPanel } from "./SectionCutsPanel";
import { useViewerWorld } from "./hooks/useViewerWorld";
import { useFragmentLoader } from "./hooks/useFragmentLoader";
import { useModelSelection } from "./hooks/useModelSelection";

type RightTab = "properties" | "viewpoints";

type Props = {
  /** Raw IFC bytes to parse and render, or null when nothing is selected yet. */
  ifcBuffer: ArrayBuffer | null;
  /** Stable identifier for the current model (used as the load key). */
  modelKey: string;
  /** Human-readable name shown in the status bar. */
  modelName: string;
};

export function IfcViewerShell({ ifcBuffer, modelKey, modelName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { handlesRef, isReady, error: worldError } = useViewerWorld(containerRef);

  const components = isReady ? (handlesRef.current?.components ?? null) : null;
  const world = isReady ? (handlesRef.current?.world ?? null) : null;
  const camera = isReady ? (handlesRef.current?.camera ?? null) : null;

  const { models, isLoading, loadError, loadIfc } = useFragmentLoader(
    components,
    world,
  );
  const { selectedElement, handleCanvasClick } = useModelSelection(
    components,
    world,
  );

  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [leftOpen, setLeftOpen] = useState(true);
  const [sectionCutsOpen, setSectionCutsOpen] = useState(false);

  // Parse + load the IFC buffer in the browser whenever it changes.
  useEffect(() => {
    if (isReady && ifcBuffer) {
      loadIfc(modelKey, ifcBuffer);
    }
  }, [isReady, ifcBuffer, modelKey, loadIfc]);

  const error = worldError ?? loadError;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#1a1a1a]">
      {/* ── Left sidebar: model tree ── */}
      {leftOpen && (
        <aside className="w-60 flex-shrink-0 overflow-hidden border-r border-neutral-800 bg-neutral-900">
          <ModelTreePanel components={components} world={world} models={models} />
        </aside>
      )}

      {/* ── Centre: canvas + toolbar ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ViewerToolbar
          components={components}
          world={world}
          camera={camera}
          models={models}
          onToggleLeftPanel={() => setLeftOpen((v) => !v)}
          onToggleSectionCuts={() => setSectionCutsOpen((v) => !v)}
        />

        <div className="relative flex-1 overflow-hidden">
          <ViewerCanvas
            containerRef={containerRef}
            isReady={isReady}
            isLoading={isLoading}
            error={error}
            onCanvasClick={() => handleCanvasClick(models)}
          />

          {sectionCutsOpen && (
            <div className="absolute left-2 top-2 z-10">
              <SectionCutsPanel components={components} world={world} />
            </div>
          )}

          {!ifcBuffer && isReady && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-neutral-500">
                Choose a sample or upload an .ifc file to begin
              </p>
            </div>
          )}
        </div>

        <ViewerStatusBar
          selectedElement={selectedElement}
          isLoading={isLoading}
          modelName={modelName}
        />
      </div>

      {/* ── Right sidebar: tabbed panels ── */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
        {/* Tab strip */}
        <div className="flex flex-shrink-0 border-b border-neutral-800">
          {(["properties", "viewpoints"] as RightTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                rightTab === tab
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-hidden">
          {rightTab === "properties" && (
            <PropertiesPanel
              components={components}
              models={models}
              selectedElement={selectedElement}
            />
          )}
          {rightTab === "viewpoints" && (
            <ViewpointsPanel components={components} camera={camera} />
          )}
        </div>
      </aside>
    </div>
  );
}
