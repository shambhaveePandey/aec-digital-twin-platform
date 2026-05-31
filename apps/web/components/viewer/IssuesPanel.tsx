"use client";

import { useEffect, useState } from "react";
import type { SelectionState } from "@/lib/thatopen/types";

type Issue = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  _count: { comments: number };
};

type Props = {
  twinId: string;
  selectedElement: SelectionState;
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-green-400",
};

export function IssuesPanel({ twinId, selectedElement }: Props) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/twins/${twinId}/issues?take=30`)
      .then((r) => r.json())
      .then((d) => {
        setIssues((d as { items: Issue[]; total: number }).items ?? []);
        setTotal((d as { items: Issue[]; total: number }).total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [twinId]);

  return (
    <div className="viewer-panel overflow-y-auto">
      <div className="sticky top-0 flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-3 py-2">
        <span className="text-xs font-semibold text-neutral-400">
          {total} issue{total !== 1 ? "s" : ""}
        </span>
        <button className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500 transition-colors">
          + New
        </button>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border border-neutral-700 border-t-blue-400" />
        </div>
      ) : issues.length === 0 ? (
        <p className="p-4 text-center text-xs text-neutral-600">No issues yet</p>
      ) : (
        <div className="divide-y divide-neutral-800">
          {issues.map((issue) => (
            <div key={issue.id} className="px-3 py-2 hover:bg-neutral-800 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-white line-clamp-2">{issue.title}</p>
                <span className={`shrink-0 text-xs ${PRIORITY_COLOR[issue.priority] ?? ""}`}>
                  ●
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-xs text-neutral-500">
                <span>{issue.status.replace("_", " ")}</span>
                <span>·</span>
                <span>{issue._count.comments} comments</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
