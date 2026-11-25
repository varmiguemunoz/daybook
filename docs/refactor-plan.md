# Gr8r Studio: from plain JS to a typed, modular product

Gr8r Studio already has a strong UI and a complete feature surface (~8.7k lines of vanilla JS).
The goal is to keep that product, drop everything that only existed to sell it, and rebuild the
code behind it as a TypeScript monorepo with a web client, an API, MongoDB persistence and Clerk
identity, so the same client can later ship as a macOS/Windows desktop app.

## Verdicts

| Question               | Decision                    | Why                                                                                                                                                                                                        |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GraphQL now?           | **No**                      | One first-party client, document-shaped data, no aggregation fan-out. Adds SDL, resolvers, dataloaders, codegen and a second cache next to TanStack Query. Revisit only with external consumers.           |
| ORM for MongoDB?       | **Mongoose, not a SQL ORM** | Mongo has no SQL to escape. The real risk is business logic leaking into the driver, so: Mongoose models + a repository layer + Zod at the edge. Prisma is relational-first and fights embedded documents. |
| Zod validation layer?  | **Yes, mandatory**          | Schemas are the single contract for server input, forms and tests. Mongoose validation runs too late and produces unusable error shapes for the UI.                                                        |
| 40 lines per file cap? | **No, scope it**            | See "File size policy". The cap belongs on functions, not files.                                                                                                                                           |
| Auth                   | **Clerk**                   | Removes the mock login, signup, social and 2FA screens entirely.                                                                                                                                           |
| Client cache           | **TanStack Query**          | Replaces `localStorage` as the source of truth. Optimistic updates carry drag-and-drop.                                                                                                                    |
| UI state               | **Zustand**                 | Only UI-only state: drawer, modals, palette, selection, density.                                                                                                                                           |
| Cookies                | **Identity only**           | Session and workspace pointer. Never domain data: 4 KB limit, sent on every request.                                                                                                                       |

## What is deleted before anything is ported

Delete first, so no dead code gets a TypeScript translation.

| Area              | Files                                                 | What goes                                                                            |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Billing           | `src/pages/settings.js`                               | `Billing` nav group, `plan` / `payment` / `invoices` panels, usage meters            |
| Permissions table | `src/pages/members.js`                                | `Billing` row                                                                        |
| Plan switching    | `src/actions/actions.js`                              | `A.changePlan`, plan copy in dialogs and toasts                                      |
| Plan labels       | `src/overlays/popovers.js`, `src/overlays/palette.js` | `w.plan` in workspace switcher and palette                                           |
| Seed data         | `src/data/seed.js`                                    | `invoices`, `plan` on workspaces                                                     |
| Marketing copy    | `src/pages/auth.js`                                   | "Free for up to 3 members", billing/trial wording                                    |
| Mock auth         | `src/pages/auth.js`, `src/actions/actions.js`         | login, signup, forgot/reset, social, fake 2FA — frozen, replaced by Clerk in Phase 6 |
| Styles            | `src/styles/pages/settings.css`                       | `.plan*` rules                                                                       |

There is no Stripe, no webhook and no entitlement check anywhere in the codebase: the payment
layer is UI fiction plus a `plan` string. Deletion, not migration.

## Target structure

Screaming architecture = feature folders, not small files. Server code never imports from features.

```
apps/web/src/
  app/            router, providers, shells, error boundaries
  features/
    tasks/        components, hooks, queries, actions, schemas
    projects/     projects, milestones, project views
    views/        board, list, table, calendar, timeline, files
    members/      members, teams, roles, invitations
    activity/     activity feed, notifications
    settings/     preferences, appearance, shortcuts
  shared/         ui primitives, icons, dates, formatting
  stores/         zustand slices (ui only)
apps/api/src/
  modules/<feature>/  controller, service, repository, schema
  infrastructure/    db connection, clerk middleware, logging
  db/models/         mongoose schemas + indexes
packages/domain/     types, zod schemas, permissions, status vocab
```

## Domain model in MongoDB

One collection per bounded context. Embedded only where the child has no independent life.

| Collection      | Shape                                                                   | Indexes                                                            |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `users`         | Clerk `userId`, profile, prefs                                          | `userId` unique                                                    |
| `workspaces`    | name, url, color, owner                                                 | `url` unique                                                       |
| `memberships`   | workspace, user, role, team                                             | `(workspace, user)` unique                                         |
| `teams`         | workspace, name, icon, color                                            | `(workspace, name)`                                                |
| `projects`      | workspace, key, status, lead, members, milestones[]                     | `(workspace, archived)`, `(workspace, key)` unique                 |
| `tasks`         | workspace, project, status, assignee, due, labels[], subtasks[], deps[] | `(workspace, project, status)`, `(assignee, due)`, text on `title` |
| `comments`      | task, author, body, reactions                                           | `(task, createdAt)`                                                |
| `activity`      | workspace, actor, verb, task, at                                        | `(workspace, at desc)`                                             |
| `notifications` | user, type, task, read, at                                              | `(user, read, at desc)`                                            |
| `files`         | workspace, project, name, size, owner                                   | `(workspace, project)`                                             |
| `events`        | workspace, project, title, date                                         | `(workspace, date)`                                                |
| `savedViews`    | owner, scope, filters, sort, group                                      | `(owner, scope)`                                                   |

