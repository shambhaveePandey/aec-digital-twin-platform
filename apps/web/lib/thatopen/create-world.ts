import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import type { WorldHandles } from "./types";

/**
 * Initialises a That Open world attached to a DOM container.
 * Must only be called in a browser context (no SSR).
 */
export async function createWorld(container: HTMLElement): Promise<WorldHandles> {
  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBCF.RendererWith2D
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBCF.RendererWith2D(components, container);
  world.camera = new OBC.OrthoPerspectiveCamera(components);

  // Default lighting, background colour, and environment
  world.scene.setup();

  // Reference grid for spatial orientation
  const grids = components.get(OBC.Grids);
  grids.create(world);

  // Start the components update/render loop. Without this the renderer never
  // ticks continuously, so the camera-controls animation used by fitToSphere
  // never advances (leaving the loader stuck in the "framing" phase) and the
  // canvas stays black. This must run once the world is fully configured.
  components.init();

  return {
    components,
    world,
    scene: world.scene as OBC.SimpleScene,
    camera: world.camera as OBC.OrthoPerspectiveCamera,
    renderer: world.renderer as OBCF.RendererWith2D,
  };
}

/** Disposes all engine resources and removes event listeners. */
export function disposeWorld(handles: WorldHandles): void {
  handles.components.dispose();
}
