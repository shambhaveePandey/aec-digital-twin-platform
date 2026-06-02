import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";
import type { FragmentsGroup, FragmentIdMap } from "@thatopen/fragments";

/** The name of the built-in selection style created by the Highlighter. */
export const SELECT_STYLE = "select";

/**
 * One selected element, resolved from the active highlighter selection.
 * `expressId` is the IFC express id and `modelUuid` identifies the owning model.
 */
export type SelectedItem = {
  expressId: number;
  modelUuid: string;
  fragmentId: string;
};

/**
 * Sets up the interactive selection Highlighter for the world.
 *
 * The Highlighter owns its own click handling: a left click selects a single
 * element (replacing the previous selection) and Ctrl+click adds/removes
 * elements from a multi-selection. We only need to register a Raycaster for the
 * world and call `setup` once — the engine wires up the DOM events itself.
 *
 * Returns the configured Highlighter instance.
 */
export function setupSelectionHighlighter(
  components: OBC.Components,
  world: OBC.World,
): OBCF.Highlighter {
  // A raycaster must exist for the world before the highlighter can pick.
  components.get(OBC.Raycasters).get(world);

  const highlighter = components.get(OBCF.Highlighter);

  // setup is idempotent-ish; guard so we don't reconfigure on every load.
  if (!highlighter.isSetup) {
    highlighter.setup({
      world,
      selectEnabled: true,
      hoverEnabled: false,
      selectionColor: new THREE.Color("#22c55e"), // green selection
      autoHighlightOnClick: true,
    });
  } else {
    highlighter.config.world = world;
  }

  // Ctrl+click toggles multi-selection.
  highlighter.multiple = "ctrlKey";
  // Don't auto-zoom on every selection — that would fight with user navigation.
  highlighter.zoomToSelection = false;

  return highlighter;
}

/**
 * Flattens the highlighter's current "select" FragmentIdMap into a list of
 * { expressId, modelUuid } items. A FragmentIdMap is a record keyed by fragment
 * id whose values are Sets of express ids belonging to that fragment.
 */
export function selectionToItems(
  fragmentIdMap: FragmentIdMap | undefined,
  fragments: OBC.FragmentsManager,
): SelectedItem[] {
  if (!fragmentIdMap) return [];

  const items: SelectedItem[] = [];
  for (const [fragmentId, expressIds] of Object.entries(fragmentIdMap)) {
    const fragment = fragments.list.get(fragmentId);
    const modelUuid =
      (fragment?.group as { uuid?: string } | undefined)?.uuid ?? "";
    for (const expressId of expressIds as Set<number>) {
      items.push({ expressId, modelUuid, fragmentId });
    }
  }
  return items;
}

/** Clears the interactive selection (and its green highlight). */
export async function clearSelection(
  highlighter: OBCF.Highlighter,
): Promise<void> {
  await highlighter.clear(SELECT_STYLE);
}

/**
 * Programmatically selects a set of elements by express id within one model.
 * Used to drive selection from the model tree so the tree and viewer stay in
 * sync. Builds a FragmentIdMap for the given express ids and highlights it.
 */
export async function selectByExpressIds(
  components: OBC.Components,
  highlighter: OBCF.Highlighter,
  model: FragmentsGroup,
  expressIds: number[],
  add = false,
): Promise<void> {
  const map = (
    model as unknown as {
      getFragmentMap?: (ids: Iterable<number>) => FragmentIdMap;
    }
  ).getFragmentMap?.(expressIds);
  if (!map) return;
  await highlighter.highlightByID(SELECT_STYLE, map, !add, false);
}