`subtasks`, `milestones` and `deps` stay embedded: they are never queried alone and always render
with their parent.

## State ownership

| State                                 | Owner                   | Notes                                                                   |
| ------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Tasks, projects, members, comments    | TanStack Query          | Keyed by `workspace`; mutations invalidate; drag-and-drop is optimistic |
| Filters, sort, grouping, view mode    | URL search params       | Shareable links replace `S.views`                                       |
| Drawer, modals, palette, multi-select | Zustand                 | Never persisted to the server                                           |
| Theme, density, accent                | Zustand + cookie        | Read before paint to avoid a flash                                      |
| Session, workspace pointer            | Clerk cookie + httpOnly | Server reads it; client never sees tokens                               |

`gr8r.v2` in `localStorage` disappears. It is the current source of truth, so it must not survive.

## File size policy

The 40-line rule as stated will hurt this codebase. A 60-line form split into three files needs
prop plumbing, barrel exports and cross-file reading to answer "what does this form do" — the
opposite of understandable. Cohesion beats line count.

| Unit                      | Limit              | Enforcement              |
| ------------------------- | ------------------ | ------------------------ |
| Function / component body | 40 lines           | `max-lines-per-function` |
| React component file      | 120 lines          | `max-lines` warn         |
| Any file                  | 200 lines hard cap | `max-lines` error        |
| Cyclomatic complexity     | 10                 | `complexity`             |

Today's worst offenders (`actions/actions.js` at 2293 lines, `pages/settings.js` at 435) violate
every one of these. Both are split by feature anyway, so the intent is preserved.

## Desktop strategy

Tauri 2 over Electron: smaller binary, lower memory, native WebView on both targets, and the web
client is reused as-is.

Two risks to spike before committing (Phase 8): Clerk sign-in inside a native WebView (custom
protocol callback or token exchange), and offline behaviour if the company works on planes. If
Clerk's desktop flow fights the wrapper, fall back to Electron — same client, same API.

## Phases

Each phase is a mergeable, shippable unit. Durations assume one senior engineer.

### Phase 0 — Freeze and baseline (1-2 days) — DONE

- [x] Screen inventory in `docs/screen-inventory.md` (21 routes, 8 project tabs, 6 overlays, 7 auth states).
- [x] Billing layer deleted: settings sections, `A.changePlan`, `ws.plan`, seed invoices, permission row, `.plan`/`.meter` styles, pricing copy.
- [x] Decision locked: Vite SPA + Hono API.
- [x] Legacy client moved to `apps/legacy` under an npm workspace root, still runnable via `npm run dev`.
- [ ] Screenshot baseline: deferred to the Playwright harness in Phase 1 so captures are reproducible.

Mock auth is frozen, not deleted. It is the visual reference for the Clerk appearance and the only
way to enter the app while the port is in progress; it dies in Phase 6 with the rest of `pages/auth.js`.

**DoD:** `grep -riE "billing|invoice|stripe|changePlan|pricing" src` returns zero hits outside demo
project copy; lint, format check and build are green.

### Phase 1 — Typed foundation (2-3 days) — DONE

