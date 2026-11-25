# Task views plan (Tasks, Board, Table, Calendar)

Status: implemented.
Goal: create, edit and delete tasks from every task screen through one shared implementation, with search, filters and bulk actions wired to the API.

## 1. Audit

| #   | Where                        | Problem                                                                                                                                          |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `TablePage` header button    | `onClick={() => undefined}`                                                                                                                      |
| 2   | `CalendarPage`, `HomePage`   | Composer only renders when `projectId` is truthy, and it is hardcoded to `undefined` / `null`                                                    |
| 3   | `BoardPage`                  | No header button; column `+` and "Add task" call `onAdd={() => undefined}`                                                                       |
| 4   | Topbar "New"                 | Button without handler                                                                                                                           |
| 5   | `TaskForm`                   | Modal never closes on success, errors are unhandled promise rejections, no feedback                                                              |
| 6   | Every page                   | Each page owns its own modal, drawer and raw `apiFetch` mutations (3 different delete/move code paths)                                           |
| 7   | `TaskDrawer`                 | Edits a stale snapshot of the task; form state is not reset when another task opens; no delete                                                   |
| 8   | `BoardPage` drag             | Errors swallowed (`.catch(() => undefined)`); card jumps back until the refetch lands                                                            |
| 9   | List, Table, Board, Calendar | Dead controls: Filter, checkboxes, row pills, group collapse, group "+", "Add task" rows, card quick actions, calendar day "+", chips, "+N more" |
| 10  | API                          | No bulk endpoint; `assigneeId` is not checked against the workspace                                                                              |
| 11  | `useTasks(filters)`          | Filter-dependent query keys nobody uses; one list query is enough (filters run client side)                                                      |

## 2. Target design

One task list query, one set of mutations, one composer, one drawer. Pages only compose.

```
features/tasks/
  queries.ts               useTasks, useCreateTask, useUpdateTask, useDeleteTasks (+ bulk update)
  task-ui-store.ts         zustand: composer { open, defaults } and drawer { taskId }
  use-task-form.ts         form state + validation + submit for create and edit
  use-task-selection.ts    selected ids, toggle, toggle all visible, clear
  use-task-view.ts         search + filters over the cached list, members map
  components/
    TaskComposer.tsx       modal, mounted once in Shell
    TaskDrawer.tsx         drawer by task id, mounted once in Shell, edit + delete
    TaskFields.tsx         title, status, priority, assignee, due date (create and edit)
    TaskMenus.tsx          status / priority / assignee popover menus reused by rows, table cells and cards
    TaskActionsMenu.tsx    "Open", "Delete" with ConfirmDialog
    BulkActionsBar.tsx     "N selected", change status, delete selected
    TaskFilters.tsx        Filter popover: status, priority, assignee
```

Anything that creates a task calls `openComposer({ status?, dueDate? })`; anything that opens a task calls `openTask(id)`. The drawer reads the task from the query cache by id, so it is always fresh and resets when the id changes.

### Mutations (TanStack Query)

- Single key `['tasks']` for the list.
- `useUpdateTask` and `useDeleteTasks`: optimistic update of the cached list in `onMutate`, rollback in `onError` with a toast, `invalidateQueries` in `onSettled`. Drag on the board and inline menus feel instant and never get stuck in a wrong state.
- `useCreateTask`: no optimistic insert (the server derives `key` and `order`); invalidate on success, close the composer, toast.
- Mutation ids go in the variables (`mutate({ id, patch })`), not in the hook argument, so one hook instance serves any task.
- SSE keeps invalidating `['tasks']` for changes made by other members.

### API

- `DELETE /api/tasks` with `{ ids }` (max 200), scoped to the workspace, `task:write`, one activity entry per task, returns `{ deleted }`.
- `PATCH /api/tasks` with `{ ids, patch }` for bulk status change (decision 2).
- `assigneeId` must belong to the workspace on create and update (422 otherwise).

## 3. Per screen

| Screen   | Create                                               | Edit                                                     | Delete                 | Search / filter  | Bulk                    |
| -------- | ---------------------------------------------------- | -------------------------------------------------------- | ---------------------- | ---------------- | ----------------------- |
| Tasks    | Header, group "+", "Add task" row (status preset)    | Row opens drawer; pills open menus; group collapse works | Row menu, drawer, bulk | Yes              | Checkboxes + select all |
| Board    | Header (new), column "+", "Add card" (status preset) | Card opens drawer; drag changes status; complete toggle  | Card menu, drawer      | Yes              | No                      |
| Table    | Header, "New task" row                               | Row opens drawer; cells open menus                       | Row menu, drawer, bulk | Yes + sort/group | Checkbox column         |
| Calendar | Header, day "+" (due date preset)                    | Chip opens drawer; "+N more" lists the day's tasks       | Drawer                 | Yes              | No                      |

Topbar "New" and Home "New task" also open the composer.

## 4. Steps

1. API: bulk delete, bulk status, assignee check.
2. Queries and stores: `queries.ts`, `task-ui-store.ts`, mount `TaskComposer` and `TaskDrawer` in `Shell`.
3. Shared components: `TaskFields`, `TaskMenus`, `TaskActionsMenu`, `TaskFilters`, `BulkActionsBar` (Impeccable for every UI piece).
4. Wire the four pages, Topbar and Home; remove per-page modals, drawers and raw `apiFetch` calls; remove dead controls that stay out of scope.
5. Verify: typecheck, lint, build, and a manual run per screen: create, edit each field, drag, delete one, bulk delete, bulk status, search, filters, a second browser tab receiving updates through SSE, API failure (rollback + toast).

## 5. Decisions (confirmed)

1. Inline menus for status, priority, assignee and due date. Opening a task, editing every field and deleting happen in the drawer.
2. Bulk actions in Tasks and Table: delete, status, priority and assignee.
3. Calendar drag to reschedule with dnd-kit, the same library as the board.
4. Filters by status, priority and assignee in all four screens, kept per screen while navigating, not persisted.

## 6. Found during implementation

`updateTaskInputSchema` was a `.partial()` of the create schema, so Zod 4 applied the create defaults to every missing key: any `PATCH` (a board drag, for example) reset priority, assignee, dates, labels and description. The update schema is now built from fields without defaults.
