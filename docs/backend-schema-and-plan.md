# Gr8r Studio — Backend Audit, DB Schema, and Integration Plan

## 0. Goal

Make the React web client fully functional against a real backend: every create/edit/delete
action works, all entities persist, files upload to Cloudflare R2, invitations send email,
and in-app/browser notifications fire. Backend-first, then frontend wiring.

---

## 1. Current backend audit

### 1.1 What exists and works

| Area | Location | State |
|---|---|---|
| Hono app composition | `apps/api/src/app.ts` | CORS, Clerk gate (Node < 26), routes wired |
| Repositories port | `apps/api/src/ports/repositories.ts` | Task, Project, Member, Workspace, Activity, Invitation |
| Memory adapter | `apps/api/src/adapters/memory/*` | Full CRUD for tasks/projects; support repos |
| Mongo adapter | `apps/api/src/adapters/mongo/*` | Task, Project, Member, Activity, Invitation, Workspace models + repos |
| Tasks module | `modules/tasks/*` | list, get, create, update, delete + activity + key gen |
| Projects module | `modules/projects/*` | list, get, create, update, archive + activity |
| Workspace module | `modules/workspace/*` | bootstrap (me), members list, activity list |
| Invitations module | `modules/invitations/*` | list, create, accept |
| Activity module | `modules/activity/*` | recordActivity, recent |
| Auth | `http/context.ts`, `http/actor.ts` | Clerk (or x-member-id fallback), provisionMember |
| Permissions | `packages/domain/src/permissions.ts` | 8 permissions, 4 roles (owner/admin/member/guest) |
| Validation | `http/validate.ts` | Zod parseBody/parseQuery |

### 1.2 What is missing (gaps)

| Gap | Impact |
|---|---|
| **Members**: no update/delete/role-change endpoint or service | Cannot edit member, change role, deactivate |
| **Teams**: domain schema exists; no backend module, repo, route, Mongo model | Teams tab shows hardcoded grouping only |
| **Files**: domain schema exists; no backend, no repo, no route, no Mongo model, no R2 storage | Files view is a static dropzone |
| **Notifications**: domain schema exists; no backend, no repo, no route, no delivery (email/browser) | Notifications derived from activity only |
| **Comments**: domain schema exists; no backend | Task detail comments impossible |
| **Calendar events**: domain schema exists; no backend | Calendar only shows task due dates |
| **Saved views**: domain schema exists; no backend | View filters/sort not persisted |
| **Preferences**: domain schema exists; client-only | No server-side user preferences |
| **Workspaces/orgs**: only `findFirst`; no create/update, single workspace assumed | Multi-org impossible |
| **Search**: no full-text endpoint (Mongo text index on tasks only) | Command palette cannot search server-side |
| **Member profile**: provisionMember creates "New member" placeholder; no profile update | Clerk users stay unnamed |
| **Real-time**: none | No live updates |
| **Rate limiting / hardening**: none | Production risk |

### 1.3 Frontend CRUD wiring gaps

The ported components render markup but most action buttons have no `onClick`:

- Tasks: `TaskForm` create works; row edit/delete/context-menu not wired; status/assignee/priority/due pills are display-only.
- Projects: "New project" button has no handler; card has no navigation; no edit/archive.
- Board: drag-and-drop wired via dnd-kit + PATCH status; "Add task" opens composer but `defaultStatus` not passed to `TaskForm` correctly (TaskForm now supports it).
- Table: read-only; no cell editing.
- Calendar: "Add task" buttons have no handler.
- Members: invite button opens modal with `InviteForm` (needs wiring to POST /api/invitations); role/team edits not wired.
- Settings: inputs are uncontrolled (`defaultValue`); no save.
- Files: upload input has no handler; no R2 integration.

---

## 2. Feature map

