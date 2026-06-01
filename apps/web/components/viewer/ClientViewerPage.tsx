"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IfcViewerShell } from "./IfcViewerShell";

type SampleEntry = {
  id: string;
  name: string;
  file: string;
  schema: string;
  description: string;
};

type Loaded = {
  key: string;
  name: string;
  buffer: ArrayBuffer;
};

export function ClientViewerPage() {
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);

  const loadSample = useCallback(async (entry: SampleEntry) => {
    setBusy(true);
    try {
      const res = await fetch(entry.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      setLoaded({ key: entry.id, name: entry.name, buffer });
    } catch (err) {
      toast.error(`Could not load ${entry.name}`);
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setBusy(false);
    }
  }, []);

  // Load the sample manifest, then auto-open the first sample once.
  useEffect(() => {
    let cancelled = false;
    fetch("/sample-ifc/manifest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((list: SampleEntry[]) => {
        if (cancelled) return;
        setSamples(list);
        if (!didInit.current && list.length > 0) {
          didInit.current = true;
          void loadSample(list[0]);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load sample list");
      });
    return () => {
      cancelled = true;
    };
  }, [loadSample]);

  function handleSampleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const entry = samples.find((s) => s.id === e.target.value);
    if (entry) void loadSample(entry);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ifc")) {
      toast.error("Please choose a .ifc file");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      setLoaded({ key: `upload:${file.name}:${file.size}`, name: file.name, buffer });
    } catch {
      toast.error("Could not read the file");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-800 px-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight text-white">
            AEC IFC Viewer
          </span>
          {busy && (
            <span className="text-xs text-yellow-500">Loading model…</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            Sample
            <select
              value={loaded?.key ?? ""}
              onChange={handleSampleChange}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Choose a sample…
              </option>
              {samples.map((s) => (
                <option key={s.id} value={s.id} title={s.description}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Upload .ifc
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </header>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        <IfcViewerShell
          ifcBuffer={loaded?.buffer ?? null}
          modelKey={loaded?.key ?? "none"}
          modelName={loaded?.name ?? ""}
        />
      </div>
    </div>
  );
}
