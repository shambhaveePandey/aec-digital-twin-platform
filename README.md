# Open AEC Digital Twin

> An open-source GitHub-hosted platform for creating browser-based AEC digital twins from IFC and Open BIM data, powered by That Open Company libraries, Fragments, and modern web tooling.

[![CI](https://github.com/shambhaveePandey/aec-digital-twin-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/shambhaveePandey/aec-digital-twin-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Features

- **IFC Upload & Conversion** — upload raw `.ifc` files; a background worker converts them to high-performance `.frag` assets once and stores them in S3-compatible object storage.
- **Browser-based 3D Viewer** — fast, WebGL viewer built on [That Open Company](https://thatopen.com) components (`@thatopen/components`, `@thatopen/components-front`, `@thatopen/fragments`) and Three.js.
- **IFC Properties Inspector** — browse property sets, classifications, storeys, systems, and disciplines live in the viewer.
- **Section Cuts & Clipping Planes** — interactive clipping plane management powered by the engine's `Clipper` component.
- **Saved Viewpoints** — capture and restore camera states; BCF-compatible viewpoint model.
- **Issue Tracking** — BCF-style issue management with model viewpoints, comments, and element linkage.
- **Sensor / IoT Overlay** — connect live MQTT telemetry to model elements; display thresholds and alerts on the 3D canvas.
- **Multi-tenant Workspaces** — invite-based workspace model with role-based access.
- **REST API + OpenAPI Spec** — documented, zod-validated endpoints for all resources.
- **Open Standards First** — IFC 2×3 and IFC 4 support via `web-ifc`; BCF-compatible issues; open data model.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  Next.js (App Router)  ←──→  @thatopen/components (Three.js)   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ REST / WebSocket
┌──────────────────▼──────────────────────────────────────────────┐
│  Next.js API Routes  (thin handlers → service modules)          │
└──────┬───────────────────┬────────────────────────┬─────────────┘
       │                   │                        │
┌──────▼──────┐  ┌─────────▼────────┐  ┌──────────▼──────────┐
│  PostgreSQL  │  │  S3-compatible   │  │  Redis / BullMQ      │
│  (Prisma)   │  │  Object Storage  │  │  (job queue)         │
└─────────────┘  └──────────────────┘  └──────────┬──────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │  ifc-worker service  │
                                        │  (IFC → Fragments)   │
                                        └─────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  sensor-bridge service  ←── MQTT broker ←── IoT devices        │
│  (WebSocket broadcast to browser)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| BIM Engine | `@thatopen/components`, `@thatopen/components-front`, `@thatopen/fragments`, `web-ifc` |
| 3D Rendering | Three.js |
| UI | Tailwind CSS + Radix UI primitives |
| Database | PostgreSQL + Prisma ORM |
| Object Storage | S3-compatible (MinIO locally, AWS S3 / Supabase in production) |
| Job Queue | BullMQ + Redis |
| Realtime | Socket.IO + MQTT bridge |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions + Changesets |
| Docs | Nextra |

---

## Monorepo Structure

```
aec-digital-twin-platform/
├── apps/
│   ├── web/                  # Main Next.js application
│   └── docs/                 # Nextra documentation site
├── packages/
│   ├── config/               # Shared ESLint, TypeScript, Tailwind configs
│   ├── database/             # Prisma schema, client, typed query helpers
│   ├── types/                # Shared TypeScript types
│   ├── ui/                   # Shared React component library
│   ├── viewer-core/          # Framework-agnostic That Open viewer utilities
│   └── api-contracts/        # Zod schemas and inferred DTO types
├── services/
│   ├── ifc-worker/           # Node.js IFC → Fragments conversion worker
│   └── sensor-bridge/        # MQTT ingestion + WebSocket broadcast service
├── infra/
│   ├── docker/               # Docker Compose for local dev
│   └── scripts/              # Database seed and infra helper scripts
├── .github/
│   ├── workflows/            # CI, lint, test, preview, release
│   ├── ISSUE_TEMPLATE/       # Bug, feature, BIM import, sensor, docs templates
│   └── PULL_REQUEST_TEMPLATE.md
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker + Docker Compose (for PostgreSQL, MinIO, Redis, MQTT broker)

### 1 — Clone and install

```bash
git clone https://github.com/shambhaveePandey/aec-digital-twin-platform.git
cd aec-digital-twin-platform
pnpm install
```

### 2 — Configure environment

```bash
cp .env.example apps/web/.env.local
cp .env.example services/ifc-worker/.env
cp .env.example services/sensor-bridge/.env
# Edit values as needed — defaults work with the Docker Compose stack
```

### 3 — Start infrastructure

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **MinIO** on port `9000` (console on `9001`)
- **Redis** on port `6379`
- **Mosquitto MQTT** on port `1883`

### 4 — Set up the database

```bash
pnpm db:migrate        # runs prisma migrate dev
pnpm db:generate       # generates the Prisma client
```

### 5 — Start all services

```bash
pnpm dev
```

Turborepo starts all apps and services in parallel:
- Web app: [http://localhost:3000](http://localhost:3000)
- Docs: [http://localhost:3001](http://localhost:3001)
- IFC worker: background process
- Sensor bridge: background process

---

## Key Commands

```bash
pnpm build              # Build all packages and apps
pnpm lint               # Lint all workspaces
pnpm typecheck          # Type-check all workspaces
pnpm test               # Run all tests
pnpm format             # Format with Prettier
pnpm db:studio          # Open Prisma Studio
pnpm changeset          # Create a changeset for release
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. Critical variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth.js signing secret |
| `S3_ENDPOINT` | Object storage endpoint |
| `MQTT_BROKER_URL` | MQTT broker for sensor data |
| `REDIS_URL` | BullMQ job queue backend |
| `NEXT_PUBLIC_WASM_PATH` | Path to web-ifc WASM files |

---

## Deployment

### Vercel (web app)

The `apps/web` Next.js app deploys to Vercel with zero config. Set environment variables in the Vercel project dashboard.

### Docker

Each service has a `Dockerfile`. Use `docker compose -f infra/docker/docker-compose.prod.yml up` for a self-hosted stack.

### Database

Run migrations in CI/CD or as a pre-deploy step:
```bash
cd packages/database && pnpm prisma migrate deploy
```

---

## Roadmap

- [x] Monorepo scaffold + CI/CD
- [x] Auth + workspace model
- [ ] IFC upload + S3 storage
- [ ] IFC → Fragments conversion worker
- [ ] 3D viewer with That Open stack
- [ ] Properties inspector + classification tree
- [ ] Section cuts + clipping planes
- [ ] Issue tracking (BCF-compatible)
- [ ] Saved viewpoints
- [ ] Sensor / IoT realtime overlay
- [ ] Dashboard analytics
- [ ] OpenAPI documentation
- [ ] Public docs site

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit style, PR checklist, and coding standards.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for disclosure policy.

## License

[MIT](LICENSE) © 2026 Shambhavee Pandey
