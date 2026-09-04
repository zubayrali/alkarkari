# AFFiNE → Karkari Fumadocs publication specification (historical)

> Superseded for active publishing by
> [AFFiNE Fumadocs Publisher v0.1](./affine-fumadocs-publisher-v0.1.md).
> This document records the original import/snapshot design. Its YAML-body and
> official-MCP details are not the current authoring or polling contract.

Status: implemented and production-build verified for document snapshots. Rich AFFiNE
objects remain phased work.

## Purpose

Use the imported AFFiNE workspace as the authoring source while preserving the
existing Karkari Fumadocs application, its routes, visual design, search, graph,
backlinks, LLM endpoints, locale builds, and specialized reading components.

The public site is a derived publication snapshot. AFFiNE remains the collaborative
source of truth; Fumadocs never needs a browser session and never queries AFFiNE per
visitor request.

## Architectural decision

Fumadocs recommends cloning or snapshotting remote content before prerendering so a
build does not repeatedly fetch the remote source. Accordingly, this integration
uses a local generated tree:

```text
AFFiNE workspace
  → official workspace MCP (read-only)
  → scripts/generate-affine.ts
  → affine/<locale>/{content,public,manifest.json,diagnostics.json}
  → CONTENT_SOURCE=affine scripts/stage.ts
  → existing Fumadocs MDX loader and alkarkari frontend
```

The separate `alkarkari` repository is retained as a frozen rollback copy. This
fork defaults to the AFFiNE snapshot; its legacy locale tree is only an explicit
comparison mode (`CONTENT_SOURCE=obsidian`).

## Supported interface boundary

The initial implementation only uses the official workspace MCP endpoint and its
`read_document` tool. It does not depend on AFFiNE's internal GraphQL API, database
schema, browser cookies, or Yjs binary endpoints.

The MCP currently cannot enumerate a workspace. Discovery therefore starts from:

- `AFFINE_MANIFEST_DOC_ID`, or
- `AFFINE_PUBLISH_DOC_IDS` (comma-separated), or
- both.

The generator traverses AFFiNE document links from those seeds. Traversal discovers
candidates; publication still requires explicit `publish: true` metadata.

## Authoring contract

Every publishable AFFiNE page begins with YAML frontmatter in the document body:

```yaml
---
title: The Wird
slug: dictionary/wird
locale: en
publish: true
description: The daily litany of the Tariqa Karkariya.
tags:
  - practice
  - daily
aliases:
  - zikr-al-wird
order: 20
featured: false
arabic: ورد
root: و ر د
related:
  - Dhikr
---
```

AFFiNE's rich-text editor interprets the two `---` delimiters as Markdown blocks.
The MCP export therefore represents the first metadata line as a level-two heading
and the remaining lines as indented text. The adapter accepts both canonical YAML
frontmatter and this observed AFFiNE export shape; authors can paste the canonical
form above directly into a new page.

Required for publication:

- `publish: true`
- A title from `title` or the first H1
- A unique slug from `slug`, or a generated slug from the title

Optional fields pass through to the existing Fumadocs schema. `draft: true`
overrides `publish: true`. `locale` defaults to the generation locale.

## URLs and hierarchy

`slug` is the stable public identity. AFFiNE document IDs are stored as
`affineDocId` metadata but never form the public URL. A page whose slug prefixes
child slugs is emitted as a folder `index.mdx`; other pages are emitted as leaf
MDX files. Internal AFFiNE links are rewritten to public slug URLs when the target
is included in the snapshot.

Duplicate slugs are blocking errors. Links to unpublished pages remain visible in
diagnostics and are not silently redirected.

## Publication safety

- Generation writes to a temporary directory and swaps it into place atomically.
- The Obsidian-generated locale trees are never deleted by AFFiNE generation.
- Secrets are read from `.env.affine`, which is ignored by Git.
- Blocking diagnostics abort the snapshot.
- Unsupported or unavailable content emits warnings instead of disappearing.
- Builds consume a reproducible local snapshot, not live AFFiNE state.

## Feature mapping

| Existing Karkari feature | AFFiNE snapshot treatment |
| --- | --- |
| Documents | MCP Markdown → sanitized MDX |
| Arbitrary properties | YAML frontmatter passthrough |
| Tags | `tags` metadata; existing tag generator retained |
| Aliases | `aliases` metadata; existing redirect index retained |
| Wikilinks/backlinks | AFFiNE document links rewritten by stable slug |
| Search/LLM routes/RSS/sitemap | Existing Fumadocs consumers retained |
| Locales | One generation run and AFFiNE manifest per locale |
| Attachments | Local imported assets publish; MCP-only blobs remain unavailable |
| Databases | Uploaded for preservation; native AFFiNE rendering awaits a supported export |
| Edgeless canvas | Native geometry/objects await a supported export |
| Legacy Canvas/Bases | Preserved in the imported corpus; not represented as AFFiNE-native objects |

## Known constraints

The official MCP exposes text but not workspace enumeration or attachment bytes.
It also flattens some AFFiNE-native blocks into Markdown/HTML. The generator strips
AFFiNE-only span wrappers and records inaccessible `blob://` images. Database and
Edgeless fidelity must be implemented from a supported export shape; this project
does not couple production builds to internal storage formats.

## Acceptance criteria

1. The 114-document imported English corpus generates valid MDX.
2. Every mapped document ID is verified unique and resolves to its source path.
3. Stable slugs, metadata, imported wikilinks, and AFFiNE links survive generation.
4. Duplicate slugs or MCP read failures fail the generation.
5. Unsupported MCP blobs produce a visible warning and diagnostic.
6. The AFFiNE snapshot is the default staged content source.
7. Existing Fumadocs routes compile and statically export against the staged AFFiNE content.

The vertical-slice verification page is AFFiNE document
`XboK27QPLAogN7ou7Psc3` in workspace `9ce702a7-9abb-417c-a3b8-203b3b553365`.
