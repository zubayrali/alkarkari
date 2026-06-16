# Aliases, backlinks, link previews, and sidenotes ported from aarnphm/quartz

The Bases engine (ADR-0004) came from aarnphm/quartz; this ADR ports the four
reader-facing affordances from the same garden that fit a densely cross-linked
reference wiki: alias redirects, a backlinks panel, hover link previews, and
margin sidenotes. Quartz-specific surfaces (stacked notes, PDF/Wikipedia/
LessWrong previews, the custom sidenote micromark syntax) were deliberately
left behind.

**Aliases — runtime redirects, not emitted pages.** Quartz emits an HTML
meta-refresh page per alias. Here the `aliases` frontmatter field (string or
list, normalized in `lib/aliases.ts`) passes through generation untouched,
and the catch-all route consults a lazily built alias→URL map
(`lib/alias-index.ts`) when slug resolution fails, answering with a 308
`permanentRedirect`. Plain aliases resolve as siblings of their page;
path-style aliases (`/dictionary/zikr`, `../zikr`) resolve against the page's
folder — same semantics as Quartz's `aliasTargetSlug`. An alias never shadows
a real page. Alias names also feed the wikilink index
(`lib/remark-wikilinks.ts`), so `[[Zikr]]` links straight to the canonical
page without the redirect hop.

**Backlinks — inverted from `extractedReferences`.** The panel
(`components/backlinks.tsx`, data in `lib/backlinks.ts`) renders below the
article body with fumadocs `Cards`, inverting the same per-page extracted
references the graph view consumes. Porting this exposed a latent bug: those
references are raw hrefs, and wikilink-resolved ones are URL-relative without
a file extension (`./wird`) — which `source.getPageByHref` cannot resolve (its
relative branch is keyed by file path *with* extension). `resolveReference` in
`lib/source.ts` resolves relative hrefs against the referencing page's slugs
(index pages resolve inside their own folder) and is now used by both
backlinks and `lib/build-graph.ts`, which silently dropped same-folder
wikilink edges before. Protected pages are excluded without unlocked access,
mirroring the graph; tag pages are skipped as sources since membership is
already visible as tag chips.

**Link previews — fetch the real page, extract the article.** A single client
component (`components/link-popover.tsx`, mounted once in the docs layout)
delegates `mouseover`/`mouseout` on the document and previews any same-origin,
extension-less link inside an `article`. The target page's server-rendered
HTML is fetched and parsed off-DOM, `article#nd-page` is extracted (footnotes,
backlinks panel, buttons stripped; `[data-skip-preview]` honored), every `id`
is prefixed `popover-` to avoid host-page collisions, and `#hash` targets are
scrolled into view inside the preview — all Quartz popover semantics.
Positioning uses `@floating-ui/dom` (offset/shift/flip + arrow), the one
dependency added. Popovers are cached on `<body>` per pathname for the
session, in-flight fetches abort when the pointer leaves, and the whole
feature is inert without a fine hover pointer (`hover: hover`). Because every
page is `force-dynamic` (ADR-0001), the fetch always returns full HTML, and a
protected page previews as its gate — titles and descriptions are public by
design.

**Sidenotes — GFM footnotes in, Quartz layout engine out.** aarnphm authors
sidenotes in a custom micromark syntax that this vault will never contain, so
the build half is adapted: `lib/rehype-sidenotes.ts` consumes the footnote
section GFM emits, replacing each `[^n]` reference with a `span.sidenote`
label + `span.sidenote-content` sibling (everything stays a `<span>` — block
elements inside `<p>` would break hydration; footnote paragraphs become
`span.sidenote-paragraph`) and removing the bottom footnote list. The runtime
half (`components/sidenotes.tsx`) is a near-verbatim port of Quartz's
`SidenoteManager`: collision-stacked margin placement, relaid out on resize;
without margin room the reference opens the note as a floating-ui popover
(replacing Quartz's inline click-to-expand fallback). Geometry is the one
adaptation: Quartz measures free space around a centered `.main-col`; here
margins are measured against the actual fumadocs layout — `#nd-sidebar` on the
left, `#nd-toc` on the right — so sidenotes only take a margin that genuinely
has ≥ 16rem free, which on most laptop widths degrades gracefully to inline
mode.

Both client components rely on stable fumadocs DOM ids (`nd-page`, `nd-toc`,
`nd-sidebar`); re-verify those on fumadocs-ui major upgrades.
