import * as OBC from "@thatopen/components";
import type { Fragment } from "@thatopen/fragments";
import type { SelectionState } from "./types";

/**
 * Casts a ray from the current cursor position into the scene and returns
 * the hit element's IDs.  Returns null when nothing is hit.
 *
 * In @thatopen/fragments v2.x, expressId is resolved from the InstancedMesh
 * instanceId via Fragment.getItemID() rather than getVertexBlockID().
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

  if (!result?.object) return null;

  // Fragment extends THREE.InstancedMesh; instanceId identifies which instance was hit
  const fragment = result.object as unknown as Fragment;
  const instanceId = result.instanceId;
  if (instanceId === undefined || instanceId === null) return null;

  const expressId = fragment.getItemID(instanceId);
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
