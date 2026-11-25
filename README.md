# Daybook

Personal tasks and notes in one place, grouped by organisation. One product, three deliverables: a web client, an API, and
a desktop shell that wraps the same client.

## Layout

| Path              | What it is                                                            |
| ----------------- | --------------------------------------------------------------------- |
| `apps/web`        | React 19 + Vite client, also packaged with Tauri (`src-tauri`).       |
| `apps/api`        | Hono API on Node with Clerk auth and memory or MongoDB persistence.   |
| `packages/domain` | Types, Zod schemas, permissions and vocabularies shared by every app. |
| `docs/`           | Plans and the quality audit (`quality-audit.md`).                     |

The web client follows a screaming architecture: `src/pages` holds one file per route and
`src/modules/<domain>/{components, hooks, lib, services, states}` holds each domain. Shared building blocks
live in `src/modules/core`.

## Commands

```bash
npm install             # one workspace install
npm run dev:web         # React client on http://localhost:5175
npm run dev:api         # Hono API on http://localhost:3001
npm run build           # build every workspace
npm run typecheck       # tsc --noEmit per workspace
npm test                # Vitest per workspace
npm run test:visual     # capture the legacy screens into tests/visual/baseline
npm run lint            # ESLint across the repo
npm run format          # Prettier
```

First run of the visual harness needs the browser once: `npx playwright install chromium`.

## Rules the tooling enforces

| Rule                                 | Where                           |
| ------------------------------------ | ------------------------------- |
| Function body ≤ 40 lines             | ESLint `max-lines-per-function` |
| File ≤ 200 lines                     | ESLint `max-lines`              |
| Cyclomatic complexity ≤ 10           | ESLint `complexity`             |
| Strict TypeScript, immutable imports | `tsconfig.base.json`            |

Size rules apply to `apps/web`, `apps/api` and `packages/*`. `apps/legacy` is exempt: it is frozen
and gets deleted slice by slice.

## Where to start

Read `docs/refactor-plan.md`. Phases 0 and 1 are closed; Phase 2 (the domain package) is next.
