# AFFiNE publisher operations

## Homepage content model

Homepage copy lives in the AFFiNE collection **Site · Homepage**. Each locale
has one control document titled `Homepage · <Language>` with:

| Property | Value |
| --- | --- |
| `Content Type` | `Site Homepage` |
| `Locale` | configured locale code |
| `Slug` | `_site/homepage` |
| `Translation Key` | `site/homepage` |
| `Publish` | checked |
| `Draft` | unchecked |

Its body contains a native two-column `Field | Value` table. Fields are paths
into the typed homepage object:

- `heroTagline`
- `home.intentionLead`
- `home.pathways.books.title`
- `home.story.mishkat.quran.0.text`

Numeric segments construct arrays. Missing fields inherit the bundled locale
JSON, falling back to English when that locale has no complete bundle. Unknown,
missing, and duplicate fields produce publishing diagnostics. The control
document must be excluded from public routes, navigation, search, graph, feeds,
and sitemap.

Relevant implementation:

- `lib/affine/site-content.ts` — parse, merge, validate, serialize
- `scripts/sync-affine-site.ts` — idempotently seed AFFiNE control documents
- `scripts/generate-affine.ts` — compile control documents into snapshots
- `lib/affine/publishing-snapshot.ts` — read the staged site snapshot
- `app/(home)/page.tsx` — prefer AFFiNE content with a safe fallback

Use `pnpm publisher:sync-site` to create missing control documents. Default
behavior preserves existing AFFiNE tables. After editing AFFiNE, run
`pnpm generate:affine:all && pnpm stage` for an immediate local refresh.

## Add a language

`affine/locales.config.json` is the only locale registry. Add one locale entry:

```json
{
  "code": "es",
  "label": "Español",
  "languageTag": "es",
  "dir": "ltr",
  "searchLanguage": "spanish",
  "tag": "lang:es",
  "collection": "Language · Español",
  "import": false
}
```

Use `dir: "rtl"` for right-to-left languages. `sourceEnv` and `import: true`
are only for a deliberate one-time legacy import; do not add them for a native
AFFiNE locale.

Then run:

```bash
pnpm publisher:sync-site
pnpm publisher:sync-locales
pnpm generate:affine:all
```

The runtime manifest, local switcher, root chooser, 404 page, and CI build
matrix derive from the registry. Do not edit their locale lists manually. A new
locale uses English application UI strings until `content-site/<code>.json` is
intentionally added, but its AFFiNE homepage content can be localized at once.

For translated pages, duplicate the source document in AFFiNE, change `Locale`,
`Title`, and localized `Slug`, and keep the same stable `Translation Key`.
`Publish=true` and `Draft=false` are required.

## Bridge modes

The background publisher service deliberately exposes a read-only tool surface.
Generation should use it. Repository authoring commands invoke
`scripts/run-affine-authoring.ts`, which starts an authenticated loopback bridge
on a free port, runs one command, and shuts it down.

If generation returns `401`, verify AFFiNE is running and the browser-derived
cookie in `.env.publisher` is current. If a direct write call reports that a
tool is unavailable, the command bypassed the authoring wrapper; fix the package
script rather than broadening the permanent bridge.

## Verification receipts

For a homepage change, verify:

- `affine/<locale>/site.json` has `source: "affine-mcp"` and `sourceDocId`.
- `affine/<locale>/public/affine-site.json` exists.
- No generated path under `content/` contains `_site`.
- The rendered homepage contains a distinctive edited value.
- `pnpm test`, `pnpm types:check`, and `pnpm lint` pass.

For a new locale, additionally run `pnpm build:all` when time and resources
permit and confirm the stitched root chooser contains the locale.
