---
name: add-locale
description: Add a new language/locale to the site (e.g. es, tr, ur, ar). Use when the user says "add Spanish", "new locale", "support another language", or starts the es/tr/ur scale-out. Encodes the 4-place manual-sync footgun.
---

# Add a locale

Adding locale `<x>` (two-letter code, lowercase) requires ALL of these steps.
A missed step fails silently at deploy time, not at build time.

## User-side prerequisites (agent CANNOT do these)

1. **Create the vault**: copy `~/Documents/alkarkarivault`'s `.obsidian/`
   folder into `~/Documents/alkarkarivault-<x>`, author at least a few notes.
   The agent cannot write Obsidian vaults (auto-mode blocks out-of-repo
   writes; CLAUDE.md forbids it).
2. Confirm the vault path with the user before proceeding.

## Repo-side steps (agent does these, in order)

3. `.env`: add `OBSIDIAN_VAULT_PATH_<X>=/Users/fxwalken/Documents/alkarkarivault-<x>`
   (uppercase suffix).
4. `lib/locales-manifest.ts`: add `{ code, label, dir }` — label in the
   language's own script (native label), `dir: 'rtl'` for ar/ur/fa/he.
5. `lib/locale.ts`: add a complete `<x>` UI-strings block including the
   nested `home` block. TypeScript enforces key parity — `pnpm types:check`
   fails until every key exists. Translate meaningfully; never leave English
   placeholders in a shipped block.
6. `.github/workflows/deploy.yml`: add `<x>` to the build matrix.
7. `deploy/root/index.html` AND `deploy/root/404.html`: add `<x>` to the
   locale chooser list and the labels map. (These two + the manifest + the
   matrix are the 4-place manual sync — verify all four agree before commit.)
8. Hand-write `locales/<x>/content/start-here.mdx` (the per-language notebook
   index page — cultural context, not a copy of the shell home) and
   `locales/<x>/content/graph.mdx` (frontmatter `full: true`). These are the
   only files `pnpm generate` preserves.
9. `pnpm generate --locale=<x>` → commit `locales/<x>/{content,public}`.
   CI has no vault access; generated content must be committed.
10. Gates: `pnpm types:check && pnpm lint && pnpm test`, then `pnpm build:all`
    and spot-check `site/<x>/` with `npx serve site`.

## RTL locales (ar, ur, …)

`<html dir>` plumbing exists via the manifest, but do NOT ship an RTL locale
before the physical→logical CSS audit: sidenotes margin engine + rail,
properties panel, canvas controls, reader-mode exit bar, karkari-theme,
nav-progress. Body face for `ar`: Amiri. (See plan phase 4 in
`docs/superpowers/plans/2026-07-02-i18n.md`.)

## Verify after deploy

- Root chooser lists the new locale; `/​<x>/` home renders.
- Language switcher on an existing locale links into `/<x>/…` and disabled
  states are correct.
- A wrong URL under `/<x>/` redirects to `/<x>/start-here` via the root 404.
