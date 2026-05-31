"use client";

import { useCallback, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { SelectionState } from "@/lib/thatopen/types";

export function useModelSelection(
  components: OBC.Components | null,
  world: OBC.World | null,
) {
  const [selectedElement, setSelectedElement] = useState<SelectionState>(null);

  const handleCanvasClick = useCallback(
    async (models: FragmentsGroup[]) => {
      if (!components || !world || models.length === 0) {
        setSelectedElement(null);
        return;
      }

      const { castRayAndSelect } = await import("@/lib/thatopen/selection");
      const result = castRayAndSelect(
        components,
        world,
        models as unknown as { children: THREE.Object3D[] }[],
      );
      setSelectedElement(result);
    },
    [components, world],
  );

  const clearSelection = useCallback(() => setSelectedElement(null), []);

  return { selectedElement, setSelectedElement, handleCanvasClick, clearSelection };
}

import type * as THREE from "three";
