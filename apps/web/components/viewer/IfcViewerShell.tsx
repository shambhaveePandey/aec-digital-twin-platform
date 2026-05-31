"use client";

import { useEffect, useRef, useState } from "react";
import { ViewerCanvas } from "./ViewerCanvas";
import { ViewerToolbar } from "./ViewerToolbar";
import { ViewerStatusBar } from "./ViewerStatusBar";
import { ModelTreePanel } from "./ModelTreePanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { IssuesPanel } from "./IssuesPanel";
import { SensorOverlayPanel } from "./SensorOverlayPanel";
import { SectionCutsPanel } from "./SectionCutsPanel";
import { ViewpointsPanel } from "./ViewpointsPanel";
import { useViewerWorld } from "./hooks/useViewerWorld";
import { useFragmentLoader } from "./hooks/useFragmentLoader";
import { useModelSelection } from "./hooks/useModelSelection";

type RightTab = "properties" | "issues" | "sensors" | "viewpoints";

type Props = {
  twinId: string;
  modelVersionId: string;
  fragUrl: string;
};

export function IfcViewerShell({ twinId, modelVersionId, fragUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { handlesRef, isReady, error: worldError } = useViewerWorld(containerRef);

  const components = isReady ? (handlesRef.current?.components ?? null) : null;
  const world = isReady ? (handlesRef.current?.world ?? null) : null;
  const camera = isReady ? (handlesRef.current?.camera ?? null) : null;

  const { models, isLoading, loadError, loadModel } = useFragmentLoader(
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

  // Load the fragment model once the engine is ready
  useEffect(() => {
    if (isReady && fragUrl) {
      loadModel(modelVersionId, fragUrl);
    }
  }, [isReady, fragUrl, modelVersionId, loadModel]);

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
        </div>

        <ViewerStatusBar
          selectedElement={selectedElement}
          isLoading={isLoading}
          modelVersionId={modelVersionId}
        />
      </div>

      {/* ── Right sidebar: tabbed panels ── */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
        {/* Tab strip */}
        <div className="flex flex-shrink-0 border-b border-neutral-800">
          {(["properties", "issues", "sensors", "viewpoints"] as RightTab[]).map(
            (tab) => (
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
            ),
          )}
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-hidden">
          {rightTab === "properties" && (
            <PropertiesPanel twinId={twinId} selectedElement={selectedElement} />
          )}
          {rightTab === "issues" && (
            <IssuesPanel twinId={twinId} selectedElement={selectedElement} />
          )}
          {rightTab === "sensors" && (
            <SensorOverlayPanel twinId={twinId} selectedElement={selectedElement} />
          )}
          {rightTab === "viewpoints" && (
            <ViewpointsPanel
              twinId={twinId}
              components={components}
              camera={camera}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
