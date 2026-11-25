# Auth & security plan

Status: implemented (phases 1 to 4). Phase 0 is manual Clerk dashboard setup.
Scope: Clerk auth, organizations, route protection, API tenant isolation, desktop shell hardening.

## 1. Audit of the current state

| #   | Where                                               | Problem                                                                                | Severity |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| 1   | `api/http/actor.ts`                                 | `x-member-id` header with fallback `m1`: any request without session acts as the owner | Critical |
| 2   | `api/http/context.ts`                               | Any Clerk error is swallowed and falls back to the header                              | Critical |
| 3   | `api/app.ts`                                        | Clerk is skipped on Node >= 26 and the API keeps serving with header auth (fail-open)  | Critical |
| 4   | `api/http/context.ts` `provisionMember`             | Every signed-in Clerk user becomes `owner` of the first workspace                      | Critical |
| 5   | `context.ts`, `clerk-routes.ts`                     | `workspaces.findFirst()`: single tenant, no organization concept                       | High     |
| 6   | `app.ts`, `workspace-routes.ts`                     | `PATCH /api/:id` and `PATCH /api/workspaces/:id` update any workspace id               | High     |
| 7   | `task-routes.ts` `GET /:id` and other by-id lookups | Not scoped by workspace (IDOR)                                                         | High     |
| 8   | `webhooks/clerk-routes.ts`                          | Without `CLERK_WEBHOOK_SECRET` unsigned payloads are accepted                          | High     |
| 9   | `app.ts` CORS                                       | Reflects any origin with `credentials: true`                                           | High     |
| 10  | `web/app/router.tsx`, `App.tsx`                     | Clerk is optional, every route is public, `/sign-in` renders inside the Shell          | High     |
| 11  | `invitation-routes.ts`                              | `POST /:token/accept` is unauthenticated and not bound to the invitee                  | Medium   |
| 12  | `app.ts` rate limit                                 | Keyed on spoofable `x-forwarded-for` / `x-member-id`                                   | Medium   |
| 13  | `web/shared/hooks/useSSE.ts`                        | `EventSource` cannot send credentials headers, stream is effectively unauthenticated   | Medium   |
| 14  | `src-tauri/tauri.conf.json`                         | `csp: null`, identifier `com.tauri.dev`                                                | Medium   |
| 15  | `api/config.ts`                                     | No auth env is validated at boot                                                       | Medium   |
| 16  | `package.json` (api, web)                           | api depends on `@clerk/clerk-react`, web on `@clerk/backend`                           | Low      |

## 2. Target model

- **Clerk owns identity, sessions and organizations** (memberships, roles, active org, switching). One Clerk organization = one Daybook workspace.
- **Personal accounts disabled** in Clerk, so every session must have an active organization (Clerk `choose-organization` session task).
- **Mongo owns domain data.** `workspace.clerkOrgId` (unique) and `member (workspaceId, clerkUserId)` (unique) link both worlds.
- **Roles:** Clerk roles map to domain `ROLES`; `can()` and the permission matrix stay as they are.
- **Fail closed everywhere:** missing config stops the boot, missing session is 401, missing org is 403.

Request flow:

```
Web:  ClerkProvider (required)
        /auth/*            -> AuthPage (only public route)
        everything else    -> RequireSession -> RequireOrganization -> Shell -> page

API:  secureHeaders -> cors(allowlist) -> authenticate (Clerk cookie or Bearer, authorizedParties)
        -> requireOrg -> resolve workspace + member -> route -> repositories scoped by workspaceId
```

## 3. Frontend structure (screaming architecture)

```
apps/web/src/
  app/            App.tsx, router.tsx, providers.tsx, shell/
  pages/          AuthPage, HomePage, TasksPage, BoardPage, TablePage, CalendarPage,
                  FilesPage, MembersPage, ActivityPage, NotificationsPage, SettingsPage
  features/
    auth/           RequireSession.tsx
    organizations/  RequireOrganization.tsx, CreateOrganizationModal.tsx, OrganizationSwitcher.tsx
    tasks/ views/ members/ ...   (unchanged, pages compose them)
  shared/  stores/  styles/
```

A page is a route entry: it composes feature components and holds no data logic.

```tsx
<Routes>
  <Route path="/auth/*" element={<AuthPage />} />
  <Route element={<RequireSession />}>
    <Route element={<RequireOrganization />}>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="tasks" element={<TasksPage />} />
        {/* ... */}
      </Route>
    </Route>
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

## 4. Phases

### Phase 0 — Clerk dashboard (manual)

1. Enable Organizations and disable personal accounts.
2. Roles: Clerk defaults. `org:admin` maps to `admin`, `org:member` to `member`.
3. Sessions → Customize session token, add the claims the API reads:
   `{ "name": "{{user.full_name}}", "email": "{{user.primary_email_address}}", "org_name": "{{org.name}}" }`
4. Allowed origins: `http://localhost:5175`, `tauri://localhost`, `http://tauri.localhost` (plus production web origin).
5. Webhook endpoint `<api>/webhooks/clerk` with `organization.created|updated`, `organizationMembership.created|updated|deleted`, `user.updated|deleted`.
6. Env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `ALLOWED_ORIGINS` (api); `VITE_CLERK_PUBLISHABLE_KEY` (web).
7. Production: add the production Clerk Frontend API domain and API origin to the Tauri CSP in `src-tauri/tauri.conf.json`.

