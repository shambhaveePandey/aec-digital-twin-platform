import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getTwinById, getWorkspaceMember, listIssues } from "@/lib/db";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

type Props = { params: { twinId: string } };

export const metadata = { title: "Issues" };

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "🔴 Critical",
  HIGH: "🟠 High",
  MEDIUM: "🟡 Medium",
  LOW: "🟢 Low",
};

export default async function IssuesPage({ params }: Props) {
  const session = await requireSession();
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinById(params.twinId);
  if (!twin) notFound();

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) notFound();

  const { items, total } = await listIssues(twin.id, { take: 50 });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/twins/${twin.id}`}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to viewer
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">Issues</h1>
          <p className="text-sm text-neutral-400">{total} total</p>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          New issue
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-700 p-12 text-center">
          <p className="text-neutral-400">No issues yet. Open the viewer to create one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900">
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Title</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Comments</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.map((issue) => (
                <tr
                  key={issue.id}
                  className="bg-neutral-900 hover:bg-neutral-800 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{issue.title}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300">
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {PRIORITY_LABEL[issue.priority] ?? issue.priority}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {issue._count.comments}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {relativeTime(issue.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
