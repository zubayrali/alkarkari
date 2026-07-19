---
name: sidenotes
description: How to compose sidenotes/marginalia in vault notes — all three authoring syntaxes (bare {{note}}, labeled {{sidenotes[label] content}}, GFM footnotes), what's protected from the transform, rendering behavior, and footguns. Use when writing or reviewing notes that contain margin notes, footnotes, or marginalia, or when debugging why a sidenote renders wrong.
---

# Sidenotes / Marginalia

All three syntaxes become GFM footnotes at generation time, flow through the
`rehypeCitations` → `rehypeSidenotes` pipeline, and render identically:
margin notes beside the article when there's room, click-popovers otherwise.
There is **never** a bottom footnote section.

Implementation: `lib/remark-sidenote-syntax.ts` (transform, tested in
`tests/sidenote-syntax.test.ts`), `lib/rehype-sidenotes.ts` (footnote →
sidenote spans), `components/sidenotes.tsx` + `app/sidenotes.css` (layout
engine).

## Syntax 1 — bare marginalia (preferred for quick notes)

```markdown
The web was static. {{Well, mostly static — CGI existed.}} Text continues.
```

- Unlabeled, auto-numbered. The marker glues to the word before the braces
  (preceding spaces are consumed).
- Full inline markdown inside: **bold**, *italics*, `code`, [links](…),
  citations (`[@key]`), images.
- Multi-line bodies are folded to a single line — do NOT put lists, block
  quotes, or paragraph breaks inside; keep it to one flowing sentence or two.

## Syntax 2 — labeled

```markdown
The doctrine of spiritual poverty {{sidenotes[faqr]: From the Arabic root
ف-ق-ر — total dependence on God.}} is central.
```

- The label (`faqr`) stays in the prose; the marker attaches after it.
- Same content rules as the bare form.

## Syntax 3 — standard GFM footnotes

```markdown
Classic footnotes work too[^tariqa].

[^tariqa]: First paragraph.

    An indented second paragraph — the ONLY way to get a multi-paragraph
    sidenote. Renders as separate blocks inside the note.
```

- Use this form when the note needs multiple paragraphs (4-space indent
  continuation) or when writing hand-maintained `content/` files.
- Referencing the same `[^id]` twice is fine — the engine renders the note
  once and wires both markers' hover to it.

## What is protected (never becomes a sidenote)

- ` ``` ` / `~~~` fenced code blocks (including ` ```orbit ` review cards)
- Inline code spans: `` `{{date}}` `` stays literal
- YAML frontmatter values
- A note may CONTAIN an inline code span — that still transforms.

## Footguns

- **Any other `{{…}}` in prose becomes a sidenote.** Escape via inline code
  or rephrase if you mean literal braces.
- **Unclosed `{{`** never matches; the converter escapes it and readers see
  literal `\{\{` text. Always close.
- **Hand-maintained `content/` files** (`start-here.mdx`, `graph.mdx`):
  `{{…}}` crashes MDX there — GFM footnotes only. The transform only runs on
  vault notes during `pnpm generate`.
- Sidenote content is also prose for other passes: reserved annotation
  delimiters (`==`, `!!`, `^^`, `((`, `||`) are live inside notes too.
- After editing vault notes: `pnpm generate --locale=en && pnpm run stage`
  (must be `pnpm run stage` — bare `pnpm stage` hits pnpm's built-in).

## Rendering behavior (what authors should expect)

- **≥1280px viewport with ≥10rem of free margin**: true margin notes.
  Per-note width adapts (8–16rem) to the available margin; both margins are
  balanced (equal-width notes on each side) via the `--fd-layout-width`
  override, so notes work on both sides with the sidebar expanded (from
  ~1500px viewports) and always when it's collapsed or reader mode is on.
  Notes alternate sides when both margins have room, and stack/drift to
  avoid collisions.
- **Otherwise**: the marker becomes a click-to-open floating popover.
- Hovering a marker highlights its note (and vice versa).
- Clicking a marker (or the note) writes `#sidenote-N` to the URL and flashes a
  soft ink wash on the note — a shareable deep link. Opening such a link scrolls
  to and washes the note. IDs are page-scoped and sequential (`sidenote-1`, …).
- Styling is plain Tufte marginalia (no box/border/fill, smaller serif, quiet
  superscript reference, hanging lead figure, faint hover wash) per `DESIGN.md`;
  edit `app/sidenotes.css`.
- Test page: vault `test.md` → `/test` exercises every form.
