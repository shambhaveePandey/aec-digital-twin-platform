# Open AEC Digital Twin — Client-Side IFC Viewer

> A 100% client-side, browser-based IFC viewer for AEC / Open BIM data, powered by
> [That Open Company](https://thatopen.com) libraries (`@thatopen/components`,
> `@thatopen/components-front`, `@thatopen/fragments`), `web-ifc`, and Three.js.
> **No sign-up, no login, no server, no database** — pick a bundled sample or upload an
> `.ifc` file and it is parsed and rendered entirely in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live app:** https://shambhaveepandey.github.io/aec-digital-twin-platform/

## Documentation

- 📖 [User Guide](https://www.notion.so/372ff97a75418179b4a6e9c658d3cb6e) — end-to-end guide to loading models, navigating the 3D viewer, and using the Digital Twin (GIS + IoT).
- 🛠️ [API & Developer Documentation](https://www.notion.so/372ff97a75418126b758ccdfd8c1e6b3) — architecture, modules, the `IotSource` contract, the MQTT topic/payload convention, and build/deploy.

---

## Features

- **In-browser IFC loading** — open a bundled sample or upload any `.ifc` file. Parsing
  happens client-side via `web-ifc` (WASM); nothing is uploaded anywhere.
- **Browser-based 3D Viewer** — fast WebGL viewer built on That Open components + Three.js.
- **IFC Properties Inspector** — click any element to read its attributes live from the
  loaded model in memory.
- **Section Cuts & Clipping Planes** — interactive clipping powered by the engine's `Clipper`.
- **Model Tree** — spatial-structure and entity classification of the loaded model.
- **Saved Viewpoints** — capture and restore camera states for the current session.
- **Digital Twin (GIS + IoT)** — place the model on an interactive world map (MapLibre GL,
  token-free OpenStreetMap tiles) using its `IfcSite` coordinates, and stream live sensor
  telemetry onto its elements. Includes an offline **Demo Simulator** (samples real element
  GlobalIds) and a real-time **MQTT-over-WebSocket** source. Reporting elements highlight
  **blue**; threshold breaches highlight **red**.
- **Determinate Load Progress** — an accessible progress bar reports real load phases
  (reading → parsing → framing → done) instead of a generic spinner.
- **Open Standards First** — IFC 2×3 and IFC 4 support via `web-ifc`.
- **Zero infrastructure** — static Next.js app; deploy anywhere that serves static assets.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (the entire app)                                        │
│                                                                  │
│  Next.js (App Router, client component, ssr:false)              │
│        │                                                         │
│        ▼                                                         │
│  ClientViewerPage  ── sample dropdown / .ifc upload ──┐         │
│        │                                               │         │
│        ▼                                               ▼         │
│  IfcViewerShell ──► web-ifc (WASM) parses IFC ──► @thatopen     │
│        │            in the browser                Fragments +    │
│        ▼                                          Three.js scene │
│  Properties · Model Tree · Section Cuts · Viewpoints (in-memory) │
└─────────────────────────────────────────────────────────────────┘
```

There is no API layer, database, object storage, job queue, or auth provider. Sample IFC
files and the `web-ifc` WASM binaries are served as static assets from `public/`.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript, fully client-rendered viewer |
| BIM Engine | `@thatopen/components`, `@thatopen/components-front`, `@thatopen/fragments`, `web-ifc` |
| 3D Rendering | Three.js + `camera-controls` |
| GIS / Map | `maplibre-gl` (token-free OpenStreetMap raster tiles) |
| IoT | `mqtt` (mqtt.js over WebSocket) |
| UI | Tailwind CSS + Radix UI primitives |
| Monorepo | pnpm workspaces + Turborepo |

---

## Project Structure

```
aec-digital-twin-platform/
├── apps/
│   └── web/
│       ├── app/
│       │   └── page.tsx                 # Home = the viewer (dynamic, ssr:false)
│       ├── components/viewer/
│       │   ├── ClientViewerPage.tsx     # Top bar: sample picker + .ifc upload
│       │   ├── IfcViewerShell.tsx       # Viewer layout + panels
│       │   ├── PropertiesPanel.tsx      # Reads element props from the in-memory model
│       │   ├── ViewpointsPanel.tsx      # Session-local saved viewpoints
│       │   ├── DigitalTwinPanel.tsx      # MapLibre map + IoT controls + live readings
│       │   ├── ModelTreePanel.tsx / SectionCutsPanel.tsx / Viewer*.tsx
│       │   └── hooks/                   # useViewerWorld, useFragmentLoader, useModelSelection, useDigitalTwin
│       ├── lib/thatopen/
│       │   ├── load-ifc-client-preview.ts  # loadIfcInBrowser() — primary load path
│       │   ├── create-world.ts / init-fragments.ts / classification.ts / clipping.ts
│       │   └── selection.ts / measurements.ts / viewpoints.ts / types.ts
│       ├── lib/twin/                        # Digital Twin layer
│       │   ├── geo.ts                       # read IfcSite lat/lon (DMS → decimal)
│       │   ├── iot.ts                       # IotSource interface + Simulator + MQTT
│       │   └── highlight-by-guid.ts         # GUID → fragment highlight bridge
│       ├── public/
│       │   ├── sample-ifc/              # Bundled demo IFC files + manifest.json
│       │   └── wasm/                    # web-ifc.wasm binaries (served at /wasm/*)
│       └── scripts/copy-wasm.mjs        # Copies WASM into public/ before dev/build
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## Local Development

### Prerequisites

- Node.js ≥ 20 (CI/CD builds on Node 24)
- pnpm ≥ 9 (`npm install -g pnpm`)

No Docker, database, or other services are required.

### Run

```bash
git clone https://github.com/shambhaveePandey/aec-digital-twin-platform.git
cd aec-digital-twin-platform
pnpm install
pnpm dev          # copies WASM, then starts the app at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000). The viewer loads with a default sample;
use the **Sample** dropdown to switch models or **Upload .ifc** to open your own file.

### Key Commands

```bash
pnpm dev          # Start the app (runs copy-wasm automatically)
pnpm build        # Production build (runs copy-wasm automatically)
pnpm typecheck    # Type-check the workspace
```

---

## Sample IFC Files

Lightweight demo models live in [`apps/web/public/sample-ifc/`](apps/web/public/sample-ifc)
and are described by `manifest.json` (which drives the in-app dropdown). They were sourced
from [youshengCode/IfcSampleFiles](https://github.com/youshengCode/IfcSampleFiles):

| Model | Schema |
|---|---|
| Sample House | IFC4 |
| Sample House — Ground Floor / Roof | IFC4 |
| Duplex — Architecture | IFC2X3 |
| Wall Elemented Case | IFC4 |
| Basin (Faceted Brep) | IFC4 |
| Cube (Advanced Brep) | IFC4 |

To add more, drop the `.ifc` into `apps/web/public/sample-ifc/` and add an entry to
`manifest.json`. Note that very large IFC files take several seconds to parse in the browser.

---

## Deployment

The app is exported as a fully static Next.js site and deployed to **GitHub Pages** via the
`.github/workflows/deploy-pages.yml` workflow (running on Node 24 runtimes). The static
export can also be served from Vercel or any static/Node host.

```bash
cd apps/web
BASE_PATH="/aec-digital-twin-platform" pnpm build   # static export → apps/web/out
```

There are no environment variables required for the viewer to work
(`NEXT_PUBLIC_WASM_PATH` defaults to `/wasm`).

> **Note:** GitHub Pages cannot send COOP/COEP headers, so `SharedArrayBuffer` is
> unavailable and `web-ifc` runs single-threaded in the browser.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Shambhavee Pandey
