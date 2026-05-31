import type { Issue, IssueComment } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function apiFetchIssues(
  twinId: string,
  params?: { status?: string; skip?: number; take?: number },
): Promise<{ items: Issue[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.skip !== undefined) sp.set("skip", String(params.skip));
  if (params?.take !== undefined) sp.set("take", String(params.take));
  const res = await fetch(`${BASE}/api/twins/${twinId}/issues?${sp}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetchIssues failed: ${res.status}`);
  return res.json();
}

export async function apiCreateIssue(
  twinId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    ifcGuid?: string;
    expressId?: number;
  },
): Promise<Issue> {
  const res = await fetch(`${BASE}/api/twins/${twinId}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createIssue failed: ${res.status}`);
  return res.json();
}

export async function apiUpdateIssue(
  twinId: string,
  issueId: string,
  data: { status?: string; priority?: string; title?: string },
): Promise<Issue> {
  const res = await fetch(`${BASE}/api/twins/${twinId}/issues/${issueId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`updateIssue failed: ${res.status}`);
  return res.json();
}
