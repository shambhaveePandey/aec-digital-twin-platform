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
    // web-ifc resolves a *relative* wasm path against the location of the
    // worker/chunk script (…/_next/static/chunks/), which mangles a base-path
    // string like "/aec-digital-twin-platform/wasm/". Build a fully-qualified,
    // origin-absolute URL instead and mark it absolute so it is used verbatim.
    const rawBase = process.env.NEXT_PUBLIC_WASM_PATH ?? assetPath("/wasm");
    const wasmBase =
      typeof window !== "undefined" && rawBase.startsWith("/")
        ? `${window.location.origin}${rawBase}`
        : rawBase;
    ifcLoader.settings.wasm = {
      path: `${wasmBase}/`,
      absolute: true,
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

  // NOTE: relation indexing is intentionally NOT awaited here. Geometry is now
  // on screen; indexing (needed only for the model tree) is the heaviest
  // non-geometry step on large files, so we defer it to ensureRelationsIndexed
  // which the tree panel calls in the background. This lets the building appear
  // and become navigable seconds sooner.
  return model;
}

// Tracks which model UUIDs have already had their relations indexed so the
// (idempotent) call below isn't repeated on every tree rebuild.
const indexedModels = new Set<string>();

/**
 * Indexes the model's IFC relations so the Classifier's bySpatialStructure has
 * the relation maps it needs (otherwise it throws "model relations ... have to
 * exists to group by spatial structure"). Safe to call multiple times; the work
 * runs at most once per model. Failure is non-fatal — entity-based
 * classification still works without relations.
 */
export async function ensureRelationsIndexed(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<void> {
  if (indexedModels.has(model.uuid)) return;
  try {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    await indexer.process(model);
    indexedModels.add(model.uuid);
  } catch {
    // Some IFC files ship without the properties needed to index relations.
  }
}
