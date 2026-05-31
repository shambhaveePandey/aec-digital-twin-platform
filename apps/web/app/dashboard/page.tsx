import { requireSession } from "@/lib/auth/session";
import { getUserWorkspaces, listTwins, getJobCountByStatus } from "@/lib/db";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = (session.user as { id: string }).id;

  const workspaces = await getUserWorkspaces(userId);
  const firstWorkspace = workspaces[0];

  const [twinsResult, jobCounts] = await Promise.all([
    firstWorkspace
      ? listTwins(firstWorkspace.id, { take: 6 })
      : Promise.resolve({ items: [], total: 0 }),
    getJobCountByStatus(),
  ]);

  return (
    <main className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Welcome back, {session.user?.name ?? session.user?.email}
        </p>
      </div>

      {/* Workspace selector */}
      {workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-700 p-8 text-center">
          <p className="text-neutral-400">No workspace yet.</p>
          <Link
            href="/sign-up"
            className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            Create one →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total twins", value: twinsResult.total },
              { label: "Jobs queued", value: jobCounts.QUEUED },
              { label: "Jobs running", value: jobCounts.RUNNING },
              { label: "Jobs failed", value: jobCounts.FAILED },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
              >
                <p className="text-xs text-neutral-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent twins */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent twins</h2>
              <Link
                href="/dashboard/twins"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {twinsResult.items.map((twin) => {
                const latestVersion = twin.modelVersions?.[0];
                return (
                  <Link
                    key={twin.id}
                    href={`/twins/${twin.id}`}
                    className="group rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white group-hover:text-blue-300 transition-colors">
                        {twin.name}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          latestVersion?.status === "READY"
                            ? "bg-green-900 text-green-400"
                            : latestVersion?.status === "PROCESSING"
                              ? "bg-yellow-900 text-yellow-400"
                              : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {latestVersion?.status ?? "No model"}
                      </span>
                    </div>
                    {twin.description && (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                        {twin.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-neutral-600">
                      Updated {relativeTime(twin.updatedAt)}
                    </p>
                  </Link>
                );
              })}

              {/* Add twin CTA */}
              {firstWorkspace && (
                <Link
                  href={`/dashboard/twins?workspace=${firstWorkspace.id}`}
                  className="flex items-center justify-center rounded-lg border border-dashed border-neutral-700 p-4 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  + New twin
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
