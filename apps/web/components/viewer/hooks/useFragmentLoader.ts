"use client";

import { useCallback, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

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
        const model = await loadIfcInBrowser(components, world, buffer);
        modelsRef.current.set(modelKey, model);
        setModelCount(modelsRef.current.size);

        // Frame the freshly loaded model.
        const { fitToScene } = await import("@/lib/thatopen/viewpoints");
        await fitToScene(components, world);
      } catch (err) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [components, world],
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
  };
}
