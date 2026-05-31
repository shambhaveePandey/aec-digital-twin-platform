import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { requireSession } from "@/lib/auth/session";
import { getTwinWithLatestVersion, getWorkspaceMember, getLatestModelVersion } from "@/lib/db";
import { getDownloadPresignedUrl } from "@/lib/storage/s3";
import type { Metadata } from "next";

type Props = { params: { twinId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const twin = await getTwinWithLatestVersion(params.twinId);
  return { title: twin?.name ?? "Twin" };
}

// Dynamically import the viewer — it uses Three.js and must not SSR
const IfcViewerShell = dynamic(
  () =>
    import("@/components/viewer/IfcViewerShell").then((m) => ({
      default: m.IfcViewerShell,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
          <p className="text-sm text-neutral-500">Initialising viewer…</p>
        </div>
      </div>
    ),
  },
);

export default async function TwinPage({ params }: Props) {
  const session = await requireSession();
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinWithLatestVersion(params.twinId);
  if (!twin) notFound();

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) notFound();

  const latestVersion = await getLatestModelVersion(twin.id);

  // Generate a short-lived pre-signed URL for the .frag asset
  const fragUrl = latestVersion?.fragFileKey
    ? await getDownloadPresignedUrl(latestVersion.fragFileKey, 3600)
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-800 px-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">{twin.name}</span>
          {latestVersion && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
              v{latestVersion.version}
            </span>
          )}
          <span
            className={`rounded px-1.5 py-0.5 text-xs ${
              latestVersion?.status === "READY"
                ? "bg-green-900/50 text-green-400"
                : latestVersion?.status === "PROCESSING"
                  ? "bg-yellow-900/50 text-yellow-400"
                  : "bg-neutral-800 text-neutral-500"
            }`}
          >
            {latestVersion?.status ?? "No model"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{twin._count.issues} issues</span>
          <span>·</span>
          <span>{twin._count.sensors} sensors</span>
        </div>
      </header>

      {/* Viewer area */}
      <div className="flex-1 overflow-hidden">
        {latestVersion?.status === "READY" && fragUrl ? (
          <IfcViewerShell
            twinId={twin.id}
            modelVersionId={latestVersion.id}
            fragUrl={fragUrl}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-4xl">📐</p>
            <p className="text-lg font-semibold text-white">No model loaded</p>
            <p className="max-w-sm text-sm text-neutral-400">
              {latestVersion?.status === "PROCESSING"
                ? "Conversion in progress. Refresh when done."
                : "Upload an IFC file and run conversion to view this twin."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
