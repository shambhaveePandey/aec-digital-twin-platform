"use client";

import { useEffect } from "react";
import type * as OBC from "@thatopen/components";
import type { Vec3 } from "@/lib/thatopen/types";

/**
 * Subscribes to camera update events and reports the new position.
 * Used for syncing React state (e.g. viewpoint capture button) with the 3D camera.
 */
export function useViewerSync(
  camera: OBC.OrthoPerspectiveCamera | null,
  onCameraChange?: (position: Vec3) => void,
) {
  useEffect(() => {
    if (!camera || !onCameraChange) return;

    const handler = () => {
      const p = camera.three.position;
      onCameraChange({ x: p.x, y: p.y, z: p.z });
    };

    camera.controls.addEventListener("update", handler);
    return () => camera.controls.removeEventListener("update", handler);
  }, [camera, onCameraChange]);
}
