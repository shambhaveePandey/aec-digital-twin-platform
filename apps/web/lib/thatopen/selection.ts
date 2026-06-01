import * as OBC from "@thatopen/components";
import type { FragmentMesh } from "@thatopen/fragments";
import type { SelectionState } from "./types";

/**
 * Casts a ray from the current cursor position into the scene and returns
 * the hit element's IDs.  Returns null when nothing is hit.
 *
 * In @thatopen/fragments v2.x the raycast hit's `object` is a `FragmentMesh`
 * (a THREE.InstancedMesh subclass). The express ID is resolved from the hit
 * `instanceId` via the *Fragment* attached to the mesh (`mesh.fragment`), not
 * the mesh itself — `getItemID` lives on `Fragment`, not on `FragmentMesh`.
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

  // The hit object is a FragmentMesh; its `.fragment` holds the instance→item map.
  const mesh = result.object as unknown as FragmentMesh;
  const fragment = mesh.fragment;
  if (!fragment || typeof fragment.getItemID !== "function") return null;

  const instanceId = result.instanceId;
  if (instanceId === undefined || instanceId === null) return null;

  const expressId = fragment.getItemID(instanceId);
  if (expressId === undefined || expressId === null) return null;

  return {
    expressId,
    ifcGuid: "", // resolved separately from the model's in-memory properties
    fragmentId: fragment.id ?? "",
    modelUuid: fragment.group?.uuid ?? "",
  };
}

// THREE is a peer dep; import type only to avoid bundling it twice
import type * as THREE from "three";
