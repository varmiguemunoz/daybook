---
name: Daybook
description: Tasks and notes for a small team, in one calm workspace
colors:
  ink-indigo: '#4b5bd6'
  ink-indigo-night: '#8e9af3'
  on-accent: '#ffffff'
  warm-paper: '#fbfaf8'
  sidebar-linen: '#f4f3f0'
  clean-sheet: '#ffffff'
  pressed-paper: '#f6f5f2'
  folded-paper: '#eeede9'
  sunken-paper: '#f7f6f3'
  hairline: '#e9e7e2'
  hairline-strong: '#dad7d0'
  graphite-ink: '#1d1c1a'
  pencil: '#57544e'
  faded-pencil: '#6b6760'
  ghost-pencil: '#8c8880'
  ledger-green: '#25754b'
  ochre: '#8f5e0e'
  stamp-red: '#b23c30'
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '23px'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.022em'
  title:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '19px'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.015em'
  body:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '13.5px'
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'ss01', 'cv11'"
  reading:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1.3
  mono:
    fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: '13.5px'
    fontWeight: 400
    lineHeight: 1.65
rounded:
  xs: '4px'
  sm: '6px'
  md: '8px'
  lg: '10px'
  dialog: '12px'
  full: '999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  '8': '32px'
  '10': '40px'
  '12': '48px'
  gutter: '24px'
components:
  button-primary:
    backgroundColor: '{colors.ink-indigo}'
    textColor: '{colors.on-accent}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: '0 11px'
    height: '30px'
  button-secondary:
    backgroundColor: '{colors.clean-sheet}'
    textColor: '{colors.graphite-ink}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: '0 11px'
    height: '30px'
  button-secondary-hover:
    backgroundColor: '{colors.pressed-paper}'
  button-ghost:
    textColor: '{colors.pencil}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: '0 11px'
    height: '30px'
  button-ghost-hover:
    backgroundColor: '{colors.pressed-paper}'
    textColor: '{colors.graphite-ink}'
  input:
    backgroundColor: '{colors.clean-sheet}'
    textColor: '{colors.graphite-ink}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: '0 10px'
    height: '30px'
  nav-item:
    textColor: '{colors.pencil}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '30px'
  nav-item-active:
    backgroundColor: '{colors.clean-sheet}'
    textColor: '{colors.graphite-ink}'
  panel:
    backgroundColor: '{colors.clean-sheet}'
    rounded: '{rounded.lg}'
  menu:
    backgroundColor: '{colors.clean-sheet}'
    rounded: '{rounded.lg}'
    padding: '4px'
  label-chip:
    backgroundColor: '{colors.clean-sheet}'
    textColor: '{colors.pencil}'
    rounded: '5px'
    padding: '0 7px 0 6px'
    height: '20px'
---

# Design System: Daybook

## Overview

**Creative North Star: "The Working Notebook"**

Daybook is a notebook that a small team keeps open all day. The ground is warm paper, the text is graphite, and one ink colour marks what you chose, what you can follow and what you can do next. Nothing on the page competes with the work: tasks, notes and people sit in compact rows separated by hairlines, and the interface steps back so writing and finding things again stay fast.

The system is refined and restrained. Depth comes from tone (paper laid on paper) rather than shadow; shadows appear only on things that genuinely float above the page, such as menus, dialogs and dragged cards. Density is deliberate: 30px rows, 13.5px body text, a 4pt spacing scale and one horizontal gutter (24px) shared by every header, toolbar, list, table and board.

Light and dark are two separate palettes, not an inversion. Dark mode keeps the paper warmth in near-black greys and lifts the indigo so it still reads as ink.

**Key Characteristics:**

- Warm paper neutrals with a single indigo accent
- Geist for everything, Geist Mono only for code, Markdown source and measured values
- Tonal layering for depth; shadows only on floating layers
- Compact 30px rows, hairline dividers, 6–10px corners
- One content gutter shared by every view

## Colors

A paper-and-ink palette: tinted warm neutrals carry the whole surface and one indigo does the pointing.

### Primary

