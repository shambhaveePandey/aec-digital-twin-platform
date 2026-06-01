"use client";

import { useState } from "react";
import { toast } from "sonner";
import type * as OBC from "@thatopen/components";
import type { CameraState } from "@/lib/thatopen/types";

type Viewpoint = {
  id: string;
  label: string;
  createdAt: number;
  state: CameraState;
};

type Props = {
  components: OBC.Components | null;
  camera: OBC.OrthoPerspectiveCamera | null;
};

/**
 * Session-local saved viewpoints. There is no backend in this client-side app,
 * so viewpoints live in React state for the lifetime of the page.
 */
export function ViewpointsPanel({ camera }: Props) {
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!camera) return;
    setSaving(true);
    try {
      const { captureViewpoint } = await import("@/lib/thatopen/viewpoints");
      const state = captureViewpoint(camera);
      const vp: Viewpoint = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        label: `Viewpoint ${viewpoints.length + 1}`,
        createdAt: Date.now(),
        state,
      };
      setViewpoints((prev) => [vp, ...prev]);
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
    await restoreViewpoint(camera, vp.state);
  }

  function handleDelete(id: string) {
    setViewpoints((prev) => prev.filter((v) => v.id !== id));
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
        <p className="p-4 text-center text-xs text-neutral-600">
          No saved viewpoints
        </p>
      ) : (
        <div className="divide-y divide-neutral-800">
          {viewpoints.map((vp) => (
            <div
              key={vp.id}
              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-neutral-800 transition-colors"
            >
              <button
                onClick={() => handleRestore(vp)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-xs text-neutral-300">{vp.label}</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {new Date(vp.createdAt).toLocaleTimeString()}
                </p>
              </button>
              <button
                onClick={() => handleDelete(vp.id)}
                title="Delete viewpoint"
                className="shrink-0 rounded px-1.5 text-xs text-neutral-600 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
