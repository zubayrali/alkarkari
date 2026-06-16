# VaultPress — Agent Context

VaultPress publishes an Obsidian vault as a documentation site. Stack: Next.js + Fumadocs + React Flow.

## Before you start

- Read `CONTEXT.md` for canonical domain vocabulary (vault, note, canvas, page, generation, wikilink, etc.).
- Read any `docs/adr/` files that touch the area you're working in.

## Commands

| Command | Purpose |
|---|---|
| `pnpm generate` | Convert vault → site content (must run before dev if `content/` is stale) |
| `pnpm dev` | Local dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm types:check` | MDX codegen + TypeScript — run after any schema or content change |
| `pnpm lint` | Oxlint |

**Verify changes with:** `pnpm types:check && pnpm lint`

## Directory layout

| Path | What lives here |
|---|---|
| `content/` | Generated MDX. Fully deleted and rebuilt by `pnpm generate`. Only `index.mdx` and `graph.mdx` are hand-maintained. |
| `public/` | Generated static assets. Fully deleted and rebuilt by `pnpm generate`. No hand-maintained files. |
| `app/` | Next.js routes (`(home)/[[...slug]]/` catch-all; `api/` for auth and search) |
| `components/` | React components (`canvas-*.tsx`, `graph-*.tsx`, `protected-gate.tsx`) |
| `lib/` | Domain logic, no React |
| `scripts/` | Generation pipeline and vault opener |
| `docs/adr/` | Architecture Decision Records |

## Architecture

```
Obsidian vault
  ├── notes (.md)        → content/**/*.mdx
  └── canvases (.canvas) → content/canvas/*.mdx  (MDX wrapper, routed by Fumadocs)
                         → public/canvas/*.canvas (raw JSON, fetched by canvas viewer at runtime)
                                        ↓
                               Next.js + Fumadocs site
```

Generation (`pnpm generate`) is read-only on the vault.

## Key files

| File | Role |
|---|---|
| `source.config.ts` | Content schema: `tags`, `protected` fields; MDX plugins (wikilinks, Mermaid, math) |
| `lib/source.ts` | Page loader; `resolvePage` (slug resolution); `getLLMText` |
| `lib/protected.ts` | Page gating: `pageRequiresAuth`, `hasProtectedAccess`, `filterPageTree` |
| `lib/build-graph.ts` | Builds graph data from pages and wikilink references |
| `lib/remark-wikilinks.ts` | Transforms `[[wikilinks]]` into internal links at build time |
| `lib/canvas-types.ts` | Canvas data types (`CanvasNode`, `CanvasEdge`, `CanvasData`) |
| `scripts/generate.ts` | Generation entry point |
| `scripts/generate-canvas-pages.ts` | Canvas-specific generation (copies raw JSON, writes MDX wrappers) |

## Environment variables

| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault. Required for generation, not used at runtime. |
| `SITE_LANGUAGE` | UI locale: `en` (default) or `cn` |
| `GENERATE_INCLUDE` | Comma-separated top-level vault folders/files to include in generation |
| `SITE_PROTECT_PASSWORD` | Shared password for protected pages. Do not commit. |

## Fumadocs reference

When working on anything Fumadocs-related, fetch:

- `https://fumadocs.dev/llms.txt` — page index (start here)
- `https://fumadocs.dev/llms-full.txt` — full docs (~700KB; search for the relevant section)
- `https://fumadocs.dev/llms.mdx/docs/<slug>/content.md` — individual page Markdown

## Critical footguns

- `content/` and `public/` are **fully wiped** at the start of every `pnpm generate` run. Never put hand-maintained files in `public/`; only `content/index.mdx` and `content/graph.mdx` survive.
- Run `pnpm generate` before `pnpm types:check` if `content/` is empty — the type checker depends on generated artefacts.
- `protected: true` gates the body only. Title, description, and tags are always public. This is intentional — see `docs/adr/0001-shared-password-protection.md`.
- Canvas pages need both the MDX wrapper in `content/` and the raw `.canvas` JSON in `public/`. Both are produced together — see `docs/adr/0002-canvas-dual-output.md`.
- Wikilink resolution runs at build time. Links to notes excluded from `GENERATE_INCLUDE` silently become dead links.
