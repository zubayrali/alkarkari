---
name: ship
description: Release loop — regenerate affected locales, run all quality gates, commit, hand off the push, verify the live deploy. Use when the user says "ship it", "deploy", "push this", "release", or a content/code batch is ready to go live.
---

# Ship

Push to `main` = production deploy (GitHub Pages matrix build + stitch).

## Order matters

1. **Vault edits land first.** If the change involves vault content, the user
   must finish editing in Obsidian BEFORE regeneration. The agent cannot
   write vaults. Watch for Obsidian Text-typed booleans (`featured: 'true'`
   as a string) — schema coerces them, but tell the user to prefer Checkbox
   properties.
2. **Regenerate affected locales**: `pnpm generate --locale=<x>` per touched
   vault (or `pnpm generate:all`). Never edit `content/`/`public/` — they are
   gitignored staging; the committed truth is `locales/<x>/`.
3. **Gates** (all must pass): `pnpm types:check && pnpm lint && pnpm test`.
   If `types:check` shows bizarre unrelated errors, `content/` is probably
   empty — stage/generate first.
4. **Build**: `pnpm build` for a single-locale sanity check; `pnpm build:all`
   + `npx serve site` when the change affects locale stitching, the switcher,
   or `deploy/root`.
5. **Commit** with a descriptive message.
6. **Push is user-side**: the permission gate blocks the agent from pushing
   to `main`. End the turn telling the user exactly what `git push` will
   deploy. Do not attempt workarounds.
7. **Verify live** after the user pushes (Actions run takes a few minutes):
   - https://zubayrali.github.io/alkarkari/ — root chooser
   - `/en/`, `/fr/`, `/cn/` homes render, no basePath-broken assets
   - one changed page per affected locale
   - language switcher preserves the path across locales
   - search dialog returns results (per-locale index)

## Known traps

- `locales/<x>/{content,public}` must be committed — CI cannot generate
  (no vault access).
- Keep in sync if touched: `lib/locales-manifest.ts` ⇄ `deploy.yml` matrix ⇄
  `deploy/root/*.html` ⇄ 404 labels map.
- Route handlers need `export const dynamic = 'force-static'` or the export
  build fails.
- After changing `instrumentation-client.ts`, a dev-server restart is
  required (not relevant to CI, bites local verification).
