# AFFiNE multilingual publishing

## Decision

Alkarkari uses one AFFiNE workspace for every language. AFFiNE is the authoring
source of truth; the former English, French, and Chinese Obsidian vaults are
migration inputs and rollback archives, not live publishing sources.

Each language is generated as an isolated immutable snapshot and static build:

```text
one AFFiNE workspace
  ├─ Locale=en → affine/en → /en
  ├─ Locale=fr → affine/fr → /fr
  └─ Locale=cn → affine/cn → /cn
                    │
                    └─ Translation Key → localized route switcher + hreflang
```

This keeps collaboration centralized while preventing one language's missing or
invalid content from changing another language's routes.

## Native AFFiNE model

Every public document has these custom properties:

| Property | Purpose |
| --- | --- |
| `Title` | Reader-facing title |
| `Slug` | Locale-specific URL without a leading slash |
| `Locale` | Canonical publisher partition: `en`, `fr`, or `cn` |
| `Translation Key` | Stable identity shared by all translations of one concept |
| `Publish` | Explicit permission to include the document |
| `Draft` | Editorial hold; wins over `Publish` |
| `Description` | Search, preview, and metadata summary |

Language tags (`lang:en`, `lang:fr`, `lang:cn`) drive AFFiNE collections for
editorial browsing. They intentionally duplicate `Locale`: tags are convenient
for humans and collection rules, while the typed property is deterministic for
the publisher.

## Translation workflow

1. Open the source document and copy its `Translation Key`.
2. Duplicate the document in the same AFFiNE workspace.
3. Set the translated `Title`, `Locale`, and localized `Slug`.
4. Keep the copied `Translation Key` unchanged.
5. Add the corresponding `lang:<locale>` tag.
6. Leave `Draft` checked while translating; check `Publish` and clear `Draft`
   when ready.

Slugs do not need to match. For example, the same Translation Key can connect:

```text
/en/articles/what-is-the-tariqa
/fr/articles/quest-ce-que-la-tariqa
/cn/articles/shenme-shi-daocheng
```

If a translation does not exist, no fake page is generated. The locale switcher
uses the generated route index when a translation exists and otherwise retains a
same-path fallback. Search indexes, graphs, feeds, and navigation are built
independently from each locale snapshot.

## Configuration

`affine/locales.config.json` is the canonical locale registry. Each locale
declares its route code, BCP 47 language tag, writing direction, search language,
label, AFFiNE tag, and collection. Its `translations` section is only needed to
bootstrap legacy notes whose localized slugs differ before native Translation Keys.

The runtime manifest, development switcher, static root chooser, and GitHub
Actions matrix all derive from this file. Adding a language does not require a
React, HTML, or workflow edit. Set its legacy `sourceEnv` only when performing
the one-time import.

## AFFiNE-managed homepage

Each locale has one control document with these native properties:

- `Content Type`: `Site Homepage`
- `Locale`: locale code
- `Slug`: `_site/homepage`
- `Translation Key`: `site/homepage`
- `Publish`: checked
- `Draft`: unchecked

The document body is a native two-column `Field | Value` table. Dot paths map
rows into the typed homepage model; numeric path segments describe list items.
The generator writes the compiled result to `affine/<locale>/site.json` and
`affine/<locale>/public/affine-site.json`, while excluding the control document
from reader pages, search, feeds, and the graph.

Run `pnpm publisher:sync-site` to create missing homepage documents and the
**Site · Homepage** collection. Existing content is preserved unless the
explicit `--overwrite` flag is supplied. Missing fields inherit the bundled
fallback and emit diagnostics instead of breaking the build.

For a new locale, add its single configuration entry, run
`pnpm publisher:sync-site`, then edit its homepage document in AFFiNE. Until a
complete application-string bundle is added, navigation and Fumadocs UI copy
fall back to English while the locale's AFFiNE homepage content remains native.

## Operations

Run a safe, idempotent metadata/collection reconciliation:

```bash
pnpm publisher:sync-locales
```

Refresh all AFFiNE snapshots and the cross-language route index:

```bash
pnpm generate:affine:all
```

Build and locally preview all languages:

```bash
pnpm build:all
npx --yes serve site -l 3000
```

The continuous publisher calls the all-language generator after a workspace
change. Production releases publish the stitched `site/` tree atomically and
retain earlier releases for rollback.

## Invariants

- A locale may not contain duplicate slugs.
- A public page must have `Publish=true`, `Draft=false`, a supported `Locale`,
  and a `Slug`.
- Translations share a Translation Key but may have different titles and slugs.
- Readers never query AFFiNE directly.
- Snapshots are derived output and can always be regenerated.
- Legacy vaults are never consulted during normal publishing.