- **Ink Indigo** (light theme; lifted to Ink Indigo Night in dark): selection, links, focus rings, the caret, the primary button and checked controls. Soft tints of it (10% for fills, 22% for text selection, 38% for lines) mark the selected or focused thing without a second hue.

### Neutral

- **Warm Paper**: the app background behind every view.
- **Sidebar Linen**: the main navigation rail, one step darker than the page so the rail reads as a separate sheet.
- **Clean Sheet**: content surfaces: the main area, panels, menus, dialogs and the active navigation row.
- **Pressed Paper** and **Folded Paper**: hover and pressed fills, table headers and inline code backgrounds.
- **Sunken Paper**: wells that hold raw input, such as the Markdown editor and code blocks.
- **Hairline** and **Hairline Strong**: dividers and control borders; strong for inputs and secondary buttons.
- **Graphite Ink**, **Pencil**, **Faded Pencil**: primary, secondary and tertiary text. Faded Pencil is the floor for any readable text, placeholders included.
- **Ghost Pencil**: resting icons only; never body text.

### Semantic

- **Ledger Green**, **Ochre**, **Stamp Red**: done or success, warning or unsaved, and destructive or error. Each has a soft tint (about 11%) for backgrounds. Status colours for tasks (backlog, todo, in progress, review, done) sit beside them and only label state.

### Named Rules

**The One Ink Rule.** Indigo is the only accent. It marks selection, links, focus and the one primary action in view; it never decorates.

**The Swappable Ink Rule.** The accent is a variable, and the tokens already define blue, violet, teal, rose and graphite alternates for a future accent setting. Never hard-code the indigo hex in a component; always use the accent token.

## Typography

**Body Font:** Geist (with the system UI stack)
**Mono Font:** Geist Mono (with ui-monospace)

**Character:** One workhorse sans at small, exact sizes with stylistic sets ss01 and cv11 on; the mono appears only where characters must line up.

### Hierarchy

- **Headline** (600, 23px, 1.2, -0.022em, balanced): page titles and note titles.
- **Title** (600, 19px, 1.25): section pages such as Settings.
- **Section** (600, 14.5px): dialog titles, panel and rail headings.
- **Body** (400, 13.5px, 1.45): every list, row, field and paragraph of chrome.
- **Reading** (400, 15px, 1.7, max 36rem, about 68 characters): rendered notes and other long-form text.
- **Label** (500, 12–12.5px): buttons, chips, hints and metadata; 11px only for counts and keyboard hints.
- **Mono** (400, 13.5px, 1.65): the Markdown editor, code, keyboard keys.

### Named Rules

**The Small Steps Rule.** The scale moves in small steps (11, 12, 12.5, 13.5, 14.5, 16, 19, 23px). Hierarchy comes from weight and colour first, size second; nothing in the app is larger than 23px.

**The Honest Mono Rule.** Monospace is for code, Markdown source, keys and figures that must align, never as a "technical" costume.

## Layout

The app is a fixed shell: a 252px navigation rail, a 46px top bar with breadcrumbs and search, and a scrolling content area. Pages with a reading width centre at up to 1160px; full-bleed views (board, table, calendar, notes) use the whole area. Every view starts its content on the same 24px gutter (16px on narrow screens).

Spacing follows a 4pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48px). Groups are tight (4–8px), separations generous (20–32px), with more space above a heading than below it. Rows are 30px tall in navigation and trees and 40px in lists (34px in compact density).

Multi-pane screens divide the width with hairline borders, never with cards: Settings uses navigation plus body; Notes uses explorer (260px), page and connections rail (260px). Breakpoints at 1240px, 1100px, 900px and 640px collapse rails first, then switch to one pane at a time with a fixed bottom navigation on phones.

## Elevation & Depth

Flat by default. Surfaces separate by tone (Sidebar Linen, Warm Paper, Clean Sheet, Sunken Paper) and hairlines. Shadows are reserved for layers that float: popovers and menus, dialogs, toasts and dragged cards. Dark mode replaces most shadows with a stronger border, because shadows vanish on dark grounds.

### Shadow Vocabulary

