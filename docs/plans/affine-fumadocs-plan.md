# AFFiNE → Karkari implementation plan (historical)

> The active extraction/release plan is
> [AFFiNE Fumadocs Publisher productization](./affine-fumadocs-publisher-productization.md).
> This plan remains as a record of the Alkarkari cutover.

Status: cutover complete for the imported English document corpus. The `affine-cutover`
branch publishes AFFiNE by default; the original repository remains an untouched
rollback copy.

## Phase 1 — publication spine (implemented)

- Define the normalized AFFiNE publication types.
- Add a minimal MCP JSON-RPC client for `read_document`.
- Parse YAML frontmatter and sanitize MCP Markdown for MDX.
- Discover linked documents from explicit seed/manifest IDs.
- Require explicit `publish: true`; respect locale and draft state.
- Rewrite published AFFiNE links to stable public slugs.
- Generate an atomic `affine/<locale>` snapshot with diagnostics.
- Allow the existing stage command to select Obsidian or AFFiNE content.
- Add focused parser/link/sanitization tests.

## Phase 2 — Karkari parity (document corpus complete)

- Migrate the canonical English notes into AFFiNE with the publication contract. ✅
- Generalize tag and Base-derived listing generation to normalized snapshot data.
- Preserve aliases, terminology properties, citations, sidenotes, annotations,
  transclusions, slides, RSS, sitemap, search, graph, and LLM endpoints. ✅
- Verify all imported source paths against the checked-in AFFiNE ID map. ✅
- Treat `CONTENT_SOURCE=obsidian` as a rollback/comparison switch, not a normal
  publishing workflow. ✅

Exit gate: complete. The production build generates 115 AFFiNE documentation pages
and static route smoke tests pass for representative notes, testimony, and slides.

## Phase 3 — native attachments and databases (future)

- Select a supported AFFiNE authentication/export path for attachment bytes.
- Copy assets into the locale snapshot with content-addressed filenames.
- Add typed normalized database/table/kanban structures.
- Render supported database views through existing Karkari components.
- Preserve an explicit fallback for unsupported formulas or views.

Exit gate: image, audio, video, PDF, table, and kanban fixtures build offline from
the generated snapshot.

## Phase 4 — native Edgeless canvas (future)

- Capture the supported AFFiNE edgeless export shape and version it as a fixture.
- Decide per object between native rendering, safe AFFiNE embedding, and static
  preview fallback.
- Build a renderer adapter without conflating AFFiNE Edgeless with Obsidian JSON
  Canvas.
- Do not infer native AFFiNE geometry from legacy Canvas JSON.

Exit gate: canvases retain layout, text, links, groups, and supported media, with
accessible non-canvas fallbacks.

## Phase 5 — cutover and operations (complete / ongoing)

- Imported 114 notes and 20 media files through AFFiNE's Markdown/media importer. ✅
- Generated and verified the 114-entry AFFiNE document map. ✅
- Switched the fork's default commands and production build to AFFiNE. ✅
- Retain encrypted AFFiNE backups and monitor scheduled snapshot builds. ⏳
- Keep the original repository immutable as rollback; do not delete its source vault. ✅

## Commands

```bash
cp .env.affine.example .env.affine
AFFINE_LOCALE=en pnpm generate:affine
CONTENT_SOURCE=affine SITE_LANGUAGE=en pnpm stage
CONTENT_SOURCE=affine SITE_LANGUAGE=en pnpm types:check
pnpm lint
CONTENT_SOURCE=affine SITE_LANGUAGE=en pnpm build
```
