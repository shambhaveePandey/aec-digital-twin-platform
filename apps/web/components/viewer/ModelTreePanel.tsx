"use client";

import { useEffect, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { ClassificationNode } from "@/lib/thatopen/types";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  models: FragmentsGroup[];
  /** Stable key identifying the loaded model set; changes only on load/unload. */
  modelKeys: string;
  /** Express ids currently selected in the viewer (for highlighting the tree). */
  selectedExpressIds: Set<number>;
  /** Called when a tree leaf is clicked; add=true for Ctrl/multi behaviour. */
  onSelectNode: (
    modelUuid: string,
    expressIds: number[],
    add: boolean,
  ) => void;
};

function TreeNode({
  node,
  depth = 0,
  selectedExpressIds,
  onSelectNode,
}: {
  node: ClassificationNode;
  depth?: number;
  selectedExpressIds: Set<number>;
  onSelectNode: Props["onSelectNode"];
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren && (node.expressIds?.length ?? 0) > 0;

  // A leaf is "active" when any of its express ids are in the selection.
  const active =
    isLeaf &&
    node.expressIds!.some((id) => selectedExpressIds.has(id));

  function handleClick(e: React.MouseEvent) {
    if (hasChildren) {
      setOpen((v) => !v);
      return;
    }
    if (isLeaf) {
      onSelectNode(node.modelUuid ?? "", node.expressIds ?? [], e.ctrlKey || e.metaKey);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-xs transition-colors ${
          active
            ? "bg-blue-600/30 text-white"
            : "text-neutral-300 hover:bg-neutral-800"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        title={isLeaf ? `${node.expressIds!.length} element(s) — click to select` : undefined}
      >
        {hasChildren && (
          <span className="text-neutral-500">{open ? "▾" : "▸"}</span>
        )}
        <span className="truncate">{node.name}</span>
        {isLeaf && (
          <span className="ml-auto shrink-0 text-[10px] text-neutral-600">
            {node.expressIds!.length}
          </span>
        )}
      </button>
      {open && hasChildren &&
        node.children!.map((child, i) => (
          <TreeNode
            key={`${child.name}-${i}`}
            node={child}
            depth={depth + 1}
            selectedExpressIds={selectedExpressIds}
            onSelectNode={onSelectNode}
          />
        ))}
    </div>
  );
}

export function ModelTreePanel({
  components,
  models,
  modelKeys,
  selectedExpressIds,
  onSelectNode,
}: Props) {
  const [tree, setTree] = useState<ClassificationNode[]>([]);

  // Rebuild the tree only when the *set* of loaded models changes (via the
  // stable `modelKeys`), not on every parent re-render.
  useEffect(() => {
    if (!components || models.length === 0) {
      setTree([]);
      return;
    }

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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, modelKeys]);

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
        tree.map((node, i) => (
          <TreeNode
            key={i}
            node={node}
            selectedExpressIds={selectedExpressIds}
            onSelectNode={onSelectNode}
          />
        ))
      )}
    </div>
  );
}
