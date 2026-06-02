"use client";

// Fully client-side viewer shell. There is no backend: IFC files are parsed
// in the browser and all panels read from the loaded model in memory.
// Layout is responsive: on large screens the tree and properties dock as
// columns; on phones/tablets they slide over the canvas as dismissible panels.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ViewerCanvas } from "./ViewerCanvas";
import { ViewerToolbar } from "./ViewerToolbar";
import { ViewerStatusBar } from "./ViewerStatusBar";
import { ViewCube } from "./ViewCube";
import { ModelTreePanel } from "./ModelTreePanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { ViewpointsPanel } from "./ViewpointsPanel";
import { SectionCutsPanel } from "./SectionCutsPanel";
import { DigitalTwinPanel } from "./DigitalTwinPanel";
import { useViewerWorld } from "./hooks/useViewerWorld";
import { useFragmentLoader, phaseLabel } from "./hooks/useFragmentLoader";
import { useViewerSelection } from "./hooks/useViewerSelection";

type RightTab = "properties" | "viewpoints" | "digital twin";

type Props = {
  ifcBuffer: ArrayBuffer | null;
  modelKey: string;
  modelName: string;
};

export function IfcViewerShell({ ifcBuffer, modelKey, modelName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { handlesRef, isReady, error: worldError } = useViewerWorld(containerRef);

  const components = isReady ? (handlesRef.current?.components ?? null) : null;
  const world = isReady ? (handlesRef.current?.world ?? null) : null;
  const camera = isReady ? (handlesRef.current?.camera ?? null) : null;

  const { models, modelKeys, isLoading, loadError, loadIfc, progress, phase } =
    useFragmentLoader(components, world);

  const { selected, selectExpressIds, clear } = useViewerSelection(
    components,
    world,
  );

  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [sectionCutsOpen, setSectionCutsOpen] = useState(false);

  // Collapse both side panels by default on small screens so the canvas is
  // usable; expand on large screens. Runs once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLarge = window.matchMedia("(min-width: 1024px)").matches;
    setLeftOpen(isLarge);
    setRightOpen(isLarge);
  }, []);

  // Parse + load the IFC buffer in the browser whenever it changes.
  useEffect(() => {
    if (isReady && ifcBuffer) {
      loadIfc(modelKey, ifcBuffer);
    }
  }, [isReady, ifcBuffer, modelKey, loadIfc]);

  // Set of selected express ids for syncing the tree highlight.
  const selectedExpressIds = useMemo(
    () => new Set(selected.map((s) => s.expressId)),
    [selected],
  );

  // Selecting from the tree drives the viewer highlight + properties.
  const handleSelectNode = useCallback(
    (modelUuid: string, expressIds: number[], add: boolean) => {
      if (expressIds.length === 0) return;
      const model =
        models.find((m) => (m as { uuid?: string }).uuid === modelUuid) ??
        models[0];
      if (!model) return;
      void selectExpressIds(model, expressIds, add);
    },
    [models, selectExpressIds],
  );

  const error = worldError ?? loadError;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#1a1a1a]">
      {/* ── Left sidebar: model tree ── */}
      <aside
        className={`${
          leftOpen ? "translate-x-0" : "-translate-x-full"
        } absolute inset-y-0 left-0 z-30 w-60 flex-shrink-0 overflow-hidden border-r border-neutral-800 bg-neutral-900 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          leftOpen ? "lg:block" : "lg:hidden"
        }`}
      >
        <ModelTreePanel
          components={components}
          world={world}
          models={models}
          modelKeys={modelKeys}
          selectedExpressIds={selectedExpressIds}
          onSelectNode={handleSelectNode}
        />
      </aside>

      {/* Mobile backdrop when a sidebar overlay is open */}
      {(leftOpen || rightOpen) && (
        <button
          aria-label="Close panels"
          className="absolute inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
        />
      )}

      {/* ── Centre: canvas + toolbar ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ViewerToolbar
          components={components}
          world={world}
          camera={camera}
          models={models}
          sectionCutsActive={sectionCutsOpen}
          hasSelection={selected.length > 0}
          onToggleLeftPanel={() => setLeftOpen((v) => !v)}
          onToggleRightPanel={() => setRightOpen((v) => !v)}
          onToggleSectionCuts={() => setSectionCutsOpen((v) => !v)}
          onClearSelection={() => void clear()}
        />

        <div className="relative flex-1 overflow-hidden">
          <ViewerCanvas
            containerRef={containerRef}
            isReady={isReady}
            isLoading={isLoading}
            error={error}
            progress={progress}
            progressLabel={phaseLabel(phase)}
          />

          {/* ViewCube + navigation gizmo */}
          {isReady && <ViewCube components={components} world={world} camera={camera} />}

          {sectionCutsOpen && (
            <div className="absolute left-2 top-2 z-10">
              <SectionCutsPanel
                components={components}
                world={world}
                model={models[0] ?? null}
              />
            </div>
          )}

          {!ifcBuffer && isReady && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
              <p className="text-sm text-neutral-500">
                Choose a sample or upload an .ifc file to begin
              </p>
            </div>
          )}
        </div>

        <ViewerStatusBar
          selected={selected}
          isLoading={isLoading}
          modelName={modelName}
        />
      </div>

      {/* ── Right sidebar: tabbed panels ── */}
      <aside
        className={`${
          rightOpen ? "translate-x-0" : "translate-x-full"
        } absolute inset-y-0 right-0 z-30 flex w-80 max-w-[85vw] flex-shrink-0 flex-col border-l border-neutral-800 bg-neutral-900 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          rightOpen ? "lg:flex" : "lg:hidden"
        }`}
      >
        {/* Tab strip */}
        <div className="flex flex-shrink-0 border-b border-neutral-800">
          {(["properties", "viewpoints", "digital twin"] as RightTab[]).map(
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
          {/* Close button on mobile overlay */}
          <button
            onClick={() => setRightOpen(false)}
            className="px-3 text-neutral-500 hover:text-neutral-300 lg:hidden"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-hidden">
          {rightTab === "properties" && (
            <PropertiesPanel
              components={components}
              models={models}
              selected={selected}
            />
          )}
          {rightTab === "viewpoints" && (
            <ViewpointsPanel components={components} camera={camera} />
          )}
          {rightTab === "digital twin" && (
            <DigitalTwinPanel
              components={components}
              world={world}
              model={models[0] ?? null}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
