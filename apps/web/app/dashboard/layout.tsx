import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getUserWorkspaces } from "@/lib/db";
import { initials } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const userId = (session.user as { id: string }).id;
  const workspaces = await getUserWorkspaces(userId);

  const displayName = session.user?.name ?? session.user?.email ?? "User";
  const abbr = initials(displayName);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      {/* Sidebar */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="flex h-14 items-center border-b border-neutral-800 px-4">
          <span className="font-semibold text-white">AEC Twin</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3 text-sm">
          {[
            { href: "/dashboard", label: "Overview" },
            { href: "/dashboard/twins", label: "Twins" },
            { href: "/dashboard/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Workspace list */}
        {workspaces.length > 0 && (
          <div className="border-t border-neutral-800 p-3">
            <p className="mb-1 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Workspace
            </p>
            {workspaces.slice(0, 3).map((ws) => (
              <div
                key={ws.id}
                className="rounded px-3 py-1.5 text-xs text-neutral-400"
              >
                {ws.name}
              </div>
            ))}
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-2 border-t border-neutral-800 p-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {abbr}
          </div>
          <span className="truncate text-xs text-neutral-300">{displayName}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
