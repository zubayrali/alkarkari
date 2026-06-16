# Obsidian Bases — Design Spec

## Overview

Adds support for Obsidian Bases (`.base` files) to the karkariwiki site. A Base is a YAML definition of a filtered, sorted, grouped view over vault notes. It becomes a page on the site and can also be embedded inline inside notes.

This is the third vault source type alongside Notes and Canvases.

---

## Architecture

```
pnpm generate
└── scripts/generate.ts
        ├── readVaultFiles() → rawFiles
        ├── [NEW] extract baseFiles from rawFiles (.base extension)
        ├── convertVaultFiles(nonBaseFiles, ...) → MDX outputs
        ├── writeVaultOutputs()
        ├── syncCanvasFromVault()
        ├── generateCanvasPages()
        └── [NEW] generateBasePages(baseFiles, outputs, include, step)
                ├── build NoteRecord[] from outputs (OutputFile[] from convertVaultFiles)
                ├── emit public/notes-index.json  (shared global index)
                ├── for each .base file:
                │     ├── parse YAML config
                │     ├── warn if filter references excluded folder
                │     ├── compile filter expressions → bytecode
                │     ├── evaluate all named views → precomputed JSON
                │     ├── write public/bases/<slug>.json
                │     └── write content/<mirror-path>.mdx
                └── done

Next.js build (fumadocs-mdx)
└── source.config.ts mdxOptions.remarkPlugins
        └── [NEW] remarkInlineBase
                └── finds ```base``` fenced blocks
                └── compiles YAML config → base64 bytecode prop
                └── replaces with <BasesInlineView configBase64="..." />

        └── remarkWikilinks (existing, extended)
                └── detects ![[Name.base]] and ![[Name.base#View]]
                └── replaces with <BasesInlineView src="/bases/<slug>.json" initialView="View" />

Server render (Next.js RSC)
└── BasesPageContent  — RSC: reads public/bases/<slug>.json from disk via fs.readFile,
                        passes precomputedNotes for the first view as a prop — no client
                        fetch, no loading skeleton for initial render

Runtime (browser)
└── BasesInlineView   — client component (used by both standalone and inline embeds)
        ├── phase 1: renders first view from precomputedNotes prop (immediate, no fetch)
        ├── phase 2 (lazy, on first view switch): fetches /notes-index.json, loads VM
        │     — shows loading skeleton only during this transition, not on page load
        ├── executes compiled bytecode against notes index for view switching
        └── view switcher tabs
```

---

## New Files

```
scripts/
  generate-base-pages.ts       — parallel to generate-canvas-pages.ts

lib/
  base-types.ts                — BaseConfig, BaseView, NoteRecord, CompiledBase types
  base-parser.ts               — YAML .base config parser + validator
  base-query.ts                — query engine: apply filter bytecode to NoteRecord[]
  base-compiler/               — ported from aarnphm quartz/util/base/compiler/
    index.ts                   — public API: compile(expr) → Bytecode
    lexer.ts                   — tokeniser
    parser.ts                  — Pratt parser → AST
    ir.ts                      — bytecode instruction set
    interpreter.ts             — stack VM: execute(bytecode, record) → value

components/
  bases-page.tsx               — standalone base page (server component wrapper)
  bases-inline-view.tsx        — client component: loads index, runs VM, renders views
  bases-view-table.tsx         — table view renderer
  bases-view-gallery.tsx       — gallery/cards view renderer
  bases-view-list.tsx          — list view renderer
```

**Modified files:**
- `scripts/generate.ts` — add `generateBasePages` step + strip `.base` before `convertVaultFiles`
- `source.config.ts` — add `remarkInlineBase` plugin
- `lib/remark-wikilinks.ts` — extend to handle `![[Name.base]]` and `![[Name.base#ViewName]]`

---

## Data Types

### NoteRecord (notes index entry)
```typescript
interface NoteRecord {
  slug: string            // URL path, e.g. /docs/dictionary/wird
  title: string           // resolved from frontmatter.title or first heading
  path: string            // vault-relative path, e.g. dictionary/wird.md
  folder: string          // parent folder, e.g. "dictionary"; empty string "" for vault root notes
  tags: string[]          // frontmatter.tags normalised to string[]
  protected: boolean      // frontmatter.protected (body hidden in results)
  // For protected notes: only title, description, tags are included below (mirrors ADR-0001 page contract)
  // For unprotected notes: all frontmatter properties included
  frontmatter: Record<string, unknown>
}
```

