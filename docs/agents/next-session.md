# Next-session brief (updated 2026-07-02 — session 2)

Read first: `CLAUDE.md`, `docs/superpowers/specs/2026-07-02-i18n-design.md`
(v2 — isolated builds), `docs/superpowers/plans/2026-07-02-i18n.md`, `DESIGN.md`.

## LIVE

The site is deployed: **https://zubayrali.github.io/alkarkari/**
(root chooser → `/en/ /fr/ /cn/`). Matrix build + stitch works; Pages Source is
already set to GitHub Actions. Verified live: chooser, per-locale homes,
cross-locale pages, legacy redirect stubs, per-locale search index, OG/RSS/
sitemap.

## Uncommitted — finish before / with the next deploy

A batch sits in the working tree, NOT yet committed:

- Task 7 (a11y/perf), Task 9 (parity report), Task 4 fr/cn featured, and the
  fr/cn seeds regenerated from their new vaults.
- **Blocked on the user**: add `featured: true` to the en vault note
  `articles/what-is-the-tariqa.md` in Obsidian (the agent cannot write the
  vault — see footgun). Then `pnpm generate --locale=en` and ship the whole
  batch in one push. (While in that note, also delete the stray `Q: Don kon
  hai` review card from the vault copy so it never regenerates.)

## Done this session (don't redo)

- **First deploy** (was task 3): multi-locale matrix + stitch, live + verified.
- **Task 1 verify**: full toolchain green (types:check / lint / test /
  build:all) + live smoke of switcher path-preservation, 404→start-here,
  legacy stubs, hydration, view transitions.
- **Task 7 a11y/perf**: `--kk-gold-ink #8f5518` (AA 5.1:1) for meaningful gold
  text on ivory — bright `--kk-gold` stays decorative / on-dark; shimmer
  switched filter→opacity (121 tiles, compositor-only); CJK search encoder
  (cn: latin words + CJK uni/bigrams; en/fr keep `forward`); DESIGN.md §6
  contrast claim corrected.
- **Task 9 parity**: `pnpm locales:report` — warn-only slug diff across
  `locales/*/content` (en 105 vs fr/cn ~12).
- **Task 4 featured**: reused the existing "What is the Tariqa?" intro article
  as the featured note; fr/cn seed articles marked `featured: true` (cards
  verified). en pending (see Uncommitted).
- **fr/cn vaults**: created at `~/Documents/alkarkarivault-{fr,cn}` (en's
  `.obsidian` config copied in), wired `OBSIDIAN_VAULT_PATH_{FR,CN}` in `.env`;
  vault→generate round-trip verified. `pnpm generate:all` now covers all three.
- **base-test / Untitled.canvas** — DECISION: these are intended demos of Base
  + canvas support; keep them published. The old "regression" task is wontfix;
  generate.ts has NO special exclusions for them.
- **History scrub**: removed a stray test review-card ("Don kon hai…") from the
  deploy commit via amend + force-push + reflog gc; redeployed clean.
- **Housekeeping**: `/artifacts`, `/site`, `/.recall/` gitignored (build
  outputs were polluting `pnpm lint`).

## Remaining tasks

1. **en featured note** — user adds `featured: true` in the vault, then regen
   en + deploy the batch (see Uncommitted).
2. **`/review` aggregator page** — `lib/review-store.ts` was built for it: all
   due spaced-repetition prompts across the notebook on one page.
3. **Bases v2 backlog** (`.scratch/bases/`, ready-for-agent): formulas →
   summaries → board/calendar/map views; notes-index chunking only past
   ~200KB gzipped.
4. **Locale scale-out**: es/tr/ur strings in `lib/locale.ts` + manifest +
   deploy.yml matrix + `deploy/root/{index,404}.html` (4 places, manual sync —
   consider generating the deploy/root lists in the stitch step from the
   artifacts). Then the **RTL package gating Arabic** (plan phase 4):
   `<html dir>` plumbing exists; audit physical→logical CSS in the sidenotes
   margin engine, properties panel, canvas controls, reader-mode exit bar,
   karkari-theme, nav-progress; Amiri as `ar` body face.
5. **cn search quality** — the CJK encoder is in place but untestable until a
   real cn vault has content; re-check recall once cn grows.
6. **Translate more fr/cn** — the new vaults are seed-only (~12 notes each);
   `pnpm locales:report` shows the gap vs en (105).
7. **Docs sweep**: README + CONTRIBUTING likely still describe the pre-i18n
   flow (unsuffixed env vars, committed `content/`); quiet or document the
   harmless "failed to resolve X wikilink" generation noise; later remove
   legacy redirect stubs after a deprecation window. (CLAUDE.md is current,
   incl. `locales:report`.)

Deliberately DROPPED with v2 (don't resurrect without a decision):
cross-locale English fallback + "not translated" banner, hreflang pairing,
slug-parity ENFORCEMENT, `app/[lang]` routing, locale middleware.

## Footguns (hard-won)

- **The agent cannot write the Obsidian vaults** (`~/Documents/alkarkarivault`
  and the new `-fr`/`-cn`) — auto-mode blocks out-of-repo vault writes and
  CLAUDE.md forbids modifying Obsidian files. en/fr/cn content changes = user
  edits the vault, then `pnpm generate --locale=<x>`.
- NEVER route a page at `/index` — static servers normalize a bare trailing
  `index` segment (`serve`: `/cn/index` → `/cn/`); `trailingSlash: true` was
  tried and reverted ("out of whack").
- Locale switcher links must stay plain `<a>`; next/link prepends the current
  build's basePath and traps readers in one locale.
- `content/`+`public/` are staging — edit `locales/<x>/` or the vault, never
  the staged copies.
- `preservedFiles` in `scripts/generate.ts` = `index.mdx`, `graph.mdx`,
  `start-here.mdx` (top-level). Everything else is swept per generate.
- Keep in sync manually: `lib/locales-manifest.ts` ⇄ `deploy.yml` matrix ⇄
  `deploy/root/*.html` locale lists ⇄ `404.html` labels map.
- `--kk-gold` (#b9803a, 2.9:1 on ivory) is DECORATIVE only; use `--kk-gold-ink`
  for any meaningful gold text on light backgrounds (AA).