| Feature | Domain schema | Backend module | Repo port | Mongo model | Routes | Status |
|---|---|---|---|---|---|---|
| Auth (Clerk) | member.clerkUserId | context.ts | — | MemberModel.clerkUserId | — | Partial (provision only) |
| Workspaces/Orgs | workspaceSchema | workspace-service | WorkspaceRepository | WorkspaceModel | GET bootstrap | Read-only |
| Members | memberSchema | workspace-service (list) | MemberRepository | MemberModel | GET /members | Read-only |
| Roles/Permissions | ROLES, can() | actor.ts | — | — | — | Enforced on task/project/invite |
| Projects | projectSchema | project-service | ProjectRepository | ProjectModel | CRUD + archive | Full |
| Tasks | taskSchema | task-service | TaskRepository | TaskModel | CRUD + query | Full |
| Subtasks/Attachments/Deps | embedded in task | task-service (via patch) | — | embedded | PATCH task | Partial (no dedicated endpoints) |
| Labels | vocab/label | — | — | string[] | — | Read-only vocab |
| Boards | derived (task.status) | — | — | — | — | Frontend only |
| Files | fileSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Calendar events | calendarEventSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Timeline | derived (task dates + milestones) | — | — | — | — | Frontend only |
| Comments | commentSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Activity | activitySchema | activity-service | ActivityRepository | ActivityModel | GET /activity | Append + read |
| Notifications | notificationSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Invitations | invitationSchema | invitation-service | InvitationRepository | InvitationModel | CRUD-ish | Create + accept |
| Saved views | savedViewSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Preferences | preferencesSchema | **missing** | **missing** | **missing** | **missing** | Client-only |
| Teams | teamSchema | **missing** | **missing** | **missing** | **missing** | Not implemented |
| Search | — | **missing** | — | text index (tasks) | **missing** | Not implemented |

---

## 3. Database schema (MongoDB / Mongoose)

All collections live in the `gr8r` database. `_id` is a string (domain id). Timestamps are epoch millis.

### 3.1 Workspaces (organizations)

```js
// collection: workspaces
{
  _id: String,            // w_<uuid>
  name: String (required),
  slug: String (unique, indexed),
  color: String,          // #RRGGBB
  ownerId: String,        // member id
  plan: String,           // 'free' | 'pro' (future)
  createdAt: Number,
  updatedAt: Number,
}
indexes: { slug: 1 } unique, { ownerId: 1 }
```

### 3.2 Members

```js
// collection: members (existing, extended)
{
  _id: String,            // m_<uuid>
  workspaceId: String (required, indexed),
  name: String (required),
  email: String (required, indexed),
  role: String (enum: owner|admin|member|guest),
  title: String,
  teamId: String | null,
  color: String,
  status: String (active|invited|disabled),
  timezone: String,
  lastSeenAt: Number | null,
  clerkUserId: String | null (indexed, sparse),
  preferences: {          // embedded preferencesSchema
    theme, accent, density, weekStart, dateFormat,
    language, timezone, motion, homeRoute
  },
  createdAt: Number,
  updatedAt: Number,
}
indexes: { workspaceId: 1, role: 1 }, { workspaceId: 1, email: 1 } unique,
         { clerkUserId: 1 } sparse unique
```

### 3.3 Teams

```js
// collection: teams (NEW)
{
  _id: String,            // team_<uuid>
  workspaceId: String (required, indexed),
  name: String (required),
  icon: String,
  color: String,
  description: String,
  leadId: String | null,
  memberIds: [String],
  createdAt: Number,
  updatedAt: Number,
}
indexes: { workspaceId: 1 }
```

### 3.4 Projects

```js
// collection: projects (existing)
{
  _id, workspaceId (indexed), key (unique per workspace), name,
  icon, color, status (indexed), teamId, leadId,
  startDate, dueDate, favorite, memberIds: [String],
  description (html), milestones: [{ name, date }],
  archivedAt (indexed), updatedAt
}
indexes: { workspaceId: 1, archivedAt: 1 }, { workspaceId: 1, key: 1 } unique
```

