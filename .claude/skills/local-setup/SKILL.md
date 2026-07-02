---
name: local-setup
description: Set up this repo on a fresh machine or for a new contributor — install, .env, vaults, generate, dev server. Use when onboarding, when the dev environment is broken, or when types:check/dev fails mysteriously on a fresh clone.
---

# Local setup

## Prerequisites

- Node 20+, pnpm (`corepack enable`).
- The Obsidian vaults (content source). Without vault access you can still
  build: `locales/*/{content,public}` are committed — skip generation and go
  straight to `pnpm stage en && pnpm dev`.

## Steps

1. `pnpm install`
2. Create `.env` at the repo root:

       OBSIDIAN_VAULT_PATH=/Users/<you>/Documents/alkarkarivault
       OBSIDIAN_VAULT_PATH_FR=/Users/<you>/Documents/alkarkarivault-fr
       OBSIDIAN_VAULT_PATH_CN=/Users/<you>/Documents/alkarkarivault-cn
       SITE_LANGUAGE=en
       GENERATE_INCLUDE=

   `PAGES_BASE_PATH` stays unset locally (site serves at `/`; the locale
   switcher hides itself because sibling builds don't exist in dev).
3. If you have the vaults: `pnpm generate:all` (or `pnpm generate --locale=en`).
4. `pnpm dev` → http://localhost:3000 (stages `SITE_LANGUAGE` first).
5. Sanity: `pnpm types:check && pnpm lint && pnpm test`.
6. Full multi-locale preview (mirror of CI): `pnpm build:all` → `npx serve site`.

## Traps on a fresh clone

- `pnpm types:check` with an empty `content/` produces unrelated-looking type
  errors — the fumadocs-mdx codegen ran over nothing. Stage or generate first.
- `content/` and `public/` are gitignored staging, fully wiped by every
  generate. Never hand-edit them; edit `locales/<x>/` or the vault.
- Changed `SITE_LANGUAGE` or `instrumentation-client.ts`? Restart the dev
  server.
- `pnpm generate -- --select` re-picks which vault folders are included
  (saved to `GENERATE_INCLUDE_<LOCALE>`).
- `pnpm obsidian` opens the configured vault in Obsidian.
