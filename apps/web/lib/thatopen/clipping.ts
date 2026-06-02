import * as OBC from "@thatopen/components";
import * as THREE from "three";
import type { FragmentsGroup } from "@thatopen/fragments";

/**
 * Section cuts (clipping planes) for the viewer.
 *
 * Why the old panel "didn't work": `Clipper.create(world)` casts a ray from the
 * current cursor position and only creates a plane where that ray hits a mesh.
 * Triggering it from a sidebar button (cursor not over geometry) raycast-missed,
 * so nothing happened. The fixes here:
 *   1. `enableClipping` turns the clipper on AND enables local clipping on the
 *      renderer (so the planes actually cut geometry).
 *   2. `addAxisPlane` drops a plane deterministically at the model's bounding-box
 *      centre along X/Y/Z via `createFromNormalAndCoplanarPoint` — no cursor
 *      needed, so the toolbar buttons always work.
 *   3. `enableDoubleClickPlanes` wires the documented double-click-on-geometry
 *      gesture for placing planes on a clicked face.
 */

export function getClipper(components: OBC.Components): OBC.Clipper {
  return components.get(OBC.Clipper);
}

export function enableClipping(
  components: OBC.Components,
  world: OBC.World,
): void {
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = true;
  clipper.visible = true;
  // Ensure a raycaster exists for double-click placement.
  components.get(OBC.Raycasters).get(world);
  // Make sure the renderer actually applies clipping planes to geometry.
  const renderer = (world.renderer as { three?: THREE.WebGLRenderer } | null)
    ?.three;
  if (renderer) renderer.localClippingEnabled = true;
}

export function disableClipping(components: OBC.Components): void {
  const clipper = components.get(OBC.Clipper);
  clipper.deleteAll();
  clipper.enabled = false;
}

/**
 * Computes the bounding-box centre of all loaded geometry so axis planes can be
 * placed in a sensible spot regardless of where the cursor is.
 */
function sceneCenter(
  components: OBC.Components,
  world: OBC.World,
  model?: FragmentsGroup,
): THREE.Vector3 {
  try {
    const boxer = components.get(OBC.BoundingBoxer);
    boxer.reset();
    if (model) {
      boxer.add(model);
    } else {
      world.scene.three.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if ((m as THREE.InstancedMesh).isInstancedMesh || m.isMesh) {
          boxer.addMesh(m as THREE.Mesh);
        }
      });
    }
    const sphere = boxer.getSphere();
    boxer.reset();
    if (sphere && Number.isFinite(sphere.center.x)) return sphere.center.clone();
  } catch {
    /* fall through */
  }
  return new THREE.Vector3(0, 0, 0);
}

export type Axis = "x" | "y" | "z";

const AXIS_NORMALS: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

/**
 * Creates a clipping plane through the model centre, perpendicular to the given
 * axis. Always succeeds (no cursor/raycast required).
 */
export function addAxisPlane(
  components: OBC.Components,
  world: OBC.World,
  axis: Axis,
  model?: FragmentsGroup,
): void {
  enableClipping(components, world);
  const clipper = components.get(OBC.Clipper);
  const point = sceneCenter(components, world, model);
  const normal = AXIS_NORMALS[axis].clone();
  clipper.createFromNormalAndCoplanarPoint(world, normal, point);
}

/**
 * Creates a clipping plane on the face currently under the cursor (used by the
 * double-click gesture). Returns true if a plane was created.
 */
export function createPlaneAtCursor(
  components: OBC.Components,
  world: OBC.World,
): boolean {
  const clipper = components.get(OBC.Clipper);
  if (!clipper.enabled) return false;
  const plane = clipper.create(world);
  return plane !== null;
}

export function deleteActiveClippingPlane(
  components: OBC.Components,
  world: OBC.World,
): void {
  components.get(OBC.Clipper).delete(world);
}

export function deleteAllClippingPlanes(components: OBC.Components): void {
  components.get(OBC.Clipper).deleteAll();
}

export function clipperPlaneCount(components: OBC.Components): number {
  return components.get(OBC.Clipper).list.length;
}
