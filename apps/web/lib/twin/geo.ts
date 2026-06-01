import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import type { FragmentsGroup } from "@thatopen/fragments";

/** A geographic position used to place the model on the world map. */
export type GeoLocation = {
  lat: number;
  lon: number;
  /** Where the value came from, for display. */
  source: "ifc-site" | "default";
  /** Optional human-readable site name from IfcSite. */
  siteName?: string;
};

/**
 * Default location used when the IFC file has no georeference. Central London
 * (near the Barbican) — a sensible neutral default for demos.
 */
export const DEFAULT_LOCATION: GeoLocation = {
  lat: 51.5202,
  lon: -0.0937,
  source: "default",
};

/**
 * Converts an IFC compound-plane-angle measure (degrees, minutes, seconds and
 * optional millionths of a second) into decimal degrees. IFC stores
 * IfcSite.RefLatitude / RefLongitude as an array of integers like
 * [deg, min, sec, millionthsOfSec].
 */
function dmsToDecimal(dms: number[] | null | undefined): number | null {
  if (!Array.isArray(dms) || dms.length < 2) return null;
  const [deg = 0, min = 0, sec = 0, millionths = 0] = dms;
  const sign = deg < 0 || Object.is(deg, -0) ? -1 : 1;
  const decimal =
    Math.abs(deg) + Math.abs(min) / 60 + (Math.abs(sec) + Math.abs(millionths) / 1e6) / 3600;
  return sign * decimal;
}

/**
 * Reads the georeference (latitude / longitude) from the first IfcSite in the
 * loaded model. Returns the DEFAULT_LOCATION when no usable georeference is
 * present, so the map always has somewhere to centre.
 *
 * This reads directly from the in-memory web-ifc model held by the IfcLoader,
 * which is the source of truth for spatial-structure properties in this
 * client-side app (there is no server).
 */
export async function readModelLocation(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<GeoLocation> {
  try {
    const ifcLoader = components.get(OBC.IfcLoader);
    const webIfc = ifcLoader.webIfc;
    // The model's modelID maps to the open web-ifc model.
    const modelID = (model as unknown as { ifcMetadata?: { modelID?: number } })
      .ifcMetadata?.modelID;
    const id = typeof modelID === "number" ? modelID : 0;

    const siteIds = webIfc.GetLineIDsWithType(id, WEBIFC.IFCSITE);
    for (let i = 0; i < siteIds.size(); i++) {
      const site = webIfc.GetLine(id, siteIds.get(i)) as {
        RefLatitude?: { value: number[] } | null;
        RefLongitude?: { value: number[] } | null;
        Name?: { value?: string } | null;
      };
      const lat = dmsToDecimal(site.RefLatitude?.value);
      const lon = dmsToDecimal(site.RefLongitude?.value);
      if (lat !== null && lon !== null && (lat !== 0 || lon !== 0)) {
        return {
          lat,
          lon,
          source: "ifc-site",
          siteName: site.Name?.value,
        };
      }
    }
  } catch {
    // Reading georeference is best-effort; fall back below.
  }
  return DEFAULT_LOCATION;
}
