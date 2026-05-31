"use client";

import { useEffect, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { ClassificationNode } from "@/lib/thatopen/types";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  models: FragmentsGroup[];
};

function TreeNode({ node, depth = 0 }: { node: ClassificationNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren && (
          <span className="text-neutral-500">{open ? "▾" : "▸"}</span>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && hasChildren &&
        node.children!.map((child, i) => (
          <TreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function ModelTreePanel({ components, world, models }: Props) {
  const [tree, setTree] = useState<ClassificationNode[]>([]);

  useEffect(() => {
    if (!components || models.length === 0) return;

    let cancelled = false;
    async function build() {
      const { getModelTree } = await import("@/lib/thatopen/classification");
      const nodes: ClassificationNode[] = [];
      for (const model of models) {
        const t = await getModelTree(components!, model);
        nodes.push(...t);
      }
      if (!cancelled) setTree(nodes);
    }
    build();
    return () => { cancelled = true; };
  }, [components, models]);

  return (
    <div className="viewer-panel h-full overflow-y-auto p-2">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Model tree
      </p>
      {tree.length === 0 ? (
        <p className="px-2 text-xs text-neutral-600">
          {models.length === 0 ? "No model loaded" : "Building tree…"}
        </p>
      ) : (
        tree.map((node, i) => <TreeNode key={i} node={node} />)
      )}
    </div>
  );
}
