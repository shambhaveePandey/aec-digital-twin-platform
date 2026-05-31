"use client";

import { useCallback, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

export function useFragmentLoader(
  components: OBC.Components | null,
  world: OBC.World | null,
) {
  const modelsRef = useRef<Map<string, FragmentsGroup>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  // Incrementing counter so components re-render when models change
  const [modelCount, setModelCount] = useState(0);

  const loadModel = useCallback(
    async (modelVersionId: string, fragUrl: string) => {
      if (!components || !world) return;
      if (modelsRef.current.has(modelVersionId)) return; // already loaded

      setIsLoading(true);
      setLoadError(null);

      try {
        const { loadFragmentModel } = await import(
          "@/lib/thatopen/load-fragment-model"
        );
        const model = await loadFragmentModel(components, world, fragUrl);
        modelsRef.current.set(modelVersionId, model);
        setModelCount((c) => c + 1);
      } catch (err) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [components, world],
  );

  const unloadModel = useCallback(
    (modelVersionId: string) => {
      if (!components || !world) return;
      const model = modelsRef.current.get(modelVersionId);
      if (!model) return;
      import("@/lib/thatopen/load-fragment-model").then(
        ({ unloadFragmentModel }) => {
          unloadFragmentModel(components, world, model);
          modelsRef.current.delete(modelVersionId);
          setModelCount((c) => c - 1);
        },
      );
    },
    [components, world],
  );

  // Expose a stable array reference derived from the map
  const models = Array.from(modelsRef.current.values());

  return { models, modelsRef, isLoading, loadError, loadModel, unloadModel, modelCount };
}
