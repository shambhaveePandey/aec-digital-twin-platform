import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

/**
 * Downloads a .frag binary from `fragmentUrl` and loads it into the scene.
 * This is the production loading path — never load raw IFC in the browser.
 */
export async function loadFragmentModel(
  components: OBC.Components,
  world: OBC.World,
  fragmentUrl: string,
): Promise<FragmentsGroup> {
  const fragments = components.get(OBC.FragmentsManager);

  const response = await fetch(fragmentUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch fragment model (${response.status}): ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const model = fragments.load(new Uint8Array(buffer));
  world.scene.three.add(model);

  return model;
}

/**
 * Removes a fragment model from the scene and disposes its GPU resources.
 */
export function unloadFragmentModel(
  components: OBC.Components,
  world: OBC.World,
  model: FragmentsGroup,
): void {
  world.scene.three.remove(model);
  const fragments = components.get(OBC.FragmentsManager);
  fragments.disposeGroup(model);
}
