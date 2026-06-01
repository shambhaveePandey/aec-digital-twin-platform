import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

/** Named highlight styles registered with the Highlighter. */
export const TWIN_STYLE_ACTIVE = "twin-active";
export const TWIN_STYLE_ALERT = "twin-alert";

let didSetup = false;

/**
 * Lazily configures the Highlighter for Digital Twin use and registers two
 * colour styles: a normal "active sensor" blue and an "alert" red. Selection /
 * hover auto-colouring is disabled because the viewer drives its own selection
 * via raycasting; we only use the Highlighter here to colour elements by GUID.
 */
export function setupTwinHighlighter(
  components: OBC.Components,
  world: OBC.World,
): OBCF.Highlighter {
  const highlighter = components.get(OBCF.Highlighter);
  if (!didSetup) {
    highlighter.setup({
      world,
      selectEnabled: false,
      hoverEnabled: false,
      autoHighlightOnClick: false,
    });
    highlighter.add(TWIN_STYLE_ACTIVE, new THREE.Color("#3b82f6"));
    highlighter.add(TWIN_STYLE_ALERT, new THREE.Color("#ef4444"));
    didSetup = true;
  }
  return highlighter;
}

/**
 * Colours the elements identified by `guids` using the given style. Converts
 * the IFC GlobalIds into a FragmentIdMap via the FragmentsManager, then applies
 * the colour with `highlightByID`. Returns the number of GUIDs that resolved to
 * real geometry.
 */
export async function highlightByGuids(
  components: OBC.Components,
  guids: string[],
  style: string,
): Promise<number> {
  if (guids.length === 0) return 0;
  const fragments = components.get(OBC.FragmentsManager);
  const map = fragments.guidToFragmentIdMap(guids);
  const resolved = Object.keys(map).length;
  if (resolved === 0) return 0;
  const highlighter = components.get(OBCF.Highlighter);
  // removePrevious=false so multiple sensors can be highlighted at once;
  // zoomToSelection=false so live updates don't yank the camera around.
  await highlighter.highlightByID(style, map, false, false);
  return resolved;
}

/** Clears a named twin highlight style (or all twin styles when omitted). */
export function clearTwinHighlights(
  components: OBC.Components,
  style?: string,
): void {
  const highlighter = components.get(OBCF.Highlighter);
  if (style) {
    highlighter.clear(style);
  } else {
    highlighter.clear(TWIN_STYLE_ACTIVE);
    highlighter.clear(TWIN_STYLE_ALERT);
  }
}
