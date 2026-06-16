# VaultPress

VaultPress publishes an Obsidian vault as a documentation site. This glossary defines the terms agents and contributors must use consistently when working in this codebase.

## Language

### Source (vault-level)

**Vault**:
The Obsidian directory that is the source of all site content. Contains notes, canvases, and assets.
_Avoid_: source, obsidian directory, workspace

**Note**:
An Obsidian Markdown file (`.md`) inside the vault. One of three source types that become pages on the site.
_Avoid_: file, document, markdown, article

**Canvas**:
An Obsidian Canvas file (`.canvas`) inside the vault. A spatial layout of nodes and edges. One of three source types that become pages on the site.
_Avoid_: diagram, board, drawing

**Base**:
An Obsidian Bases file (`.base`) inside the vault. A YAML definition of a filtered, sorted, and grouped view over vault notes. One of three source types that become pages on the site. Can also appear inline inside a note as a fenced ` ```base ``` ` code block or as a wikilink embed `![[Name.base]]`.
_Avoid_: database, query, table

**Base view**:
A named visualization within a Base (e.g. `table`, `gallery`, `list`). A single Base defines one or more views; the visitor switches between them on the page.
_Avoid_: tab, layout, mode

**Asset**:
A non-note, non-canvas file inside the vault (image, video, audio, PDF, etc.). Synced to `public/` during generation for use in pages and canvas nodes.
_Avoid_: media, attachment, static file

**Wikilink**:
An Obsidian-style `[[Note Title]]` reference inside vault source. Transformed into an internal link during generation.
_Avoid_: internal link (when referring to the source syntax), wiki link (two words)

**Alias**:
An alternate name for a note, declared in the `aliases` frontmatter field
(string or list). Each alias becomes a permanent redirect to the note's page
and resolves in wikilinks. Useful for transliteration variants (Zikr → Dhikr).
An alias never shadows a real page.
_Avoid_: synonym, alternate title, redirect (for the frontmatter field itself)

**Tag**:
A label applied to a note via the `tags` frontmatter field. Hierarchical with
`/` separators: a note tagged `a/b` also counts as tagged `a`.
_Avoid_: category, label, keyword

**Tag note**:
An optional vault note at `tags/<tag>.md` holding a tag's meta information
(title, description, body). Merged into the tag's page during generation.
_Avoid_: tag description file, tag stub

**Canvas node**:
A single visual element inside a canvas. Four types: `text` (Markdown content), `file` (vault asset or note), `link` (external URL), `group` (labelled frame). Nodes are connected by edges.
_Avoid_: element, item, card, block

### Site (published-level)

**Page**:
Anything the site publishes at a URL. Two kinds: a generated page (produced from a vault note, canvas, or base by `pnpm generate`) and a shell page (hand-maintained in `app/`, not touched by generation). Most pages are generated; the home page at `/` is the primary shell page.
_Avoid_: document, article, post, entry

**Shell page**:
A page hand-maintained in `app/` that is never produced by generation. The home page at `/` is the only shell page. Changes to shell pages require editing source code, not vault notes.
_Avoid_: static page, custom page, manual page

**Internal link**:
A hyperlink between two pages on the site. What a wikilink becomes after generation.
_Avoid_: wikilink (when referring to the resolved site link)

**Backlink**:
An inbound internal link: page A wikilinks page B, so A appears in B's
backlinks panel ("Pages that reference this page", below the article body).
Computed from the same extracted references the graph uses.
_Avoid_: inbound link, reverse link, reference (alone)

**Link preview**:
The hover popover on an internal link showing the target page's rendered
content in place. Pointer-only; ported from aarnphm/quartz.
_Avoid_: popover (alone — the view-options popover is unrelated), tooltip, hover card

**Annotation**:
A hand-sketched rough-notation mark drawn over a span of text, authored in
note prose with delimiter pairs: `==highlight==`, `!!underline!!`, `^^box^^`,
`((circle))`, `||bracket||`, or a ` ```highlight ` fence for a whole sentence.
_Avoid_: marker, decoration, emphasis (for this feature)

**Sidenote**:
A footnote rendered in the page margin next to its reference instead of at the
bottom. When the viewport has no margin room, clicking the reference opens the
note as a floating popover instead. Authored as a standard `[^n]` footnote in
the vault.
_Avoid_: footnote (after the transform has run), margin note, annotation

**Graph**:
The interactive knowledge graph showing pages as nodes and their internal links as edges. Accessible at `/graph`. Protected pages are excluded unless the visitor has unlocked access.
_Avoid_: knowledge graph, link graph, site map

**Local graph**:
The depth-limited neighborhood graph of the current page, shown under the
table of contents. The visitor can widen it (depth 1–3) or jump to the full
graph. Hidden on orphan pages.
_Avoid_: mini graph, page graph, context graph

**Protected page**:
A page whose body is withheld from visitors until they supply the correct shared password. Marked with `protected: true` in frontmatter. Title, description, and tags remain visible before unlock.
_Avoid_: gated page, private page, locked page

**Tag page**:
The generated page at `/tags/<tag>` for a tag: the tag note's content (if any)
above a Base-powered listing of all pages bearing the tag. `/tags` is the index
of all tag pages. Tag pages are hidden from the sidebar.
_Avoid_: tag index (except for `/tags` itself), tag listing

### Karkari Wiki — content sections

**Dictionary**:
The primary content section. A collection of pages defining terms specific to the Tariqa Karkariya and Sufi tradition (Wird, Dhikr, Hadra, etc.).
_Avoid_: glossary, lexicon

**Books**:
The bibliography section. A collection of pages covering published works by Shaykh Mohamed Faouzi al-Karkari and related authors.
_Avoid_: bibliography, reading list, library

**Podcasts**:
The section for audio episodes and their full written transcripts.
_Avoid_: audio, recordings, episodes

### Process

**Generation**:
The end-to-end process of reading vault content and writing it as MDX to `content/` and static assets to `public/`. Triggered by `pnpm generate`.
_Avoid_: publish, sync, build, export
