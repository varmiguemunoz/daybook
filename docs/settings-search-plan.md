# Settings, global search and Home plan

Status: implemented.

## 1. Audit

| #   | Area             | Problem                                                                                                                                                      |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Appearance       | The theme only lives in the zustand store: nothing sets `data-theme` on `<html>`, so picking Light/Dark changes nothing. Dark comes from the OS media query. |
| 2   | Appearance       | The `useEffect` that saves preferences depends on the mutation object, which changes every render: it keeps sending `PATCH /api/members/:id` in a loop.      |
| 3   | Members          | `.set-body` caps content at 720px and the table has `minWidth: 880`, so it scrolls sideways and the member column is cut.                                    |
| 4   | Members          | Team column prints raw ids (`TEAM_NAMES` is a hardcoded map of demo teams).                                                                                  |
| 5   | Members          | Removing someone only leaves Clerk; the webhook marks the row `disabled`, so the person stays in lists and assignee menus.                                   |
| 6   | Teams (Settings) | `SettingsBody` renders `<TeamsGrid teams={[]} onOpen={() => {}} />`: always empty, no actions. The working version lives only on `/members`.                 |
| 7   | Teams            | `TeamDrawerBody` calls `useTeamActions` after an early `return` (hook order bug); membership is stored twice (`team.memberIds` and `member.teamId`).         |
| 8   | Topbar           | Search opens a stub palette with 3 fixed links, no input, classes that do not exist, and no ⌘K shortcut. "+ New" duplicates every page button.               |
| 9   | Home             | "My tasks" checkboxes are uncontrolled (`defaultChecked`) with no handler; the panel reads `bootstrap.tasks`, a different cache from the task screens.       |
| 10  | Profile          | Fields are initialised once from `me`; when Settings mounts before `bootstrap` resolves they stay empty (your screenshot: empty name, role "—").             |

## 2. Target design

### Appearance

- Two options: Light (default) and Dark. "System" is removed from the store, the cards and `tokens.css` (the `prefers-color-scheme` block goes away; dark stays in `[data-theme='dark']`).
- The store applies `document.documentElement.dataset.theme` on load and on change, and persists the choice (decision 1). No API call, so the loop disappears.

### Members

- Members and Teams sections use the full width of the settings content (`.set-body` wide variant); the table uses `width: 100%` without `minWidth`, columns: Member, Role, Teams, Tasks, Status, actions.
- Team names come from `useTeams()`.
- `DELETE /api/members/:id` (admin, not yourself, not the last admin): removes the Clerk organization membership through the Backend API, deletes the member row, unassigns their tasks and removes them from teams, in one place. The webhook for `organizationMembership.deleted` calls the same cleanup, so removing someone from the Clerk dashboard gives the same result.
- The row action becomes "Remove from workspace" with a confirm dialog.

### Teams

- One `TeamsManager` (grid + "New team" + drawer) used by Settings and by `/members`.
- Drawer: edit name, icon, color, description; roster with add/remove; delete with confirm. Hook order fixed.
- `team.memberIds` is the only source of truth; `member.teamId` is removed from domain, API and UI (decision 3).

### Global search (topbar + ⌘K / Ctrl+K)

- `CommandPalette` rebuilt on the existing `Modal`: one input, results grouped as Pages, Tasks, Members, Teams; arrow keys + Enter; Esc closes.
- Pages and settings sections are filtered locally; tasks, members and teams come from `GET /api/search?q=` (teams added to the endpoint), debounced through TanStack Query.
- Enter on a task opens the task drawer, on a member goes to Settings → Members, on a team opens its drawer, on a page navigates.
- "+ New" is removed from the topbar.

### Home "My tasks"

- The panel reads from `useTasks()` (the same cache as the task screens) and the checkbox is controlled: checked → `done`, unchecked → `todo`, through the optimistic `useUpdateTask`. The task moves to the Completed tab at once and rolls back with a toast if the API fails. Clicking the row opens the task drawer.

### Profile

- The section waits for `me` and keys the form by `me.id`, so the fields always start filled.

## 3. Steps

1. API: `DELETE /api/members/:id` + shared cleanup used by the webhook; teams in search; drop `member.teamId`.
2. Theme store and `tokens.css`.
3. Members table and full-width settings layout.
4. `TeamsManager` and drawer fix, used in Settings and `/members`.
5. Command palette and topbar.
6. Home checkbox and Profile fix.
7. Verify: typecheck, lint, build, API smoke for delete/search, manual checklist per item.

## 4. Decisions (confirmed)

1. Theme saved in the profile (`member.preferences.theme`), so it follows the user to every device.
2. Removing a member deletes them: tasks become unassigned and they leave every team.
3. A person can belong to several teams; `member.teamId` is gone.
4. `/members` stays and renders the same `MembersSection` and `TeamsManager` as Settings.

## 5. Found during implementation

`updateMemberInputSchema` had the same Zod 4 problem as tasks: a `PATCH` with only `preferences` reset `title` and `timezone` to their defaults. Fixed with a schema without defaults, and preferences are merged on the server.