### Phase 1 — API fail closed

1. `config.ts`: the Clerk keys, webhook secret and `ALLOWED_ORIGINS` are required; boot fails without them.
2. `http/auth.ts`: one middleware. Verifies the Clerk session (cookie `__session` or `Authorization: Bearer`) with `authorizedParties = ALLOWED_ORIGINS`. No `userId` → 401, no `orgId` → 403 `organization_required`. Stores `{ userId, orgId, orgRole }` in the Hono context. Replaces the Node version guard (use `@clerk/hono` if it runs on the current Node, otherwise `@clerk/backend` `authenticateRequest`; whichever needs less code).
3. `http/context.ts`: workspace by `clerkOrgId`, member by `(workspaceId, clerkUserId)`. Just-in-time upsert from the verified token claims (no webhook race after creating an org); role refreshed from the token on every request. Delete `memberIdOf`, `FALLBACK_MEMBER_ID`, `findFirst`, `provisionMember`.
4. Repository ports: every by-id read, update and delete takes `workspaceId` (tasks, comments, files, events, views, teams, members, notifications), so cross-tenant access cannot be forgotten in a route. Memory and Mongo adapters plus unique indexes.
5. Workspace: one `PATCH /api/workspace` acting on the request workspace. Remove the duplicated `workspacesRoutes` in `app.ts` and `POST /workspaces` (org creation lives in Clerk). Name and slug are owned by Clerk and synced by webhook; domain fields (color) stay in the API.
6. Webhooks: always verified with Svix. Idempotent handlers keyed by Clerk ids for org, membership and user create/update/delete.
7. Hardening: CORS allowlist from `ALLOWED_ORIGINS` with `authorization` and `content-type` headers; `secureHeaders()`; rate limit keyed by `userId` after auth.
8. Invitations: see decision 3. Minimum fix: accepting requires a session whose email matches the invitation.
9. SSE stream goes through the same middleware.
10. Seed and existing tests stop using `x-member-id` (adapted, no new tests).

### Phase 2 — Pages folder

Move every `*Page.tsx` to `src/pages/` and fix imports. Mechanical, no logic change, own commit.

### Phase 3 — Web auth

1. `App.tsx`: `ClerkProvider` mandatory (throw without key), wired to React Router navigation, `signInUrl=/auth/sign-in`, `signUpUrl=/auth/sign-up`, `afterSignOutUrl=/auth/sign-in`. Remove every `hasClerk` branch.
2. `pages/AuthPage.tsx`: own layout outside the Shell, reusing `styles/pages/auth.css`. Clerk `<SignIn>` and `<SignUp>` with path routing; password recovery is part of the SignIn flow, no extra route. Clerk `appearance` mapped to `tokens.css` (Impeccable).
3. `RequireSession`: loading state while Clerk loads, redirect to `/auth/sign-in` keeping the return URL, otherwise `<Outlet />`. Must read pending sessions as signed in (verify `treatPendingAsSignedOut: false`) so a user without org is not bounced back to sign-in.
4. `RequireOrganization`: active org → `<Outlet />`; memberships but no active org → `setActive` on the first one, no modal; no memberships → `CreateOrganizationModal`, centered and blocking (no close button, no Esc, focus trapped), name field → `createOrganization` + `setActive`. Built on the existing `Modal` (Impeccable).
5. Sidebar: the workspace button becomes `OrganizationSwitcher` (existing `Popover` + `useOrganizationList` + `setActive`); profile button gets sign out.
6. Org isolation on the client: `Providers` keyed by `orgId`, so switching org discards the whole query cache.
7. `apiFetch`: sends `Authorization: Bearer <session token>`; 401 signs out.
8. `useSSE`: fetch stream with the `Authorization` header instead of `EventSource`, no new dependency.

### Phase 4 — Desktop shell (Tauri)

1. Strict CSP: `self` plus API origin, Clerk Frontend API, `img.clerk.com` and Cloudflare challenge frames (verify against Clerk CSP docs).
2. Real `identifier` and `productName` (webview storage, so the session cookie persists per app).
3. Capabilities stay `core:default`. No auth logic in Rust: tokens never cross IPC.
4. Spike: Clerk email/password and email code inside WKWebView and WebView2 on a production instance. Social OAuth on desktop (system browser + deep link) is out of v1.

### Phase 5 — Verification (no new unit tests)

`typecheck`, `lint`, web build and `tauri build`, then manual checks:

- No session: every route goes to `/auth/sign-in`; API answers 401.
- Session without org: blocking modal; API answers 403.
- Create org: lands on Home; workspace and owner member exist in Mongo.
- User in two orgs: switch from the sidebar, data changes, no stale cache.
- Request with `x-member-id` only: 401.
- Task id from org A requested from org B: 404.
- Webhook with bad signature: 400. Unknown origin: blocked by CORS.
- Sign out: back to `/auth/sign-in`, session cleared.

## 5. Commits

One commit per phase step group, on the current branch (no branches or PRs unless requested).

## 6. Decisions (confirmed)

1. Clerk Organizations are the source of truth for orgs, memberships, roles and invitations. The own invitation module is gone.
2. Clerk default roles only: `admin` and `member`.
3. The backend stays Hono on Node; Rust is the Tauri shell only.

## 7. Out of scope

Desktop social OAuth, MFA enforcement (a Clerk toggle later), billing.
