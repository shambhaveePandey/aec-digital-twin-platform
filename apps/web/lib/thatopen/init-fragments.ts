import * as OBC from "@thatopen/components";

/**
 * Retrieves FragmentsManager from the components container.
 * Worker URL configuration is not available in @thatopen/components v2.x —
 * WASM files are loaded directly from the public path set in next.config.mjs.
 * Call once after createWorld, before loading any model.
 */
export function initFragments(components: OBC.Components): OBC.FragmentsManager {
  return components.get(OBC.FragmentsManager);
}

/**
 * Connects camera update events to the render loop so level-of-detail
 * and visibility culling respond to camera movement.
 * Returns a cleanup function to remove the listener.
 */
export function connectFragmentsToCamera(
  _fragments: OBC.FragmentsManager,
  camera: OBC.OrthoPerspectiveCamera,
): () => void {
  // Trigger a renderer update on each camera move
  const onUpdate = () => camera.updateAspect();
  camera.controls.addEventListener("update", onUpdate);
  return () => camera.controls.removeEventListener("update", onUpdate);
}
