import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";

/**
 * DEV / DEMO ONLY — loads a raw IFC file in the browser via IfcLoader.
 *
 * WARNING: IFC parsing in the browser is too slow for production models.
 * Production must convert IFC → Fragments in the ifc-worker service and
 * load the resulting .frag via loadFragmentModel() instead.
 *
 * This path is intentionally separated so it can never be accidentally
 * imported in a production code path.
 */
export async function loadIfcClientPreview(
  components: OBC.Components,
  world: OBC.World,
  ifcArrayBuffer: ArrayBuffer,
): Promise<FragmentsGroup> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "loadIfcClientPreview must not be called in production. Use loadFragmentModel.",
    );
  }

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
