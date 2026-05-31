import type { DigitalTwin, TwinModelVersion } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type TwinWithVersion = DigitalTwin & { modelVersions: TwinModelVersion[] };

export async function apiFetchTwins(
  workspaceId: string,
  params?: { search?: string; page?: number },
): Promise<{ items: TwinWithVersion[]; total: number }> {
  const sp = new URLSearchParams({ workspaceId });
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("skip", String((params.page - 1) * 20));
  const res = await fetch(`${BASE}/api/twins?${sp}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetchTwins failed: ${res.status}`);
  return res.json();
}

export async function apiFetchTwin(twinId: string): Promise<TwinWithVersion> {
  const res = await fetch(`${BASE}/api/twins/${twinId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetchTwin failed: ${res.status}`);
  return res.json();
}

export async function apiCreateTwin(data: {
  workspaceId: string;
  name: string;
  description?: string;
}): Promise<DigitalTwin> {
  const res = await fetch(`${BASE}/api/twins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createTwin failed: ${res.status}`);
  return res.json();
}

export async function apiDeleteTwin(twinId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/twins/${twinId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`deleteTwin failed: ${res.status}`);
}
