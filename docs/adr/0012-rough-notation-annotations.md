# Rough-notation annotations with kufrCleaner's inline markdown syntax

Hand-sketched annotations (rough-notation, the same `^0.5.1` dependency both
aarnphm and kufrCleaner use) are authored directly in vault notes with
kufrCleaner's (astro-modular) inline syntax — chosen over aarnphm's variant,
which only auto-boxes TOC markers and has no authoring syntax:

| Syntax | Annotation |
|---|---|
| `==text==` | highlight (matches Obsidian's native highlight syntax) |
| `!!text!!` | underline |
| `^^text^^` | box |
| `((text))` | circle |
| `\|\|text\|\|` | bracket |
| ` ```highlight ` fence | block form (any of the five type names) |

`lib/remark-annotations.ts` ports kufrCleaner's indexOf-based text splitter
but emits **`mdxJsxTextElement` nodes, not raw `html` nodes** — plugin-emitted
`html` nodes are unparsable in the fumadocs MDX pipeline
(`MODULE_UNPARSABLE`), and JSX text children need no escaping. Headings are
skipped (same constraint as wikilinks: fumadocs wraps heading content in its
own anchor). `components/rough-annotations.tsx` ports kufrCleaner's
annotations-client: annotates `#nd-page .rough-ann` spans (scoped so link-
preview clones are never annotated), re-runs on navigation, theme flips
(colors are the `--ann-*` CSS vars in `app/global.css`), and resize; animation
is disabled under reduced motion.

Caveat: the five delimiter pairs are reserved in note prose — in particular
`((…))` will annotate any double-parenthesized text.
