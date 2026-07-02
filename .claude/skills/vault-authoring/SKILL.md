---
name: vault-authoring
description: The authoring contract for Obsidian vault notes — frontmatter schema, orbit review-card syntax, sidenote syntax, reserved annotation delimiters, collision rules. Use when writing or reviewing note content, drafting copy-paste-ready notes for the user, creating terms, or debugging why a note renders wrong.
---

# Vault authoring contract

The agent CANNOT write the vaults (`~/Documents/alkarkarivault{,-fr,-cn}`).
When content is needed, produce a **copy-paste-ready note body** in the chat
and let the user paste it into Obsidian, then run `pnpm generate --locale=<x>`.

## Frontmatter schema (source.config.ts)

- `title`, `description` — standard.
- `tags`, `aliases` — string or array, both normalized.
- `draft: true` — never generated (excluded at generation; runtime 404 guard).
- `unlisted: true` — routable by URL but hidden from sidebar/search/graph/
  RSS/sitemap/recent/tags; gets `noindex`.
- `slides: true` — adds a `<page>/slides` route.
- `featured: true` — home-page "Start here" card target (at most ONE note
  per locale).
- Booleans: use Obsidian **Checkbox** properties. Text-typed `'true'` strings
  are coerced by the schema, but Checkbox is the contract.
- Any other keys (`arabic`, `root`, `category`, `related`, …) pass through to
  the Properties infobox; `[[wikilinks]]` in values resolve to real links.
- `created`/`modified` are emitted from file stats — don't set unless
  overriding.

## Terminology / dictionary notes

Follow the Properties-panel conventions: `arabic`, `root`, `category`,
`related` frontmatter render as the Obsidian-style infobox above the body
(see `components/properties-panel.tsx`, ADR-0013). Standalone `![[Note]]` on
its own paragraph transcludes the target note in a collapsible cartridge;
mid-sentence `![[Note]]` degrades to a link. `![[Note#Section]]` links the
header but does not slice the body.

## Orbit review cards

Two syntaxes, both hold `Q:`/`A:` pairs:

    ```orbit color=green
    Q: Question text?
    A: Answer text.

    Q: Second question?
    A: Multi-line answers work.
    Continuation lines attach to the field above.
    ```

or a callout: `> [!orbit]- color=green` with `> Q: …` / `> A: …` lines.

Rules:
- Fields start with a **colon** (`Q:`, `A:`, `QI:`, `AI:`). Lines like
  `A. first option` are continuations, not fields.
- Blank line separates prompts. A blank line inside an answer TRUNCATES it —
  multi-paragraph answers are unsupported.
- `QI:`/`AI:` attach an image (public asset name) to the preceding Q/A.
- Colors: red orange yellow green turquoise cyan blue violet purple pink.
- Editing a prompt's text changes its content-hash id — readers' progress on
  that card resets. Edit deliberately.
- "Skip" advances the interval like "Remembered" (faithful to Orbit).

## Sidenotes

- Vault notes: `{{sidenotes[label]: content}}` (generation-time transform) or
  standard GFM footnotes `[^1]`.
- Hand-maintained `content/` files (start-here, graph): GFM footnotes ONLY —
  the `{{…}}` syntax crashes MDX there.
- Rendering: margin notes in reader mode, cards below the TOC otherwise,
  popover on mobile. Never a bottom footnote section.

## Reserved delimiters (rough-notation annotations, ADR-0012)

`==highlight==`, `!!underline!!`, `^^box^^`, `((circle))`, `||bracket||` are
live syntax in note prose. In particular, any double-parenthesized text gets
circled. Escape or rephrase if literal.

## Collision rules (silent overwrites)

- `.base` + `.md` with the same stem in the same folder → the Base wins.
- Folder-index base (`dict/dict.base` or `dict/index.base`) overwrites a
  `dict/index.md` note.
- A vault tag note `tags/<tag>.md` becomes the tag page's intro, not a page.
- Never name a note so its slug ends in a bare `index` segment.
- `[[wikilinks]]` inside headings render as plain text (nested-anchor rule).
- Links to notes excluded from `GENERATE_INCLUDE` become dead links silently.
