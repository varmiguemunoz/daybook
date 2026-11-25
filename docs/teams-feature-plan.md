# Teams Feature — Plan

## 0. Goal

Make the "Teams" tab in Members fully functional: clicking a team opens a popup showing its
description, roster, and name; allows editing all fields, adding/removing members, and deleting
the team. Backend + DB + frontend wired end-to-end.

## 1. Current state

### Backend (already exists)
- `teamSchema` (domain) — id, workspaceId, name, icon, color, description, (no leadId in schema currently).
- `TeamRepository` port + memory + mongo adapters + `TeamModel`.
- `team-service.ts`: list, get, create, update, delete.
- `team-routes.ts`: GET/POST/PATCH/DELETE /teams.
- Permissions: `workspace:manage` required for write.

### Frontend (read-only)
- `TeamsGrid` groups members by `teamId` and renders cards.
- `MembersPage` teams tab renders `TeamsGrid` + "New team" modal.
- No detail/edit popup. No add/remove member. No delete.

### Gaps
- No dedicated add/remove member endpoints (could reuse PATCH member, but dedicated is cleaner and keeps team.memberIds in sync).
- No cascade on team delete (members keep stale teamId).
- No edit popup UI.
- `teamSchema` lacks `leadId` and `memberIds` is not in domain schema (only in Mongo model). Need to add `memberIds` and `leadId` to domain for consistency.

## 2. DB schema changes

### teams collection (extend domain teamSchema)
```js
{
  _id: String,            // team_<uuid>
  workspaceId: String (required, indexed),
  name: String (required),
  icon: String,
  color: String,
  description: String (default ''),
  leadId: String | null (default null),
  memberIds: [String] (default []),
  createdAt: Number,
  updatedAt: Number,
}
indexes: { workspaceId: 1 }
```

Domain changes:
- Add `leadId: idSchema.nullable().default(null)` and `memberIds: z.array(idSchema).default([])` and `createdAt/updatedAt` to `teamSchema`.
- Update `createTeamInputSchema` / `updateTeamInputSchema` (omit id/workspaceId; include new fields).

## 3. Backend additions

### 3.1 New endpoints
- `POST /teams/:id/members` body `{ memberId }` → add member to team (set member.teamId, append to team.memberIds). Require `workspace:manage`.
- `DELETE /teams/:id/members/:memberId` → remove member from team (set member.teamId=null, remove from team.memberIds). Require `workspace:manage`.

### 3.2 Cascade on delete
- `deleteTeam`: before removing, set `teamId=null` for all members whose teamId === id.

### 3.3 Service functions
- `addMemberToTeam(repositories, teamId, memberId)`
- `removeMemberFromTeam(repositories, teamId, memberId)`
- Update `deleteTeam` to cascade.

### 3.4 Repository
- Already has update/remove. No new repo methods needed (use memberRepository.update + teamRepository.update).

### 3.5 Routes
- Add the two new routes to `team-routes.ts`.

## 4. Frontend

### 4.1 Team popup (Drawer or Modal)
Reuse `Drawer` (portal, `.drawer` CSS). Contents:
- Name input (editable).
- Icon + color pickers.
- Description textarea.
- Lead select (member).
- Roster list with remove button per member.
- "Add member" select + button.
- Save button (PATCH /teams/:id + PATCH members).
- Delete team button (DELETE /teams/:id) with ConfirmDialog.

### 4.2 TeamsGrid
- Click card → open TeamDrawer with that team.
- Pass `onOpen(team)` callback.

### 4.3 MembersPage teams tab
- Render `TeamsGrid` + `TeamDrawer` (selected team state).
- Keep "New team" modal.

### 4.4 Data
- `useTeams()` already exists.
- Add `useAddTeamMember(teamId)`, `useRemoveTeamMember(teamId, memberId)` mutations.
- `useDeleteTeam` exists.

## 5. Execution order

1. Domain: extend `teamSchema` (leadId, memberIds, timestamps).
2. Backend: service functions (add/remove/cascade) + routes.
3. Typecheck + tests.
4. Frontend: `TeamDrawer` component + wire `TeamsGrid` click + `MembersPage`.
5. Typecheck + lint + build + smoke test.

## 6. Notes
- No commits until user reviews.
- Keep components ≤ 40 lines / files ≤ 200 lines / complexity ≤ 10.
- Artifacts in English.
EOF
echo done