import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import { assetPath } from "@/lib/utils/asset-path";

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

// web-ifc's WASM only needs to be set up once per page; re-running setup() on
// every file switch re-initialises the WASM module and slows loading down.
let didSetup = false;

export async function loadIfcInBrowser(
  components: OBC.Components,
  world: OBC.World,
  ifcArrayBuffer: ArrayBuffer,
): Promise<FragmentsGroup> {
  const ifcLoader = components.get(OBC.IfcLoader);

  if (!didSetup) {
    const wasmBase = process.env.NEXT_PUBLIC_WASM_PATH ?? assetPath("/wasm");
    ifcLoader.settings.wasm = {
      path: `${wasmBase}/`,
      absolute: false,
    };
    // We provide the WASM path manually, so don't let setup() override it.
    ifcLoader.settings.autoSetWasm = false;

    // Properties must be included so IfcRelationsIndexer can build the relation
    // maps that the model tree (bySpatialStructure) depends on.
    ifcLoader.settings.includeProperties = true;

    // web-ifc performance / correctness tuning:
    //  - COORDINATE_TO_ORIGIN recenters far-from-origin models (common in geo-
    //    referenced IFCs) to avoid float precision artefacts and visible jitter.
    //  - CIRCLE_SEGMENTS lowers curved-geometry tessellation a little for
    //    faster parsing with negligible visual impact at viewer scale.
    ifcLoader.settings.webIfc = {
      ...ifcLoader.settings.webIfc,
      COORDINATE_TO_ORIGIN: true,
      CIRCLE_SEGMENTS: 12,
    };

    await ifcLoader.setup();
    didSetup = true;
  }

  const model = await ifcLoader.load(new Uint8Array(ifcArrayBuffer));
  world.scene.three.add(model);

  // Index the model's IFC relations so downstream components (e.g. the
  // Classifier's bySpatialStructure) have the relation maps they require.
  // Without this, classification throws "model relations ... have to exists
  // to group by spatial structure". Failure here is non-fatal: the geometry
  // still renders and entity-based classification still works.
  try {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    await indexer.process(model);
  } catch {
    // Some IFC files ship without the properties needed to index relations;
    // swallow so the model still displays.
  }

  return model;
}
