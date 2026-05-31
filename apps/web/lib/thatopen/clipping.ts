import * as OBC from "@thatopen/components";

export function getClipper(components: OBC.Components): OBC.Clipper {
  return components.get(OBC.Clipper);
}

export function enableClipping(components: OBC.Components): void {
  components.get(OBC.Clipper).enabled = true;
}

export function disableClipping(components: OBC.Components): void {
  components.get(OBC.Clipper).enabled = false;
}

export function createClippingPlane(
  components: OBC.Components,
  world: OBC.World,
): void {
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = true;
  clipper.create(world);
}

export function deleteActiveClippingPlane(
  components: OBC.Components,
  world: OBC.World,
): void {
  components.get(OBC.Clipper).delete(world);
}

export function deleteAllClippingPlanes(
  components: OBC.Components,
  world: OBC.World,
): void {
  components.get(OBC.Clipper).deleteAll(world);
}

export function toggleClipping(
  components: OBC.Components,
  world: OBC.World,
): void {
  const clipper = components.get(OBC.Clipper);
  if (clipper.enabled) {
    deleteAllClippingPlanes(components, world);
    clipper.enabled = false;
  } else {
    createClippingPlane(components, world);
  }
}
