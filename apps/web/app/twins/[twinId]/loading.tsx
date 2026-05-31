export default function TwinLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
        <p className="text-sm text-neutral-400">Loading twin…</p>
      </div>
    </div>
  );
}
