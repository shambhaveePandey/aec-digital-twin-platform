"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TwinError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-center">
      <p className="text-5xl">⚠️</p>
      <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
      <p className="max-w-xs text-sm text-neutral-400">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
