export type Vec3 = { x: number; y: number; z: number };

export type CameraState = {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  isOrthographic: boolean;
  orthographicSize?: number;
};

export type SelectionState = {
  expressId: number;
  ifcGuid: string;
  fragmentId: string;
  modelUuid: string;
} | null;

export type ClassificationNode = {
  name: string;
  id?: string;
  children?: ClassificationNode[];
};

export type WorldHandles = {
  /** Root component container — use components.get(SomeComponent) to access tools */
  components: import("@thatopen/components").Components;
  world: import("@thatopen/components").World;
  scene: import("@thatopen/components").SimpleScene;
  camera: import("@thatopen/components").OrthoPerspectiveCamera;
  renderer: import("@thatopen/components-front").RendererWith2D;
};