### 3.5 Tasks

```js
// collection: tasks (existing)
{
  _id, workspaceId (indexed), projectId (indexed), key (unique per project),
  title (text index), status (indexed), assigneeId (indexed),
  priority, startDate, dueDate (indexed), labels: [String],
  subtasks: [{ id, title, done }],
  attachments: [{ id, name, type, size, uploadedBy, at }],
  dependencyIds: [String],
  description (html), estimate, order, favorite, recurrence,
  createdAt, updatedAt, completedAt
}
indexes: { workspaceId: 1, projectId: 1, status: 1 },
         { workspaceId: 1, assigneeId: 1, dueDate: 1 },
         { title: 'text' }
```

### 3.6 Comments

```js
// collection: comments (NEW)
{
  _id: String,            // c_<uuid>
  workspaceId: String (required, indexed),
  taskId: String (required, indexed),
  authorId: String (required),
  body: String (max 4000),
  reactions: { [emoji]: [memberId] },
  createdAt: Number,
  editedAt: Number | null,
}
indexes: { taskId: 1, createdAt: -1 }
```

### 3.7 Files

```js
// collection: files (NEW) — metadata only; bytes in R2
{
  _id: String,            // f_<uuid>
  workspaceId: String (required, indexed),
  projectId: String (required, indexed),
  taskId: String | null (indexed),
  name: String (required),
  type: String (enum: fig|pdf|doc|sheet|img|zip|code|other),
  size: String,           // human readable
  sizeBytes: Number,
  mimeType: String,
  r2Key: String (required),   // object key in R2 bucket
  r2Bucket: String,
  uploadedBy: String (required),
  at: Number (indexed),
}
indexes: { projectId: 1, at: -1 }, { taskId: 1 }
```

R2 layout: `gr8r-files/{workspaceId}/{projectId}/{fileId}-{sanitizedName}`.

### 3.8 Calendar events

```js
// collection: events (NEW)
{
  _id: String,            // ev_<uuid>
  workspaceId: String (required, indexed),
  projectId: String | null (indexed),
  title: String (required),
  date: String (YYYY-MM-DD, indexed),
  time: String (HH:MM),
  createdAt: Number,
  createdBy: String,
}
indexes: { workspaceId: 1, date: 1 }
```

### 3.9 Saved views

```js
// collection: saved_views (NEW)
{
  _id: String,            // v_<uuid>
  workspaceId: String (required, indexed),
  ownerId: String (required),
  projectId: String | null,
  name: String (required),
  type: String (list|board|table|calendar|timeline),
  filters: [{ field, operator, values }],
  sort: { field, direction },
  group: String,
  query: String,
  hiddenColumns: [String],
  createdAt: Number,
  updatedAt: Number,
}
indexes: { workspaceId: 1, ownerId: 1 }
```

### 3.10 Activity (existing)

```js
// collection: activities (existing)
{ _id, workspaceId (indexed), actorId, verb, taskId, projectId, detail, at (indexed) }
indexes: { workspaceId: 1, at: -1 }
```

### 3.11 Notifications

```js
// collection: notifications (NEW)
{
  _id: String,            // n_<uuid>
  workspaceId: String (required, indexed),
  userId: String (required, indexed),   // recipient member id
  type: String (mention|assign|comment|update),
  actorId: String | null,
  taskId: String | null,
  projectId: String | null,
  text: String (max 200),
  snippet: String (max 400),
  read: Boolean (default false, indexed),
  channel: String (inapp|email|both),
  emailedAt: Number | null,
  at: Number (indexed),
}
indexes: { userId: 1, read: 1, at: -1 }, { workspaceId: 1, at: -1 }
```

### 3.12 Invitations (existing)

