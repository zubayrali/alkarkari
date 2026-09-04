---
name: add-locale
description: Add a language to the AFFiNE-backed multilingual publisher. Use when adding or onboarding a locale, language collection, translated homepage, locale switcher entry, or deploy target. Do not use the obsolete multi-vault Obsidian workflow.
---

# Add an AFFiNE locale

Read `../affine-publisher/SKILL.md` and its
`references/operations.md` **Add a language** section, then follow that contract.

The essential invariant is that `affine/locales.config.json` is the only locale
registry. Do not manually edit `lib/locales-manifest.ts`, the development
allow-list, root/404 HTML links, or the GitHub Actions matrix.

Add one configuration entry with `code`, native `label`, `languageTag`, `dir`,
`searchLanguage`, AFFiNE `tag`, and `collection`. For a native AFFiNE language,
set `import: false` and omit legacy vault variables.

Bootstrap and verify with:

```bash
pnpm publisher:sync-site
pnpm publisher:sync-locales
pnpm generate:affine:all
pnpm test
pnpm types:check
pnpm lint
```

The new locale may use the English application interface fallback until a full
`content-site/<code>.json` bundle exists. Its homepage and documents should be
authored in AFFiNE immediately. Do not fabricate translated public pages when
only the interface fallback exists.
