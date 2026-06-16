# Tag pages are synthetic Bases generated per tag

Every tag used in vault note frontmatter gets a page at `/tags/<tag>`: optional
hand-written meta content above a listing of the notes bearing that tag, plus a
`/tags` index. The pattern follows aarnphm's quartz `TagPage` emitter (a vault
`tags/<tag>.md` "tag note" supplies the meta content), but the listing is not a
one-off list renderer.

Instead, `scripts/generate-tag-pages.ts` compiles a *synthetic Base* per tag —
filter `file.hasTag("<tag>")`, single Table view — emitting
`public/bases/tags/<tag>.json` + `content/tags/<tag>.mdx` exactly like the auto
folder-index pages in `scripts/generate-base-pages.ts`. Tag pages therefore get
the full Bases treatment for free: RSC rendering with precomputed results,
client re-evaluation, and the same chrome suppression (`base: true`, ADR-0005).
An explicit vault `tags/<tag>.base` overrides the synthetic one (the base
pipeline already compiles it at the same slug; the tag generator skips it), so
a tag page's views are user-customizable per tag.

Generated tag pages carry two new frontmatter fields: `tagPage: true`
(identifies the page kind per ADR-0005's flag pattern — used to hide the
`tags/` folder from the sidebar tree and to turn tag pages into graph tag
nodes) and `tag: "<tag>"` (the tag string, so consumers never parse URLs).

To make parent-tag pages include child-tagged notes (a note tagged `a/b`
appears on `/tags/a`), the Bases VM's `hasTag` was made hierarchy-aware
(`t === q || t.startsWith(q + "/")`) — this matches Obsidian's nested-tag
semantics and applies everywhere `hasTag` is used, including user-authored
`.base` files. Exact-match behavior is not preserved; this is a fidelity fix.

Tag identity is the raw tag string (case-sensitive, `/`-separated), not a
slugified form: tag URLs and `tags/<tag>.md` lookups use the tag verbatim.
