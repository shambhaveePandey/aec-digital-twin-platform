"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

/** Human-readable phases reported while a model loads. */
export type LoadPhase = "idle" | "reading" | "parsing" | "framing" | "done";

const PHASE_LABELS: Record<LoadPhase, string> = {
  idle: "",
  reading: "Reading file…",
  parsing: "Parsing geometry…",
  framing: "Framing model…",
  done: "Ready",
};

export function phaseLabel(phase: LoadPhase): string {
  return PHASE_LABELS[phase];
}

/**
 * Manages models loaded into the viewer. In this client-side app, models are
 * parsed from raw IFC ArrayBuffers entirely in the browser (no server / .frag
 * pipeline). Loading a new model clears any previously loaded geometry.
 */
export function useFragmentLoader(
  components: OBC.Components | null,
  world: OBC.World | null,
) {
  const modelsRef = useRef<Map<string, FragmentsGroup>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  // Incrementing counter so components re-render when models change
  const [modelCount, setModelCount] = useState(0);

  // Load progress (0–100) and the current phase label. web-ifc parses the IFC
  // in a single opaque WASM call with no incremental callback, so during the
  // parse phase we ease a simulated value toward ~90% to give the user a sense
  // of motion, then snap to 100% the moment geometry is on screen and framed.
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoadPhase>("idle");
  // Holds the rAF/timer id for the simulated-progress ramp so we can cancel it.
  const rampRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRamp = useCallback(() => {
    if (rampRef.current !== null) {
      clearInterval(rampRef.current);
      rampRef.current = null;
    }
  }, []);

  // Eases progress asymptotically toward `ceiling` so the bar keeps creeping
  // forward during the opaque parse without ever falsely hitting 100%.
  const startRamp = useCallback(
    (ceiling: number) => {
      stopRamp();
      rampRef.current = setInterval(() => {
        setProgress((p) => (p >= ceiling ? p : p + (ceiling - p) * 0.08));
      }, 120);
    },
    [stopRamp],
  );

  // Clean up any running ramp if the component unmounts mid-load.
  useEffect(() => stopRamp, [stopRamp]);

  /** Removes all loaded models from the scene and disposes their GPU resources. */
  const clear = useCallback(() => {
    if (!components || !world) return;
    if (modelsRef.current.size === 0) return;
    import("@/lib/thatopen/load-fragment-model").then(
      ({ unloadFragmentModel }) => {
        for (const model of modelsRef.current.values()) {
          unloadFragmentModel(components, world, model);
        }
        modelsRef.current.clear();
        setModelCount(0);
      },
    );
  }, [components, world]);

  /**
   * Parses a raw IFC ArrayBuffer in the browser and loads it into the scene.
   * Any previously loaded model is cleared first so switching files does not
   * stack geometry.
   */
  const loadIfc = useCallback(
    async (modelKey: string, buffer: ArrayBuffer) => {
      if (!components || !world) return;

      setIsLoading(true);
      setLoadError(null);
      setPhase("reading");
      setProgress(8);

      try {
        // Clear existing models synchronously before loading the new one.
        if (modelsRef.current.size > 0) {
          const { unloadFragmentModel } = await import(
            "@/lib/thatopen/load-fragment-model"
          );
          for (const model of modelsRef.current.values()) {
            unloadFragmentModel(components, world, model);
          }
          modelsRef.current.clear();
        }

        const { loadIfcInBrowser } = await import(
          "@/lib/thatopen/load-ifc-client-preview"
        );

        // Geometry parse is the long, opaque step — ramp toward 90%.
        setPhase("parsing");
        setProgress((p) => Math.max(p, 15));
        startRamp(90);

        const model = await loadIfcInBrowser(components, world, buffer);
        stopRamp();
        modelsRef.current.set(modelKey, model);
        setModelCount(modelsRef.current.size);

        // Frame the freshly loaded model. fitToScene is internally guarded by a
        // timeout, so even if the camera animation misbehaves the load still
        // completes and the model stays visible (never stuck at 94%).
        setPhase("framing");
        setProgress((p) => Math.max(p, 94));
        const { fitToScene } = await import("@/lib/thatopen/viewpoints");
        await fitToScene(components, world, model);

        setPhase("done");
        setProgress(100);
      } catch (err) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stopRamp();
        setIsLoading(false);
        // Reset the bar shortly after it completes so the next load starts clean.
        setTimeout(() => {
          setProgress(0);
          setPhase("idle");
        }, 600);
      }
    },
    [components, world, startRamp, stopRamp],
  );

  // Expose a stable array reference derived from the map
  const models = Array.from(modelsRef.current.values());
  // A stable string key that only changes when the *set* of loaded models
  // changes. Effects that rebuild expensive derived state (e.g. the model
  // tree, which re-runs relation indexing + classification) should depend on
  // this instead of the `models` array, whose reference changes every render.
  const modelKeys = Array.from(modelsRef.current.keys()).join("|");

  return {
    models,
    modelKeys,
    modelsRef,
    isLoading,
    loadError,
    loadIfc,
    clear,
    modelCount,
    progress,
    phase,
  };
}