```js
// collection: invitations (existing)
{ _id, workspaceId (indexed), email, role, token (indexed, unique), invitedBy,
  expiresAt, acceptedAt, createdAt }
indexes: { workspaceId: 1, email: 1 }, { token: 1 } unique
```

---

## 4. Backend integration plan

### Phase B0 — Foundation (members, teams, workspaces, permissions)

1. **Member service** (`modules/members/member-service.ts` + routes):
   - `GET /members` (exists via workspace), `PATCH /members/:id` (name, title, teamId, timezone, color, preferences), `PATCH /members/:id/role` (require `role:manage`), `DELETE /members/:id` (soft-disable: status=disabled, require `role:manage`).
   - Update `MemberRepository` interface + memory/mongo adapters.
   - Mongo: add `updatedAt` to MemberModel (currently missing).
2. **Team service** (`modules/teams/*`):
   - CRUD routes: `GET /teams`, `POST /teams`, `PATCH /teams/:id`, `DELETE /teams/:id`.
   - Repository port + memory/mongo adapters + Mongo model.
3. **Workspace service**:
   - `PATCH /workspaces/:id` (name, slug, color) require `workspace:manage`.
   - `POST /workspaces` (create org) — multi-tenant bootstrap.
4. **Permission seeding on provision**: when Clerk provisions a member, set role `owner` if first member of workspace, else `member`; set name/email from Clerk user.
5. **Tests**: route-level tests for member/team/workspace CRUD (memory adapter).

### Phase B1 — Comments + Notifications (core collaboration)

1. **Comments module** (`modules/comments/*`):
   - `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`, `PATCH /comments/:id`, `DELETE /comments/:id`.
   - Repository port + memory/mongo adapters + Mongo model.
   - On create: record activity (verb `commented`) + enqueue notification to assignee + watchers.
2. **Notifications module** (`modules/notifications/*`):
   - `GET /notifications?unread=true`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`.
   - Repository port + memory/mongo adapters + Mongo model.
   - Notification factory: `notify(repositories, { userId, type, actorId, taskId, projectId, text, snippet, channel })`.
3. **Notification delivery layer** (`shared/notifications/`):
   - In-app: append to `notifications` collection (polled by frontend or pushed via SSE).
   - Email: Nodemailer transporter configured via env (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Template per type. Send async, record `emailedAt`.
   - Browser push: Web Push (VAPID keys) optional; store subscription per member. Defer to later phase.
4. **Triggers**: task assigned → notify assignee; comment → notify task assignee + participants; mention (@name) → notify; project archived → notify members.

### Phase B2 — Files (Cloudflare R2)

1. **R2 client** (`shared/storage/r2.ts`): S3-compatible client using `@aws-sdk/client-s3` with R2 endpoint + credentials from env (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`).
2. **Files module** (`modules/files/*`):
   - `POST /files/presign` → returns `{ uploadUrl, fileKey, fileId }` (presigned PUT, 15 min TTL).
   - `POST /files` → confirm upload, store metadata (size from HEAD), record activity.
   - `GET /files?projectId=&taskId=` → list.
   - `GET /files/:id/download` → presigned GET (15 min).
   - `DELETE /files/:id` → delete object in R2 + metadata.
3. **Frontend**: dropzone calls presign → PUT bytes to R2 → confirm. Show progress via XHR.
4. **Limits**: 250 MB per file (matches UI copy); allowed MIME types allowlist.

### Phase B3 — Calendar events + Saved views

1. **Events module** (`modules/events/*`): CRUD `GET/POST/PATCH/DELETE /events`.
2. **Saved views module** (`modules/views/*`): CRUD for `savedViewSchema`.
3. Frontend: calendar reads events from API; view toolbar persists saved views.

### Phase B4 — Search

1. `GET /search?q=&types=tasks,projects,members,files` → aggregate across collections using Mongo `$text` + regex fallback.
2. Frontend command palette (`⌘K`) calls it.

### Phase B5 — Real-time (optional, later)

