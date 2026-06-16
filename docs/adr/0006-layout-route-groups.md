# `HomeLayout` and `DocsLayout` are sibling route groups, not nested

The home page (`/`) uses Fumadocs' `HomeLayout` (top navbar) per [ADR-0003](0003-home-page-as-shell-page.md). When it was introduced, `HomeLayout` became the *root* layout for the entire `(home)` route group, and a `DocsLayout` was nested inside it (at `(home)/[...slug]/layout.tsx`) to preserve sidebar chrome for every other page.

This nesting caused three problems on every non-home page:

- `HomeLayout`'s top navbar (title, nav links, search, theme, GitHub) rendered above `DocsLayout`'s own sidebar header, duplicating title/search/links.
- `DocsLayout`'s sidebar lost its native sticky positioning — it scrolled with the page because it was no longer a direct child of the root layout's scroll container.
- `DocsLayout`'s `links` (rendered inside its sidebar) duplicated the page-tree entries for the same sections (Dictionary, Books, Podcasts).

We considered stripping `DocsLayout`'s sidebar down to "purely navigational" (drop its title/search, keep only the page tree and collapse toggle) while keeping the nested structure. We rejected this — it fights Fumadocs' default chrome piece by piece and still leaves the navbar permanently visible on docs pages.

Instead, `app/(home)/[...slug]/` was moved to `app/(docs)/[...slug]/` — a sibling route group, not a child route. Route groups don't affect URLs, and `(docs)/[...slug]` (≥1 path segment) doesn't conflict with `(home)/page.tsx` (`/` exactly), so this is a pure file move:

- `(home)/layout.tsx` → `HomeLayout`, wraps only `/` (the hand-maintained shell page).
- `(docs)/[...slug]/layout.tsx` → `DocsLayout` with its default chrome (sticky sidebar, own title/search/collapse toggle, mobile-only header), wraps every other page.

This restores `DocsLayout` to its out-of-the-box behavior — sticky sidebar, no competing top navbar — for all generated content pages.

## `links` are layout-specific, not shared

`baseOptions()` (`lib/layout.shared.tsx`) previously included a shared `links` array (Dictionary/Books/Podcasts quick links). With `HomeLayout` and `DocsLayout` no longer nested, this array would render in *both* `HomeLayout`'s navbar *and* `DocsLayout`'s sidebar — the sidebar copy duplicates the page tree directly below it.

`baseOptions()` no longer sets `links`. The Dictionary/Books/Podcasts quick-link array is now passed as a `links` override only on `<HomeLayout>` in `app/(home)/layout.tsx`, where it's the navbar's only navigation aid (the home page has no sidebar). `DocsLayout` uses `{...baseOptions()}` unmodified — its page tree is the primary navigation, so it needs no extra links.