- **Hairline lift** (`0 1px 2px rgba(28,25,20,0.05)`): buttons with a border and the active navigation row.
- **Card ring** (`0 1px 2px rgba(28,25,20,0.04), 0 0 0 1px hairline`): resting cards on the board.
- **Pop** (`0 12px 32px -8px rgba(28,25,20,0.16), 0 2px 6px -2px rgba(28,25,20,0.06), 0 0 0 1px hairline`): menus, popovers and dialogs.
- **Drag** (`0 16px 36px -10px rgba(28,25,20,0.28), 0 0 0 1px hairline-strong`): an item being dragged.

### Named Rules

**The Paper-On-Paper Rule.** If a surface does not float above the page, it gets a tone or a hairline, not a shadow.

## Shapes

Gently rounded and consistent: 4px for small marks (code, keys, checkboxes), 6px for controls and rows, 8px for fields and wells, 10px for panels and menus, 12px for dialogs, fully round only for avatars and dots. Borders are always 1px hairlines; a strong hairline outlines inputs and secondary buttons. Emphasis is a full border or a tint, never a bar down one side.

## Components

### Buttons

- **Shape:** gently rounded (6px), 30px tall (26px small), 12.5px medium label, 6px gap to a 14–16px icon.
- **Primary:** Ink Indigo fill with white label and a faint inner bottom edge; one per view.
- **Secondary:** Clean Sheet with a strong hairline and hairline lift.
- **Ghost:** no fill; Pencil text that darkens on hover over a Pressed Paper fill.
- **States:** 140ms transitions on background, border and colour; a 0.97 press scale; disabled at 45% opacity with no pointer events. Icon-only buttons are 30px squares with a tooltip and an accessible label.

### Inputs / Fields

- **Style:** Clean Sheet, strong hairline, 6px corners, 30px tall, 10px inside padding, placeholder in Faded Pencil.
- **Focus:** the border turns Ink Indigo with a 3px soft indigo ring.
- **Error / Disabled:** errors in Stamp Red below the field; disabled fields drop to Pressed Paper with tertiary text.

### Navigation

- **Style:** 30px rows, a 9px gap between icon and label, Pencil text, icons in Ghost Pencil.
- **Hover:** Folded Paper fill, text and icon darken.
- **Active:** a Clean Sheet tile with hairline lift and medium weight, so the current place reads as a sheet laid on the rail. Dark mode uses a tonal fill instead of the ring.
- **Mobile:** below 640px a fixed bottom bar with icon and label buttons replaces the rail.

### Menus and Popovers

- **Style:** Clean Sheet, 10px corners, Pop shadow, 4px inner padding, entering with a 160ms scale and fade.
- **Items:** 30px rows; hover and keyboard focus share the Pressed Paper fill; the chosen value shows an indigo check.

### Panels and Dialogs

- **Panels:** Clean Sheet, hairline border, 10px corners, a 13.5px semibold heading row. Never nested.
- **Dialogs:** native modal dialogs, 12px corners, Pop shadow, a dimmed warm overlay; Escape and the backdrop close them, focus lands on the safe action.

### Explorer tree (signature)

The notes explorer is the navigation rail's language applied to content: 28px rows indented 14px per level, a rotating chevron (160ms), folder and file icons in Ghost Pencil, the open note as a Clean Sheet tile, actions revealed on hover or focus.

## Do's and Don'ts

### Do:

- **Do** use the accent token for every indigo use, never the hex.
- **Do** separate panes with 1px hairlines and surfaces with tone.
- **Do** keep readable text at Faded Pencil or darker, placeholders included.
- **Do** start every view's content on the shared 24px gutter.
- **Do** cover hover, focus, disabled, loading, empty and error for every control and view.
- **Do** keep long-form reading at 15px with a 36rem measure (about 68 characters).

### Don't:

- **Don't** add a second accent hue; semantic colours only mark state.
- **Don't** put shadows on surfaces that do not float.
- **Don't** nest cards or wrap whole pages in cards.
- **Don't** use a coloured bar down one side of a box for emphasis.
- **Don't** exceed 23px type in the product UI.
- **Don't** use Ghost Pencil for text.
