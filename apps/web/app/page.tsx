import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex h-14 items-center justify-between border-b border-neutral-800 px-6">
        <span className="font-semibold tracking-tight">AEC Digital Twin</span>
        <div className="flex gap-4 text-sm">
          <Link href="/sign-in" className="text-neutral-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-400">
          Open source · MIT license
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white">
          Browser-based AEC digital twins from IFC
        </h1>
        <p className="max-w-xl text-lg text-neutral-400">
          Upload IFC models, convert them to high-performance Fragments, and operate
          your building data with a fast WebGL viewer, live sensor overlays, BCF issues,
          and a documented REST API.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Start building
          </Link>
          <a
            href="https://github.com/shambhaveePandey/aec-digital-twin-platform"
            className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-neutral-800 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-2 text-2xl">{f.icon}</div>
              <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-neutral-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-6 text-center text-xs text-neutral-500">
        MIT License · Built with{" "}
        <a href="https://thatopen.com" className="underline hover:text-neutral-300" target="_blank" rel="noopener noreferrer">
          That Open Company
        </a>{" "}
        libraries
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: "📐",
    title: "IFC Upload & Conversion",
    description:
      "Upload .ifc files and convert them once to Fragments. The viewer always loads the fast .frag artifact.",
  },
  {
    icon: "🧊",
    title: "WebGL 3D Viewer",
    description:
      "Powered by @thatopen/components and Three.js. Orbit, first-person, and plan-view navigation.",
  },
  {
    icon: "🏗️",
    title: "Properties Inspector",
    description:
      "Browse IFC property sets, classifications, storeys, and systems. Select any element to inspect.",
  },
  {
    icon: "✂️",
    title: "Section Cuts",
    description:
      "Interactive clipping planes for cross-sections. Create, move, and delete planes on-the-fly.",
  },
  {
    icon: "📋",
    title: "BCF Issues",
    description:
      "BCF-compatible issue management with viewpoints, element links, comments, and status tracking.",
  },
  {
    icon: "📡",
    title: "Live Sensor Overlay",
    description:
      "Map MQTT telemetry to model elements. Thresholds, alerts, and a colour-coded status legend.",
  },
];
