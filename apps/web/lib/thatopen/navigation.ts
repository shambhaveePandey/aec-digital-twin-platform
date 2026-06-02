import * as OBC from "@thatopen/components";
import * as THREE from "three";

/**
 * Standard named viewpoints for the ViewCube / navigation gizmo. Each maps to a
 * camera direction (the offset applied to the model centre, scaled by the
 * bounding-sphere radius) so the model is always nicely framed.
 */
export type StandardView =
  | "top"
  | "bottom"
  | "front"
  | "back"
  | "left"
  | "right"
  | "iso";

const VIEW_DIRECTIONS: Record<StandardView, THREE.Vector3> = {
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  iso: new THREE.Vector3(1, 0.8, 1),
};

/** Computes the current scene bounding sphere, or a unit sphere fallback. */
function sceneSphere(components: OBC.Components, world: OBC.World): THREE.Sphere {
  try {
    const boxer = components.get(OBC.BoundingBoxer);
    boxer.reset();
    world.scene.three.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if ((m as THREE.InstancedMesh).isInstancedMesh || m.isMesh) {
        boxer.addMesh(m as THREE.Mesh);
      }
    });
    const sphere = boxer.getSphere();
    boxer.reset();
    if (sphere && Number.isFinite(sphere.radius) && sphere.radius > 0) {
      return sphere;
    }
  } catch {
    /* fall through */
  }
  return new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5);
}

/**
 * Moves the camera to a standard orthographic-style view, framing the whole
 * model. Works for any loaded model because the distance scales with the
 * bounding-sphere radius.
 */
export async function goToStandardView(
  components: OBC.Components,
  world: OBC.World,
  view: StandardView,
): Promise<void> {
  const camera = world.camera as OBC.OrthoPerspectiveCamera;
  const sphere = sceneSphere(components, world);
  const center = sphere.center;
  const dir = VIEW_DIRECTIONS[view].clone().normalize();
  // Distance: enough to fit the sphere comfortably in view.
  const distance = sphere.radius * 3 + 1;
  const pos = center.clone().add(dir.multiplyScalar(distance));

  await camera.controls.setLookAt(
    pos.x,
    pos.y,
    pos.z,
    center.x,
    center.y,
    center.z,
    true,
  );
  // Tighten the framing once oriented.
  await camera.controls.fitToSphere(sphere, true);
}

/** Toggles between perspective and orthographic projection. */
export async function toggleProjection(
  camera: OBC.OrthoPerspectiveCamera,
): Promise<"Perspective" | "Orthographic"> {
  const isOrtho = camera.projection.current === "Orthographic";
  const next = isOrtho ? "Perspective" : "Orthographic";
  await camera.projection.set(next);
  return next;
}

/** Zooms in/out by dollying the camera toward/away from its target. */
export async function zoom(
  camera: OBC.OrthoPerspectiveCamera,
  factor: number,
): Promise<void> {
  const controls = camera.controls;
  const pos = new THREE.Vector3();
  const target = new THREE.Vector3();
  controls.getPosition(pos);
  controls.getTarget(target);
  // Move position toward (factor<1) or away from (factor>1) the target.
  const newPos = target.clone().add(pos.clone().sub(target).multiplyScalar(factor));
  await controls.setPosition(newPos.x, newPos.y, newPos.z, true);
}
