# Keystatic Site Strings Design

**Date:** 2026-07-13  
**Status:** Approved for implementation by the user's request to implement the full handoff

## Goal

Add a development-only Keystatic editor for every hand-maintained localized
site string while preserving VaultPress's isolated static builds. The editor
manages English, French, and Chinese homepage copy, shared UI microcopy, and
the Mishkat scripture citations. It never manages vault-derived notes or
generated assets.

## Chosen Approach

Use one locale-keyed Keystatic collection named `site` backed by
`content-site/<locale>.json`. Each locale file contains one complete,
schema-identical string document. This keeps a locale atomic and gives the
editor one source of truth for structural parity.

Alternatives rejected:

- A homepage-only collection leaves the broader i18n request unresolved and
  keeps general UI strings embedded in TypeScript.
- Separate `home` and `ui` collections improve editor grouping slightly but
  split every locale across files and create a second synchronization path.

## Data Boundary

`content-site/en.json`, `content-site/fr.json`, and `content-site/cn.json` hold:

- general site UI strings currently maintained in `lib/locale.ts`;
- the full nested homepage string block;
- all three five-item Mishkat citation decks;
- translated Fumadocs UI overrides for French and Chinese.

Build metadata and executable values remain in TypeScript: locale label,
`htmlLang`, search tokenizer language, and Fumadocs translation constructors.
The existing vault content under `locales/<locale>/` remains generated from
Obsidian and is explicitly outside Keystatic.

## Type Safety

`lib/site-strings.ts` defines the explicit `SiteStrings`, `HomeStrings`, and
citation interfaces. Each JSON import is checked with `satisfies SiteStrings`
before being placed into the locale map. Consumers continue to call
`getSiteLanguage()` and access the same fields, so the migration does not
change component behavior.

The explicit interface and the Keystatic schema must describe the same nested
shape. Missing or malformed JSON fields fail TypeScript, while invalid editor
input is rejected by Keystatic.

## Development-Only CMS

`@keystatic/core` and `@keystatic/next` are development dependencies.
`keystatic.config.ts` declares local storage and the locale-keyed `site`
collection with JSON data.

The admin page and API handler use `.dev.tsx` / `.dev.ts` route extensions.
`next.config.mjs` includes those extensions only when
`NODE_ENV === 'development'`. Consequently:

- `pnpm dev` exposes `/keystatic` and its local API;
- `pnpm build` does not discover either route;
- production application modules never import `@keystatic/*`;
- the static export contains no Keystatic page or API output.

## Component Changes

The Mishkat component receives its three citation decks as props alongside
its localized labels. The homepage passes the decks from
`home.story.mishkatCitations`; the component no longer contains English copy.
Its interaction, timing, appearance, and accessibility behavior stay intact.

All other components keep their existing `getSiteLanguage()` and `home`
access patterns.

## Failure Handling

- A missing locale JSON file is a module-resolution/type-check failure.
- A locale with missing or incorrectly typed fields is a TypeScript failure.
- A malformed Keystatic write is prevented by its schema.
- Production route leakage is caught by inspecting the export and exercising
  `/keystatic` against the production server response.

## Verification

Acceptance requires all of the following:

1. Keystatic packages are development dependencies compatible with the
   installed Next.js and React versions.
2. `pnpm types:check` passes with all three JSON files checked against the
   explicit schema.
3. `pnpm lint` passes.
4. `pnpm build` completes as a static export.
5. `/keystatic` loads during `pnpm dev`, lists `en`, `fr`, and `cn`, and can
   read the locale documents.
6. The production export contains no Keystatic route or bundled Keystatic
   application import.
7. The home page still renders localized copy and the Mishkat uses the
   locale-owned citation decks.

