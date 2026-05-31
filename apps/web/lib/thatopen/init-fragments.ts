import * as OBC from "@thatopen/components";

/**
 * Retrieves FragmentsManager from the components container and sets
 * the worker URL so the WASM processing runs in a background thread.
 * Call once after createWorld, before loading any model.
 */
export function initFragments(components: OBC.Components): OBC.FragmentsManager {
  const fragments = components.get(OBC.FragmentsManager);

  // The fragments worker is served from /public/wasm/ via copy-wasm.mjs
  const wasmBase = process.env.NEXT_PUBLIC_WASM_PATH ?? "/wasm";
  fragments.core.workerUrl = `${wasmBase}/fragments-worker.mjs`;

  return fragments;
}

/**
 * Connects camera update events to fragments core update so level-of-detail
 * and visibility culling respond to camera movement.
 * Returns a cleanup function to remove the listener.
 */
export function connectFragmentsToCamera(
  fragments: OBC.FragmentsManager,
  camera: OBC.OrthoPerspectiveCamera,
): () => void {
  const onUpdate = () => fragments.core.update(true);
  camera.controls.addEventListener("update", onUpdate);
  return () => camera.controls.removeEventListener("update", onUpdate);
}
