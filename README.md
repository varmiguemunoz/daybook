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
9. [API reference](#api-reference)
10. [Code conventions](#code-conventions)
11. [Design system and AI skills](#design-system-and-ai-skills)
12. [Contributing](#contributing)
13. [Known limitations](#known-limitations)
14. [License](#license)

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
│   │   │   │   └── mongo/        Mongoose models and repositories
│   │   │   ├── fixtures/seed/    Demo workspace, members and tasks
│   │   │   ├── http/             Auth, workspace scope, permissions, errors, validation
│   │   │   ├── modules/          One folder per feature: *-routes.ts + *-service.ts
│   │   │   ├── ports/            Repository interfaces
│   │   │   ├── scripts/seed.ts   Loads the demo data into MongoDB
│   │   │   ├── shared/           Event bus and email
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
├── docker-compose.yml            MongoDB 7 for local development
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
| `settings`      | Workspace, appearance, profile and shortcuts                           |

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

| Variable                       | Required     | Default                             | Description                                                         |
| ------------------------------ | ------------ | ----------------------------------- | ------------------------------------------------------------------- |
| `PORT`                         | No           | `3001`                              | API port                                                            |
| `PERSISTENCE`                  | No           | `memory`                            | `memory` or `mongo`                                                 |
| `MONGODB_URI`                  | With `mongo` | `mongodb://127.0.0.1:27017/daybook` | MongoDB connection string; the example matches Docker Compose       |
| `CLERK_SECRET_KEY`             | Yes          | –                                   | Clerk secret key, starts with `sk_`                                 |
| `CLERK_PUBLISHABLE_KEY`        | Yes          | –                                   | Clerk publishable key, starts with `pk_`                            |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes          | –                                   | Clerk webhook signing secret, starts with `whsec_`                  |
| `ALLOWED_ORIGINS`              | Yes          | –                                   | Comma-separated origins allowed to call the API (web app and Tauri) |
| `SMTP_HOST`                    | No           | –                                   | SMTP server for email notifications                                 |
| `SMTP_PORT`                    | No           | `587`                               | SMTP port                                                           |
| `SMTP_SECURE`                  | No           | `false`                             | `true` for implicit TLS (port 465)                                  |
| `SMTP_USER`                    | No           | –                                   | SMTP user                                                           |
| `SMTP_PASS`                    | No           | –                                   | SMTP password                                                       |
| `SMTP_FROM`                    | No           | `SMTP_USER`                         | Sender address                                                      |

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

### API reference

All `/api` routes need `Authorization: Bearer <Clerk session token>` with an active organization. Errors use `{ "error": { "message", "issues", "code" } }`. Routes marked **admin** need the `admin` role; routes that change notes need `note:write`, which both roles have.

| Method and path                                                           | Purpose                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `GET /health`                                                             | Health check (no auth)                                            |
| `POST /webhooks/clerk`                                                    | Clerk webhooks (signature verified)                               |
| `GET /api/bootstrap`                                                      | Workspace, current member, members, activity                      |
| `GET /api/tasks` · `POST /api/tasks`                                      | List (with filters) and create tasks                              |
| `GET/PATCH/DELETE /api/tasks/:id`                                         | Read, update, delete a task                                       |
| `PATCH /api/tasks` · `DELETE /api/tasks`                                  | Bulk update and bulk delete                                       |
| `GET/POST /api/comments/tasks/:taskId`                                    | Comments of a task                                                |
| `PATCH/DELETE /api/comments/:id`                                          | Edit or delete your comment                                       |
| `POST /api/comments/:id/reactions`                                        | Toggle an emoji reaction                                          |
| `GET /api/members` · `GET /api/members/:id`                               | Members                                                           |
| `PATCH/DELETE /api/members/:id`                                           | Update or remove a member (admin)                                 |
| `GET/POST /api/teams` · `GET/PATCH/DELETE /api/teams/:id`                 | Teams (changes: admin)                                            |
| `POST /api/teams/:id/members` · `DELETE /api/teams/:id/members/:memberId` | Team membership (admin)                                           |
| `GET /api/folders` · `POST /api/folders`                                  | Note folders                                                      |
| `PATCH/DELETE /api/folders/:id`                                           | Rename or move, delete a folder                                   |
| `GET /api/notes?folderId=&q=`                                             | Note summaries; empty `folderId` = loose notes                    |
| `GET /api/notes/:id`                                                      | `{ note, related, backlinks }`                                    |
| `POST /api/notes` · `PATCH /api/notes/:id`                                | Create and update; send `baseUpdatedAt` to get a 409 on conflicts |
| `PUT /api/notes/:id/links` · `DELETE /api/notes/:id`                      | Set explicit links, delete a note                                 |
| `GET /api/notifications`                                                  | Your notifications                                                |
| `PATCH /api/notifications/:id/read` · `POST /api/notifications/read-all`  | Mark as read                                                      |
| `GET /api/activity`                                                       | Activity feed                                                     |
| `GET /api/search?q=`                                                      | Search                                                            |
| `GET /api/events/stream`                                                  | Server-Sent Events for the workspace                              |

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

- The event bus and the rate limiter live in the API process, so real-time updates and rate limits assume a single API instance. Running several instances needs a shared bus (for example Redis).
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
9. [Referencia de la API](#referencia-de-la-api)
10. [Convenciones de código](#convenciones-de-código)
11. [Sistema de diseño y skills de IA](#sistema-de-diseño-y-skills-de-ia)
12. [Cómo contribuir](#cómo-contribuir)
13. [Limitaciones conocidas](#limitaciones-conocidas)
14. [Licencia](#licencia)

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
│   │   │   │   └── mongo/        Modelos y repositorios de Mongoose
│   │   │   ├── fixtures/seed/    Espacio, miembros y tareas de demo
│   │   │   ├── http/             Auth, alcance del espacio, permisos, errores, validación
│   │   │   ├── modules/          Una carpeta por funcionalidad: *-routes.ts + *-service.ts
│   │   │   ├── ports/            Interfaces de repositorios
│   │   │   ├── scripts/seed.ts   Carga los datos de demo en MongoDB
│   │   │   ├── shared/           Bus de eventos y correo
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
├── docker-compose.yml            MongoDB 7 para desarrollo local
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
| `settings`      | Espacio, apariencia, perfil y atajos                                                  |

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

| Variable                       | Obligatoria | Por defecto                         | Descripción                                                    |
| ------------------------------ | ----------- | ----------------------------------- | -------------------------------------------------------------- |
| `PORT`                         | No          | `3001`                              | Puerto de la API                                               |
| `PERSISTENCE`                  | No          | `memory`                            | `memory` o `mongo`                                             |
| `MONGODB_URI`                  | Con `mongo` | `mongodb://127.0.0.1:27017/daybook` | Cadena de conexión; la del ejemplo coincide con Docker Compose |
| `CLERK_SECRET_KEY`             | Sí          | –                                   | Secret key de Clerk, empieza por `sk_`                         |
| `CLERK_PUBLISHABLE_KEY`        | Sí          | –                                   | Publishable key de Clerk, empieza por `pk_`                    |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Sí          | –                                   | Signing secret del webhook de Clerk, empieza por `whsec_`      |
| `ALLOWED_ORIGINS`              | Sí          | –                                   | Orígenes permitidos separados por comas (app web y Tauri)      |
| `SMTP_HOST`                    | No          | –                                   | Servidor SMTP para notificaciones por correo                   |
| `SMTP_PORT`                    | No          | `587`                               | Puerto SMTP                                                    |
| `SMTP_SECURE`                  | No          | `false`                             | `true` para TLS implícito (puerto 465)                         |
| `SMTP_USER`                    | No          | –                                   | Usuario SMTP                                                   |
| `SMTP_PASS`                    | No          | –                                   | Contraseña SMTP                                                |
| `SMTP_FROM`                    | No          | `SMTP_USER`                         | Remitente                                                      |

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

- El bus de eventos y el límite de peticiones viven en el proceso de la API, así que el tiempo real y los límites asumen una sola instancia. Para varias instancias hace falta un bus compartido (por ejemplo Redis).
- `PERSISTENCE=memory` pierde todo al reiniciar. Usa MongoDB para lo que quieras conservar.
- Los enlaces `[[Título]]` usan el título, así que renombrar una nota rompe los enlaces que usaban el título anterior.
- Arrastrar en el árbol de notas requiere puntero; con teclado se usan los menús **Move to…**.
- Descargar una nota como `.md` puede no funcionar todavía dentro de la app de escritorio.

### Licencia

Daybook se publica bajo la [licencia MIT](LICENSE). Al contribuir, aceptas que tus aportes se licencien en los mismos términos.
