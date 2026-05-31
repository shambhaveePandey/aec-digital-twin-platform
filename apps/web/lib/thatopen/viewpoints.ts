import * as OBC from "@thatopen/components";
import * as THREE from "three";
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

/** Fits the camera to show all loaded geometry. */
export async function fitToScene(
  components: OBC.Components,
  world: OBC.World,
): Promise<void> {
  const camera = world.camera as OBC.OrthoPerspectiveCamera;
  await camera.fit(world.meshes, 0.8);
}
