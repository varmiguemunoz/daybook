---
version: 1
slug: 'src-pages-notespage-tsx'
primary_target: 'src/pages/NotesPage.tsx'
related_targets: ['src/modules/notes', 'src/styles/pages/notes.css']
---

# Notes surface

Scope: whole surface inside the established Daybook world. Visitor mode: Operate.
Audience: an owner and a small team sharing one workspace. Job: capture a note fast, find it again, and connect it to related notes.
Task frequency: daily, in short bursts (capture) and longer reading sessions (knowledge base).
Constraints: existing tokens, Geist, Lucide icons and core components only; textarea editor; last write wins; desktop web and Tauri, usable down to phone width.

## Direction contract

THESIS: Notes is a three-pane working surface: an explorer tree on the left, the note as a readable page in the middle, and its connections on the right. It refuses a card grid of notes and a toolbar-heavy editor; reading is the default state and editing is a deliberate mode.

OWN-WORLD: Daybook's warm neutrals with the indigo accent used only for selection, links and the primary action. Explorer rows reuse the shell's sitem rhythm (30px, 8px radius). The page reads at 72ch in Geist; the editor switches to Geist Mono on a sunken field. Hairline column dividers, no cards.

STORY: The user sees every folder and note at once, opens one, reads it rendered, double-clicks or presses Edit, writes, presses Cmd/Ctrl+S and sees Saved. They link notes from the right rail and follow backlinks to move through their knowledge.

FIRST VIEWPORT: Left 260px explorer: search, New note primary button, folder tree with notes nested. Center: a bar with the folder path (also the move control) on the left and save state, Edit/Done and delete on the right, then the title at fs-2xl, then the rendered body. Right 260px rail: Related and Mentioned in lists (the names the user approved in docs/notes-plan.md, decision 3) with Link note action, then note meta. Below 1240px the rail drops under the page; below 900px one pane shows at a time.

FORM: Explorer, page, connections rail; position 1 of the plan's ordered layout. seed: none (pinned) "grid-template-columns: 260px minmax(0, 1fr) 260px" from docs/notes-plan.md, approved by the user ("arranca por completar este plan").
Signature move: the connections rail, with outgoing links and backlinks as two directional lists that make the note graph walkable. Motion grammar: 160ms ease-out on mode switch and tree expand, nothing else.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Phase 2 additions

Edits autosave 1.5s after typing stops; a 409 shows an amber conflict strip with Use their version and Keep mine. [[Title]] links render as ink links, unresolved ones dashed in Pencil, and typing [[ opens a title list at the caret. Notes and folders drag onto folders or onto empty tree space. Notes download as .md.
