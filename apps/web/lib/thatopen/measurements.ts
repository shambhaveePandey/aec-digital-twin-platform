import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export function enableLengthMeasurement(
  components: OBC.Components,
  world: OBC.World,
): OBCF.LengthMeasurement {
  const measurements = components.get(OBCF.LengthMeasurement);
  measurements.world = world;
  measurements.enabled = true;
  return measurements;
}

export function disableLengthMeasurement(components: OBC.Components): void {
  const measurements = components.get(OBCF.LengthMeasurement);
  measurements.enabled = false;
}

export function clearMeasurements(components: OBC.Components): void {
  const measurements = components.get(OBCF.LengthMeasurement);
  measurements.deleteAll();
}
