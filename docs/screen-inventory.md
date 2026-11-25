# Screen inventory

Baseline for the port. Every screen here must reach visual parity before its feature slice closes.
Counts: 21 routes, 8 project tabs, 6 overlays, 7 auth states.

## Routes

| Route           | Module                   | Purpose                                                  |
| --------------- | ------------------------ | -------------------------------------------------------- |
| `home`          | `pages/home.js`          | Dashboard: upcoming work, activity, per-project progress |
| `inbox`         | `pages/inbox.js`         | Notification inbox with categories and unread filter     |
| `mytasks`       | `pages/my-tasks.js`      | Tasks assigned to the current user, list/board toggle    |
| `favorites`     | `pages/favorites.js`     | Starred projects and tasks                               |
| `notifications` | `pages/notifications.js` | Full notification list with filters                      |
| `search`        | `pages/search.js`        | Global search across projects, tasks, members, files     |
| `overview`      | `pages/overview.js`      | Workspace-level metrics                                  |
| `projects`      | `pages/projects.js`      | Project grid/list, create and archive                    |
| `project`       | `pages/project.js`       | Project shell with 8 tabs (below)                        |
| `tasks`         | `pages/tasks.js`         | Workspace task list with filter/sort/group               |
| `calendar`      | `pages/calendar.js`      | Workspace calendar                                       |
| `timeline`      | `pages/timeline.js`      | Workspace timeline                                       |
| `members`       | `pages/members.js`       | Member list, roles, permission matrix                    |
| `member`        | `pages/members.js`       | Member detail                                            |
| `teams`         | `pages/members.js`       | Team grid                                                |
| `team`          | `pages/members.js`       | Team detail                                              |
| `activity`      | `pages/activity.js`      | Workspace activity feed                                  |
| `settings`      | `pages/settings.js`      | 5 groups / 19 sections                                   |
| `system`        | `pages/design-system.js` | Design tokens and component gallery                      |
| `states`        | `pages/errors.js`        | Empty, loading, error and 404 states                     |
| `archive`       | `features/archive.js`    | Archived projects and tasks                              |

## Project tabs

`overview`, `board`, `list`, `table`, `calendar`, `timeline`, `files`, `activity`, plus saved views
(`v:<id>`) rendered as extra tabs.

## Overlays

| Overlay         | Module                     | Behaviour                                               |
| --------------- | -------------------------- | ------------------------------------------------------- |
| Task drawer     | `overlays/drawer.js`       | Comments, subtasks, files, activity; full-screen toggle |
| Command palette | `overlays/palette.js`      | Commands, navigation, workspace switch                  |
| Modals          | `overlays/modals.js`       | Task/project forms, confirmations, shortcuts            |
| Popovers        | `overlays/popovers.js`     | Filters, sort, group, columns, workspaces, roles        |
| Context menu    | `overlays/context-menu.js` | Task, column, project, member actions                   |
| Toasts          | `ui/toast.js`              | Transient feedback                                      |

## Auth states

Replaced wholesale by Clerk in Phase 6. Frozen now: they are the visual reference for the
Clerk appearance configuration, and the app must stay usable while the port is in progress.

| State                    | Notes                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `login`                  | Email + password, remember me, three social buttons              |
| `signup`                 | Name, email, password with strength meter, social buttons        |
| `forgot` / `forgot-sent` | Request reset, confirmation                                      |
| `reset`                  | New password                                                     |
| `verify`                 | Email verification                                               |
| `onboarding`             | Workspace, use case, team style, size, project template, invites |

## Shared UI to extract first

These are used by every route above and define the visual language:

- `ui/helpers.js` — avatars, priority/status icons, project icons
- `core/icons.js` — Lucide subset plus brand mark
- `ui/select.js` — native select enhanced into a design-system menu
- `shell/skeletons.js` — loading placeholders per route
- `styles/tokens.css` — colours, spacing, type, radius, the shared `--gutter`
