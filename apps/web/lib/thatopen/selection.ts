import * as OBC from "@thatopen/components";
import type { SelectionState } from "./types";

/**
 * Casts a ray from the current cursor position into the scene and returns
 * the hit element's IDs.  Returns null when nothing is hit.
 *
 * Note: expressId extraction depends on the fragment geometry layout which
 * may vary across @thatopen/components versions — adjust getVertexBlockID
 * call if needed when upgrading the engine.
 */
export function castRayAndSelect(
  components: OBC.Components,
  world: OBC.World,
  // Accept any iterable of Three.js Object3D children (fragment groups)
  models: { children: THREE.Object3D[] }[],
): SelectionState {
  const casters = components.get(OBC.Raycasters);
  const caster = casters.get(world);

  const meshes = models.flatMap((m) => m.children as THREE.Object3D[]);
  const result = caster.castRay(meshes);

  if (!result?.face || !result.object) return null;

  // OBC.Fragment extends THREE.InstancedMesh
  const fragment = result.object as unknown as OBC.Fragment;
  if (!fragment?.getVertexBlockID) return null;

  const expressId = fragment.getVertexBlockID(result.face.a);
  if (expressId === undefined || expressId === null) return null;

  return {
    expressId,
    ifcGuid: "", // resolved separately via API call to /properties?expressId=…
    fragmentId: fragment.id ?? "",
    modelUuid: fragment.group?.uuid ?? "",
  };
}

// THREE is a peer dep; import type only to avoid bundling it twice
import type * as THREE from "three";
