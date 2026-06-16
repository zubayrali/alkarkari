# Note transclusion and the Properties panel (terminology infobox)

Two reading affordances, ported in concept from
[lithos](https://github.com/) (Nuxt/Docus), adapted to our Next/Fumadocs RSC
stack. Together they form the core of the terminology layer: define a term once,
surface it everywhere, and present its metadata as a structured infobox.

## Note transclusion — `![[Note]]`, `![[Note#Section]]`, `![[Note|Label]]`

`lib/remark-wikilinks.ts` previously embedded only `![[Name.base]]`. It now also
recognises a **standalone** note embed — a paragraph whose entire text is a
single `![[…]]` (excluding `.base`) — and replaces that paragraph with a
block-level `<NoteEmbed target=… section=… label=…>` (`mdxJsxFlowElement`).

- **Standalone only.** Mid-sentence `![[Note]]` is left for the wikilink pass and
  renders as an ordinary link. Transclusion is a block affordance (matches
  Obsidian), and a `<details>` block inside a `<p>` would be invalid HTML.
- **Resolution is deferred to render time** (`lib/note-embed.ts`,
  `resolveNoteTarget`): a lazy name → page index over `source.getPages()`, keyed
  by filename stem, title, and alias (title/stem win over aliases), mirroring
  `lib/alias-index.ts`. Remark carries only the raw wikilink target, preserving
  Obsidian's name-based linking.
- **`components/note-embed.tsx` is a server component** that renders the target
  page's compiled MDX body (`page.data.body`) inside a collapsible cartridge,
  with the body's internal links rewritten relative to the **target** page via
  `createRelativeLink(source, targetPage)`.
- **Depth is threaded through the MDX component map, not React context** (RSCs
  can't read context). `makeNoteEmbed(depth)` renders the body with
  `NoteEmbed: makeNoteEmbed(depth + 1)`; past `MAX_DEPTH = 3` it collapses to a
  link. This bounds work and defuses embed cycles (A embeds B embeds A).
- **`NoteEmbed` is registered only at the page render site** (`app/(docs)/[...slug]/page.tsx`),
  not in `getMDXComponents`, so the server-only `source` import never reaches a
  client MDX consumer (e.g. the canvas preview). Nested embeds get `NoteEmbed`
  from the parent embed's own render, so the page-level registration suffices.

**Limitation:** `#Section` does not slice the body — the whole note renders and
the cartridge title links to the section anchor (`slugifySection`). Slicing a
compiled MDX component by heading is not feasible without re-architecting the
body pipeline; deferred until there's a need.

## Properties panel — terminology infobox

`source.config.ts` now applies `.passthrough()` to the docs schema, so arbitrary
vault frontmatter (`arabic`, `root`, `category`, `related`, …) survives into
`page.data` instead of being stripped by Zod. `components/properties-panel.tsx`
(server component) renders those custom fields as a compact, type-aware,
collapsible panel above the article body:

- A **denylist** (`HIDDEN_KEYS` + `_`-prefixed + fumadocs internals) hides
  schema/layout/internal fields, so only genuine note properties show. The panel
  **self-hides** when nothing is displayable, leaving ordinary notes untouched.
- Type inference renders dates, URLs, numbers, booleans, and arrays distinctly.
  Frontmatter wikilink strings (`"[[Baqā]]"`, including inside arrays like
  `related:`) are resolved through `resolveNoteTarget` to real page links —
  tying the infobox into the same graph the body links feed.

Both stylesheets (`app/note-embed.css`, `app/properties-panel.css`) follow the
existing `link-popover.css`/`sidenotes.css` pattern and use `--color-fd-*`
tokens, so they track theme and dark mode for free.

## Authoring

A consistent terminology schema is the knowledge-management half of this: see
the `/create-term` skill (`.claude/skills/create-term/`) for the frontmatter
contract and note layout that these two surfaces are designed to render.
