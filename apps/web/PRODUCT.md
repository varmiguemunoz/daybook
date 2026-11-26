# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and a small team. Each person signs in with Clerk and belongs to one or more organizations (workspaces). The organizations separate contexts and are shared by the people in them. The work is planning and tracking tasks, and capturing and finding notes.

## Product Purpose

Daybook keeps a team's tasks and notes in one place per organization. Success means tasks and knowledge are captured quickly and found again without leaving the app.

## Positioning

Tasks and Markdown notes live side by side in the same organization, with notes related to one another. It is a single workspace, so nobody has to switch between a task tool and a notes tool.

## Operating Context

- Mostly used in the browser today. The same client is packaged as a Tauri desktop app, and both are expected to be used equally.
- Keyboard-heavy desktop use: ⌘K search, Ctrl/⌘+S to save notes.
- Small screens must still work.
- Real-time updates between teammates over SSE.

## Capabilities and Constraints

- Tasks with list, board, table and calendar views; bulk actions; comments; assignments and notifications; teams; members with admin and member roles; light and dark theme stored per user.
- **Notes:**
  - Markdown with GitHub-flavoured syntax.
  - Nested folders.
  - Explicit relations between notes, shown as related notes and backlinks.
  - Shared by the whole organization.
  - Double-click enters edit mode; Ctrl/⌘+S saves.
- **Notes usage:** between a durable knowledge base (second brain) and quick notes.
- **Stack:** React 19 + Vite, Hono API on Node, MongoDB, Clerk, Tauri 2.
- **Undecided:** `[[wiki-link]]` syntax, autosave, conflict handling between simultaneous editors.

## Brand Commitments

- **Name:** Daybook.
- **Logo:** an isometric cube of beige panels with one orange tile (`apps/web/public/favicon.svg`, `LogoMark` in `src/modules/core/components/Brand.tsx`). Keep its colors as they are.

## Evidence on Hand

No testimonials, metrics or customer content exist. Do not invent any.

## Product Principles

- Capture fast: creating a task or note takes one action and is keyboard-reachable.
- Find again: search, folders and relations make knowledge retrievable.
- One workspace: tasks and notes share the same organization, people and real-time updates.
