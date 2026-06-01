import dynamic from "next/dynamic";

// The viewer uses Three.js / WebGL and must not server-render.
const ClientViewerPage = dynamic(
  () =>
    import("@/components/viewer/ClientViewerPage").then((m) => ({
      default: m.ClientViewerPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
          <p className="text-sm text-neutral-500">Initialising viewer…</p>
        </div>
      </div>
    ),
  },
);

export default function HomePage() {
  return <ClientViewerPage />;
}
