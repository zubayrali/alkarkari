# Alkarkari AFFiNE Publisher — Agent Context

This repository publishes a collaborative AFFiNE workspace as a multilingual
Next.js + Fumadocs knowledge base. AFFiNE is the editable source of truth;
generated snapshots are immutable build inputs. The old Obsidian trees are
rollback/import material only.

## Skills

- Use `.agents/skills/affine-publisher/SKILL.md` for AFFiNE content, homepage,
  locale, generation, staging, publishing, and stale-content tasks.
- Use `.agents/skills/visual-qa/SKILL.md` for visual regression work.
- Use `.agents/skills/ship/SKILL.md` for release/deployment work.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Stage the active locale and start Next on the first free port |
| `pnpm generate:affine:all` | Refresh every configured AFFiNE locale snapshot |
| `pnpm stage` | Stage one generated locale into `content/` and `public/` |
| `pnpm publisher:watch` | Run the continuous read-only publisher |
| `pnpm publisher:sync-site` | Safely create missing AFFiNE homepage controls |
| `pnpm publisher:sync-locales` | Reconcile language collections and metadata |
| `pnpm build:all` | Build and stitch every configured locale |
| `pnpm test` | Run Vitest |
| `pnpm types:check` | Stage, generate Fumadocs types, and run TypeScript |
| `pnpm lint` | Run Oxlint |

Before handoff, run `pnpm test`, `pnpm types:check`, `pnpm lint`, and
`git diff --check` in proportion to the change.

## Architecture

```text
AFFiNE workspace
  → loopback MCP bridge
  → affine/<locale>/ atomic snapshots
  → scripts/stage.ts
  → content/ + public/
  → Next.js/Fumadocs
```

- `affine/locales.config.json` is the single locale registry.
- `lib/affine/` owns the publication, homepage, canvas, database, and snapshot
  contracts.
- `scripts/generate-affine.ts` creates one locale snapshot;
  `scripts/generate-affine-all.ts` creates all locales and translation routes.
- `scripts/run-affine-authoring.ts` provides a short-lived write-capable bridge
  for explicit sync/seed commands. The long-running publisher remains read-only.
- `content/`, `public/`, and `affine/<locale>/` are generated. Never hand-edit
  them or store durable assets there.
- Visitors must never query AFFiNE directly or receive its credentials.

## Environment and secrets

Runtime publishing configuration lives in ignored `.env.publisher`. Never
print or commit cookies, MCP tokens, session identifiers, or bearer tokens.
`.env.publisher.example` documents supported variable names.

## Fumadocs reference

For Fumadocs-specific behavior, consult the current official documentation:

- `https://fumadocs.dev/llms.txt`
- `https://fumadocs.dev/llms-full.txt`
- `https://fumadocs.dev/llms.mdx/docs/<slug>/content.md`

## Critical footguns

- A successful AFFiNE edit is not a staged site update. Distinguish AFFiNE
  source, generated locale snapshot, and staged tree when diagnosing staleness.
- `Publish=true` and `Draft=false` are both required for a public document.
- `_site/*` control documents must never become reader routes.
- Never broaden the permanent bridge to authoring merely to make a sync command
  pass; use or repair the short-lived authoring wrapper.
- Do not use overwrite/reset flags without explicit user authorization.
