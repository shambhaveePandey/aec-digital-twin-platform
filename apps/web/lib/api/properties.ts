const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type ElementProperties = {
  ifcGuid: string;
  ifcClass: string;
  name: string | null;
  spatialPath: string | null;
  propertySets: Record<string, Record<string, unknown>>;
  classifications: Record<string, unknown> | null;
};

export async function apiFetchElementProperties(
  twinId: string,
  ifcGuid: string,
): Promise<ElementProperties> {
  const res = await fetch(
    `${BASE}/api/twins/${twinId}/properties?ifcGuid=${encodeURIComponent(ifcGuid)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`fetchProperties failed: ${res.status}`);
  return res.json();
}

export async function apiFetchElementsByClass(
  twinId: string,
  ifcClass: string,
): Promise<{ ifcGuid: string; name: string | null; spatialPath: string | null }[]> {
  const res = await fetch(
    `${BASE}/api/twins/${twinId}/properties?ifcClass=${encodeURIComponent(ifcClass)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`fetchByClass failed: ${res.status}`);
  const data = (await res.json()) as {
    elements: { ifcGuid: string; name: string | null; spatialPath: string | null }[];
  };
  return data.elements;
}