### BaseConfig (parsed .base file)
```typescript
interface BaseConfig {
  filters?: FilterNode           // top-level filter tree (and/or/not)
  properties?: Record<string, PropertyConfig>
  views?: BaseView[]
  // summaries and formulas intentionally absent — v2
}

interface BaseView {
  type: 'table' | 'gallery' | 'list'
  name: string
  filters?: FilterNode           // view-level filter, AND-combined with top-level
  groupBy?: { property: string; direction: 'ASC' | 'DESC' }
  sort?: Array<{ property: string; direction: 'ASC' | 'DESC' }>
  order?: string[]               // visible columns (property names)
  cardSize?: number              // gallery only
  image?: string                 // gallery only — property path for cover image
}

interface PropertyConfig {
  displayName?: string
}

// FilterNode is a union of YAML-tree combinators and string expression nodes
type FilterNode =
  | { and: FilterNode[] }
  | { or: FilterNode[] }
  | { not: FilterNode[] }
  | string                       // expression string, compiled to bytecode
```

### Emitted JSON shapes

**`public/notes-index.json`** — shared global index:
```typescript
{ version: 1; notes: NoteRecord[] }
```

**`public/bases/<vault-mirrored-slug>.json`** — per-standalone-base (mirrors vault structure, e.g. `dictionary/books.base` → `public/bases/dictionary/books.json`):
```typescript
{
  version: 1
  config: BaseConfig
  views: Array<{
    name: string
    type: BaseView['type']
    compiledFilter: string        // base64-encoded bytecode for this view's combined filter
    precomputedNotes: NoteRecord[] // notes matching this view's filter at generate time
    sortedBy: Array<{ property: string; direction: string }>
    groupBy?: { property: string; direction: string }
    order?: string[]
  }>
}
```

---

## Expression Engine

Port `quartz/util/base/compiler/` from aarnphm as `lib/base-compiler/`. The module is pure TypeScript with no Quartz imports — only the compiler pipeline files are needed (lexer, parser, ir, interpreter).

**Build-time** (`generate-base-pages.ts`):
- Parse filter expression strings from `.base` YAML
- Compile each to bytecode via `lib/base-compiler/index.ts`
- Evaluate all views against NoteRecord[] to produce `precomputedNotes`
- Embed compiled bytecode (base64) in the emitted JSON

**Runtime** (`bases-inline-view.tsx`):
- Ship `lib/base-compiler/interpreter.ts` to client as a dynamic import (~15-20KB)
- On load: deserialise bytecode, execute against notes index
- On view switch: re-execute bytecode for the selected view's filter
- Cache results per (bytecodeHash + notesIndexVersion)

**Property mapping in the VM:**
- `file.hasTag("x")` → checks `record.tags`
- `file.inFolder("x")` → checks `record.folder` with prefix match
- `file.name` → `record.path` stem
- `file.path` → `record.path`
- `file.ext` → always `"md"` (all notes are markdown)
- `note.X` or bare `X` → `record.frontmatter.X`
- `file.tags` → `record.tags`

---

## Generation Pipeline Detail

### Progress step

Add `{ id: "base-pages", label: "Generating base pages" }` to the `GenerateProgress` steps array in `generate.ts`, after `canvas-pages`. Add a corresponding `createStepProgress(progress, "base-pages")` call and pass it to `generateBasePages`.

### Step: extract base files

In `generate.ts`, after `readVaultFiles()`:
```typescript
const baseRawFiles = rawFiles.filter(f => f.path.endsWith('.base'))
const nonBaseRawFiles = rawFiles.filter(f => !f.path.endsWith('.base'))
// pass only nonBaseRawFiles to convertVaultFiles()
```

### Step: build notes index

In `generate-base-pages.ts`, after `convertVaultFiles` outputs are available:
- Iterate `OutputFile[]` where `type === 'content'`
- Parse frontmatter from MDX content (YAML between `---` delimiters)
- Normalise tags using `normalizeTags` from `lib/tags.ts`; coerce `undefined` → `[]`
- For protected notes (`protected === true`): include only `title`, `description`, `tags` in `frontmatter` bucket — strip all other properties (mirrors ADR-0001 page contract)
- Resolve title using `resolveTitle` (already in `generate.ts` — extract to shared util)
- Derive slug from `outPath` → same URL mapping as the site router
- Emit `public/notes-index.json`

### Step: generate per-base outputs

