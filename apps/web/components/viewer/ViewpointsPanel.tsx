"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type * as OBC from "@thatopen/components";

type Viewpoint = {
  id: string;
  label: string | null;
  snapshotKey: string | null;
  createdAt: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  cameraUp: { x: number; y: number; z: number };
  isOrthographic: boolean;
};

type Props = {
  twinId: string;
  components: OBC.Components | null;
  camera: OBC.OrthoPerspectiveCamera | null;
};

export function ViewpointsPanel({ twinId, components, camera }: Props) {
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/twins/${twinId}/viewpoints`)
      .then((r) => r.json())
      .then((d) => setViewpoints((d as { viewpoints: Viewpoint[] }).viewpoints ?? []))
      .catch(() => {});
  }, [twinId]);

  async function handleSave() {
    if (!camera) return;
    setSaving(true);
    const { captureViewpoint } = await import("@/lib/thatopen/viewpoints");
    const state = captureViewpoint(camera);

    try {
      const res = await fetch(`/api/twins/${twinId}/viewpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraPosition: state.position,
          cameraTarget: state.target,
          cameraUp: state.up,
          isOrthographic: state.isOrthographic,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json() as Viewpoint;
      setViewpoints((prev) => [saved, ...prev]);
      toast.success("Viewpoint saved");
    } catch {
      toast.error("Failed to save viewpoint");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(vp: Viewpoint) {
    if (!camera) return;
    const { restoreViewpoint } = await import("@/lib/thatopen/viewpoints");
    await restoreViewpoint(camera, {
      position: vp.cameraPosition,
      target: vp.cameraTarget,
      up: vp.cameraUp,
      isOrthographic: vp.isOrthographic,
    });
  }

  return (
    <div className="viewer-panel overflow-y-auto">
      <div className="sticky top-0 flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-3 py-2">
        <span className="text-xs font-semibold text-neutral-400">
          {viewpoints.length} viewpoint{viewpoints.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleSave}
          disabled={saving || !camera}
          className="rounded bg-blue-700 px-2 py-0.5 text-xs text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "📸 Save"}
        </button>
      </div>

      {viewpoints.length === 0 ? (
        <p className="p-4 text-center text-xs text-neutral-600">No saved viewpoints</p>
      ) : (
        <div className="divide-y divide-neutral-800">
          {viewpoints.map((vp) => (
            <button
              key={vp.id}
              onClick={() => handleRestore(vp)}
              className="w-full px-3 py-2 text-left hover:bg-neutral-800 transition-colors"
            >
              <p className="text-xs text-neutral-300">{vp.label ?? "Viewpoint"}</p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {new Date(vp.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
