"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type * as OBCF from "@thatopen/components-front";
import type { FragmentsGroup, FragmentIdMap } from "@thatopen/fragments";
import type { SelectedItem } from "@/lib/thatopen/selection";

/**
 * Owns interactive selection for the viewer. It wires the built-in
 * Highlighter "select" events to React state so that:
 *  - clicking an element highlights it (green) and exposes its properties,
 *  - Ctrl+clicking adds/removes elements (multi-selection),
 *  - the model tree can drive selection programmatically and stay in sync.
 *
 * Returns the list of currently selected items plus helpers.
 */
export function useViewerSelection(
  components: OBC.Components | null,
  world: OBC.World | null,
) {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const highlighterRef = useRef<OBCF.Highlighter | null>(null);

  // Set up the highlighter and subscribe to its select events.
  useEffect(() => {
    if (!components || !world) return;

    let disposed = false;

    async function init() {
      const { setupSelectionHighlighter, selectionToItems, SELECT_STYLE } =
        await import("@/lib/thatopen/selection");
      const OBC = await import("@thatopen/components");

      const highlighter = setupSelectionHighlighter(components!, world!);
      if (disposed) return;
      highlighterRef.current = highlighter;

      const fragments = components!.get(OBC.FragmentsManager);

      const sync = (map: FragmentIdMap | null) => {
        const items = selectionToItems(map ?? undefined, fragments);
        setSelected(items);
      };

      // onHighlight gives the current select FragmentIdMap; onClear resets it.
      const onHighlight = (map: FragmentIdMap) => sync(map);
      const onClear = () => setSelected([]);

      const events = highlighter.events[SELECT_STYLE];
      events?.onHighlight.add(onHighlight);
      events?.onClear.add(onClear);

      // Stash removers for cleanup.
      cleanupRef.current = () => {
        events?.onHighlight.remove(onHighlight);
        events?.onClear.remove(onClear);
      };
    }

    const cleanupRef: { current: (() => void) | null } = { current: null };
    init();

    return () => {
      disposed = true;
      cleanupRef.current?.();
    };
  }, [components, world]);

  /** Selects a set of express ids in one model (e.g. from the tree). */
  const selectExpressIds = useCallback(
    async (model: FragmentsGroup, expressIds: number[], add = false) => {
      if (!components) return;
      const highlighter = highlighterRef.current;
      if (!highlighter) return;
      const { selectByExpressIds } = await import("@/lib/thatopen/selection");
      await selectByExpressIds(components, highlighter, model, expressIds, add);
    },
    [components],
  );

  /** Clears the current selection and its highlight. */
  const clear = useCallback(async () => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;
    const { clearSelection } = await import("@/lib/thatopen/selection");
    await clearSelection(highlighter);
    setSelected([]);
  }, []);

  return { selected, selectExpressIds, clear, highlighterRef };
}