For each `VaultFile` in `baseRawFiles`:
1. Apply same github-slugger path normalisation as `convertVaultFiles` (path segments slugged, extension swapped to `.mdx`). If `views` is absent or empty in the parsed config, synthesise a default: `[{ type: "table", name: "Table" }]`.
2. Parse YAML content of the `.base` file into `BaseConfig`
3. **Warn** if any `file.inFolder(x)` or `file.hasTag(x)` references a folder not covered by `GENERATE_INCLUDE` (compare against vault top-level directory names in include set)
4. Compile filter expressions to bytecode
5. Evaluate each view against the notes index → `precomputedNotes`
6. Write `public/bases/<slug>.json`
7. Write `content/<mirror-path>.mdx`:
```mdx
---
title: "My Base"
description: "Obsidian Base"
---

import { BasesPageContent } from "@/components/bases-page";

<BasesPageContent src="/bases/dictionary/books.json" />
```

---

## Embed Modes

### Inline ` ```base ``` ` codeblock

`remarkInlineBase` remark plugin added to `source.config.ts`:
- Finds fenced code blocks with language `base`
- Parses YAML content into a lightweight inline config (supports shorthand: `folder`, `sort`, `limit`, `columns` in addition to full `filters`/`views`)
- Compiles filters to bytecode at build time
- Base64-encodes `{ config, compiledViews }` as a prop
- Replaces with `<BasesInlineView configBase64="..." />`
- `BasesInlineView` fetches `public/notes-index.json` to get note data; shows a loading skeleton until the fetch resolves (no pre-computation — this is expected behaviour for inline embeds)

Supported shorthand in inline config:
```yaml
folder: Books        # shorthand for file.inFolder("Books") filter
sort: date desc      # shorthand sort
limit: 10
columns: title, date, author
```

### `![[Name.base]]` / `![[Name.base#ViewName]]` wikilink embed

Extended in `lib/remark-wikilinks.ts`:
- Detect embed wikilinks where the resolved file has a `.base` extension
- Re-apply the same github-slugger path normalisation used in `generate-base-pages.ts` to derive the slug from the wikilink target path — this is a pure function that needs no runtime lookup table
- Replace with `<BasesInlineView src="/bases/<slug>.json" initialView="ViewName" />`
- If the base JSON file doesn't exist at that URL (excluded by `GENERATE_INCLUDE`), the component renders a dead-link fallback at runtime — consistent with how dead note wikilinks are handled

---

## View Renderers

### Table (`bases-view-table.tsx`)
- Headless sortable table
- Columns from `order` property (or all frontmatter keys if absent)
- Column headers use `properties[x].displayName` if defined, else the property key
- Click column header to toggle sort ASC/DESC
- Protected notes: render title as greyed link, all other cells empty

### Gallery (`bases-view-gallery.tsx`)
- CSS grid, card width controlled by `cardSize` (default 280px)
- Cover image from `image` property (resolved as a vault asset URL)
- Shows title, then properties from `order`
- Groups rendered as section headings if `groupBy` is set
- Protected notes: render card with title only, no image, blurred overlay

### List (`bases-view-list.tsx`)
- Ordered vertical list
- Each item: title (linked) + inline property chips
- Properties from `order`
- Groups rendered as collapsible headings if `groupBy` is set

---

## GENERATE_INCLUDE Warning

During `generateBasePages`, after parsing a `.base` file's filters, extract all `file.inFolder("x")` arguments recursively from the filter tree. Compare each against the set of included top-level vault folders. If any folder argument does not start with an included folder prefix, print:

```
⚠ Base "dictionary/books-overview.base": filter references folder "podcasts" which is not in GENERATE_INCLUDE. Results will be empty.
```

---

## Footguns

- A `.base` file and a `.md` note with the same stem in the same vault folder both generate `content/<path>.mdx`. The Base is written last and silently overwrites the note. Document in `CLAUDE.md` alongside existing footguns — no runtime check, consistent with how canvas/note collisions are handled.
- `notes-index.json` is publicly accessible with no auth. It contains frontmatter for all notes, **except** protected notes where custom frontmatter is stripped (only title, description, tags retained per ADR-0001).

---

## What Is Deferred (v2)

All tracked in `.scratch/bases/`:

- **summaries** — aggregate expressions over filtered note set (`watched: values.filter(...).length`)
- **formulas** — computed per-row columns (`status_icon: if(...)`)  
- **board view** — kanban column layout
- **calendar view** — date grid layout
- **map view** — geographic layout (requires map tile library)
