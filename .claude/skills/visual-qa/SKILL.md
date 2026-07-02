---
name: visual-qa
description: Standing checklist of pages and interactions to eyeball after UI changes — the agent has no browser tooling, so this is the human-verification handoff. Use after changing sidenotes, review cards, reader mode, view transitions, the locale switcher, or any CSS/layout work.
---

# Visual QA checklist

The agent verifies builds and exported HTML; a human verifies pixels. After a
UI change, hand the user the relevant subset of this list with `pnpm dev`
running (or `pnpm build:all` + `npx serve site` for locale-switch checks).

## Sidenotes — `/articles/style-test` (only en page with footnotes)

- Normal desktop (≥1280px): cards stacked in the rail **below the TOC**;
  hovering a label highlights its card and vice versa; clicking a label
  scrolls the card into view.
- Reader mode: TOC gone, notes become **margin notes** beside the text.
- Narrow window (<1280px): labels open a click-popover; Escape closes it.
- Sidebar collapsed: notes remain visible (rail or margin).

## Review cards (orbit) — any page with an orbit block

- Deck: next cards peek behind the front card, scaled/offset; grading slides
  the front card away and the card behind animates forward.
- Cover: "Click anywhere to reveal" rows visibly glide sideways (if not:
  check macOS Reduce Motion — the marquee correctly freezes under it).
- Buttons disabled until reveal; "Skip this card" text link appears after
  reveal; keyboard: Space reveal/remember, 1 forgot, 2 remembered, 3 skip.
- Progress ladder shows In-text → 1 week → 2 weeks → 1 month → Long-term.
- Two orbit blocks on one page: grading in one must not reset the other.

## Reader mode

- Enter via the actions bar; content centers at 52rem; TOC/actions/
  properties/backlinks/comments/footer hidden.
- Exit: Escape, Ctrl+B, floating exit bar, or expanding the sidebar.
- Escape with the search dialog open closes the dialog only.

## Navigation & transitions

- Home ↔ docs: content crossfades, no horizontal drift or elements morphing
  into unrelated partners.
- Base table row click: row morphs into the destination H1.
- Sidebar collapsed state survives navigation without a layout flash.
- Nav progress bar fills during slow navigations, fades cleanly.

## Locale switching (stitched build only — `pnpm build:all` + `npx serve site`)

- Switcher preserves the current path across locales.
- Untranslated page → lands on that locale's `/start-here` via root 404.
- In plain `pnpm dev`, other locales correctly render disabled with a hint.

## Search

- Dialog opens (Cmd+K), results render, preview pane shows content.
- cn build: query CJK terms (uni/bigram encoder) once cn has real content.
