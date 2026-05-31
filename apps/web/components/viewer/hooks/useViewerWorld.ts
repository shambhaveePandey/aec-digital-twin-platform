"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { WorldHandles } from "@/lib/thatopen/types";

/**
 * Initialises a That Open world inside the given container element.
 * All heavy imports are lazy so they never execute on the server.
 */
export function useViewerWorld(containerRef: RefObject<HTMLDivElement>) {
  const handlesRef = useRef<WorldHandles | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function init() {
      try {
        const { createWorld } = await import("@/lib/thatopen/create-world");
        const { initFragments, connectFragmentsToCamera } = await import(
          "@/lib/thatopen/init-fragments"
        );

        const handles = await createWorld(container);
        if (cancelled) {
          const { disposeWorld } = await import("@/lib/thatopen/create-world");
          disposeWorld(handles);
          return;
        }

        const fragments = initFragments(handles.components);
        connectFragmentsToCamera(fragments, handles.camera);

        handlesRef.current = handles;
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (handlesRef.current) {
        import("@/lib/thatopen/create-world").then(({ disposeWorld }) => {
          if (handlesRef.current) {
            disposeWorld(handlesRef.current);
            handlesRef.current = null;
          }
        });
      }
    };
    // containerRef.current is stable — deps array is intentionally minimal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handlesRef, isReady, error };
}
