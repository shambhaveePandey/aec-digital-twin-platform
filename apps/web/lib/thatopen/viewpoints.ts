import * as OBC from "@thatopen/components";
import * as THREE from "three";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { CameraState } from "./types";

/** Serialises current camera state to a plain object safe for DB storage. */
export function captureViewpoint(camera: OBC.OrthoPerspectiveCamera): CameraState {
  const pos = camera.three.position;
  const target = new THREE.Vector3();
  camera.controls.getTarget(target);
  const up = camera.three.up;

  return {
    position: { x: pos.x, y: pos.y, z: pos.z },
    target: { x: target.x, y: target.y, z: target.z },
    up: { x: up.x, y: up.y, z: up.z },
    isOrthographic: camera.projection.current === "Orthographic",
  };
}

/** Animates the camera to a previously serialised viewpoint. */
export async function restoreViewpoint(
  camera: OBC.OrthoPerspectiveCamera,
  state: CameraState,
  animated = true,
): Promise<void> {
  await camera.controls.setPosition(
    state.position.x,
    state.position.y,
    state.position.z,
    animated,
  );
  await camera.controls.setTarget(
    state.target.x,
    state.target.y,
    state.target.z,
    animated,
  );

  if (state.isOrthographic) {
    await camera.projection.set("Orthographic");
  } else {
    await camera.projection.set("Perspective");
  }
}

/**
 * Resolves once `p` settles or after `ms`, whichever comes first. Used to guard
 * camera-framing so a never-settling controls animation can't hang the loader.
 */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([
    p,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

/**
 * Fits the camera to show the loaded model.
 *
 * Previously this called `camera.fit(world.meshes, ...)`, but the IFC loader
 * adds fragment meshes to `world.scene.three` — NOT to `world.meshes`. With an
 * empty mesh set the camera computes a NaN bounding sphere and the underlying
 * camera-controls `fitToSphere` animation never settles, leaving the loader
 * stuck at the "framing" phase and the overlay covering an unframed (black)
 * canvas.
 *
 * Instead we compute a real bounding sphere from the model via BoundingBoxer
 * and frame that. Everything is wrapped in a timeout so framing can never
 * block the load from completing — worst case the camera keeps its default
 * pose but the model is on screen and interactive.
 */
export async function fitToScene(
  components: OBC.Components,
  world: OBC.World,
  model?: FragmentsGroup,
): Promise<void> {
  const camera = world.camera as OBC.OrthoPerspectiveCamera;

  // Derive a bounding sphere for the loaded geometry.
  let sphere: THREE.Sphere | null = null;
  try {
    const boxer = components.get(OBC.BoundingBoxer);
    boxer.reset();
    if (model) {
      boxer.add(model);
    } else {
      // Fall back to every mesh currently in the scene.
      world.scene.three.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if ((m as THREE.InstancedMesh).isInstancedMesh || m.isMesh) {
          boxer.addMesh(m as THREE.Mesh);
        }
      });
    }
    const candidate = boxer.getSphere();
    boxer.reset();
    if (
      candidate &&
      Number.isFinite(candidate.radius) &&
      candidate.radius > 0 &&
      Number.isFinite(candidate.center.x)
    ) {
      sphere = candidate;
    }
  } catch {
    sphere = null;
  }

  if (sphere) {
    // camera-controls' fitToSphere resolves reliably for a valid sphere.
    await withTimeout(
      Promise.resolve(camera.controls.fitToSphere(sphere, true)),
      3000,
    );
    return;
  }

  // Last resort: try the built-in fit but never let it hang the loader.
  try {
    await withTimeout(camera.fit(world.meshes, 0.8), 3000);
  } catch {
    /* leave camera at default pose */
  }
}
