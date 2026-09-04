---
name: affine-publisher
description: Operate and extend an AFFiNE-to-Fumadocs publishing site, including homepage content, multilingual locales, snapshot refreshes, safe authoring syncs, staging, validation, and diagnosing stale or missing published content. Use for this repository's publishing workflow; do not use for generic Next.js work unrelated to AFFiNE content.
---

# AFFiNE Publisher

Treat AFFiNE as the editable source and the generated snapshot as immutable
build input:

```text
AFFiNE → local MCP bridge → affine/<locale>/ → content/ + public/ → Fumadocs
```

## Non-negotiable invariants

- Never hand-edit generated `content/`, `public/`, or `affine/<locale>/` output.
- Visitors never query AFFiNE or receive its credentials.
- Keep the long-running bridge read-only. Explicit authoring commands start a
  short-lived `authoring` bridge through `scripts/run-affine-authoring.ts`.
- Never print `.env.publisher`, cookies, bearer tokens, or bridge tokens.
- Do not use `publisher:sync-site -- --overwrite` unless the user explicitly
  asks to replace existing AFFiNE homepage tables.
- Preserve unrelated changes in the dirty worktree.

## Route the task

- For homepage fields, locale onboarding, publication properties, or exact
  commands, read [references/operations.md](references/operations.md).
- For application behavior, inspect the relevant implementation rather than
  assuming an Obsidian-era path still applies.

## Standard workflow

1. Inspect `affine/locales.config.json` and the relevant publisher code.
2. Make source/configuration changes; do not patch derived snapshots.
3. For an explicit AFFiNE mutation, use the existing `publisher:sync-*`,
   `publisher:seed-*`, or migration command. Those commands provide the
   short-lived authoring bridge automatically.
4. Refresh all locale snapshots and stage the active locale:

   ```bash
   pnpm generate:affine:all
   pnpm stage
   ```

5. Verify the affected page through the running development server and ensure
   `_site/*` control documents did not become public routes.
6. Run proportionate gates; before handoff run:

   ```bash
   pnpm test
   pnpm types:check
   pnpm lint
   git diff --check
   ```

When content looks stale, distinguish the three states: AFFiNE source, generated
`affine/<locale>` snapshot, and currently staged `content/` tree. A successful
change in one layer does not imply the next layer refreshed.
