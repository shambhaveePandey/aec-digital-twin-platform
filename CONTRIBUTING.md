# Contributing to Open AEC Digital Twin

Thank you for taking the time to contribute. This document covers everything you need to open a PR that gets merged quickly.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Branch Naming](#branch-naming)
3. [Commit Style](#commit-style)
4. [Pull Request Checklist](#pull-request-checklist)
5. [Testing Expectations](#testing-expectations)
6. [Architecture Notes](#architecture-notes)
7. [Coding Standards](#coding-standards)
8. [Issue Triage Labels](#issue-triage-labels)

---

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `pnpm install`
3. Copy environment variables: `cp .env.example apps/web/.env.local`
4. Start infrastructure: `docker compose -f infra/docker/docker-compose.yml up -d`
5. Run migrations: `pnpm db:migrate`
6. Start dev servers: `pnpm dev`
7. Create a branch from `main` following the naming convention below.

---

## Branch Naming

| Prefix | Use case |
|---|---|
| `feat/*` | New feature or enhancement |
| `fix/*` | Bug fix |
| `chore/*` | Tooling, dependency updates, CI changes |
| `docs/*` | Documentation only |
| `refactor/*` | Code refactoring with no functional change |
| `test/*` | Adding or fixing tests |
| `perf/*` | Performance improvements |

Examples:
```
feat/ifc-upload-flow
fix/fragment-loader-memory-leak
chore/upgrade-thatopen-2.1
docs/sensor-bridge-setup
```

---

## Commit Style

We use **Conventional Commits** (`<type>(scope): <description>`).

```
feat(viewer): add section cut persistence
fix(worker): handle malformed IFC gracefully
chore(deps): upgrade web-ifc to 0.0.57
docs(readme): update local setup instructions
test(api): add twin creation route coverage
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`

**Scopes** (use the most specific that applies):
`viewer`, `ifc-worker`, `sensor-bridge`, `api`, `database`, `auth`, `dashboard`, `issues`, `viewpoints`, `sensors`, `ui`, `config`, `infra`

Breaking changes: append `!` after the type/scope and include a `BREAKING CHANGE:` footer.

```
feat(api)!: rename twin endpoints to v2 format

BREAKING CHANGE: All /api/twins routes now live under /api/v2/twins.
```

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] Branch is up to date with `main`
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm test` passes (or new tests added for new behaviour)
- [ ] `pnpm build` succeeds
- [ ] PR title follows Conventional Commits format
- [ ] PR description includes a **change summary**, **screenshots or video** (for UI changes), **test evidence**, **migration notes** (if schema changed), and a **linked issue** (`Closes #123`)
- [ ] New environment variables are added to `.env.example`
- [ ] Public API changes are reflected in `packages/api-contracts`
- [ ] No `.ifc` or `.frag` binary files committed (store in S3)
- [ ] No secrets or credentials in code or comments

---

## Testing Expectations

| Area | Requirement |
|---|---|
| Pure utility functions | Unit tests with Vitest |
| API route handlers | Integration tests hitting a real test DB |
| Viewer hooks | Unit tests where DOM-independent; use `jsdom` sparingly |
| Database query helpers | Integration tests with a seeded test DB |
| CI gate | All tests must pass in `pnpm test:ci` |

Test files live alongside source in `__tests__/` directories or as `*.test.ts` / `*.spec.ts` siblings.

**Do not mock the database in integration tests.** Use a real PostgreSQL instance (the CI workflow spins one up as a service container). Mocked DB tests have historically masked migration bugs.

---

## Architecture Notes

### Monorepo layout
- `apps/web` — Next.js product app. App Router only; no Pages Router.
- `apps/docs` — Nextra documentation site.
- `packages/database` — Prisma schema and typed query helpers. Import as `@aec-twin/database`.
- `packages/api-contracts` — Zod schemas and inferred TS types shared between frontend and backend.
- `packages/viewer-core` — Framework-agnostic That Open utilities. No React dependency.
- `packages/ui` — Shared Radix + Tailwind components. No business logic.
- `services/ifc-worker` — Standalone Node.js process; reads jobs from Redis/BullMQ.
- `services/sensor-bridge` — Standalone Node.js process; MQTT in, WebSocket out.

### Viewer boundary
Keep That Open engine code inside `apps/web/lib/thatopen/` and `apps/web/components/viewer/`. Business logic (auth, DB calls, API fetches) must not leak into viewer hooks. Viewer hooks call typed API client functions from `apps/web/lib/api/`.

### IFC loading pipeline
Production path: IFC upload → S3 → job queue → `ifc-worker` converts to `.frag` → S3 → viewer loads `.frag`.  
Never parse raw IFC in the browser in production. The `load-ifc-client-preview.ts` path is **dev/demo only** and is clearly marked as such.

### API route handlers
Route handlers in `apps/web/app/api/` are thin: parse + validate with Zod, call a service module, return a typed response. No business logic directly in route handlers.

---

## Coding Standards

- **TypeScript everywhere.** Avoid `any`; use `unknown` + narrowing.
- **No barrel re-exports** from `index.ts` files unless the package is a published library. Prefer direct imports to avoid circular deps.
- **Server components by default** in Next.js. Add `"use client"` only when browser APIs or interactivity require it.
- **Small, composable modules.** One concept per file. Files over ~250 lines are a signal to split.
- **Comments only for non-obvious WHY.** Do not comment what the code does—name things clearly instead.
- **No half-finished implementations.** If a feature is incomplete, gate it behind an env flag and document it.
- **Error handling at boundaries.** Validate at system edges (user input, external APIs). Trust internal typed code.
- **Accessibility.** UI components must have correct ARIA roles, keyboard navigation, and colour contrast.

### Formatting

Prettier handles formatting automatically. Run `pnpm format` before committing. The CI `lint` job enforces format parity.

### Import order (enforced by ESLint)

1. Node built-ins
2. External packages
3. Internal packages (`@aec-twin/*`)
4. Relative imports

---

## Issue Triage Labels

| Label | Meaning |
|---|---|
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `good first issue` | Suitable for first-time contributors |
| `help wanted` | Maintainers want community help |
| `viewer` | 3D viewer / That Open engine |
| `ifc` | IFC parsing, loading, or standards |
| `fragments` | Fragment conversion or loading |
| `api` | REST API / route handlers |
| `database` | Prisma schema / DB queries |
| `documentation` | Docs site or inline docs |
| `infra` | Docker, CI, deployment |
| `sensor-integration` | MQTT / IoT / sensor bridge |
| `breaking-change` | Contains a breaking API or schema change |
| `duplicate` | Already reported |
| `wontfix` | Out of scope for this project |

---

Questions? Open a [discussion](https://github.com/shambhaveePandey/aec-digital-twin-platform/discussions) or ping in the issue.