1. SSE endpoint `GET /events/stream` (workspace-scoped) emitting activity + notification + task-change events.
2. Frontend subscribes and invalidates React Query caches.

### Phase B6 — Hardening

1. Rate limiting (per IP + per member) via middleware.
2. Request size limits, file type validation, virus scan hook (optional).
3. Audit log for permission-sensitive actions.
4. Integration tests against Mongo (env-gated, already scaffolded).
5. OpenAPI spec generation from Zod (optional).

---

## 5. Frontend integration plan (after backend phases)

For each screen, wire the existing buttons to the endpoints above. Checklist:

### Tasks
- [ ] Row: click title → task detail drawer; checkbox → PATCH status done; context menu → edit/delete.
- [ ] Status/assignee/priority/due pills → open popovers (real portal) → PATCH on change.
- [ ] "New task" modal → TaskForm (already creates).
- [ ] TaskTable group by status (already).
- [ ] Comments in task detail.

### Projects
- [ ] "New project" → modal with ProjectForm → POST.
- [ ] Card click → project detail (board view).
- [ ] Edit/archive via context menu.

### Board
- [ ] Drag end → PATCH status (already wired).
- [ ] "Add task" in column → composer with status (TaskForm supports defaultStatus now).
- [ ] Card click → task detail.

### Table
- [ ] Cell click → inline edit (title, estimate) → PATCH.
- [ ] Column header → sort.

### Calendar
- [ ] "Add task" → modal with due date preset.
- [ ] Event create (double-click day) → modal.
- [ ] Drag task chip between days → PATCH dueDate.

### Timeline
- [ ] Bar click → task detail.
- [ ] Drag bar edges → PATCH startDate/dueDate (defer).

### Members
- [ ] Invite form → POST /invitations.
- [ ] Role change → PATCH /members/:id/role (portal popover).
- [ ] Deactivate → DELETE/PATCH status.

### Settings
- [ ] Workspace name/slug/color → PATCH /workspaces/:id (debounced).
- [ ] Appearance → persist preferences (PATCH member preferences).
- [ ] Profile → PATCH member name/title/timezone.
- [ ] Remove "Language" and "Date & time" tabs (done in UI).

### Files
- [ ] Dropzone + upload button → presign → PUT → confirm.
- [ ] Grid/list toggle, search, filter, sort (client-side over loaded list).
- [ ] Preview/download via presigned GET.

### Notifications
- [ ] Mark read / mark all read → PATCH.
- [ ] Click notification → navigate to task/project.

### Popups (real portals)
- [ ] Convert `Modal` to `createPortal` (done).
- [ ] Add `Popover` (portal + click-outside + escape) reusing `.pop` CSS.
- [ ] Add `Drawer` (portal) reusing `.drawer` CSS.
- [ ] All popovers (filter, sort, group, priority, status, assignee, date, labels, member options, column options, ctx menu) use these primitives.

### Sidebar 100% height
- [x] Fixed `#app` → `#root` selector in shell.css so the grid gets full viewport height.

---

## 6. Environment variables (add to .env)

```
# API
MONGODB_URI=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
VAPID_PUBLIC_KEY=        # optional, browser push
VAPID_PRIVATE_KEY=       # optional

# Web
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=
```

---

## 7. Recommended execution order

1. **B0** (members/teams/workspaces) — unblocks settings + members screens.
2. **B1** (comments + notifications) — unblocks collaboration + notification screen.
3. **B2** (files + R2) — unblocks files screen.
4. **B3** (events + saved views) — unblocks calendar/timeline persistence.
5. **B4** (search) — unblocks command palette.
6. Frontend wiring pass (screen by screen, following section 5 checklist).
7. **B6** (hardening) before release.
8. Tauri release build.

Each backend phase ships with: Zod schemas (already mostly exist), repository port + memory + Mongo adapters, service, routes, tests (memory adapter), and Mongo integration test (env-gated).
