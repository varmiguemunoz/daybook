# Daybook

Tasks and notes for a small team, in one calm workspace. Open source under the MIT License. Daybook ships as a web app, an API and a desktop app that wraps the same web client.

**[English](#english) · [Español](#español)**

---

## English

### Contents

1. [What Daybook does](#what-daybook-does)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Modules](#modules)
6. [Getting started](#getting-started)
7. [Environment variables](#environment-variables)
8. [Commands](#commands)
9. [Deployment](#deployment)
10. [AI assistants (MCP)](#ai-assistants-mcp)
11. [API reference](#api-reference)
12. [Code conventions](#code-conventions)
13. [Design system and AI skills](#design-system-and-ai-skills)
14. [Contributing](#contributing)
15. [Known limitations](#known-limitations)
16. [License](#license)

### What Daybook does

**Workspaces and people**

- Sign in and sign up with Clerk. Every Clerk organization is a Daybook workspace; switch between them or create a new one from the app.
- Two roles, mapped from Clerk: `admin` (`org:admin`) and `member` (`org:member`). Admins manage the workspace, invite people, change roles and remove members.
- Invite people by email with a role. Removing a member unassigns their tasks and takes them out of every team.
- Teams: named groups with an icon, colour, description and members.
- Profile: name, title and timezone. Theme: light or dark, saved to your Clerk profile so it follows you to every device.

**Tasks**

- Every task gets a workspace key such as `DAY-42`.
- Fields: title, status (Backlog, To Do, In Progress, Review, Done), priority, assignee, start and due dates, labels (Design, Frontend, Backend, Research, Content, Bug, QA, Growth), estimate (`4h`, `2d`, `1w`), recurrence (daily, weekly, every 2 weeks, monthly), subtasks, dependencies, favourite and a rich description.
- Four views of the same tasks: list, board (drag cards between columns), table and calendar (month and week, drag to reschedule).
- Filters, bulk update and bulk delete.
- Comments with emoji reactions; authors can edit and delete their own.

**Notes**

- Markdown notes that belong to the workspace, organised in nested folders.
- Read mode renders GitHub-flavoured Markdown: tables, task lists, code, quotes and links. Raw HTML is never executed.
- Double-click or press **Edit** to write. `⌘S` / `Ctrl+S` saves; edits also save on their own 1.5 s after you stop typing; `Esc` stops editing.
- Link notes in two ways: from the **Related** panel, or by writing `[[Title]]` (or `[[Title|text]]`) in the body. Typing `[[` suggests titles. A link to a note that does not exist creates it.
- **Mentioned in** lists every note that links to the open one.
- Two people editing the same note never overwrite each other silently: the second save gets a conflict notice with **Use their version** and **Keep mine**.
- Drag notes and folders onto another folder, or use the **Move to…** menus. Deleting a folder moves its contents to the parent folder.
- Download any note as a `.md` file.
- Leaving a note with unsaved changes (another note, another page, the back button or closing the tab) asks first.

**Everywhere**

- Home: workspace stats, your tasks and recent activity.
- Activity feed of what changed in the workspace.
- Notifications when someone assigns you a task or comments on yours, in the app and, when SMTP is configured, by email.
- Real-time updates: tasks, comments, notes, folders and notifications refresh for everyone without reloading (Server-Sent Events).
- `⌘K` / `Ctrl+K` search across tasks, notes, people, teams and pages.
- Desktop app for macOS, Windows and Linux built with Tauri 2.

### Tech stack

| Layer      | Technology                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Web client | React 19, Vite 8, React Router 7 (data router), TanStack Query 5, Zustand, dnd-kit, react-markdown + remark-gfm, Lucide icons |
| Desktop    | Tauri 2 (Rust) wrapping the web build                                                                                         |
| API        | Node 22, Hono 4, `@hono/node-server`, Zod 4, Nodemailer                                                                       |
| Auth       | Clerk (`@clerk/react`, `@clerk/backend`), organizations and webhooks                                                          |
| Data       | MongoDB 7 through Mongoose 9, or an in-memory store for quick local runs                                                      |
| Shared     | `@daybook/domain`: Zod schemas, types, permissions and vocabularies                                                           |
| Tooling    | npm workspaces, TypeScript 5.9 (strict), ESLint 10, Prettier 3, Vitest 5, Docker Compose                                      |

### Architecture

```
┌────────────── apps/web ───────────────┐        ┌──────────────────── apps/api ────────────────────┐
│ React pages → modules → TanStack Query │──HTTP──▶ Hono middleware → modules (routes → services)     │
│ Clerk session token (Bearer)           │◀──SSE── event bus                    │                    │
│ Tauri wraps the same build             │        │                    ports (repository interfaces) │
└────────────────────────────────────────┘        │                     ├── adapters/memory           │
                ▲                                  │                     └── adapters/mongo ──▶ MongoDB│
                │ shared types and schemas         └──────────────────────────────────────────────────┘
          packages/domain ─────────────────────────────────▲
                                       Clerk ──webhooks──▶ /webhooks/clerk
```

**API (hexagonal).** Each request to `/api/*` passes, in order: secure headers → CORS → 1 MB body limit → Clerk authentication → rate limit (300 requests per minute per user) → workspace scope. The scope middleware finds or creates the workspace for the active Clerk organization and the member for the signed-in user, so a fresh database fills itself on first use. Routes validate input with the Zod schemas from `@daybook/domain`, check permissions with `permit('…')`, and call services. Services depend only on the repository ports in `src/ports/repositories.ts`; `PERSISTENCE` chooses the memory or the Mongo adapters at boot. Every repository call carries the workspace id, so one organization can never read another's data. Services emit events on an in-process bus; `/api/events/stream` relays them to browsers as Server-Sent Events. Clerk webhooks keep workspaces and members in sync when organizations or memberships change outside the app.

**Web (screaming architecture).** `src/pages` holds one file per route, loaded lazily. `src/modules/<domain>` holds each feature, split into `components`, `hooks`, `lib`, `services` (TanStack Query hooks) and `states` (Zustand stores) when needed. `src/modules/core` holds shared building blocks: the API client, dialogs, popovers, toasts, icons and date utilities. Server data lives in TanStack Query; SSE events invalidate the matching queries. URL search parameters hold page state such as the open note, so links and the back button work.

**Domain package.** `packages/domain` is the contract between client and server: schemas, inferred types, the permission matrix and vocabularies (statuses, priorities, labels, roles, themes).

### Folder structure

```
daybook/
├── apps/
│   ├── api/                      Hono API
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── memory/       In-memory repositories (seeded demo data)
│   │   │   │   ├── mongo/        Mongoose models and repositories
│   │   │   │   └── redis/        Shared event bus and rate-limit counter
│   │   │   ├── fixtures/seed/    Demo workspace, members and tasks
│   │   │   ├── http/             Auth, workspace scope, rate limit, logging, errors, validation
│   │   │   ├── modules/          One folder per feature: *-routes.ts + *-service.ts
│   │   │   ├── ports/            Repository interfaces
│   │   │   ├── scripts/seed.ts   Loads the demo data into MongoDB
│   │   │   ├── shared/           Event bus, email, quotas, JSON logger
│   │   │   ├── app.ts            Middleware and route wiring
│   │   │   ├── config.ts         Environment validation
│   │   │   └── server.ts         Entry point
│   │   └── .env.example
│   └── web/                      React client and Tauri desktop app
│       ├── src/
│       │   ├── app/              App root, providers, router and shell (sidebar, top bar, bottom nav)
│       │   ├── pages/            One component per route
│       │   ├── modules/          One folder per feature (see Modules)
│       │   └── styles/           Tokens, base, components, overlays, pages/, views/
│       ├── src-tauri/            Tauri 2 project (Rust)
│       ├── public/
│       ├── DESIGN.md             Visual design system
│       ├── PRODUCT.md            Product context for design work
│       ├── .impeccable/          Design tokens sidecar and surface briefs
│       └── .env.example
├── packages/
│   └── domain/                   Shared schemas, types, permissions, vocabularies
├── .claude/                      AI agent skills and sub-agents (see Design system and AI skills)
├── .agents/  .opencode/          The same skills for other agent tools
├── deploy/Caddyfile              Edge proxy with automatic TLS for a VPS
├── docker-compose.yml            MongoDB 7 for local development
├── docker-compose.prod.yml       Production stack for a VPS (edge, web, api replicas, Redis)
├── eslint.config.js  tsconfig.base.json  .prettierrc.json  .editorconfig
├── skills-lock.json              Pinned external skills
└── .env.example                  MongoDB credentials for Docker Compose
```

### Modules

**API (`apps/api/src/modules`)**

| Module          | Responsibility                                                                   |
| --------------- | -------------------------------------------------------------------------------- |
| `workspace`     | `/bootstrap`: workspace, current member, members and recent activity in one call |
| `identity`      | Creates and syncs workspaces and members from Clerk identities                   |
| `members`       | List, update (role, profile) and remove members                                  |
| `teams`         | Teams and their members                                                          |
| `tasks`         | Task CRUD, keys, bulk update and delete, assignment notifications                |
| `comments`      | Task comments, edits and emoji reactions                                         |
| `notifications` | In-app notifications and optional email                                          |
| `activity`      | Workspace activity feed                                                          |
| `folders`       | Nested note folders; prevents cycles; deleting moves contents to the parent      |
| `notes`         | Notes, explicit links, `[[Title]]` mentions, backlinks and save conflicts (409)  |
| `search`        | `⌘K` search across tasks, members, teams and notes                               |
| `realtime`      | Server-Sent Events stream per workspace                                          |
| `webhooks`      | Clerk webhooks for organizations, memberships and users                          |
| `mcp`           | MCP server for AI assistants: OAuth with Clerk, 39 tools, one per-request server |

**Web (`apps/web/src/modules`)**

| Module          | Responsibility                                                         |
| --------------- | ---------------------------------------------------------------------- |
| `core`          | API client, SSE hook, dialogs, popovers, menus, toasts, icons, dates   |
| `auth`          | Clerk provider, session recovery                                       |
| `organizations` | Organization switcher, creation and the "choose an organization" gate  |
| `workspace`     | Bootstrap query                                                        |
| `home`          | Home stats, my tasks, recent activity                                  |
| `tasks`         | Task rows, drawer, fields, composer, filters, bulk actions             |
| `views`         | Board, table and calendar views                                        |
| `comments`      | Comment queries                                                        |
| `notes`         | Explorer tree, Markdown reader, editor, links, autosave, drag and drop |
| `members`       | Members table, invitations, roles and permissions                      |
| `teams`         | Team management                                                        |
| `notifications` | Notification list and unread badge                                     |
| `activity`      | Activity feed                                                          |
| `search`        | Command palette                                                        |
| `settings`      | Workspace, appearance, profile, AI assistants and shortcuts            |

### Getting started

**Prerequisites**

- Node.js 22.12 or newer (`.nvmrc` pins 22) and npm.
- A free [Clerk](https://clerk.com) account.
- Docker, only if you want MongoDB locally.
- The [Rust toolchain](https://www.rust-lang.org/tools/install) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), only for the desktop app.

**1. Install**

```bash
git clone https://github.com/varmiguemunoz/daybook.git
cd daybook
npm install
```

**2. Set up Clerk**

1. Create an application in the [Clerk Dashboard](https://dashboard.clerk.com).
2. Turn on **Organizations**. Daybook requires an active organization for every request.
3. Under **Sessions → Customize session token**, add these claims. The API rejects tokens without them:

   ```json
   {
     "name": "{{user.full_name}}",
     "email": "{{user.primary_email_address}}",
     "org_name": "{{org.name}}"
   }
   ```

4. Copy the **Publishable key** (`pk_…`) and **Secret key** (`sk_…`) from **API keys**.
5. Under **Webhooks**, add an endpoint at `https://<your-api-host>/webhooks/clerk` with these events: `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`, `user.updated`, `user.deleted`. Copy its **Signing secret** (`whsec_…`). Locally, expose port 3001 with a tunnel such as `ngrok http 3001`. The app also works without webhooks while you develop, because workspaces and members are created on first use; webhooks keep them in sync afterwards.

**3. Configure the environment**

```bash
cp .env.example .env                    # only for Docker Compose
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill in the values described in [Environment variables](#environment-variables).

**4. Choose where data lives**

- `PERSISTENCE=memory` (default): no database, demo data loaded at start, everything is lost when the API restarts.
- `PERSISTENCE=mongo`: start MongoDB with `npm run db:up` and set `MONGODB_URI`. Optionally load the demo workspace with `npm run seed -w @daybook/api`.

**5. Run**

```bash
npm run dev:api     # http://localhost:3001
npm run dev:web     # http://localhost:5175
```

Open http://localhost:5175, sign up, create an organization and start working.

**Desktop app**

```bash
npm run tauri:dev -w @daybook/web      # runs the web dev server inside a native window
npm run tauri:build -w @daybook/web    # builds installers into apps/web/src-tauri/target
```

The API must allow the Tauri origins (`tauri://localhost`, `http://tauri.localhost`), which `ALLOWED_ORIGINS` includes by default.

### Environment variables

**Root `.env`** (used only by `docker-compose.yml`)

| Variable         | Required | Default       | Description                      |
| ---------------- | -------- | ------------- | -------------------------------- |
| `MONGO_USER`     | No       | `daybook`     | MongoDB root user for Docker     |
| `MONGO_PASSWORD` | No       | `daybookpass` | MongoDB root password for Docker |

**API `apps/api/.env`**

| Variable                       | Required     | Default                             | Description                                                           |
| ------------------------------ | ------------ | ----------------------------------- | --------------------------------------------------------------------- |
| `NODE_ENV`                     | No           | `development`                       | `production` in production; refuses `PERSISTENCE=memory`              |
| `PORT`                         | No           | `3001`                              | API port                                                              |
| `PERSISTENCE`                  | No           | `memory`                            | `memory` or `mongo`                                                   |
| `MONGODB_URI`                  | With `mongo` | `mongodb://127.0.0.1:27017/daybook` | MongoDB connection string; the example matches Docker Compose         |
| `CLERK_SECRET_KEY`             | Yes          | –                                   | Clerk secret key, starts with `sk_`                                   |
| `CLERK_PUBLISHABLE_KEY`        | Yes          | –                                   | Clerk publishable key, starts with `pk_`                              |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes          | –                                   | Clerk webhook signing secret, starts with `whsec_`                    |
| `ALLOWED_ORIGINS`              | Yes          | –                                   | Comma-separated origins allowed to call the API (web app and Tauri)   |
| `SMTP_HOST`                    | No           | –                                   | SMTP server for email notifications                                   |
| `SMTP_PORT`                    | No           | `587`                               | SMTP port                                                             |
| `SMTP_SECURE`                  | No           | `false`                             | `true` for implicit TLS (port 465)                                    |
| `SMTP_USER`                    | No           | –                                   | SMTP user                                                             |
| `SMTP_PASS`                    | No           | –                                   | SMTP password                                                         |
| `SMTP_FROM`                    | No           | `SMTP_USER`                         | Sender address                                                        |
| `PUBLIC_API_URL`               | No           | `http://localhost:PORT`             | Public URL of the API; AI assistants connect to `PUBLIC_API_URL/mcp`  |
| `APP_URL`                      | No           | –                                   | Public URL of the web app; invitations sent by an assistant land here |
| `REDIS_URL`                    | No           | –                                   | Redis for several API instances (`redis://` or `rediss://`)           |
| `MAX_TASKS_PER_WORKSPACE`      | No           | `0`                                 | Task limit per workspace; `0` means no limit                          |
| `MAX_NOTES_PER_WORKSPACE`      | No           | `0`                                 | Note limit per workspace; `0` means no limit                          |

Set `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS` together, or leave all three empty to send in-app notifications only. The API validates everything at boot and refuses to start with a clear error when something is missing.

**Web `apps/web/.env`**

| Variable                     | Required | Default                 | Description                |
| ---------------------------- | -------- | ----------------------- | -------------------------- |
| `VITE_API_URL`               | No       | `http://localhost:3001` | Base URL of the API        |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes      | –                       | Same Clerk publishable key |

Never commit `.env` files; only the `.env.example` files are tracked.

### Commands

Run from the repository root.

| Command                                   | What it does                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `npm install`                             | Installs every workspace                                                |
| `npm run dev:web`                         | Web client with hot reload on port 5175                                 |
| `npm run dev:api`                         | API with reload on port 3001                                            |
| `npm run build`                           | Type-checks every workspace and builds the web app into `apps/web/dist` |
| `npm run preview`                         | Serves the web build                                                    |
| `npm run typecheck`                       | `tsc --noEmit` in every workspace                                       |
| `npm test`                                | Vitest in every workspace                                               |
| `npm run lint`                            | ESLint across the repository                                            |
| `npm run format` / `npm run format:check` | Prettier write / check                                                  |
| `npm run db:up` / `db:down` / `db:logs`   | Start, stop or follow the MongoDB container                             |
| `npm run seed -w @daybook/api`            | Load the demo workspace into MongoDB                                    |
| `npm run tauri:dev -w @daybook/web`       | Desktop app in development                                              |
| `npm run tauri:build -w @daybook/web`     | Desktop installers                                                      |

### Deployment

The hosted service runs at **https://app.sprintos.run** (web) and **https://api.sprintos.run** (API). Each app has a Dockerfile; build both from the repository root.

| Image | Dockerfile            | Runs                   | Notes                                                                                                   |
| ----- | --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| api   | `apps/api/Dockerfile` | Node on `PORT` (3001)  | esbuild bundle, non-root user, healthcheck on `/health`, readiness on `/ready`, graceful `SIGTERM`      |
| web   | `apps/web/Dockerfile` | Caddy on `PORT` (8080) | Static build with SPA fallback; `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` are **build arguments** |

```bash
docker build -f apps/api/Dockerfile -t daybook-api .
docker build -f apps/web/Dockerfile -t daybook-web \
  --build-arg VITE_API_URL=https://api.sprintos.run \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_... .
```

Production rules:

- `NODE_ENV=production` and `PERSISTENCE=mongo`. The API refuses to start with the memory store in production.
- `ALLOWED_ORIGINS` includes `https://app.sprintos.run` (plus the Tauri origins for the desktop app).
- `PUBLIC_API_URL=https://api.sprintos.run` and `APP_URL=https://app.sprintos.run`, so AI assistants and invitations use the public addresses.
- Use the keys of your Clerk **production** instance.
- Vite writes `VITE_*` values into the bundle, so changing them needs a new build.
- `.env` files never enter an image (`.dockerignore`); the platform injects the variables at runtime.

**Railway**

1. In one project, next to your MongoDB service, add two services from this GitHub repository: `api` and `web`.
2. In each service's **Variables**, set `RAILWAY_DOCKERFILE_PATH` (`apps/api/Dockerfile` or `apps/web/Dockerfile`) and the variables from [Environment variables](#environment-variables). The web Dockerfile declares `VITE_*` with `ARG`, which is how Railway passes them to the build.
3. Point `MONGODB_URI` at your database with a reference variable, for example `${{MongoDB.MONGO_URL}}` (use your service's name).
4. In the `api` settings, set the healthcheck path to `/ready`.
5. Set watch paths so each service only rebuilds when it changes: `api` → `/apps/api/**`, `/packages/domain/**`, `/package-lock.json`; `web` → `/apps/web/**`, `/packages/domain/**`, `/package-lock.json`.
6. Add the custom domains `app.sprintos.run` (web) and `api.sprintos.run` (api) and create the DNS records Railway shows.
7. For more than one `api` replica, add a Redis service, set `REDIS_URL=${{Redis.REDIS_URL}}` on `api` and raise **Replicas** in its settings. Without `REDIS_URL`, keep one replica.

**VPS with Docker Compose**

1. Point the DNS `A` records of `app.sprintos.run` and `api.sprintos.run` at the server.
2. Clone the repository and create `apps/api/.env` and `apps/web/.env` with production values.
3. Start everything:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file apps/web/.env up -d --build
   ```

4. The stack runs the edge proxy, the web app, two `api` replicas and Redis. The edge proxy (`deploy/Caddyfile`) gets TLS certificates on its own, spreads requests over the replicas and streams Server-Sent Events without buffering. Set `API_REPLICAS` in `apps/web/.env` to run a different number of replicas.
5. To update, `git pull` and run the same command. The replicas restart, close their open streams and the browsers reconnect within a few seconds.

**Several API instances**

- With `REDIS_URL` set, the instances share real-time events and the rate limit (300 requests per minute per user) through Redis. Redis only holds short-lived data, so it needs no persistence or backup.
- Without `REDIS_URL` the API runs as one instance and keeps both in memory.
- `/ready` answers 503 while MongoDB or Redis is unreachable and while the instance shuts down, so the platform stops sending it traffic. If Redis goes down, requests keep working, but real-time updates pause until it returns.

**Logs**

The API writes one JSON object per line (`time`, `level`, `msg`, `requestId`, `method`, `path`, `status`, `durationMs`, `userId`, `workspaceId`). Every response carries an `X-Request-Id` header with the same id, so a user's report can be matched to its log line.

**Limits for a hosted instance**

- `MAX_TASKS_PER_WORKSPACE` and `MAX_NOTES_PER_WORKSPACE` cap what one workspace can create. Past the limit, the API answers 403 with the code `limit_reached`, and the app shows the message.
- Clerk's free plan includes 100 monthly retained organizations per app (single-member organizations are free) and up to 20 members per organization. Check your Clerk plan before inviting larger teams.

**Backups**

MongoDB holds all the data. Turn on your provider's backups (Railway volume backups or MongoDB Atlas snapshots), or run `mongodump --uri "$MONGODB_URI" --archive=daybook-$(date +%F).gz --gzip` on a schedule and keep the files off the server. Test a restore with `mongorestore --archive=<file> --gzip`.

**Clerk in production**

1. Create the production instance for `sprintos.run` and add the DNS records Clerk asks for.
2. Turn on Organizations, let users create their own (capped at a few per user, for example 3) and add the same session token claims as in development (`name`, `email`, `org_name`).
3. Create the webhook at `https://api.sprintos.run/webhooks/clerk` with the same events.
4. Put the production keys in the API variables and in the web build arguments.
5. Add the MCP server and turn on dynamic client registration, as described in [AI assistants (MCP)](#ai-assistants-mcp).

**Desktop app**: build the installers with `VITE_API_URL=https://api.sprintos.run` so they talk to the hosted API.

### AI assistants (MCP)

The API includes an MCP server at `/mcp` (`https://api.sprintos.run/mcp` in the hosted service). Claude, ChatGPT and Codex connect to it with OAuth through Clerk and act as the signed-in user, with the same workspaces and role as in the app. Each person finds the connection steps in **Settings → AI assistants**.

| Area                      | Tools                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Workspace                 | `list_workspaces`, `get_workspace_overview`, `search`, `get_activity`                                           |
| Tasks                     | `list_tasks`, `get_task`, `create_task`, `update_task`, `bulk_update_tasks`, `delete_task`, `bulk_delete_tasks` |
| Comments                  | `list_comments`, `add_comment`, `edit_comment`, `react_to_comment`, `delete_comment`                            |
| Notes                     | `list_notes`, `get_note`, `create_note`, `update_note`, `set_note_links`, `delete_note`                         |
| Folders                   | `list_folders`, `create_folder`, `update_folder`, `delete_folder`                                               |
| Members (admin to change) | `list_members`, `invite_member`, `update_member_role`, `remove_member`                                          |
| Teams (admin to change)   | `list_teams`, `create_team`, `update_team`, `add_team_member`, `remove_team_member`, `delete_team`              |
| Notifications             | `list_notifications`, `mark_notification_read`, `mark_all_notifications_read`                                   |

Each note is also a resource at `daybook://<workspace>/notes/<id>` in Markdown.

**Set up Clerk once per instance**

1. In the Clerk Dashboard, open **Agents → MCP servers**, select **Add MCP server** and enter the exact endpoint: `https://api.sprintos.run/mcp` in production, `http://localhost:3001/mcp` in development. This turns on the audience claim the API checks.
2. In **OAuth applications**, turn on **Dynamic client registration** (Claude and Codex register themselves) and set default scopes for clients that send none.
3. Set `PUBLIC_API_URL` (and `APP_URL`) on the API so the advertised URL matches the one in Clerk.

**How it works**

- Stateless Streamable HTTP (`@modelcontextprotocol/server` v2): every request gets a fresh server, so any replica can answer. Clients on the 2025 protocol revisions are served too.
- Without a valid token, `/mcp` answers 401 with `WWW-Authenticate` pointing to `/.well-known/oauth-protected-resource/mcp`, which names Clerk as the authorization server. That starts the sign-in in each client.
- Tokens are verified with Clerk (`acceptsToken: 'oauth_token'`, audience = the MCP URL). The token names a user; the tool picks the workspace from the `workspace` argument (Clerk organization id, workspace id or name) and checks membership with Clerk on each request.
- Tools call the same services as the REST API, so permissions, quotas, notifications and real-time updates behave the same. Activity records changes as **via AI assistant**, and the rate limit is shared with the REST API.

**Try it locally**: run the API, then `npx @modelcontextprotocol/inspector` and connect to `http://localhost:3001/mcp`. Claude and ChatGPT connect from their own servers, so they need a public HTTPS URL.

### API reference

All `/api` routes need `Authorization: Bearer <Clerk session token>` with an active organization. Errors use `{ "error": { "message", "issues", "code" } }`. Routes marked **admin** need the `admin` role; routes that change notes need `note:write`, which both roles have.

| Method and path                                                           | Purpose                                                               |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /health`                                                             | Liveness check (no auth)                                              |
| `GET /ready`                                                              | Readiness: 200 when MongoDB and Redis answer, 503 otherwise (no auth) |
| `POST /webhooks/clerk`                                                    | Clerk webhooks (signature verified)                                   |
| `POST /mcp`                                                               | MCP server (Streamable HTTP); needs a Clerk OAuth access token        |
| `GET /.well-known/oauth-protected-resource/mcp`                           | OAuth discovery for MCP clients (RFC 9728)                            |
| `GET /api/bootstrap`                                                      | Workspace, current member, members, activity                          |
| `GET /api/tasks` · `POST /api/tasks`                                      | List (with filters) and create tasks                                  |
| `GET/PATCH/DELETE /api/tasks/:id`                                         | Read, update, delete a task                                           |
| `PATCH /api/tasks` · `DELETE /api/tasks`                                  | Bulk update and bulk delete                                           |
| `GET/POST /api/comments/tasks/:taskId`                                    | Comments of a task                                                    |
| `PATCH/DELETE /api/comments/:id`                                          | Edit or delete your comment                                           |
| `POST /api/comments/:id/reactions`                                        | Toggle an emoji reaction                                              |
| `GET /api/members` · `GET /api/members/:id`                               | Members                                                               |
| `PATCH/DELETE /api/members/:id`                                           | Update or remove a member (admin)                                     |
| `GET/POST /api/teams` · `GET/PATCH/DELETE /api/teams/:id`                 | Teams (changes: admin)                                                |
| `POST /api/teams/:id/members` · `DELETE /api/teams/:id/members/:memberId` | Team membership (admin)                                               |
| `GET /api/folders` · `POST /api/folders`                                  | Note folders                                                          |
| `PATCH/DELETE /api/folders/:id`                                           | Rename or move, delete a folder                                       |
| `GET /api/notes?folderId=&q=`                                             | Note summaries; empty `folderId` = loose notes                        |
| `GET /api/notes/:id`                                                      | `{ note, related, backlinks }`                                        |
| `POST /api/notes` · `PATCH /api/notes/:id`                                | Create and update; send `baseUpdatedAt` to get a 409 on conflicts     |
| `PUT /api/notes/:id/links` · `DELETE /api/notes/:id`                      | Set explicit links, delete a note                                     |
| `GET /api/notifications`                                                  | Your notifications                                                    |
| `PATCH /api/notifications/:id/read` · `POST /api/notifications/read-all`  | Mark as read                                                          |
| `GET /api/activity`                                                       | Activity feed                                                         |
| `GET /api/search?q=`                                                      | Search                                                                |
| `GET /api/events/stream`                                                  | Server-Sent Events for the workspace                                  |

### Code conventions

The tooling enforces these, and `npm run lint` fails when they break:

| Rule                                                | Enforced by                     |
| --------------------------------------------------- | ------------------------------- |
| Files of at most 200 lines                          | ESLint `max-lines`              |
| Functions of at most 40 lines                       | ESLint `max-lines-per-function` |
| Cyclomatic complexity of at most 10                 | ESLint `complexity`             |
| Strict TypeScript                                   | `tsconfig.base.json`            |
| 160-character lines, single quotes, trailing commas | Prettier                        |

Team conventions:

- Code, names, comments and commit messages in English. Comments take one line and explain why, not what.
- Keep it simple: no abstraction, wrapper or dependency without a concrete need. Reuse what `modules/core` already has.
- Validate every input with a Zod schema from `@daybook/domain`. Partial update schemas never carry defaults, so a `PATCH` cannot erase fields the client did not send.
- Nullable fields in Mongoose models use `default: null`, never `required`.
- New repository methods go in the port first, then in both adapters (memory and Mongo).
- Use design tokens from `apps/web/src/styles/tokens.css`; never hard-code colours.

### Design system and AI skills

- `apps/web/DESIGN.md`: the visual system ("The Working Notebook"): colours, type, layout, depth, shapes, components and rules. `.impeccable/design.json` holds the same tokens for tools.
- `apps/web/PRODUCT.md`: who Daybook is for and its design principles.
- `apps/web/.impeccable/surfaces/`: per-screen design briefs.

The repository ships agent skills so AI coding assistants follow the same standards:

| Skill                 | Where                                                                                          | Use                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `impeccable` (v4.10)  | `.claude/skills/impeccable`, `.opencode/skills/impeccable`, `.opencode/commands/impeccable.md` | Designing, critiquing, auditing and polishing UI; keeps `DESIGN.md` current                              |
| Impeccable sub-agents | `.claude/agents/impeccable-*.md`                                                               | Finish reviewer, documenter, motion reviewer, asset producer, manual edit applier                        |
| `modern-web-guidance` | `.claude/skills/modern-web-guidance`, `.agents/skills/modern-web-guidance`                     | Google Chrome's guidance on accessibility, performance and modern web APIs; pinned in `skills-lock.json` |

Claude Code, OpenCode and other tools that read `.claude/` or `.agents/` pick these up automatically. Use `impeccable` for any change to the interface.

### Contributing

1. Fork the repository and create a branch from `main`: `feat/…`, `fix/…` or `docs/…`.
2. Make the change, following the conventions above.
3. Run `npm run typecheck && npm run lint && npm test && npm run build`.
4. Commit with a clear message, for example `feat(notes): add note templates`.
5. Open a pull request that explains what changed and why, with screenshots for UI changes.

### Known limitations

- While Redis is unreachable, events published in that time are not delivered; open pages catch up on their next refresh.
- AI assistants connect only with OAuth for now; personal API keys for scripts are not available yet.
- `PERSISTENCE=memory` loses everything on restart. Use MongoDB for anything you want to keep.
- `[[Title]]` links match note titles, so renaming a note breaks links that used its old title.
- Dragging in the notes tree needs a pointer; keyboard users move items with the **Move to…** menus.
- Downloading a note as `.md` may not work inside the desktop app yet.

### License

Daybook is released under the [MIT License](LICENSE). By contributing, you agree that your contributions are licensed under the same terms.

---

## Español

### Contenido

1. [Qué hace Daybook](#qué-hace-daybook)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Módulos](#módulos)
6. [Primeros pasos](#primeros-pasos)
7. [Variables de entorno](#variables-de-entorno)
8. [Comandos](#comandos)
9. [Despliegue](#despliegue)
10. [Asistentes de IA (MCP)](#asistentes-de-ia-mcp)
11. [Referencia de la API](#referencia-de-la-api)
12. [Convenciones de código](#convenciones-de-código)
13. [Sistema de diseño y skills de IA](#sistema-de-diseño-y-skills-de-ia)
14. [Cómo contribuir](#cómo-contribuir)
15. [Limitaciones conocidas](#limitaciones-conocidas)
16. [Licencia](#licencia)

### Qué hace Daybook

Daybook reúne tareas y notas de un equipo pequeño en un solo espacio de trabajo tranquilo. Se entrega como app web, API y app de escritorio que envuelve el mismo cliente web.

**Espacios de trabajo y personas**

- Inicio de sesión y registro con Clerk. Cada organización de Clerk es un espacio de trabajo de Daybook; puedes cambiar entre ellas o crear una nueva desde la app.
- Dos roles, tomados de Clerk: `admin` (`org:admin`) y `member` (`org:member`). Los administradores gestionan el espacio, invitan personas, cambian roles y eliminan miembros.
- Invitaciones por correo con un rol. Al eliminar un miembro se desasignan sus tareas y sale de todos los equipos.
- Equipos: grupos con nombre, icono, color, descripción y miembros.
- Perfil: nombre, cargo y zona horaria. Tema claro u oscuro, guardado en tu perfil de Clerk para que te siga en cada dispositivo.

**Tareas**

- Cada tarea recibe una clave del espacio, como `DAY-42`.
- Campos: título, estado (Backlog, To Do, In Progress, Review, Done), prioridad, responsable, fechas de inicio y entrega, etiquetas (Design, Frontend, Backend, Research, Content, Bug, QA, Growth), estimación (`4h`, `2d`, `1w`), recurrencia (diaria, semanal, cada 2 semanas, mensual), subtareas, dependencias, favorita y descripción enriquecida.
- Cuatro vistas de las mismas tareas: lista, tablero (arrastra tarjetas entre columnas), tabla y calendario (mes y semana, arrastra para reprogramar).
- Filtros, edición masiva y borrado masivo.
- Comentarios con reacciones de emoji; cada autor puede editar y borrar los suyos.

**Notas**

- Notas en Markdown que pertenecen al espacio de trabajo, organizadas en carpetas anidadas.
- El modo lectura muestra Markdown de GitHub: tablas, listas de tareas, código, citas y enlaces. El HTML crudo nunca se ejecuta.
- Doble clic o **Edit** para escribir. `⌘S` / `Ctrl+S` guarda; los cambios también se guardan solos 1,5 s después de dejar de escribir; `Esc` sale de la edición.
- Dos formas de relacionar notas: desde el panel **Related**, o escribiendo `[[Título]]` (o `[[Título|texto]]`) en el cuerpo. Al escribir `[[` aparecen sugerencias. Un enlace a una nota que no existe la crea.
- **Mentioned in** muestra todas las notas que enlazan a la abierta.
- Dos personas editando la misma nota nunca se pisan en silencio: el segundo guardado recibe un aviso de conflicto con **Use their version** y **Keep mine**.
- Arrastra notas y carpetas a otra carpeta, o usa los menús **Move to…**. Al borrar una carpeta, su contenido pasa a la carpeta padre.
- Descarga cualquier nota como archivo `.md`.
- Salir de una nota con cambios sin guardar (a otra nota, otra página, el botón atrás o cerrando la pestaña) pide confirmación.

**En toda la app**

- Inicio: estadísticas del espacio, tus tareas y actividad reciente.
- Registro de actividad con lo que cambió en el espacio.
- Notificaciones cuando alguien te asigna una tarea o comenta en una tuya, dentro de la app y, si configuras SMTP, por correo.
- Tiempo real: tareas, comentarios, notas, carpetas y notificaciones se actualizan para todos sin recargar (Server-Sent Events).
- Búsqueda con `⌘K` / `Ctrl+K` en tareas, notas, personas, equipos y páginas.
- App de escritorio para macOS, Windows y Linux hecha con Tauri 2.

### Stack tecnológico

| Capa         | Tecnología                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Cliente web  | React 19, Vite 8, React Router 7 (data router), TanStack Query 5, Zustand, dnd-kit, react-markdown + remark-gfm, iconos Lucide |
| Escritorio   | Tauri 2 (Rust) envolviendo el build web                                                                                        |
| API          | Node 22, Hono 4, `@hono/node-server`, Zod 4, Nodemailer                                                                        |
| Auth         | Clerk (`@clerk/react`, `@clerk/backend`), organizaciones y webhooks                                                            |
| Datos        | MongoDB 7 con Mongoose 9, o un almacén en memoria para pruebas rápidas                                                         |
| Compartido   | `@daybook/domain`: esquemas Zod, tipos, permisos y vocabularios                                                                |
| Herramientas | npm workspaces, TypeScript 5.9 (estricto), ESLint 10, Prettier 3, Vitest 5, Docker Compose                                     |

### Arquitectura

El diagrama de la [sección en inglés](#architecture) aplica igual.

**API (hexagonal).** Cada petición a `/api/*` pasa, en orden, por: cabeceras de seguridad → CORS → límite de 1 MB → autenticación con Clerk → límite de peticiones (300 por minuto por usuario) → alcance del espacio de trabajo. El middleware de alcance busca o crea el espacio de la organización activa de Clerk y el miembro del usuario, así una base de datos vacía se llena sola con el primer uso. Las rutas validan con los esquemas Zod de `@daybook/domain`, revisan permisos con `permit('…')` y llaman a los servicios. Los servicios solo dependen de los puertos de `src/ports/repositories.ts`; `PERSISTENCE` elige los adaptadores de memoria o de Mongo al arrancar. Cada llamada a un repositorio lleva el id del espacio, así una organización nunca lee los datos de otra. Los servicios emiten eventos en un bus en proceso; `/api/events/stream` los envía al navegador como Server-Sent Events. Los webhooks de Clerk mantienen sincronizados espacios y miembros cuando las organizaciones o membresías cambian fuera de la app.

**Web (screaming architecture).** `src/pages` tiene un archivo por ruta, cargado en diferido. `src/modules/<dominio>` contiene cada funcionalidad, dividida en `components`, `hooks`, `lib`, `services` (hooks de TanStack Query) y `states` (stores de Zustand) cuando hace falta. `src/modules/core` reúne las piezas compartidas: cliente de API, diálogos, popovers, toasts, iconos y utilidades de fechas. Los datos del servidor viven en TanStack Query; los eventos SSE invalidan las consultas correspondientes. Los parámetros de la URL guardan el estado de la página, como la nota abierta, para que los enlaces y el botón atrás funcionen.

**Paquete de dominio.** `packages/domain` es el contrato entre cliente y servidor: esquemas, tipos inferidos, la matriz de permisos y los vocabularios (estados, prioridades, etiquetas, roles, temas).

### Estructura de carpetas

```
daybook/
├── apps/
│   ├── api/                      API en Hono
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── memory/       Repositorios en memoria (datos de demo)
│   │   │   │   ├── mongo/        Modelos y repositorios de Mongoose
│   │   │   │   └── redis/        Bus de eventos compartido y contador del límite
│   │   │   ├── fixtures/seed/    Espacio, miembros y tareas de demo
│   │   │   ├── http/             Auth, alcance del espacio, límite, logs, errores, validación
│   │   │   ├── modules/          Una carpeta por funcionalidad: *-routes.ts + *-service.ts
│   │   │   ├── ports/            Interfaces de repositorios
│   │   │   ├── scripts/seed.ts   Carga los datos de demo en MongoDB
│   │   │   ├── shared/           Bus de eventos, correo, límites, logger JSON
│   │   │   ├── app.ts            Middleware y rutas
│   │   │   ├── config.ts         Validación del entorno
│   │   │   └── server.ts         Punto de entrada
│   │   └── .env.example
│   └── web/                      Cliente React y app de escritorio Tauri
│       ├── src/
│       │   ├── app/              Raíz, providers, router y shell (barra lateral, barra superior, navegación móvil)
│       │   ├── pages/            Un componente por ruta
│       │   ├── modules/          Una carpeta por funcionalidad (ver Módulos)
│       │   └── styles/           Tokens, base, componentes, overlays, pages/, views/
│       ├── src-tauri/            Proyecto Tauri 2 (Rust)
│       ├── public/
│       ├── DESIGN.md             Sistema de diseño visual
│       ├── PRODUCT.md            Contexto de producto para el diseño
│       ├── .impeccable/          Tokens de diseño y briefs por pantalla
│       └── .env.example
├── packages/
│   └── domain/                   Esquemas, tipos, permisos y vocabularios compartidos
├── .claude/                      Skills y subagentes de IA (ver Sistema de diseño y skills de IA)
├── .agents/  .opencode/          Las mismas skills para otras herramientas de agentes
├── deploy/Caddyfile              Proxy de borde con TLS automático para un VPS
├── docker-compose.yml            MongoDB 7 para desarrollo local
├── docker-compose.prod.yml       Stack de producción para un VPS (borde, web, réplicas de api, Redis)
├── eslint.config.js  tsconfig.base.json  .prettierrc.json  .editorconfig
├── skills-lock.json              Skills externas fijadas a una versión
└── .env.example                  Credenciales de MongoDB para Docker Compose
```

### Módulos

**API (`apps/api/src/modules`)**

| Módulo          | Responsabilidad                                                                     |
| --------------- | ----------------------------------------------------------------------------------- |
| `workspace`     | `/bootstrap`: espacio, miembro actual, miembros y actividad reciente en una llamada |
| `identity`      | Crea y sincroniza espacios y miembros a partir de las identidades de Clerk          |
| `members`       | Listar, actualizar (rol, perfil) y eliminar miembros                                |
| `teams`         | Equipos y sus miembros                                                              |
| `tasks`         | CRUD de tareas, claves, edición y borrado masivo, notificación de asignación        |
| `comments`      | Comentarios, ediciones y reacciones de emoji                                        |
| `notifications` | Notificaciones en la app y correo opcional                                          |
| `activity`      | Registro de actividad del espacio                                                   |
| `folders`       | Carpetas anidadas de notas; evita ciclos; al borrar mueve el contenido al padre     |
| `notes`         | Notas, enlaces explícitos, menciones `[[Título]]`, backlinks y conflictos (409)     |
| `search`        | Búsqueda `⌘K` en tareas, miembros, equipos y notas                                  |
| `realtime`      | Flujo de Server-Sent Events por espacio                                             |
| `webhooks`      | Webhooks de Clerk para organizaciones, membresías y usuarios                        |
| `mcp`           | Servidor MCP para asistentes de IA: OAuth con Clerk, 39 herramientas                |

**Web (`apps/web/src/modules`)**

| Módulo          | Responsabilidad                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| `core`          | Cliente de API, hook de SSE, diálogos, popovers, menús, toasts, iconos, fechas        |
| `auth`          | Provider de Clerk y recuperación de sesión                                            |
| `organizations` | Selector y creación de organizaciones, y la pantalla "elige una organización"         |
| `workspace`     | Consulta de bootstrap                                                                 |
| `home`          | Estadísticas, mis tareas, actividad reciente                                          |
| `tasks`         | Filas, panel lateral, campos, compositor, filtros y acciones masivas                  |
| `views`         | Vistas de tablero, tabla y calendario                                                 |
| `comments`      | Consultas de comentarios                                                              |
| `notes`         | Árbol de carpetas, lector Markdown, editor, enlaces, autoguardado, arrastrar y soltar |
| `members`       | Tabla de miembros, invitaciones, roles y permisos                                     |
| `teams`         | Gestión de equipos                                                                    |
| `notifications` | Lista de notificaciones y contador de no leídas                                       |
| `activity`      | Registro de actividad                                                                 |
| `search`        | Paleta de comandos                                                                    |
| `settings`      | Espacio, apariencia, perfil, asistentes de IA y atajos                                |

### Primeros pasos

**Requisitos**

- Node.js 22.12 o superior (`.nvmrc` fija la 22) y npm.
- Una cuenta gratuita de [Clerk](https://clerk.com).
- Docker, solo si quieres MongoDB en local.
- El [toolchain de Rust](https://www.rust-lang.org/tools/install) y los [requisitos de Tauri](https://v2.tauri.app/start/prerequisites/), solo para la app de escritorio.

**1. Instalar**

```bash
git clone https://github.com/varmiguemunoz/daybook.git
cd daybook
npm install
```

**2. Configurar Clerk**

1. Crea una aplicación en el [Clerk Dashboard](https://dashboard.clerk.com).
2. Activa **Organizations**. Daybook exige una organización activa en cada petición.
3. En **Sessions → Customize session token**, añade estos claims. La API rechaza los tokens que no los tengan:

   ```json
   {
     "name": "{{user.full_name}}",
     "email": "{{user.primary_email_address}}",
     "org_name": "{{org.name}}"
   }
   ```

4. Copia la **Publishable key** (`pk_…`) y la **Secret key** (`sk_…`) desde **API keys**.
5. En **Webhooks**, crea un endpoint en `https://<host-de-tu-api>/webhooks/clerk` con estos eventos: `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`, `user.updated`, `user.deleted`. Copia su **Signing secret** (`whsec_…`). En local, expón el puerto 3001 con un túnel como `ngrok http 3001`. Mientras desarrollas, la app funciona sin webhooks porque crea espacios y miembros con el primer uso; los webhooks los mantienen sincronizados después.

**3. Configurar el entorno**

```bash
cp .env.example .env                    # solo para Docker Compose
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Completa los valores descritos en [Variables de entorno](#variables-de-entorno).

**4. Elegir dónde viven los datos**

- `PERSISTENCE=memory` (por defecto): sin base de datos, datos de demo al arrancar; todo se pierde al reiniciar la API.
- `PERSISTENCE=mongo`: levanta MongoDB con `npm run db:up` y define `MONGODB_URI`. Si quieres el espacio de demo, cárgalo con `npm run seed -w @daybook/api`.

**5. Ejecutar**

```bash
npm run dev:api     # http://localhost:3001
npm run dev:web     # http://localhost:5175
```

Abre http://localhost:5175, regístrate, crea una organización y empieza a trabajar.

**App de escritorio**

```bash
npm run tauri:dev -w @daybook/web      # el servidor web de desarrollo dentro de una ventana nativa
npm run tauri:build -w @daybook/web    # instaladores en apps/web/src-tauri/target
```

La API debe permitir los orígenes de Tauri (`tauri://localhost`, `http://tauri.localhost`), que `ALLOWED_ORIGINS` ya incluye en el ejemplo.

### Variables de entorno

**`.env` de la raíz** (solo lo usa `docker-compose.yml`)

| Variable         | Obligatoria | Por defecto   | Descripción                          |
| ---------------- | ----------- | ------------- | ------------------------------------ |
| `MONGO_USER`     | No          | `daybook`     | Usuario root de MongoDB en Docker    |
| `MONGO_PASSWORD` | No          | `daybookpass` | Contraseña root de MongoDB en Docker |

**API `apps/api/.env`**

| Variable                       | Obligatoria | Por defecto                         | Descripción                                                                    |
| ------------------------------ | ----------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`                     | No          | `development`                       | `production` en producción; rechaza `PERSISTENCE=memory`                       |
| `PORT`                         | No          | `3001`                              | Puerto de la API                                                               |
| `PERSISTENCE`                  | No          | `memory`                            | `memory` o `mongo`                                                             |
| `MONGODB_URI`                  | Con `mongo` | `mongodb://127.0.0.1:27017/daybook` | Cadena de conexión; la del ejemplo coincide con Docker Compose                 |
| `CLERK_SECRET_KEY`             | Sí          | –                                   | Secret key de Clerk, empieza por `sk_`                                         |
| `CLERK_PUBLISHABLE_KEY`        | Sí          | –                                   | Publishable key de Clerk, empieza por `pk_`                                    |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Sí          | –                                   | Signing secret del webhook de Clerk, empieza por `whsec_`                      |
| `ALLOWED_ORIGINS`              | Sí          | –                                   | Orígenes permitidos separados por comas (app web y Tauri)                      |
| `SMTP_HOST`                    | No          | –                                   | Servidor SMTP para notificaciones por correo                                   |
| `SMTP_PORT`                    | No          | `587`                               | Puerto SMTP                                                                    |
| `SMTP_SECURE`                  | No          | `false`                             | `true` para TLS implícito (puerto 465)                                         |
| `SMTP_USER`                    | No          | –                                   | Usuario SMTP                                                                   |
| `SMTP_PASS`                    | No          | –                                   | Contraseña SMTP                                                                |
| `SMTP_FROM`                    | No          | `SMTP_USER`                         | Remitente                                                                      |
| `PUBLIC_API_URL`               | No          | `http://localhost:PORT`             | URL pública de la API; los asistentes de IA se conectan a `PUBLIC_API_URL/mcp` |
| `APP_URL`                      | No          | –                                   | URL pública de la web; ahí llegan las invitaciones que envía un asistente      |
| `REDIS_URL`                    | No          | –                                   | Redis para varias instancias de la API (`redis://` o `rediss://`)              |
| `MAX_TASKS_PER_WORKSPACE`      | No          | `0`                                 | Límite de tareas por espacio; `0` es sin límite                                |
| `MAX_NOTES_PER_WORKSPACE`      | No          | `0`                                 | Límite de notas por espacio; `0` es sin límite                                 |

Define `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` juntos, o deja los tres vacíos para enviar solo notificaciones en la app. La API valida todo al arrancar y no inicia si falta algo, con un error claro.

**Web `apps/web/.env`**

| Variable                     | Obligatoria | Por defecto             | Descripción                       |
| ---------------------------- | ----------- | ----------------------- | --------------------------------- |
| `VITE_API_URL`               | No          | `http://localhost:3001` | URL base de la API                |
| `VITE_CLERK_PUBLISHABLE_KEY` | Sí          | –                       | La misma publishable key de Clerk |

Nunca subas archivos `.env`; solo se versionan los `.env.example`.

### Comandos

Desde la raíz del repositorio.

| Comando                                   | Qué hace                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `npm install`                             | Instala todos los workspaces                                         |
| `npm run dev:web`                         | Cliente web con recarga en caliente, puerto 5175                     |
| `npm run dev:api`                         | API con recarga, puerto 3001                                         |
| `npm run build`                           | Revisa tipos en cada workspace y construye la web en `apps/web/dist` |
| `npm run preview`                         | Sirve el build de la web                                             |
| `npm run typecheck`                       | `tsc --noEmit` en cada workspace                                     |
| `npm test`                                | Vitest en cada workspace                                             |
| `npm run lint`                            | ESLint en todo el repositorio                                        |
| `npm run format` / `npm run format:check` | Prettier: formatear / comprobar                                      |
| `npm run db:up` / `db:down` / `db:logs`   | Iniciar, detener o ver logs del contenedor MongoDB                   |
| `npm run seed -w @daybook/api`            | Cargar el espacio de demo en MongoDB                                 |
| `npm run tauri:dev -w @daybook/web`       | App de escritorio en desarrollo                                      |
| `npm run tauri:build -w @daybook/web`     | Instaladores de escritorio                                           |

### Despliegue

El servicio alojado corre en **https://app.sprintos.run** (web) y **https://api.sprintos.run** (API). Cada app tiene su Dockerfile; ambos se construyen desde la raíz del repositorio.

| Imagen | Dockerfile            | Ejecuta                | Notas                                                                                                                        |
| ------ | --------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| api    | `apps/api/Dockerfile` | Node en `PORT` (3001)  | Bundle con esbuild, usuario sin privilegios, healthcheck en `/health`, readiness en `/ready`, apagado ordenado con `SIGTERM` |
| web    | `apps/web/Dockerfile` | Caddy en `PORT` (8080) | Build estático que envía cualquier ruta a la app; `VITE_API_URL` y `VITE_CLERK_PUBLISHABLE_KEY` son **argumentos de build**  |

Los comandos de `docker build` son los de la [sección en inglés](#deployment).

Reglas de producción:

- `NODE_ENV=production` y `PERSISTENCE=mongo`. La API no arranca con el almacén en memoria en producción.
- `ALLOWED_ORIGINS` incluye `https://app.sprintos.run` (más los orígenes de Tauri para la app de escritorio).
- `PUBLIC_API_URL=https://api.sprintos.run` y `APP_URL=https://app.sprintos.run`, para que los asistentes de IA y las invitaciones usen las direcciones públicas.
- Usa las claves de la instancia de **producción** de Clerk.
- Vite escribe los valores `VITE_*` en el bundle, así que cambiarlos exige un build nuevo.
- Los `.env` nunca entran en una imagen (`.dockerignore`); la plataforma inyecta las variables al arrancar.

**Railway**

1. En un proyecto, junto a tu servicio de MongoDB, añade dos servicios desde este repositorio de GitHub: `api` y `web`.
2. En **Variables** de cada servicio, define `RAILWAY_DOCKERFILE_PATH` (`apps/api/Dockerfile` o `apps/web/Dockerfile`) y las variables de [Variables de entorno](#variables-de-entorno). El Dockerfile de la web declara `VITE_*` con `ARG`, que es como Railway se las pasa al build.
3. Apunta `MONGODB_URI` a tu base de datos con una variable de referencia, por ejemplo `${{MongoDB.MONGO_URL}}` (con el nombre de tu servicio).
4. En los ajustes de `api`, pon `/ready` como ruta del healthcheck.
5. Define las watch paths para que cada servicio solo se reconstruya cuando cambia: `api` → `/apps/api/**`, `/packages/domain/**`, `/package-lock.json`; `web` → `/apps/web/**`, `/packages/domain/**`, `/package-lock.json`.
6. Añade los dominios `app.sprintos.run` (web) y `api.sprintos.run` (api) y crea los registros DNS que indica Railway.
7. Para más de una réplica de `api`, añade un servicio de Redis, define `REDIS_URL=${{Redis.REDIS_URL}}` en `api` y sube **Replicas** en sus ajustes. Sin `REDIS_URL`, deja una réplica.

**VPS con Docker Compose**

1. Apunta los registros DNS `A` de `app.sprintos.run` y `api.sprintos.run` al servidor.
2. Clona el repositorio y crea `apps/api/.env` y `apps/web/.env` con valores de producción.
3. Arranca todo:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file apps/web/.env up -d --build
   ```

4. El stack levanta el proxy de borde, la web, dos réplicas de `api` y Redis. El proxy de borde (`deploy/Caddyfile`) obtiene los certificados TLS solo, reparte las peticiones entre las réplicas y transmite los Server-Sent Events sin buffer. Define `API_REPLICAS` en `apps/web/.env` para usar otro número de réplicas.
5. Para actualizar, haz `git pull` y repite el comando. Las réplicas se reinician, cierran sus streams abiertos y los navegadores se reconectan en pocos segundos.

**Varias instancias de la API**

- Con `REDIS_URL`, las instancias comparten por Redis los eventos en tiempo real y el límite de peticiones (300 por minuto por usuario). Redis solo guarda datos de vida corta, así que no necesita persistencia ni copias.
- Sin `REDIS_URL`, la API corre como una sola instancia y guarda ambos en memoria.
- `/ready` responde 503 mientras MongoDB o Redis no responden y mientras la instancia se apaga, así la plataforma deja de enviarle tráfico. Si Redis cae, las peticiones siguen funcionando, pero el tiempo real se pausa hasta que vuelve.

**Logs**

La API escribe un objeto JSON por línea (`time`, `level`, `msg`, `requestId`, `method`, `path`, `status`, `durationMs`, `userId`, `workspaceId`). Cada respuesta lleva la cabecera `X-Request-Id` con el mismo id, para cruzar el reporte de un usuario con su línea de log.

**Límites para una instancia alojada**

- `MAX_TASKS_PER_WORKSPACE` y `MAX_NOTES_PER_WORKSPACE` limitan lo que puede crear un espacio. Al pasar el límite, la API responde 403 con el código `limit_reached` y la app muestra el mensaje.
- El plan gratuito de Clerk incluye 100 organizaciones retenidas al mes por app (las de un solo miembro son gratis) y hasta 20 miembros por organización. Revisa tu plan de Clerk antes de invitar equipos más grandes.

**Copias de seguridad**

MongoDB guarda todos los datos. Activa las copias de tu proveedor (backups de volumen en Railway o snapshots de MongoDB Atlas), o programa `mongodump --uri "$MONGODB_URI" --archive=daybook-$(date +%F).gz --gzip` y guarda los archivos fuera del servidor. Prueba la restauración con `mongorestore --archive=<archivo> --gzip`.

**Clerk en producción**

1. Crea la instancia de producción para `sprintos.run` y añade los registros DNS que pide Clerk.
2. Activa Organizations, permite que los usuarios creen las suyas (con un tope por usuario, por ejemplo 3) y añade los mismos claims del token de sesión que en desarrollo (`name`, `email`, `org_name`).
3. Crea el webhook en `https://api.sprintos.run/webhooks/clerk` con los mismos eventos.
4. Pon las claves de producción en las variables de la API y en los argumentos de build de la web.
5. Añade el servidor MCP y activa el registro dinámico de clientes, como se explica en [Asistentes de IA (MCP)](#asistentes-de-ia-mcp).

**App de escritorio**: construye los instaladores con `VITE_API_URL=https://api.sprintos.run` para que hablen con la API alojada.

### Asistentes de IA (MCP)

La API incluye un servidor MCP en `/mcp` (`https://api.sprintos.run/mcp` en el servicio alojado). Claude, ChatGPT y Codex se conectan con OAuth a través de Clerk y actúan como el usuario que inició sesión, con los mismos espacios y rol que en la app. Cada persona encuentra los pasos en **Settings → AI assistants**. La lista de herramientas está en la [sección en inglés](#ai-assistants-mcp); cubren espacio, tareas, comentarios, notas, carpetas, miembros, equipos y notificaciones, y cada nota es además un recurso `daybook://<espacio>/notes/<id>` en Markdown.

**Configura Clerk una vez por instancia**

1. En el Clerk Dashboard, abre **Agents → MCP servers**, selecciona **Add MCP server** y escribe el endpoint exacto: `https://api.sprintos.run/mcp` en producción, `http://localhost:3001/mcp` en desarrollo. Así se activa el claim de audiencia que verifica la API.
2. En **OAuth applications**, activa **Dynamic client registration** (Claude y Codex se registran solos) y define scopes por defecto para los clientes que no envían ninguno.
3. Define `PUBLIC_API_URL` (y `APP_URL`) en la API para que la URL anunciada coincida con la de Clerk.

**Cómo funciona**

- Streamable HTTP sin estado (`@modelcontextprotocol/server` v2): cada petición crea un servidor nuevo, así que cualquier réplica responde. También atiende a clientes con las revisiones del protocolo de 2025.
- Sin token válido, `/mcp` responde 401 con `WWW-Authenticate` apuntando a `/.well-known/oauth-protected-resource/mcp`, que indica a Clerk como servidor de autorización. Eso inicia el login en cada cliente.
- Los tokens se verifican con Clerk (`acceptsToken: 'oauth_token'`, audiencia = la URL del MCP). El token identifica al usuario; la herramienta elige el espacio con el argumento `workspace` (id de organización de Clerk, id del espacio o nombre) y comprueba la membresía con Clerk en cada petición.
- Las herramientas llaman a los mismos servicios que la API REST: permisos, límites, notificaciones y tiempo real funcionan igual. La actividad marca los cambios como **via AI assistant** y el límite de peticiones se comparte con la API REST.

**Pruébalo en local**: arranca la API, luego `npx @modelcontextprotocol/inspector` y conéctate a `http://localhost:3001/mcp`. Claude y ChatGPT se conectan desde sus propios servidores, así que necesitan una URL HTTPS pública.

### Referencia de la API

La tabla de la [sección en inglés](#api-reference) aplica igual. Todas las rutas `/api` necesitan `Authorization: Bearer <token de sesión de Clerk>` con una organización activa. Los errores tienen la forma `{ "error": { "message", "issues", "code" } }`. Las rutas marcadas **admin** requieren el rol `admin`; las que modifican notas requieren `note:write`, que tienen ambos roles. En `PATCH /api/notes/:id`, envía `baseUpdatedAt` para recibir un 409 si otra persona guardó antes.

### Convenciones de código

Las herramientas las exigen y `npm run lint` falla si se rompen:

| Regla                                                     | Lo exige                        |
| --------------------------------------------------------- | ------------------------------- |
| Archivos de máximo 200 líneas                             | ESLint `max-lines`              |
| Funciones de máximo 40 líneas                             | ESLint `max-lines-per-function` |
| Complejidad ciclomática de máximo 10                      | ESLint `complexity`             |
| TypeScript estricto                                       | `tsconfig.base.json`            |
| Líneas de 160 caracteres, comillas simples, comas finales | Prettier                        |

Convenciones del equipo:

- Código, nombres, comentarios y mensajes de commit en inglés. Los comentarios ocupan una línea y explican el porqué, no el qué.
- Mantenlo simple: ninguna abstracción, wrapper o dependencia sin una necesidad concreta. Reutiliza lo que ya existe en `modules/core`.
- Valida toda entrada con un esquema Zod de `@daybook/domain`. Los esquemas de actualización parcial nunca llevan valores por defecto, así un `PATCH` no borra campos que el cliente no envió.
- Los campos que aceptan `null` en los modelos de Mongoose usan `default: null`, nunca `required`.
- Un método nuevo de repositorio va primero en el puerto y después en ambos adaptadores (memoria y Mongo).
- Usa los tokens de diseño de `apps/web/src/styles/tokens.css`; nunca escribas colores a mano.

### Sistema de diseño y skills de IA

- `apps/web/DESIGN.md`: el sistema visual ("The Working Notebook"): colores, tipografía, layout, profundidad, formas, componentes y reglas. `.impeccable/design.json` guarda los mismos tokens para herramientas.
- `apps/web/PRODUCT.md`: para quién es Daybook y sus principios de diseño.
- `apps/web/.impeccable/surfaces/`: briefs de diseño por pantalla.

El repositorio incluye skills para que los asistentes de código con IA sigan los mismos estándares:

| Skill                    | Dónde                                                                                          | Uso                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `impeccable` (v4.10)     | `.claude/skills/impeccable`, `.opencode/skills/impeccable`, `.opencode/commands/impeccable.md` | Diseñar, criticar, auditar y pulir la interfaz; mantiene `DESIGN.md` al día                               |
| Subagentes de Impeccable | `.claude/agents/impeccable-*.md`                                                               | Revisor final, documentador, revisor de movimiento, productor de assets, aplicador de ediciones manuales  |
| `modern-web-guidance`    | `.claude/skills/modern-web-guidance`, `.agents/skills/modern-web-guidance`                     | Guías de Google Chrome sobre accesibilidad, rendimiento y APIs web modernas; fijada en `skills-lock.json` |

Claude Code, OpenCode y otras herramientas que leen `.claude/` o `.agents/` las cargan solas. Usa `impeccable` para cualquier cambio en la interfaz.

### Cómo contribuir

1. Haz un fork y crea una rama desde `main`: `feat/…`, `fix/…` o `docs/…`.
2. Haz el cambio siguiendo las convenciones de arriba.
3. Ejecuta `npm run typecheck && npm run lint && npm test && npm run build`.
4. Haz commit con un mensaje claro, por ejemplo `feat(notes): add note templates`.
5. Abre un pull request que explique qué cambió y por qué, con capturas si toca la interfaz.

### Limitaciones conocidas

- Mientras Redis no responde, los eventos publicados en ese rato no llegan; las páginas abiertas se ponen al día en su siguiente recarga.
- Por ahora los asistentes de IA solo se conectan con OAuth; aún no hay API keys personales para scripts.
- `PERSISTENCE=memory` pierde todo al reiniciar. Usa MongoDB para lo que quieras conservar.
- Los enlaces `[[Título]]` usan el título, así que renombrar una nota rompe los enlaces que usaban el título anterior.
- Arrastrar en el árbol de notas requiere puntero; con teclado se usan los menús **Move to…**.
- Descargar una nota como `.md` puede no funcionar todavía dentro de la app de escritorio.

### Licencia

Daybook se publica bajo la [licencia MIT](LICENSE). Al contribuir, aceptas que tus aportes se licencien en los mismos términos.