- [x] Workspace root extended with `apps/web` (React 19 + Vite + strict TS) and `apps/api` (Hono).
- [x] `tsconfig.base.json`: strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnusedLocals`.
- [x] ESLint size policy: 40 lines per function, 200 per file, complexity 10 — verified to fail a 210-line file and a 63-line function.
- [x] Vitest per workspace, Playwright harness, CI split into `checks` and `visual` jobs.
- [x] Screenshot baseline: 35 legacy screens at 1440x900 into `tests/visual/baseline`.

**DoD:** `npm run lint && npm run format:check && npm run typecheck && npm test && npm run build`
green; the size policy rejects an oversized file.

Testing Library and jsdom are deferred to Phase 4: Phase 1 tests render with `react-dom/server`,
so no DOM dependency is paid for before there are components to interact with.

### Phase 2 — Domain package (2-3 days) — DONE

- Extract types and vocab (`STATUSES`, `PRIOS`, `LABELS`, project states) from `core/constants.js`.
- Zod schemas for every entity; types derived with `z.infer`, never duplicated.
- Port `seed()` into a fixture module used by tests and by the demo importer.

**DoD:** zero duplicated type/vocab declarations; schemas round-trip the whole seed payload.

### Phase 3 — API and persistence (5-7 days) — DONE

- Mongo connection, Mongoose models, indexes from the table above.
- One module per feature: `controller` (Zod parse) → `service` (rules, permissions) →
  `repository` (Mongoose only).
- Clerk middleware verifying the session; every query scoped by `workspaceId`. (Clerk deferred to Phase 6; header-based actor stub used.)
- Importer that loads the seed workspace into Mongo for parity testing.

**DoD:** every mutation is validated by Zod and reachable only through a repository; no Mongoose
import outside `db/` and `repository`; integration tests cover each module; permissions enforced
server-side and covered by a test per role.

### Phase 4 — Web shell (4-5 days) — IN PROGRESS

- Vite + React 19 + router, providers (Query, Clerk, error boundaries).
- Layout, sidebar, topbar, theme and density from Zustand; skeletons per route.
- Query keys and fetchers per feature; no component talks to `fetch` directly.

**DoD:** shell renders with parity screenshots; loading and error states exist for every route;
no `localStorage` read or write of domain data.

### Phase 5 — Feature slices (10-15 days)

Order: tasks → projects → views → overlays → members/teams → activity/notifications → settings.

Each slice: components ≤ 120 lines, hooks for query/mutation, optimistic updates where the UI
already felt instant.

**DoD per slice:** visual parity against the Phase 0 screenshots; Playwright covers the core flow;
no slice introduces a file over 200 lines.

### Phase 6 — Identity and invitations (3-4 days)

- Clerk sign-in/sign-up, social providers, 2FA through Clerk.
- Workspace creation on first login, invitation links, role assignment (`Owner/Admin/Member/Guest`).
- Server-side permission matrix shared with the client from `packages/domain`.

**DoD:** invited user joins with the right role; guest cannot reach a private project (tested);
every route requires a session; role matrix has one source of truth.

### Phase 7 — Hardening (3-5 days)

- Accessibility pass (focus management in the drawer, palette, modals), keyboard shortcuts.
- Error boundaries, empty states, request logging, Mongo connection pooling.
- Delete `vercel.json` assumptions that no longer apply; document deployment.

**DoD:** axe reports no critical violations on the main routes; failed mutations surface a
recoverable message; p95 page data under 300 ms on the seeded workspace.

### Phase 8 — Desktop shell (2-3 days + spike)

- Tauri 2 project in `apps/desktop` loading the built client, pointing at the hosted API.
- Signed builds for macOS and Windows; deep-link auth spike resolved.

**DoD:** installable on macOS and Windows, signs in with Clerk, creates and edits a task against
the production API.

## Decided: how the server is reached

**Option A — Vite SPA + Hono API.** Closed on 2026-11-23: the web layer stays a literal React +
Vite static build, durability lives behind one typed API, and the desktop wrapper bundles the same
static client. Options B and C are recorded below as the rejected alternatives.

| Option                                   | Shape                                                            | Wins                                                                                                                                  | Costs                                                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **A. Vite SPA + Hono API** (recommended) | Static client, separate typed API, Hono RPC for end-to-end types | No SSR machinery for an authenticated app; desktop wrapper bundles a plain static build; cheapest ops; smallest surface for auth bugs | Two deployables, one shared types package                                                                                 |
| **B. TanStack Start 1.0**                | Vite-based full-stack, `createServerFn`, loaders                 | One deployable, typed server functions, route-level data loading                                                                      | SSR and hydration you do not need; server functions are same-origin RPC, so the desktop build needs server routes instead |
| **C. Next.js App Router**                | Server Actions, RSC                                              | Largest ecosystem, `use server` matches the request literally                                                                         | Drops Vite; RSC is a mindset change the current UI does not need                                                          |

Option A is the decision. Option B only wins if you later want a single deployment and no second
service; Option C is out because it drops Vite.

## Risks

| Risk                                          | Mitigation                                                   |
| --------------------------------------------- | ------------------------------------------------------------ |
| Visual regressions during the port            | Screenshot parity gate per slice, not at the end             |
| Clerk inside WebView                          | Spike in Phase 8 before promising desktop dates              |
| Role rules drifting between client and server | Single matrix in `packages/domain`, tested                   |
| Feature creep while porting                   | Port only what exists today; new features after Phase 8      |
| Mongo without transactions across collections | Denormalise reads, keep cascade rules in services, test them |

## Next step

Phase 1: scaffold the npm workspaces (`apps/web`, `apps/api`, `packages/domain`), TypeScript strict,
the ESLint size policy and the Vitest/Playwright harness.
