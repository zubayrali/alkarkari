# Next-session brief (written 2026-07-02)

Read first: `CLAUDE.md`, `docs/superpowers/specs/2026-07-02-i18n-design.md`
(v2 — isolated builds; v1's fumadocs-i18n routing was REJECTED),
`docs/superpowers/plans/2026-07-02-i18n.md`, `.scratch/bases/*.md`, `DESIGN.md`.

## State: what is DONE (don't redo)

From the 2026-07-02 audit:

- Recent-notes pipeline: `pnpm generate` emits `created`/`modified` from vault
  file stats; `components/home/relative-time.tsx` renders relative time
  client-side (no frozen build-time timestamps).
- `featured: true` frontmatter flag replaces the `/101/` regex (schema +
  `lib/home-data.ts`); card falls back to Dictionary.
- Homepage fully localized: all copy in `lib/locale.ts` `home` blocks
  (en/fr/cn); nothing hardcoded in `components/home/*`.
- CI gates: `types:check`/`lint`/`test` run per matrix leg before build.
- ADR-0001 marked superseded (password protection impossible on static
  export); CONTEXT.md "Protected page" → "Unlisted page".
- `buildGraph()` production-only module cache.
- Cusdis config in `lib/shared.ts` (`cusdisConfig`); `pageId` locale-prefixed.
- `gitConfig` placeholders fixed (`zubayrali/alkarkari`).
- CLAUDE.md rewritten and current (commands, dirs, deployment, env, footguns).

i18n (isolated builds — one vault per language, zero cross-locale coupling):

- `lib/locales-manifest.ts` (en/fr/cn) — single source; `deploy.yml` matrix
  and `deploy/root/*.html` locale lists mirror it BY HAND.
- `locales/<x>/{content,public}` committed; live `content/`+`public/` are
  gitignored staging via `pnpm stage <x>` (`.staged-locale` marker).
- `pnpm generate --locale=<x>` (suffixed env `OBSIDIAN_VAULT_PATH_<X>`,
  `GENERATE_INCLUDE_<X>`; unsuffixed = en fallback); `generate:all`;
  `build:all` (local mirror of CI matrix+stitch → `site/`, preview with
  `npx serve site`); `locales:migrate` (already run).
- Matrix deploy + `scripts/stitch-deploy.ts`: root chooser (`deploy/root/`),
  locale-aware `404.html` that auto-redirects untranslated URLs to that
  locale's `/start-here`, legacy flat-file redirect stubs, sitemap index.
- Locale switcher: `components/locale-switcher.tsx` — client `<details>`
  dropdown, docs-sidebar banner + home navbar, path-preserving, plain `<a>`
  only (never next/link). Disabled-with-hint in dev (no sibling builds).
- `/start-here` per locale: hand-maintained `content/start-here.mdx`
  (preserved by generate) — the notebook's index with per-culture framing.
  Home hero's 2nd CTA and first nav link point there.
- French locale complete (UI strings incl. fumadocs `ui` overrides + seeds);
  Chinese seeds; both vaults are SEED CONTENT ONLY (no real vaults yet).
- `"type": "module"` in package.json; `--local` typo flag now errors.
- graph-visited localStorage locale-prefixed; other keys deliberately NOT
  (content-hash/URL-keyed; documented in spec).

Deliberately DROPPED with v2 (do not resurrect without a decision):
cross-locale English fallback + "not translated" banner, hreflang pairing,
slug-parity ENFORCEMENT, `app/[lang]` routing, locale middleware.

## Task list (priority order)

1. **Verify end-to-end — nothing below matters until this is green.** The
   entire i18n implementation was written without a runnable toolchain.
   `pnpm types:check && pnpm lint && pnpm test`, then
   `pnpm build:all && npx serve site`. Exercise: locale switcher
   path-preservation (`/en/dictionary/wird` → fr), 404 → `/start-here`
   redirect (note: `serve` doesn't honor 404.html — GitHub Pages does),
   legacy stubs (`/dictionary/wird` → `/en/dictionary/wird`), root chooser
   remember/auto-forward, view transitions + sidebar persistence still intact
   (the ADR-0007/0009 CSS is fragile), RecentNotes hydration.
2. **REGRESSION — test content is live again.** The user's
   `pnpm generate --locale=en` (run against the real vault) re-imported
   `base-test/` (12 notes + Base, with tags polluting tag pages) and
   `untitled.mdx`/`Untitled.canvas` WITHOUT `unlisted: true`, and en's
   `notes-index.json` contains them. Fix at the SOURCE: add `unlisted: true`
   in the vault notes or drop them via `GENERATE_INCLUDE_EN`
   (`pnpm generate -- --select`), then regenerate. Also sweep rename stubs:
   `rm locales/*/content/library.mdx && rm -r locales/*/content/index`
   (or let the next generate clean them).
3. **First real deploy**: push, watch the matrix + stitch, confirm Pages
   settings (Source = GitHub Actions). Verify `/alkarkari/` chooser,
   `/alkarkari/<x>/` sites, search index per locale, OG/RSS/sitemap under
   subpaths.
4. **Featured note**: draft a "Karkariya 101" vault note with
   `featured: true` (the home card currently always falls back to
   Dictionary), or decide the card should target `/start-here`.
5. **`/review` aggregator page** — `lib/review-store.ts` was built for it:
   all due spaced-repetition prompts across the notebook on one page.
6. **Bases v2 backlog** (`.scratch/bases/`, all ready-for-agent):
   formulas → summaries → board/calendar/map views; notes-index chunking only
   past ~200KB gzipped.
7. **Accessibility/perf**: `--kk-gold #b9803a` on ivory ≈2.8:1 — FAILS AA for
   small gold labels/Arabic captions; DESIGN.md §6 wrongly claims AA (fix
   claim or colors). Muraqqaʿa mosaic: `kk-shimmer` animates `filter` on 121
   elements — profile low-end, consider `will-change`/opacity-based shimmer.
   Check `cn` search: flexsearch `tokenize: 'forward'` is weak for CJK —
   evaluate proper CJK tokenization.
8. **Locale scale-out**: es/tr/ur strings in `lib/locale.ts` + manifest +
   deploy.yml matrix + `deploy/root/index.html` & `404.html` lists (4 places,
   manual sync — consider generating the deploy/root locale lists in the
   stitch step from the artifacts instead). Then the **RTL package gating
   Arabic** (plan phase 4): `<html dir>` plumbing exists; audit physical→
   logical CSS in sidenotes margin engine, properties panel, canvas controls,
   reader-mode exit bar, karkari-theme, nav-progress; Amiri as `ar` body face.
9. **Optional parity report**: v2 dropped enforcement, but the path-preserving
   switcher works best when slugs match — a `pnpm locales:report` diffing
   slugs across `locales/*/content` (warn-only) would help teams converge.
10. **Docs sweep**: README + CONTRIBUTING likely still describe the pre-i18n
    flow (unsuffixed env vars, committed `content/`); quiet or document the
    harmless "failed to resolve X wikilink" generation noise; later, remove
    legacy redirect stubs after a deprecation window.

## Footguns (hard-won this session)

- NEVER route a page at `/index` — static servers normalize a bare trailing
  `index` segment (`serve`: `/cn/index` → `/cn/`); `trailingSlash: true` was
  tried and reverted ("out of whack") — don't retry it casually.
- Locale switcher links must stay plain `<a>`; next/link prepends the current
  build's basePath and traps readers in one locale.
- `content/`+`public/` are staging — edit `locales/<x>/` or the vault, never
  the staged copies.
- `preservedFiles` in `scripts/generate.ts` = `index.mdx`, `graph.mdx`,
  `start-here.mdx` (top-level names). Everything else is swept per generate.
- Keep in sync manually: `lib/locales-manifest.ts` ⇄ `deploy.yml` matrix ⇄
  `deploy/root/*.html` locale lists ⇄ `404.html` labels map.
