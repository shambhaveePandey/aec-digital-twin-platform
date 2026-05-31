import { requireSession } from "@/lib/auth/session";
import { getUserWorkspaces, listTwins } from "@/lib/db";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Twins" };

type SearchParams = { workspace?: string; search?: string; page?: string };

export default async function TwinsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();
  const userId = (session.user as { id: string }).id;

  const workspaces = await getUserWorkspaces(userId);
  const activeWorkspace =
    workspaces.find((w) => w.id === searchParams.workspace) ?? workspaces[0];

  if (!activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-neutral-400">No workspace found. Create one first.</p>
      </div>
    );
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const take = 18;
  const skip = (page - 1) * take;

  const { items, total } = await listTwins(activeWorkspace.id, {
    search: searchParams.search,
    skip,
    take,
  });

  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Twins</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          New twin
        </button>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search twins…"
          className="w-64 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
        />
        <input type="hidden" name="workspace" value={activeWorkspace.id} />
        <button
          type="submit"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Twin grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-700 p-12 text-center">
          <p className="text-neutral-400">No twins yet. Upload an IFC to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((twin) => {
            const v = twin.modelVersions?.[0];
            return (
              <Link
                key={twin.id}
                href={`/twins/${twin.id}`}
                className="group rounded-lg border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {twin.name}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                      v?.status === "READY"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {v?.status ?? "—"}
                  </span>
                </div>
                {twin.description && (
                  <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                    {twin.description}
                  </p>
                )}
                <div className="mt-3 flex gap-3 text-xs text-neutral-600">
                  <span>{twin._count.issues} issues</span>
                  <span>{twin._count.sensors} sensors</span>
                  <span className="ml-auto">{relativeTime(twin.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?workspace=${activeWorkspace.id}&page=${p}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "border border-neutral-700 text-neutral-400 hover:text-white"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
