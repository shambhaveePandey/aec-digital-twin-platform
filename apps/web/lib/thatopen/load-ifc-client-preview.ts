import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

/**
 * Loads a raw IFC file fully in the browser via IfcLoader.
 *
 * This is the supported, primary load path for this client-side app: there is
 * no server, no conversion worker, and no .frag pipeline. The IFC bytes are
 * parsed in-browser by web-ifc (WASM served from NEXT_PUBLIC_WASM_PATH) and the
 * resulting fragments group is added to the scene.
 *
 * Note: very large IFC files (tens of MB) can take several seconds to parse in
 * the browser. Prefer the bundled lightweight samples for quick demos.
 */
export async function loadIfcInBrowser(
  components: OBC.Components,
  world: OBC.World,
  ifcArrayBuffer: ArrayBuffer,
): Promise<FragmentsGroup> {
  const ifcLoader = components.get(OBC.IfcLoader);

  const wasmBase = process.env.NEXT_PUBLIC_WASM_PATH ?? "/wasm";
  ifcLoader.settings.wasm = {
    path: `${wasmBase}/`,
    absolute: false,
  };

  await ifcLoader.setup();

  const model = await ifcLoader.load(new Uint8Array(ifcArrayBuffer));
  world.scene.three.add(model);

  return model;
}
