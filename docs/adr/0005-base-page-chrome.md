# Base pages suppress the actions bar and prev/next footer via a `base: true` frontmatter flag

`.base`-generated pages (and the auto-generated folder-index pages that also render `BasesPageContent`) inherited the same Fumadocs `DocsPage` chrome as regular notes: a copy-markdown button, an "open in" popover (Obsidian/GitHub/raw markdown), and a prev/next page footer driven by sidebar order.

None of these make sense for a Base page. There's no single "document" to copy or open — the page is a generated table/gallery/list view over many notes. The prev/next footer surfaces an arbitrary sidebar-adjacent page as a "recommended reading" suggestion, which is misleading on what is effectively an index/listing page.

We considered detecting Base pages by URL/slug pattern in the page component, but that couples the route handler to generation conventions (folder-index vs explicit `.base` slugs differ) and would break if either changes independently. Instead, `scripts/generate-base-pages.ts` stamps `base: true` into the frontmatter of every page it writes, `source.config.ts` declares this as an optional boolean on the docs schema, and `app/(docs)/[...slug]/page.tsx` reads `page.data.base` to:

- skip rendering the `MarkdownCopyButton` / `ViewOptionsPopover` bar
- pass `footer={{ enabled: false }}` to `DocsPage`, dropping the prev/next cards

This generalizes: any future page "kind" that needs different chrome (e.g. a different generated page type) can add its own boolean frontmatter flag and branch in the same place, without the route component needing to know how slugs are constructed.
