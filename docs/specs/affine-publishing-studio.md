# AFFiNE Publishing Studio

Status: active implementation spec  
Source of truth: AFFiNE workspace  
Reader delivery: immutable Fumadocs snapshot

## Product promise

The Publishing Studio turns AFFiNE collections and native document properties into a dependable publishing control plane. Editors organize and review content in AFFiNE; the publisher compiles that state into static Fumadocs pages, reusable portal data, and a local release-readiness dashboard. A reader request never depends on AFFiNE, the MCP bridge, a session cookie, or a second CMS database.

```text
AFFiNE documents + collections + properties
                  │
                  ▼
        deterministic snapshot compiler
          ├─ content/**/*.mdx
          ├─ public assets and Canvas data
          ├─ public/affine-publishing.json
          ├─ manifest.json
          ├─ diagnostics.json
          └─ studio.json (development only)
                  │
                  ▼
          Fumadocs reader experience
```

## Core invariants

1. `Publish=true` and `Draft!=true` are both required before a document can enter a public snapshot.
2. Draft titles, bodies, and arbitrary properties never enter `public/affine-publishing.json`.
3. Portal properties use an explicit allow-list per portal. Secrets and AFFiNE account data are never copied by default.
4. Production renders from the last complete atomic snapshot. Live AFFiNE availability cannot break readers.
5. Every published page belongs to exactly one configured language collection and its `Locale` agrees with that collection.
6. A `Translation Key` may occur only once per locale.
7. Required release failures are errors; editorial incompleteness is a warning unless the configured contract says otherwise.
8. Reusable publisher code contains no Alkarkari category assumptions. Site-specific collection names, routes, fields, and layouts live in `affine/publishing.config.json`.

## Configuration contract

Each portal declares:

- stable `id` and public `route`;
- AFFiNE `collection` used as its editorial membership source;
- optional locale and slug-prefix filters;
- presentation `layout`: `cards`, `library`, `list`, `media`, or `timeline`;
- an allow-list of native AFFiNE properties safe to publish;
- whether a missing source collection blocks a release.

Language collections remain validation boundaries. A portal may use a language collection plus `slugPrefix` during migration, then move to a dedicated rule-driven collection without changing its public route.

## Generated contracts

### Public portal snapshot

`public/affine-publishing.json` contains only published pages and allow-listed display metadata. Components use it for collection landing pages. The Books shelf is the first end-to-end consumer.

### Studio snapshot

`affine/<locale>/studio.json` contains counts, collection health, portal coverage, and diagnostics. It is read only by `/publishing`, which returns 404 in production. Drafts are represented as aggregate counts, not public content.

### Manifest

`manifest.json` remains the release and rollback ledger. Its page records carry safe summary fields needed by tooling without parsing MDX.

## Editorial diagnostics

Initial checks cover:

- missing, multiple, or mismatched language-collection membership;
- duplicate `Translation Key + Locale` pairs;
- missing recommended Description or Translation Key;
- missing configured portal collections and empty required portals;
- existing compiler failures such as duplicate slugs, broken reads, unavailable blobs, Canvas failures, and discovery limits.

Later iterations should add translation coverage, link integrity summaries, media rights/review rules, scheduled publishing, per-page preview links, and webhook-triggered rebuilds.

## Acceptance criteria

- A configured collection produces deterministic ordered portal entries.
- Only explicitly allowed properties appear in the public portal snapshot.
- A draft in a portal collection cannot appear in public JSON or Fumadocs routes.
- Language mismatches and duplicate translations block snapshot replacement.
- `/publishing` shows freshness, totals, portal coverage, collections, and actionable diagnostics in development.
- `/publishing` is unavailable in production.
- Books render from generated portal data while retaining the current visual component.
- Unit tests, TypeScript, lint, and the production build pass.

## Deliberately deferred

- A separate database or authentication service.
- Public draft-preview URLs.
- Browser requests directly to AFFiNE or MCP.
- Reimplementation of AFFiNE's editor inside Fumadocs.
- Publishing arbitrary properties without an allow-list.
