# Gr8r Studio — Frontend Integration Plan

## 0. Goal

Wire the ported React UI to the now-complete backend so every create/edit/delete action works,
with optimistic updates, real popovers (portals), and live refresh via SSE.

## 1. Foundation (F0)

### 1.1 Mutation hooks (`apps/web/src/shared/api/mutations.ts` or per-feature)

Add `useMutation` wrappers for every endpoint, invalidating the right query keys on success:

- Tasks: `useCreateTask` (exists), `useUpdateTask(id)`, `useDeleteTask(id)`, `useMoveTaskStatus`.
- Projects: `useCreateProject`, `useUpdateProject(id)`, `useArchiveProject(id)`.
- Members: `useUpdateMember(id)`, `useChangeRole(id)`, `useDeactivateMember(id)`.
- Teams: `useCreateTeam`, `useUpdateTeam(id)`, `useDeleteTeam(id)`.
- Workspaces: `useUpdateWorkspace(id)`.
- Comments: `useCreateComment(taskId)`, `useUpdateComment(id)`, `useDeleteComment(id)`, `useToggleReaction(commentId)`.
- Events: `useCreateEvent`, `useUpdateEvent(id)`, `useDeleteEvent(id)`.
- Files: `usePresignUpload`, `useConfirmUpload`, `useDeleteFile(id)`.
- Views: `useCreateView`, `useUpdateView(id)`, `useDeleteView(id)`.
- Notifications: `useMarkRead(id)`, `useMarkAllRead`.
- Invitations: `useCreateInvitation`.

### 1.2 Shared primitives

- `Toast` (portal + auto-dismiss) for success/error feedback.
- `ConfirmDialog` (portal) for destructive actions.
- `Popover` (portal + click-outside + Esc) reusing `.pop`/`.popover` CSS.
- `Drawer` (portal) reusing `.drawer` CSS.
- `useSSE(workspaceId)` hook: EventSource on `/api/events/stream`, invalidates query keys on events.

### 1.3 Query keys

Extend `queryKeys` with comments, events, files, views, notifications, teams.

## 2. Screen-by-screen wiring (F1)

### Tasks (TasksPage, TaskTable, TaskRow)
- "New task" modal → `useCreateTask` (already works).
- Row checkbox → `useUpdateTask` status=done.
- Title click → open TaskDrawer (edit form).
- Status pill → Popover with status options → PATCH.
- Assignee pill → Popover with member list → PATCH assigneeId.
- Priority pill → Popover → PATCH priority.
- Due pill → date picker Popover → PATCH dueDate.
- Labels → Popover → PATCH labels.
- Context menu (ellipsis) → edit/delete/duplicate.
- Delete → ConfirmDialog → `useDeleteTask`.
- TaskDrawer: edit title/status/priority/due/assignee/labels/description → PATCH; comments list + composer → `useCreateComment`; reactions → `useToggleReaction`; attachments → file upload flow.

### Projects (ProjectsPage, ProjectCard)
- "New project" → modal with form → `useCreateProject`.
- Card click → navigate to project board view (or open drawer).
- Context menu → edit/archive/delete.
- Archive → `useArchiveProject`.

### Board (BoardPage, Board, BoardCard)
- Drag end → `useUpdateTask` (status) — already wired, verify.
- "Add task" in column → composer with defaultStatus (TaskForm supports it now).
- Card click → TaskDrawer.
- Card context menu → edit/delete.

### Table (TablePage, Table)
- Cell click (title) → inline edit → PATCH on blur.
- Column header → sort (client-side via view-model, already).
- Group select → re-group (already).

### Calendar (CalendarPage)
- "Add task" button → modal with due date preset.
- Double-click day → create event modal → `useCreateEvent`.
- Event chip click → edit/delete event.
- Drag task chip between days → PATCH dueDate (defer if complex).

### Timeline (TimelinePage)
- Bar click → TaskDrawer.
- (Drag resize deferred.)

### Members (MembersPage, MembersTable, MembersHeader)
- Invite form → `useCreateInvitation` + toast.
- Role cell → Popover → `useChangeRole`.
- Team cell → Popover → `useUpdateMember` (teamId).
- Deactivate → ConfirmDialog → `useDeactivateMember`.
- Teams tab → `useTeams` + create/edit/delete team.

### Settings (SettingsPage, SettingsNav, SettingsBody)
- Workspace name/slug/color → debounced `useUpdateWorkspace`.
- Appearance (theme/density) → persist via `useUpdateMember` (preferences).
- Profile (name/title/timezone) → `useUpdateMember`.

### Files (FilesPage)
- Dropzone + upload button → presign → PUT to R2 (or local dev) → confirm → `useConfirmUpload`.
- Grid/list toggle, search, filter, sort (client-side).
- Card click → download (presigned GET).
- Context menu → delete.

### Notifications (NotificationsPage)
- Mark read → `useMarkRead`.
- Mark all read → `useMarkAllRead`.
- Click row → navigate to task/project.

### Activity (ActivityPage)
- Read-only; filters already client-side. Add "load more" pagination (optional).

### Home (HomePage)
- Stat cards → navigate to relevant views.
- My tasks panel rows → TaskDrawer.
- Project progress rows → project view.

## 3. Real-time (F2)

- `useSSE` hook subscribes to `/api/events/stream`.
- On `task.*` events → invalidate `['tasks']`.
- On `comment.created` → invalidate comments query.
- On `notification` events → invalidate notifications + show toast.
- Heartbeat keeps connection alive; reconnect on close.

## 4. Error handling & UX (F3)

- Toast on mutation success/error.
- Optimistic updates where cheap (status toggle, read toggle).
- Disable buttons while pending.
- Form validation feedback (Zod issues from 422).

## 5. Execution order (recommended)

1. F0.1 mutation hooks + query keys (foundation).
2. F0.2 Popover/Toast/ConfirmDialog/Drawer primitives.
3. F1 Tasks (highest value, most interactions).
4. F1 Projects + Board.
5. F1 Members + Settings.
6. F1 Files.
7. F1 Calendar + Timeline.
8. F1 Notifications + Activity + Home wiring.
9. F2 SSE.
10. F3 polish + optimistic updates.

## 6. Definition of done (per screen)

- Every visible button has a working handler.
- Create/edit/delete round-trips to backend and refreshes the list.
- Popovers use real portals reusing legacy CSS (`.pop`, `.popover`, `.drawer`, `.modal`).
- No console errors; lint + typecheck clean; build passes.

## 7. Notes

- Do NOT commit until user reviews (per user instruction).
- Keep components ≤ 40 lines / files ≤ 200 lines / complexity ≤ 10 (ESLint).
- Artifacts in English.
