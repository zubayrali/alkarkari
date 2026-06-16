# Obsidian Bases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Obsidian Bases (`.base` files) as a first-class source type: standalone pages, inline fenced blocks, and wikilink embeds — with a build-time bytecode VM for interactive view switching. Primary use-case is **folder notes**: a `.base` file placed inside a folder becomes that folder's Fumadocs landing page, auto-listing the folder's notes (mirrors the obsidian-folder-notes plugin). Folders with no explicit `.base` file get an auto-generated index page.

**Architecture:** Port aarnphm's Pratt-parser → bytecode IR → stack VM from `quartz/util/base/compiler/` as a standalone `lib/base-compiler/` module, replacing the Quartz-specific `QuartzPluginData` context with our own `NoteRecord`. At generate time, compile filter expressions to base64 bytecode and precompute initial view results; ship bytecode to the client for lazy re-evaluation on view switch.

**Tech Stack:** js-yaml (YAML parsing), github-slugger (path normalisation), vitest (unit tests), React Server Components + client island pattern (two-phase load), Tailwind for view renderers.

---

## File Structure

### New files
| Path | Responsibility |
|---|---|
| `lib/base-types.ts` | `NoteRecord`, `BaseConfig`, `BaseView`, `FilterNode`, `CompiledBase` types |
| `lib/base-compiler/tokens.ts` | Token types (copy verbatim — no Quartz deps) |
| `lib/base-compiler/errors.ts` | `Diagnostic` type (copy verbatim) |
| `lib/base-compiler/diagnostics.ts` | `BaseExpressionDiagnostic` (copy verbatim) |
| `lib/base-compiler/ast.ts` | AST node types + `spanFrom` (copy verbatim) |
| `lib/base-compiler/lexer.ts` | Tokeniser (copy verbatim) |
| `lib/base-compiler/parser.ts` | Pratt parser → `Program` (copy verbatim) |
| `lib/base-compiler/ir.ts` | Bytecode IR + `compileExpression` (copy verbatim) |
| `lib/base-compiler/expressions.ts` | `BasesExpressions` type (copy verbatim) |
| `lib/base-compiler/properties.ts` | `buildPropertyExpressionSource` (copy verbatim) |
| `lib/base-compiler/schema.ts` | `BUILTIN_SUMMARY_TYPES` (copy verbatim) |
| `lib/base-compiler/interpreter.ts` | Stack VM adapted: `QuartzPluginData` → `NoteRecord` |
| `lib/base-compiler/index.ts` | Public re-exports |
| `lib/base-parser.ts` | YAML → `BaseConfig` + compile `FilterNode` trees |
| `lib/base-query.ts` | `applyFilter`, `applySort`, `groupNotes` over `NoteRecord[]` |
| `scripts/generate-base-pages.ts` | Build `NoteRecord[]`, emit `notes-index.json`, per-base JSON + MDX |
| `lib/remark-inline-base.ts` | Remark plugin: ` ```base ``` ` blocks → `<BasesInlineView>` |
| `components/bases-page.tsx` | RSC: reads base JSON from disk, renders first view |
| `components/bases-inline-view.tsx` | Client component: lazy VM, view tabs |
| `components/bases-view-table.tsx` | Table renderer |
| `components/bases-view-gallery.tsx` | Gallery renderer |
| `components/bases-view-list.tsx` | List renderer |
| `tests/base-compiler.test.ts` | Compiler unit tests |
| `tests/base-parser.test.ts` | Parser unit tests |
| `tests/base-query.test.ts` | Query engine unit tests |
| `vitest.config.ts` | Vitest configuration |

### Modified files
| Path | Change |
|---|---|
| `package.json` | Add `js-yaml`, `@types/js-yaml`, `github-slugger`, `@types/github-slugger`, `vitest` |
| `scripts/generate.ts` | Extract `.base` files before `convertVaultFiles`; add `base-pages` progress step; call `generateBasePages` |
| `source.config.ts` | Add `remarkInlineBase` to `remarkPlugins` |
| `lib/remark-wikilinks.ts` | Handle `![[Name.base]]` and `![[Name.base#ViewName]]` embeds |
| `CLAUDE.md` | Document `.base`/`.md` stem collision footgun |

---

## Task 1: Install dependencies and configure vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add deps**

```bash
pnpm add js-yaml github-slugger
pnpm add -D @types/js-yaml vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 4: Create tests directory and smoke test**

Create `tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('vitest is configured', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run to confirm passing**

```
pnpm test
```

Expected: 1 test passing.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts tests/smoke.test.ts
git commit -m "chore: add vitest, js-yaml, github-slugger"
```

---

## Task 2: Create lib/base-types.ts

**Files:**
- Create: `lib/base-types.ts`

- [ ] **Step 1: Write failing type test**

Create `tests/base-types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { NoteRecord, BaseConfig, CompiledBase } from '../lib/base-types'

describe('NoteRecord', () => {
  it('has required shape', () => {
    expectTypeOf<NoteRecord>().toHaveProperty('slug')
    expectTypeOf<NoteRecord>().toHaveProperty('title')
    expectTypeOf<NoteRecord>().toHaveProperty('path')
    expectTypeOf<NoteRecord>().toHaveProperty('folder')
    expectTypeOf<NoteRecord>().toHaveProperty('tags')
    expectTypeOf<NoteRecord>().toHaveProperty('protected')
    expectTypeOf<NoteRecord>().toHaveProperty('frontmatter')
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```
pnpm test
```

Expected: FAIL — cannot find module `../lib/base-types`.

- [ ] **Step 3: Create lib/base-types.ts**

```typescript
export interface NoteRecord {
  slug: string
  title: string
  path: string
  folder: string
  tags: string[]
  protected: boolean
  frontmatter: Record<string, unknown>
}

export interface NotesIndex {
  version: 1
  notes: NoteRecord[]
}

export type FilterNode =
  | { and: FilterNode[] }
  | { or: FilterNode[] }
  | { not: FilterNode[] }
  | string

export interface PropertyConfig {
  displayName?: string
}

export interface BaseView {
  type: 'table' | 'gallery' | 'list'
  name: string
  filters?: FilterNode
  groupBy?: { property: string; direction: 'ASC' | 'DESC' }
  sort?: Array<{ property: string; direction: 'ASC' | 'DESC' }>
  order?: string[]
  cardSize?: number
  image?: string
}

export interface BaseConfig {
  filters?: FilterNode
  properties?: Record<string, PropertyConfig>
  views?: BaseView[]
}

export interface CompiledView {
  name: string
  type: BaseView['type']
  compiledFilter: string
  precomputedNotes: NoteRecord[]
  sortedBy: Array<{ property: string; direction: string }>
  groupBy?: { property: string; direction: string }
  order?: string[]
}

export interface CompiledBase {
  version: 1
  config: BaseConfig
  views: CompiledView[]
}
```

- [ ] **Step 4: Run test to confirm passing**

```
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/base-types.ts tests/base-types.test.ts
git commit -m "feat: add base-types (NoteRecord, BaseConfig, CompiledBase)"
```

---

## Task 3: Port base-compiler pure files (no Quartz deps)

These files are copied verbatim from `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\`. They have zero Quartz-specific imports.

**Files:**
- Create: `lib/base-compiler/tokens.ts`
- Create: `lib/base-compiler/errors.ts`
- Create: `lib/base-compiler/diagnostics.ts`
- Create: `lib/base-compiler/ast.ts`
- Create: `lib/base-compiler/lexer.ts`
- Create: `lib/base-compiler/parser.ts`
- Create: `lib/base-compiler/ir.ts`
- Create: `lib/base-compiler/expressions.ts`
- Create: `lib/base-compiler/properties.ts`
- Create: `lib/base-compiler/schema.ts`

- [ ] **Step 1: Write a failing test that imports from the compiler**

Create `tests/base-compiler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseExpressionSource, compileExpression } from '../lib/base-compiler/index'

describe('base-compiler lexer', () => {
  it('tokenises a simple expression', () => {
    const result = parseExpressionSource('rating >= 8')
    expect(result.diagnostics).toHaveLength(0)
    expect(result.program.body).not.toBeNull()
  })
})

describe('base-compiler ir', () => {
  it('compiles an expression to bytecode', () => {
    const result = parseExpressionSource('file.hasTag("review")')
    expect(result.program.body).not.toBeNull()
    const bytecode = compileExpression(result.program.body!)
    expect(bytecode.instructions.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
pnpm test
```

Expected: FAIL — cannot find module `../lib/base-compiler/index`.

- [ ] **Step 3: Copy tokens.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\tokens.ts` to `lib/base-compiler/tokens.ts`. No changes needed.

- [ ] **Step 4: Copy errors.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\errors.ts` to `lib/base-compiler/errors.ts`. No changes needed.

- [ ] **Step 5: Copy diagnostics.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\diagnostics.ts` to `lib/base-compiler/diagnostics.ts`. No changes needed.

- [ ] **Step 6: Copy ast.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\ast.ts` to `lib/base-compiler/ast.ts`. No changes needed.

- [ ] **Step 7: Copy lexer.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\lexer.ts` to `lib/base-compiler/lexer.ts`. No changes needed.

- [ ] **Step 8: Copy parser.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\parser.ts` to `lib/base-compiler/parser.ts`. No changes needed.

- [ ] **Step 9: Copy ir.ts verbatim**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\ir.ts` to `lib/base-compiler/ir.ts`. No changes needed.

- [ ] **Step 10: Copy expressions.ts, properties.ts, schema.ts verbatim**

Copy all three files from `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\` to `lib/base-compiler/`. No changes needed.

- [ ] **Step 11: Run type check on the copied files**

```
pnpm types:check 2>&1 | head -30
```

These files use only their own internal imports — expect zero errors from them.

- [ ] **Step 12: Commit the pure compiler files**

```bash
git add lib/base-compiler/tokens.ts lib/base-compiler/errors.ts lib/base-compiler/diagnostics.ts lib/base-compiler/ast.ts lib/base-compiler/lexer.ts lib/base-compiler/parser.ts lib/base-compiler/ir.ts lib/base-compiler/expressions.ts lib/base-compiler/properties.ts lib/base-compiler/schema.ts
git commit -m "feat: port base-compiler pure files from aarnphm (no Quartz deps)"
```

---

## Task 4: Port interpreter.ts — swap QuartzPluginData for NoteRecord

This is the only compiler file that references Quartz-specific types. Copy the file, then make targeted replacements.

**Files:**
- Create: `lib/base-compiler/interpreter.ts`

- [ ] **Step 1: Copy interpreter.ts from aarnphm**

Copy `C:\Users\user1\Documents\GitHub\aarnphm\quartz\util\base\compiler\interpreter.ts` to `lib/base-compiler/interpreter.ts`.

- [ ] **Step 2: Replace the three Quartz import lines at the top**

Find (lines 1-3 of the copied file):
```typescript
import { QuartzPluginData } from '../../../plugins/vfile'
import { FilePath, FullSlug, simplifySlug, slugifyFilePath, splitAnchor } from '../../path'
import { parseWikilink, resolveWikilinkTarget } from '../../wikilinks'
```

Replace with:
```typescript
import type { NoteRecord } from '../base-types'
```

- [ ] **Step 3: Replace FileValue type**

Find:
```typescript
export type FileValue = { kind: 'file'; value: QuartzPluginData }
```

Replace with:
```typescript
export type FileValue = { kind: 'file'; value: NoteRecord }
```

- [ ] **Step 4: Replace EvalContext type**

Find the full `EvalContext` type definition:
```typescript
export type EvalContext = {
  file: QuartzPluginData
  thisFile?: QuartzPluginData
  allFiles: QuartzPluginData[]
  rows?: QuartzPluginData[]
  fileIndex?: Map<string, QuartzPluginData>
  ...
}
```

Replace with:
```typescript
export type EvalContext = {
  file: NoteRecord
  thisFile?: NoteRecord
  allFiles?: NoteRecord[]
  rows?: NoteRecord[]
  fileIndex?: Map<string, NoteRecord>
  formulas?: Record<string, ProgramIR>
  formulaSources?: Record<string, string>
  formulaCache?: Map<string, Value>
  formulaStack?: Set<string>
  locals?: Record<string, Value>
  values?: Value[]
  diagnostics?: BaseExpressionDiagnostic[]
  diagnosticContext?: string
  diagnosticSource?: string
  diagnosticSet?: Set<string>
  propertyCache?: Map<string, Value>
}
```

- [ ] **Step 5: Replace resolveFileSlug**

Find:
```typescript
const resolveFileSlug = (file: QuartzPluginData): string | undefined => {
  if (!file.slug) return undefined
  return simplifySlug(file.slug as FullSlug)
}
```

Replace with:
```typescript
const resolveFileSlug = (record: NoteRecord): string => record.slug
```

- [ ] **Step 6: Replace resolveFileProperty**

Find the full `const resolveFileProperty = (file: QuartzPluginData, ...)` function and replace it:

```typescript
const resolveFileProperty = (record: NoteRecord, property: string, _ctx: EvalContext): Value => {
  if (property === 'file') return makeFile(record)
  if (property === 'name' || property === 'basename') {
    return makeString(record.path.split('/').pop()?.replace(/\.md$/, '') ?? '')
  }
  if (property === 'title') return makeString(record.title)
  if (property === 'path') return makeString(record.path)
  if (property === 'folder') return makeString(record.folder)
  if (property === 'ext') return makeString('md')
  if (property === 'tags') {
    return makeList(record.tags.map(tag => makeString(tag)))
  }
  if (property === 'aliases') {
    const aliases = record.frontmatter?.aliases
    if (!aliases) return makeList([])
    const list = Array.isArray(aliases) ? aliases : [aliases]
    return makeList(list.map(alias => makeString(String(alias))))
  }
  if (property === 'link') return makeLink(record.slug)
  if (property === 'properties') return toValue(record.frontmatter)
  if (
    property === 'links' ||
    property === 'outlinks' ||
    property === 'backlinks' ||
    property === 'inlinks' ||
    property === 'embeds'
  ) {
    return makeList([])
  }
  if (property === 'size' || property === 'ctime' || property === 'mtime') return makeNull()
  const raw: unknown = record.frontmatter?.[property]
  return toValue(raw)
}
```

- [ ] **Step 7: Replace evalFileMethod (file-specific methods)**

Find the block inside `evalFileMethod` that handles the `file` value (the `if (isFileValue(receiver))` block). The key method handlers to replace:

```typescript
// Inside evalFileMethod, replace the file.hasTag / file.inFolder / file.asLink / file.hasProperty / file.hasLink block:
if (method === 'asLink') {
  const display = args[0] ? valueToString(args[0]) : undefined
  return makeLink(file.slug, display)
}
if (method === 'hasTag') {
  const queryTags = args.map(arg => valueToString(arg))
  return makeBoolean(queryTags.some(tag => file.tags.includes(tag)))
}
if (method === 'inFolder') {
  const folderArg = args[0] ? valueToString(args[0]) : ''
  if (!folderArg) return makeBoolean(false)
  const normalized = folderArg.endsWith('/') ? folderArg : `${folderArg}/`
  const recordFolder = file.folder ? `${file.folder}/` : ''
  return makeBoolean(recordFolder.startsWith(normalized) || file.folder === folderArg)
}
if (method === 'hasProperty') {
  const propName = args[0] ? valueToString(args[0]) : ''
  return makeBoolean(propName in (file.frontmatter ?? {}))
}
if (method === 'hasLink') {
  return makeBoolean(false)
}
```

Note: `file` here refers to `receiver.value` (which is now `NoteRecord`). Find the existing hasTag/inFolder block inside `evalMethodCallValues` where `isFileValue(receiver)` is checked — the variable `file` is destructured as `receiver.value`.

- [ ] **Step 8: Replace link-resolution helpers that use Quartz path utilities**

Find and replace `resolveLinkComparisonKey`:
```typescript
const resolveLinkComparisonKey = (
  value: Value,
  ctx: EvalContext,
): { slug?: string; text?: string } => {
  if (isFileValue(value)) return { slug: value.value.slug }
  if (isLinkValue(value)) {
    const text = normalizeLinkText(value.value)
    const match = ctx.allFiles?.find(f => f.slug === text || f.path.replace(/\.md$/, '') === text)
    return match ? { slug: match.slug } : { text }
  }
  if (isStringValue(value)) return { text: normalizeLinkText(value.value) }
  return {}
}
```

Find and replace `findFileByTarget`:
```typescript
const findFileByTarget = (target: string, ctx: EvalContext): NoteRecord | undefined => {
  const normalized = target.trim()
  return ctx.allFiles?.find(f => f.slug === normalized || f.path.replace(/\.md$/, '') === normalized)
}
```

Find and replace `resolveLinkSlugFromText`:
```typescript
const resolveLinkSlugFromText = (raw: string, ctx: EvalContext): string | undefined => {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return undefined
  const match = ctx.allFiles?.find(f => f.slug === trimmed || f.path.replace(/\.md$/, '') === trimmed)
  return match?.slug
}
```

Find and replace `resolveLinkSlugFromValue`:
```typescript
const resolveLinkSlugFromValue = (value: Value, ctx: EvalContext): string | undefined => {
  if (isFileValue(value)) return value.value.slug
  if (isLinkValue(value)) return resolveLinkSlugFromText(value.value, ctx)
  if (isStringValue(value)) return resolveLinkSlugFromText(value.value, ctx)
  return undefined
}
```

- [ ] **Step 9: Replace resolveIdentifier `note` case**

Find inside `resolveIdentifier`:
```typescript
if (name === 'note') {
  const fm = ctx.file.frontmatter
  return toValue(fm)
}
```

This is already correct since `NoteRecord` has `.frontmatter`. Confirm it's present.

Find:
```typescript
if (name === 'this') return ctx.thisFile ? makeFile(ctx.thisFile) : makeNull()
```

This is also already correct. Confirm it's present.

Find the bare identifier fallback at the end of `resolveIdentifier`:
```typescript
const raw: unknown = ctx.file.frontmatter ? ctx.file.frontmatter[name] : undefined
return toValue(raw)
```

This is correct for `NoteRecord`. Confirm it's present.

- [ ] **Step 10: Fix makeFile factory call (allFiles list map)**

Any place that previously called `makeFile(row)` where `row: QuartzPluginData` is now `row: NoteRecord`. Since the type changed, this should work automatically once FileValue.value is NoteRecord. Verify no remaining `QuartzPluginData` references:

```
grep -n "QuartzPluginData\|FullSlug\|simplifySlug\|slugifyFilePath\|splitAnchor\|parseWikilink\|resolveWikilinkTarget" lib/base-compiler/interpreter.ts
```

Expected: zero matches.

- [ ] **Step 11: Commit**

```bash
git add lib/base-compiler/interpreter.ts
git commit -m "feat: port interpreter — swap QuartzPluginData for NoteRecord"
```

---

## Task 5: Create lib/base-compiler/index.ts

**Files:**
- Create: `lib/base-compiler/index.ts`

- [ ] **Step 1: Write a failing test that uses the public API**

Add to `tests/base-compiler.test.ts`:

```typescript
import { evaluateFilterExpression } from '../lib/base-compiler/index'
import type { NoteRecord } from '../lib/base-types'

describe('evaluateFilterExpression', () => {
  it('filters notes by tag', () => {
    const { program } = parseExpressionSource('file.hasTag("review")')
    const bytecode = compileExpression(program.body!)
    const note: NoteRecord = {
      slug: '/dict/test', title: 'Test', path: 'dict/test.md',
      folder: 'dict', tags: ['review'], protected: false, frontmatter: {},
    }
    const ctx = { file: note, allFiles: [note] }
    expect(evaluateFilterExpression(bytecode, ctx)).toBe(true)
  })

  it('returns false when tag absent', () => {
    const { program } = parseExpressionSource('file.hasTag("review")')
    const bytecode = compileExpression(program.body!)
    const note: NoteRecord = {
      slug: '/dict/other', title: 'Other', path: 'dict/other.md',
      folder: 'dict', tags: [], protected: false, frontmatter: {},
    }
    expect(evaluateFilterExpression(bytecode, { file: note, allFiles: [note] })).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm failing**

```
pnpm test
```

Expected: FAIL — `evaluateFilterExpression` not exported from index yet.

- [ ] **Step 3: Create lib/base-compiler/index.ts**

```typescript
export { lex } from './lexer'
export { parseExpressionSource } from './parser'
export type { ParseResult } from './parser'
export type { Diagnostic } from './errors'
export type { Program, Expr, Span, Position } from './ast'
export { spanFrom } from './ast'
export type { BaseExpressionDiagnostic } from './diagnostics'
export type { BasesExpressions } from './expressions'
export type { Instruction, ProgramIR } from './ir'
export { compileExpression } from './ir'
export { buildPropertyExpressionSource } from './properties'
export type { PropertyConfig, BuiltinSummaryType } from './schema'
export { BUILTIN_SUMMARY_TYPES } from './schema'
export {
  evaluateExpression,
  evaluateFilterExpression,
  valueToUnknown,
} from './interpreter'
export type {
  EvalContext,
  Value,
  NullValue, BooleanValue, NumberValue, StringValue,
  DateValue, DurationValue, ListValue, ObjectValue,
  FileValue, LinkValue, RegexValue, HtmlValue, IconValue, ImageValue,
  ValueKind, ValueOf,
} from './interpreter'
export { isValueKind } from './interpreter'
```

- [ ] **Step 4: Run tests to confirm passing**

```
pnpm test
```

Expected: all tests PASS (including the tag filter test).

- [ ] **Step 5: Commit**

```bash
git add lib/base-compiler/index.ts tests/base-compiler.test.ts
git commit -m "feat: add base-compiler public API + VM tests"
```

---

## Task 6: Create lib/base-parser.ts

Adapts `compile.ts` from aarnphm. Parses YAML `.base` file content into `BaseConfig` and compiles all `FilterNode` trees to `ProgramIR`.

**Files:**
- Create: `lib/base-parser.ts`
- Create: `tests/base-parser.test.ts`

- [ ] **Step 1: Write a failing test**

Create `tests/base-parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseBaseConfig, vaultPathToSlug } from '../lib/base-parser'

describe('vaultPathToSlug', () => {
  it('slugifies a simple path', () => {
    expect(vaultPathToSlug('dictionary/My Note.md')).toBe('dictionary/my-note')
  })

  it('slugifies a base file path', () => {
    expect(vaultPathToSlug('dictionary/Books Overview.base')).toBe('dictionary/books-overview')
  })

  it('handles vault root file', () => {
    expect(vaultPathToSlug('Wird.md')).toBe('wird')
  })
})

describe('parseBaseConfig', () => {
  it('parses a minimal config with no views', () => {
    const yaml = `filters: "file.inFolder(\\"dictionary\\")"
`
    const { config } = parseBaseConfig(yaml)
    expect(config.filters).toBe('file.inFolder("dictionary")')
    expect(config.views).toHaveLength(1)
    expect(config.views![0]).toMatchObject({ type: 'table', name: 'Table' })
  })

  it('synthesises default table view when views array is absent', () => {
    const { config } = parseBaseConfig('')
    expect(config.views).toHaveLength(1)
    expect(config.views![0].type).toBe('table')
  })

  it('compiles a top-level filter to bytecode', () => {
    const yaml = `filters: "file.hasTag(\\"review\\")"\n`
    const { topLevelFilter } = parseBaseConfig(yaml)
    expect(topLevelFilter).not.toBeNull()
    expect(topLevelFilter!.instructions.length).toBeGreaterThan(0)
  })

  it('compiles view-level filter combined with top-level', () => {
    const yaml = `
filters: "file.inFolder(\\"dictionary\\")"
views:
  - type: table
    name: Reviews
    filters: "file.hasTag(\\"review\\")"
`
    const { viewFilters } = parseBaseConfig(yaml)
    expect(viewFilters[0]).not.toBeNull()
  })

  it('parses display names from properties', () => {
    const yaml = `
properties:
  rating:
    displayName: Rating (1-10)
`
    const { config } = parseBaseConfig(yaml)
    expect(config.properties?.rating?.displayName).toBe('Rating (1-10)')
  })
})

describe('vaultPathToSlug — folder-index convention', () => {
  it('slugifies folder-index path correctly', () => {
    // dictionary/dictionary.base → slug "dictionary/dictionary"
    // (generate-base-pages then maps this to content/dictionary/index.mdx)
    expect(vaultPathToSlug('dictionary/dictionary.base')).toBe('dictionary/dictionary')
    expect(vaultPathToSlug('dictionary/index.base')).toBe('dictionary/index')
  })
})
```

- [ ] **Step 2: Run to confirm failing**

```
pnpm test
```

Expected: FAIL — cannot find module `../lib/base-parser`.

- [ ] **Step 3: Create lib/base-parser.ts**

```typescript
import yaml from 'js-yaml'
import GithubSlugger from 'github-slugger'
import type { Expr, LogicalExpr, UnaryExpr } from './base-compiler/ast'
import { spanFrom } from './base-compiler/ast'
import { compileExpression, parseExpressionSource } from './base-compiler/index'
import type { ProgramIR } from './base-compiler/ir'
import type { BaseConfig, BaseView, FilterNode, PropertyConfig } from './base-types'

export type ParsedBase = {
  config: BaseConfig
  topLevelFilter: ProgramIR | null
  viewFilters: Array<ProgramIR | null>
}

const slugger = new GithubSlugger()

export function vaultPathToSlug(vaultPath: string): string {
  const withoutExt = vaultPath.replace(/\.[^/.]+$/, '')
  return withoutExt
    .split('/')
    .map(segment => { slugger.reset(); return slugger.slug(segment) })
    .join('/')
}

function parseExpr(source: string): Expr | null {
  const result = parseExpressionSource(source)
  return result.program.body ?? null
}

function buildLogical(op: '&&' | '||', exprs: Expr[]): Expr | null {
  if (exprs.length === 0) return null
  let current: Expr = exprs[0]
  for (let i = 1; i < exprs.length; i++) {
    const next = exprs[i]
    current = {
      type: 'LogicalExpr',
      operator: op,
      left: current,
      right: next,
      span: spanFrom(current.span, next.span),
    } satisfies LogicalExpr
  }
  return current
}

function buildFilterExpr(node: FilterNode): Expr | null {
  if (typeof node === 'string') return parseExpr(node)
  if ('and' in node) {
    const parts = node.and.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    return buildLogical('&&', parts)
  }
  if ('or' in node) {
    const parts = node.or.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    return buildLogical('||', parts)
  }
  if ('not' in node) {
    const parts = node.not.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    const negated: UnaryExpr[] = parts.map(expr => ({
      type: 'UnaryExpr' as const,
      operator: '!' as const,
      argument: expr,
      span: spanFrom(expr.span, expr.span),
    }))
    return buildLogical('&&', negated)
  }
  return null
}

function compileFilterNode(node: FilterNode | undefined): ProgramIR | null {
  if (!node) return null
  const expr = buildFilterExpr(node)
  return expr ? compileExpression(expr) : null
}

function combinedFilter(
  top: FilterNode | undefined,
  view: FilterNode | undefined,
): ProgramIR | null {
  if (!top && !view) return null
  if (!top) return compileFilterNode(view)
  if (!view) return compileFilterNode(top)
  const topExpr = buildFilterExpr(top)
  const viewExpr = buildFilterExpr(view)
  if (!topExpr) return compileFilterNode(view)
  if (!viewExpr) return compileFilterNode(top)
  const combined: LogicalExpr = {
    type: 'LogicalExpr',
    operator: '&&',
    left: topExpr,
    right: viewExpr,
    span: spanFrom(topExpr.span, viewExpr.span),
  }
  return compileExpression(combined)
}

function parsePropertyConfig(raw: unknown): Record<string, PropertyConfig> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const result: Record<string, PropertyConfig> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    result[key] = typeof v.displayName === 'string' ? { displayName: v.displayName } : {}
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function parseViews(raw: unknown): BaseView[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map(v => {
      const type: BaseView['type'] =
        v.type === 'gallery' ? 'gallery' : v.type === 'list' ? 'list' : 'table'
      const name = typeof v.name === 'string' ? v.name : type[0].toUpperCase() + type.slice(1)
      const view: BaseView = { type, name }
      if (v.filters) view.filters = v.filters as FilterNode
      if (typeof v.groupBy === 'string') {
        view.groupBy = { property: v.groupBy, direction: 'ASC' }
      } else if (typeof v.groupBy === 'object' && v.groupBy !== null) {
        const gb = v.groupBy as Record<string, unknown>
        view.groupBy = {
          property: typeof gb.property === 'string' ? gb.property : '',
          direction: gb.direction === 'DESC' ? 'DESC' : 'ASC',
        }
      }
      if (Array.isArray(v.sort)) {
        view.sort = v.sort
          .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
          .map(s => ({
            property: typeof s.property === 'string' ? s.property : '',
            direction: s.direction === 'DESC' ? 'DESC' as const : 'ASC' as const,
          }))
      }
      if (Array.isArray(v.order)) {
        view.order = v.order.filter((o): o is string => typeof o === 'string')
      }
      if (typeof v.cardSize === 'number') view.cardSize = v.cardSize
      if (typeof v.image === 'string') view.image = v.image
      return view
    })
}

export function parseBaseConfig(content: string): ParsedBase {
  const raw = yaml.load(content) as Record<string, unknown> | null
  const parsed: Record<string, unknown> = raw && typeof raw === 'object' ? raw : {}

  let views = parseViews(parsed.views)
  if (views.length === 0) views = [{ type: 'table', name: 'Table' }]

  const config: BaseConfig = {
    filters: parsed.filters as FilterNode | undefined,
    properties: parsePropertyConfig(parsed.properties),
    views,
  }

  const topLevelFilter = compileFilterNode(config.filters)
  const viewFilters = views.map(view => combinedFilter(config.filters, view.filters))

  return { config, topLevelFilter, viewFilters }
}
```

- [ ] **Step 4: Run tests to confirm passing**

```
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/base-parser.ts tests/base-parser.test.ts
git commit -m "feat: add base-parser (YAML → BaseConfig + filter compilation)"
```

---

## Task 7: Create lib/base-query.ts

**Files:**
- Create: `lib/base-query.ts`
- Create: `tests/base-query.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/base-query.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseExpressionSource, compileExpression } from '../lib/base-compiler/index'
import { applyFilter, applySort, groupNotes } from '../lib/base-query'
import type { NoteRecord } from '../lib/base-types'

const note = (overrides: Partial<NoteRecord>): NoteRecord => ({
  slug: '/test', title: 'Test', path: 'test.md', folder: '',
  tags: [], protected: false, frontmatter: {},
  ...overrides,
})

const compileExpr = (src: string) => {
  const { program } = parseExpressionSource(src)
  return compileExpression(program.body!)
}

describe('applyFilter', () => {
  it('returns all notes when filter is null', () => {
    const notes = [note({ slug: '/a' }), note({ slug: '/b' })]
    expect(applyFilter(notes, null)).toEqual(notes)
  })

  it('filters by tag', () => {
    const notes = [
      note({ slug: '/a', tags: ['review'] }),
      note({ slug: '/b', tags: ['draft'] }),
    ]
    const filter = compileExpr('file.hasTag("review")')
    expect(applyFilter(notes, filter)).toHaveLength(1)
    expect(applyFilter(notes, filter)[0].slug).toBe('/a')
  })

  it('filters by folder', () => {
    const notes = [
      note({ slug: '/dict/a', folder: 'dictionary' }),
      note({ slug: '/books/b', folder: 'books' }),
    ]
    const filter = compileExpr('file.inFolder("dictionary")')
    expect(applyFilter(notes, filter)).toHaveLength(1)
  })

  it('filters by frontmatter property', () => {
    const notes = [
      note({ frontmatter: { rating: 9 } }),
      note({ frontmatter: { rating: 5 } }),
    ]
    const filter = compileExpr('rating >= 8')
    expect(applyFilter(notes, filter)).toHaveLength(1)
  })
})

describe('applySort', () => {
  it('sorts ascending by title', () => {
    const notes = [note({ title: 'Zeta' }), note({ title: 'Alpha' })]
    const sorted = applySort(notes, [{ property: 'title', direction: 'ASC' }])
    expect(sorted[0].title).toBe('Alpha')
  })

  it('sorts descending', () => {
    const notes = [note({ title: 'Alpha' }), note({ title: 'Zeta' })]
    const sorted = applySort(notes, [{ property: 'title', direction: 'DESC' }])
    expect(sorted[0].title).toBe('Zeta')
  })
})

describe('groupNotes', () => {
  it('returns single empty-key group when groupBy is undefined', () => {
    const notes = [note({}), note({})]
    const groups = groupNotes(notes, undefined)
    expect(groups.size).toBe(1)
    expect(groups.get('')).toHaveLength(2)
  })

  it('groups by frontmatter property', () => {
    const notes = [
      note({ frontmatter: { status: 'done' } }),
      note({ frontmatter: { status: 'wip' } }),
      note({ frontmatter: { status: 'done' } }),
    ]
    const groups = groupNotes(notes, { property: 'status', direction: 'ASC' })
    expect(groups.size).toBe(2)
    expect(groups.get('done')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to confirm failing**

```
pnpm test
```

Expected: FAIL — cannot find module `../lib/base-query`.

- [ ] **Step 3: Create lib/base-query.ts**

```typescript
import { evaluateFilterExpression } from './base-compiler/index'
import type { EvalContext } from './base-compiler/interpreter'
import type { ProgramIR } from './base-compiler/ir'
import type { NoteRecord } from './base-types'

export function applyFilter(notes: NoteRecord[], filter: ProgramIR | null): NoteRecord[] {
  if (!filter) return notes
  return notes.filter(record => {
    const ctx: EvalContext = { file: record, allFiles: notes }
    try {
      return evaluateFilterExpression(filter, ctx)
    } catch {
      return false
    }
  })
}

export function applySort(
  notes: NoteRecord[],
  sort: Array<{ property: string; direction: 'ASC' | 'DESC' }>,
): NoteRecord[] {
  if (!sort || sort.length === 0) return notes
  return [...notes].sort((a, b) => {
    for (const { property, direction } of sort) {
      const aVal = resolveProperty(a, property)
      const bVal = resolveProperty(b, property)
      const cmp = compareValues(aVal, bVal)
      if (cmp !== 0) return direction === 'DESC' ? -cmp : cmp
    }
    return 0
  })
}

export function groupNotes(
  notes: NoteRecord[],
  groupBy: { property: string; direction: 'ASC' | 'DESC' } | undefined,
): Map<string, NoteRecord[]> {
  if (!groupBy) return new Map([['', notes]])
  const grouped = new Map<string, NoteRecord[]>()
  for (const note of notes) {
    const key = String(resolveProperty(note, groupBy.property) ?? '')
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(note)
  }
  const sorted = [...grouped.entries()].sort(([a], [b]) => {
    const cmp = a.localeCompare(b)
    return groupBy.direction === 'DESC' ? -cmp : cmp
  })
  return new Map(sorted)
}

function resolveProperty(note: NoteRecord, property: string): unknown {
  if (property === 'title') return note.title
  if (property === 'folder') return note.folder
  if (property === 'path') return note.path
  if (property === 'tags') return note.tags.join(', ')
  return note.frontmatter?.[property]
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}
```

- [ ] **Step 4: Run tests to confirm passing**

```
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/base-query.ts tests/base-query.test.ts
git commit -m "feat: add base-query (filter, sort, group NoteRecord[])"
```

---

## Task 8: Create scripts/generate-base-pages.ts

Builds `NoteRecord[]` from the generation outputs, emits `public/notes-index.json`, then for each `.base` file produces `public/bases/<slug>.json` and `content/<path>.mdx`.

**Folder-note conventions (new):**
- If a `.base` file's stem equals its parent folder name (`dictionary/dictionary.base`) OR is `index` (`dictionary/index.base`), it is a **folder-index file** and outputs to `content/dictionary/index.mdx` — making it the Fumadocs landing page for that folder.
- If a folder-index `.base` file has **no explicit `filters`**, the filter `file.inFolder("parentFolder")` is auto-injected. An empty `dictionary/dictionary.base` therefore auto-lists all dictionary notes with zero config.
- After processing explicit `.base` files, **auto-generate** a folder index page for every folder in `GENERATE_INCLUDE` that still has no `content/<folder>/index.mdx`. This ensures all included folders get a landing page even if no `.base` file was created in the vault.

**Files:**
- Create: `scripts/generate-base-pages.ts`

- [ ] **Step 1: Create scripts/generate-base-pages.ts**

```typescript
import fs from 'node:fs/promises'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import yaml from 'js-yaml'
import { frontmatter } from 'fumadocs-core/content/md/frontmatter'
import type { OutputFile, VaultFile } from 'fumadocs-obsidian'
import { parseBaseConfig, vaultPathToSlug } from '../lib/base-parser.ts'
import { applyFilter, applySort } from '../lib/base-query.ts'
import type { CompiledBase, CompiledView, NoteRecord, NotesIndex } from '../lib/base-types.ts'

const publicDir = 'public'
const contentDir = 'content'

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}

function bytecodeToBase64(bytecode: object): string {
  return Buffer.from(JSON.stringify(bytecode)).toString('base64')
}

function buildNoteRecords(outputs: OutputFile[]): NoteRecord[] {
  const records: NoteRecord[] = []

  for (const file of outputs) {
    if (file.type !== 'content') continue
    if (!file.path.endsWith('.mdx')) continue
    if (file.path === 'index.mdx' || file.path === 'graph.mdx') continue

    const content = typeof file.content === 'string' ? file.content : file.content.toString('utf8')
    const { data } = frontmatter(content)
    const fm = data as Record<string, unknown>

    const isProtected = fm.protected === true || fm.protected === 'true'

    // Slug: strip .mdx and prepend /
    const slug = '/' + file.path.replace(/\.mdx$/, '')

    // Path: derive vault-relative .md path from output path
    const vaultPath = file.path.replace(/\.mdx$/, '.md')

    // Folder: parent directory (empty string for vault-root files)
    const folder = vaultPath.includes('/') ? vaultPath.split('/').slice(0, -1).join('/') : ''

    // Title: from frontmatter or filename stem
    const title =
      typeof fm.title === 'string' && fm.title.trim()
        ? fm.title.trim()
        : file.path.split('/').pop()?.replace(/\.mdx$/, '') ?? ''

    // Frontmatter: strip all custom props for protected notes (ADR-0001)
    const safeFrontmatter: Record<string, unknown> = isProtected
      ? {
          title: fm.title,
          description: fm.description,
          tags: fm.tags,
        }
      : { ...fm }

    records.push({
      slug,
      title,
      path: vaultPath,
      folder,
      tags: normalizeTags(fm.tags),
      protected: isProtected,
      frontmatter: safeFrontmatter,
    })
  }

  return records
}

function extractFolderArgs(filter: unknown): string[] {
  if (typeof filter === 'string') {
    const matches = [...filter.matchAll(/file\.inFolder\(\s*["']([^"']+)["']\s*\)/g)]
    return matches.map(m => m[1])
  }
  if (typeof filter === 'object' && filter !== null) {
    const node = filter as Record<string, unknown>
    for (const key of ['and', 'or', 'not']) {
      if (Array.isArray(node[key])) {
        return (node[key] as unknown[]).flatMap(extractFolderArgs)
      }
    }
  }
  return []
}

type StepProgress = {
  advance: (label: string) => void
  skip: (label: string) => void
  start: (total: number) => void
  complete: (label: string) => void
  setDetail: (label: string) => void
}

export async function generateBasePages(
  baseFiles: VaultFile[],
  outputs: OutputFile[],
  include: string[],
  step: StepProgress,
): Promise<void> {
  if (baseFiles.length === 0) {
    step.skip('No .base files found')
    return
  }

  step.start(baseFiles.length)

  // Build notes index from generation outputs
  const notes = buildNoteRecords(outputs)

  // Emit public/notes-index.json
  const indexDir = publicDir
  await fs.mkdir(indexDir, { recursive: true })
  const notesIndex: NotesIndex = { version: 1, notes }
  await fs.writeFile(
    path.join(indexDir, 'notes-index.json'),
    JSON.stringify(notesIndex),
  )

  // Derive set of included top-level vault folders from include patterns
  const includedFolders = new Set(
    include
      .filter(p => !p.startsWith('!'))
      .map(p => p.split('/')[0].split('*')[0])
      .filter(Boolean),
  )

  // Track which folders already have an explicit folder-index .base file
  const explicitFolderIndexes = new Set<string>()

  // Process each .base file
  for (const baseFile of baseFiles) {
    const rawContent =
      typeof baseFile.content === 'string'
        ? baseFile.content
        : (baseFile.content as Buffer).toString('utf8')

    const slug = vaultPathToSlug(baseFile.path)   // e.g. "dictionary/books"

    // ── Folder-index detection ──────────────────────────────────────────────
    // dictionary/dictionary.base  →  folder-index for "dictionary"
    // dictionary/index.base       →  folder-index for "dictionary"
    const pathSegments = baseFile.path.split('/')
    const baseStem = pathSegments[pathSegments.length - 1].replace(/\.base$/, '')
    const parentVaultFolder = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null
    const isFolderIndex =
      baseStem === 'index' || (parentVaultFolder !== null && baseStem === parentVaultFolder)

    if (isFolderIndex && parentVaultFolder) {
      explicitFolderIndexes.add(parentVaultFolder)
    }

    // ── Auto-infer filter for folder-index files ────────────────────────────
    // If the .base file is a folder index and has no explicit filters,
    // inject file.inFolder("parentFolder") so an empty YAML file just works.
    let content = rawContent
    if (isFolderIndex && parentVaultFolder) {
      try {
        const parsed = (yaml.load(rawContent) ?? {}) as Record<string, unknown>
        if (!parsed.filters) {
          parsed.filters = `file.inFolder("${parentVaultFolder}")`
          content = yaml.dump(parsed)
        }
      } catch {
        // malformed YAML — parseBaseConfig will handle gracefully
      }
    }

    const { config, viewFilters } = parseBaseConfig(content)

    // GENERATE_INCLUDE warning
    const folders = extractFolderArgs(config.filters)
    for (const view of config.views ?? []) {
      if (view.filters) folders.push(...extractFolderArgs(view.filters))
    }
    for (const folder of folders) {
      const topLevel = folder.split('/')[0]
      if (includedFolders.size > 0 && !includedFolders.has(topLevel)) {
        console.warn(
          `⚠ Base "${baseFile.path}": filter references folder "${topLevel}" which is not in GENERATE_INCLUDE. Results will be empty.`,
        )
      }
    }

    // Compile views
    const compiledViews: CompiledView[] = (config.views ?? []).map((view, i) => {
      const filter = viewFilters[i] ?? null
      const filtered = applyFilter(notes, filter)
      const sorted = applySort(filtered, view.sort ?? [])
      return {
        name: view.name,
        type: view.type,
        compiledFilter: filter ? bytecodeToBase64(filter) : '',
        precomputedNotes: sorted,
        sortedBy: view.sort ?? [],
        groupBy: view.groupBy,
        order: view.order,
      }
    })

    const compiled: CompiledBase = { version: 1, config, views: compiledViews }

    // Derive title: for folder-index use the parent folder name, else use the stem
    const rawStem = baseStem === 'index' && parentVaultFolder ? parentVaultFolder : baseStem
    const title = rawStem.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    // ── Folder-index path mapping ───────────────────────────────────────────
    // dictionary/dictionary.base → content/dictionary/index.mdx  (landing page)
    // dictionary/books.base      → content/dictionary/books.mdx  (normal page)
    const slugSegments = slug.split('/')
    const jsonSlug = isFolderIndex && parentVaultFolder
      ? slugSegments.slice(0, -1).join('/') + '/index'   // e.g. "dictionary/index"
      : slug                                              // e.g. "dictionary/books"

    const mdxRelPath = jsonSlug + '.mdx'   // relative to content/
    const mdxPath = path.join(contentDir, mdxRelPath.replace(/\//g, path.sep))

    await fs.mkdir(path.dirname(mdxPath), { recursive: true })
    const mdxContent = `---
title: "${title}"
description: "${isFolderIndex ? `Notes in ${title}` : 'Obsidian Base'}"
---

import { BasesPageContent } from "@/components/bases-page";

<BasesPageContent src="/bases/${jsonSlug}.json" />
`
    await fs.writeFile(mdxPath, mdxContent)

    // Also write JSON to the mapped slug (important: use jsonSlug not slug)
    const jsonOut = path.join(publicDir, 'bases', jsonSlug.replace(/\//g, path.sep) + '.json')
    // (Re-write at correct path — the earlier write used `slug`, replace it with `jsonSlug`)
    await fs.mkdir(path.dirname(jsonOut), { recursive: true })
    await fs.writeFile(jsonOut, JSON.stringify(compiled))

    step.advance(baseFile.path)
  }

  // ── Auto-generate folder index pages ───────────────────────────────────────
  // For every folder in GENERATE_INCLUDE that has no explicit folder-index .base
  // file AND no content/<folder>/index.mdx already written by note conversion,
  // emit a default table view listing all notes in that folder.
  for (const folder of includedFolders) {
    if (explicitFolderIndexes.has(folder)) continue   // already handled above

    const targetMdx = path.join(contentDir, folder, 'index.mdx')
    // Skip if a vault note already produced content/<folder>/index.mdx
    try { await fs.access(targetMdx); continue } catch { /* doesn't exist — proceed */ }

    const autoFilterSrc = `filters: "file.inFolder(\\"${folder}\\")"\n`
    const { config: autoConfig, viewFilters: autoFilters } = parseBaseConfig(autoFilterSrc)
    const autoFiltered = applyFilter(notes, autoFilters[0] ?? null)
    const autoViews: CompiledView[] = [{
      name: 'Table',
      type: 'table',
      compiledFilter: autoFilters[0] ? bytecodeToBase64(autoFilters[0]) : '',
      precomputedNotes: autoFiltered,
      sortedBy: [],
    }]
    const autoCompiled: CompiledBase = { version: 1, config: autoConfig, views: autoViews }

    const autoJsonOut = path.join(publicDir, 'bases', folder, 'index.json')
    await fs.mkdir(path.dirname(autoJsonOut), { recursive: true })
    await fs.writeFile(autoJsonOut, JSON.stringify(autoCompiled))

    const folderTitle = folder.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    await fs.mkdir(path.dirname(targetMdx), { recursive: true })
    await fs.writeFile(targetMdx, `---
title: "${folderTitle}"
description: "Notes in ${folderTitle}"
---

import { BasesPageContent } from "@/components/bases-page";

<BasesPageContent src="/bases/${folder}/index.json" />
`)
  }

  step.complete(`Generated ${baseFiles.length} base page${baseFiles.length === 1 ? '' : 's'}`)
}
```

- [ ] **Step 2: Run type check**

```
pnpm types:check 2>&1 | grep "generate-base-pages" | head -20
```

Fix any type errors before committing. The most likely issue is the `VaultFile` import — add it to the fumadocs-obsidian import.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-base-pages.ts
git commit -m "feat: add generate-base-pages (NoteRecord build, notes-index, base JSON+MDX)"
```

---

## Task 9: Wire generate.ts

Add the base-pages step to the generation pipeline.

**Files:**
- Modify: `scripts/generate.ts`

- [ ] **Step 1: Add VaultFile import and generateBasePages import**

At the top of `scripts/generate.ts`, add to the existing imports:

```typescript
import type { VaultFile } from "fumadocs-obsidian";
import { generateBasePages } from "./generate-base-pages.ts";
```

- [ ] **Step 2: Add base-pages to the progress steps array**

Find the `GenerateProgress` constructor call and add the new step after `canvas-pages`:

```typescript
const progress = new GenerateProgress([
  { id: "clean", label: "Cleaning generated files" },
  { id: "convert", label: "Converting vault" },
  { id: "write", label: "Writing files" },
  { id: "canvas-sync", label: "Syncing canvas assets" },
  { id: "canvas-pages", label: "Generating canvas pages" },
  { id: "base-pages", label: "Generating base pages" },   // ← add this
]);
```

- [ ] **Step 3: Add step creation inside runWithGenerateUi**

Add alongside the other `createStepProgress` calls:

```typescript
const basePages = createStepProgress(progress, "base-pages");
```

- [ ] **Step 4: Extract .base files before convertVaultFiles**

After `readVaultFiles()` and before `convertVaultFiles()`, add:

```typescript
const baseRawFiles = rawFiles.filter((f: VaultFile) => f.path.endsWith('.base'));
const nonBaseRawFiles = rawFiles.filter((f: VaultFile) => !f.path.endsWith('.base'));
```

Then change `convertVaultFiles(rawFiles, ...)` to `convertVaultFiles(nonBaseRawFiles, ...)`.

- [ ] **Step 5: Call generateBasePages after canvas pages**

After `await generateCanvasPages(canvasPages);`, add:

```typescript
await generateBasePages(baseRawFiles, outputs, include, basePages);
```

- [ ] **Step 6: Run type check**

```
pnpm types:check 2>&1 | grep "generate.ts" | head -20
```

Expected: no errors for generate.ts.

- [ ] **Step 7: Commit**

```bash
git add scripts/generate.ts
git commit -m "feat: wire generate.ts — extract .base files, add base-pages step"
```

---

## Task 10: Create BasesPageContent server component

An RSC that reads the pre-generated base JSON from disk and renders the first view without a loading skeleton.

**Files:**
- Create: `components/bases-page.tsx`

- [ ] **Step 1: Create components/bases-page.tsx**

```typescript
import fs from 'node:fs/promises'
import path from 'node:path'
import type { CompiledBase } from '@/lib/base-types'
import { BasesInlineView } from './bases-inline-view'

interface Props {
  src: string  // e.g. "/bases/dictionary/books.json"
}

export async function BasesPageContent({ src }: Props) {
  const filePath = path.join(process.cwd(), 'public', src)

  let compiled: CompiledBase
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    compiled = JSON.parse(raw) as CompiledBase
  } catch {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Base not found: {src}
      </div>
    )
  }

  const firstView = compiled.views[0]
  if (!firstView) {
    return <div className="text-sm text-neutral-500">No views defined.</div>
  }

  return (
    <BasesInlineView
      src={src}
      precomputedNotes={firstView.precomputedNotes}
      views={compiled.views.map(v => ({ name: v.name, type: v.type }))}
      properties={compiled.config.properties ?? {}}
    />
  )
}
```

- [ ] **Step 2: Run type check (will fail — BasesInlineView doesn't exist yet)**

```
pnpm types:check 2>&1 | grep "bases-page" | head -10
```

Expected: error about missing `BasesInlineView`. Proceed to Task 11.

---

## Task 11: Create BasesInlineView client component

The interactive island. Phase 1: renders from `precomputedNotes` prop (no fetch). Phase 2 (on view switch): lazily fetches `notes-index.json`, deserialises bytecode, re-evaluates filter.

**Files:**
- Create: `components/bases-inline-view.tsx`

- [ ] **Step 1: Create components/bases-inline-view.tsx**

```typescript
'use client'

import { useState, useCallback, useTransition } from 'react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { BasesViewTable } from './bases-view-table'
import { BasesViewGallery } from './bases-view-gallery'
import { BasesViewList } from './bases-view-list'

interface ViewMeta {
  name: string
  type: 'table' | 'gallery' | 'list'
}

interface Props {
  src?: string                      // URL to the base JSON (for lazy fetch)
  precomputedNotes?: NoteRecord[]   // first-view notes from RSC
  views?: ViewMeta[]
  properties?: Record<string, PropertyConfig>
  initialView?: string              // for wikilink embed with #ViewName
  configBase64?: string             // for inline ```base``` embed
}

export function BasesInlineView({
  src,
  precomputedNotes = [],
  views = [],
  properties = {},
  initialView,
  configBase64,
}: Props) {
  const [activeViewName, setActiveViewName] = useState(
    initialView ?? views[0]?.name ?? '',
  )
  const [notes, setNotes] = useState<NoteRecord[]>(precomputedNotes)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const activeView = views.find(v => v.name === activeViewName) ?? views[0]

  const switchView = useCallback(
    async (viewName: string) => {
      if (viewName === activeViewName) return
      setActiveViewName(viewName)

      if (!src) return

      // Lazy phase: fetch notes-index and re-evaluate bytecode
      setLoading(true)
      try {
        const [indexRes, baseRes] = await Promise.all([
          fetch('/notes-index.json'),
          fetch(src),
        ])
        const [indexData, baseData] = await Promise.all([
          indexRes.json() as Promise<{ notes: NoteRecord[] }>,
          baseRes.json() as Promise<{ views: Array<{ name: string; compiledFilter: string; sortedBy: Array<{ property: string; direction: string }> }> }>,
        ])

        const viewData = baseData.views.find(v => v.name === viewName)
        if (!viewData) {
          setNotes(indexData.notes)
          return
        }

        if (!viewData.compiledFilter) {
          setNotes(indexData.notes)
          return
        }

        // Dynamically import the VM to keep it out of the initial bundle
        const { evaluateFilterExpression } = await import('@/lib/base-compiler/interpreter')
        const bytecode = JSON.parse(atob(viewData.compiledFilter))

        startTransition(() => {
          const filtered = indexData.notes.filter(record => {
            try {
              return evaluateFilterExpression(bytecode, { file: record, allFiles: indexData.notes })
            } catch {
              return false
            }
          })
          setNotes(filtered)
        })
      } finally {
        setLoading(false)
      }
    },
    [activeViewName, src],
  )

  const viewType = activeView?.type ?? 'table'

  return (
    <div className="not-prose">
      {views.length > 1 && (
        <div className="mb-3 flex gap-2 border-b pb-2">
          {views.map(v => (
            <button
              key={v.name}
              onClick={() => switchView(v.name)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                v.name === activeViewName
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="h-8 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800 mb-3" />
      )}

      {viewType === 'table' && (
        <BasesViewTable notes={notes} properties={properties} />
      )}
      {viewType === 'gallery' && (
        <BasesViewGallery notes={notes} properties={properties} />
      )}
      {viewType === 'list' && (
        <BasesViewList notes={notes} properties={properties} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run type check (will fail until view renderers exist)**

Proceed to Tasks 12–14 to create the renderers, then circle back.

---

## Task 12: Create view renderers

**Files:**
- Create: `components/bases-view-table.tsx`
- Create: `components/bases-view-gallery.tsx`
- Create: `components/bases-view-list.tsx`

- [ ] **Step 1: Create components/bases-view-table.tsx**

```typescript
import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
}

function getColumns(notes: NoteRecord[], order?: string[]): string[] {
  if (order && order.length > 0) return order
  const keys = new Set<string>()
  for (const note of notes) {
    for (const k of Object.keys(note.frontmatter)) keys.add(k)
  }
  return ['title', ...Array.from(keys).filter(k => k !== 'title')]
}

function renderCell(note: NoteRecord, col: string): React.ReactNode {
  if (col === 'title') {
    return note.protected ? (
      <span className="text-neutral-400">{note.title}</span>
    ) : (
      <Link href={note.slug} className="underline underline-offset-2">
        {note.title}
      </Link>
    )
  }
  if (note.protected) return null
  const val = note.frontmatter[col]
  if (val === null || val === undefined) return null
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

export function BasesViewTable({ notes, properties, order }: Props) {
  const columns = getColumns(notes, order)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            {columns.map(col => (
              <th key={col} className="px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                {properties[col]?.displayName ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {notes.map(note => (
            <tr key={note.slug} className="border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              {columns.map(col => (
                <td key={col} className="px-3 py-2">
                  {renderCell(note, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {notes.length === 0 && (
        <p className="py-4 text-center text-sm text-neutral-400">No results.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create components/bases-view-gallery.tsx**

```typescript
import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
  cardSize?: number
  imageProperty?: string
}

export function BasesViewGallery({ notes, properties, order, cardSize = 280, imageProperty }: Props) {
  const columns = order ?? []

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))` }}
    >
      {notes.map(note => {
        const imageUrl = imageProperty && !note.protected
          ? String(note.frontmatter[imageProperty] ?? '')
          : ''

        return (
          <div
            key={note.slug}
            className="relative rounded-lg border overflow-hidden flex flex-col"
          >
            {imageUrl && (
              <div className="h-40 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {note.protected && (
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center">
                <span className="text-xs text-neutral-500">Protected</span>
              </div>
            )}
            <div className="p-3 flex flex-col gap-1">
              <Link href={note.slug} className="font-medium text-sm hover:underline">
                {note.title}
              </Link>
              {!note.protected && columns.map(col => {
                const val = note.frontmatter[col]
                if (val === null || val === undefined) return null
                return (
                  <div key={col} className="text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium">{properties[col]?.displayName ?? col}:</span>{' '}
                    {Array.isArray(val) ? val.join(', ') : String(val)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {notes.length === 0 && (
        <p className="col-span-full py-4 text-center text-sm text-neutral-400">No results.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create components/bases-view-list.tsx**

```typescript
import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
}

export function BasesViewList({ notes, properties, order }: Props) {
  const columns = order ?? []

  return (
    <ul className="divide-y">
      {notes.map(note => (
        <li key={note.slug} className="flex items-baseline gap-3 py-2">
          {note.protected ? (
            <span className="text-neutral-400 text-sm">{note.title}</span>
          ) : (
            <Link href={note.slug} className="text-sm font-medium hover:underline">
              {note.title}
            </Link>
          )}
          {!note.protected && columns.map(col => {
            const val = note.frontmatter[col]
            if (val === null || val === undefined) return null
            return (
              <span
                key={col}
                className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-600 dark:text-neutral-400"
                title={properties[col]?.displayName ?? col}
              >
                {Array.isArray(val) ? val.join(', ') : String(val)}
              </span>
            )
          })}
        </li>
      ))}
      {notes.length === 0 && (
        <li className="py-4 text-center text-sm text-neutral-400">No results.</li>
      )}
    </ul>
  )
}
```

- [ ] **Step 4: Run type check**

```
pnpm types:check 2>&1 | grep -E "bases-(page|inline|view)" | head -30
```

Expected: no errors from these components.

- [ ] **Step 5: Commit**

```bash
git add components/bases-page.tsx components/bases-inline-view.tsx components/bases-view-table.tsx components/bases-view-gallery.tsx components/bases-view-list.tsx
git commit -m "feat: add BasesPageContent, BasesInlineView, and view renderers"
```

---

## Task 13: Create lib/remark-inline-base.ts

A remark plugin that finds ` ```base ``` ` fenced code blocks, compiles the YAML config at build time, and replaces them with `<BasesInlineView configBase64="..." />`.

**Files:**
- Create: `lib/remark-inline-base.ts`

- [ ] **Step 1: Create lib/remark-inline-base.ts**

```typescript
import { Buffer } from 'node:buffer'
import yaml from 'js-yaml'
import type { Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import { compileExpression, parseExpressionSource } from './base-compiler/index'
import type { FilterNode, BaseView } from './base-types'

type InlineBaseConfig = {
  folder?: string
  tag?: string
  filters?: FilterNode
  views?: BaseView[]
  sort?: string
  limit?: number
  columns?: string
}

function parseShorthandFilter(config: InlineBaseConfig): FilterNode | undefined {
  const parts: FilterNode[] = []
  if (config.folder) parts.push(`file.inFolder("${config.folder}")`)
  if (config.tag) parts.push(`file.hasTag("${config.tag}")`)
  if (config.filters) parts.push(config.filters)
  if (parts.length === 0) return undefined
  if (parts.length === 1) return parts[0]
  return { and: parts }
}

function parseShorthandSort(raw: string): BaseView['sort'] {
  const trimmed = raw.trim()
  const parts = trimmed.split(/\s+/)
  const property = parts[0] ?? 'title'
  const direction = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' as const : 'ASC' as const
  return [{ property, direction }]
}

function compileFilterNode(node: FilterNode | undefined): string {
  if (!node) return ''
  if (typeof node === 'string') {
    const result = parseExpressionSource(node)
    if (!result.program.body) return ''
    return Buffer.from(JSON.stringify(compileExpression(result.program.body))).toString('base64')
  }
  // For compound filters, build and/or/not expression then compile
  // (simplified: only support string filters in inline embeds for v1)
  return ''
}

export function remarkInlineBase() {
  return (tree: Root) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'base') return
      if (!parent || index === undefined) return

      let config: InlineBaseConfig = {}
      try {
        const parsed = yaml.load(node.value)
        if (typeof parsed === 'object' && parsed !== null) {
          config = parsed as InlineBaseConfig
        }
      } catch {
        return
      }

      const filter = parseShorthandFilter(config)
      const compiledFilter = compileFilterNode(filter)

      const views: BaseView[] = config.views ?? [
        {
          type: 'table',
          name: 'Table',
          filters: filter,
          sort: typeof config.sort === 'string' ? parseShorthandSort(config.sort) : undefined,
          order: typeof config.columns === 'string'
            ? config.columns.split(',').map(c => c.trim()).filter(Boolean)
            : undefined,
        },
      ]

      const payload = {
        compiledFilter,
        views: views.map(v => ({ name: v.name, type: v.type, order: v.order })),
        limit: config.limit,
      }

      const configBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')

      const jsxNode: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'BasesInlineView',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'configBase64',
            value: configBase64,
          },
        ],
        children: [],
      }

      parent.children.splice(index, 1, jsxNode as unknown as typeof parent.children[number])
    })
  }
}
```

- [ ] **Step 2: Run type check**

```
pnpm types:check 2>&1 | grep "remark-inline-base" | head -10
```

This file is a remark plugin — it imports `unist-util-visit` and `mdast-util-mdx-jsx`. If these aren't installed, add them:

```bash
pnpm add -D unist-util-visit mdast-util-mdx-jsx
```

Then re-run the check. You may also need `@types/mdast` — check if already present via fumadocs.

- [ ] **Step 3: Commit**

```bash
git add lib/remark-inline-base.ts
git commit -m "feat: add remarkInlineBase plugin (```base``` fenced blocks → BasesInlineView)"
```

---

## Task 14: Extend remarkWikilinks for .base embed wikilinks

Handles `![[Name.base]]` and `![[Name.base#ViewName]]` embed wikilinks.

**Files:**
- Modify: `lib/remark-wikilinks.ts`

- [ ] **Step 1: Add an embed wikilink regex and .base detection**

Open `lib/remark-wikilinks.ts`. Add a new regex for embeds at the top, alongside the existing `WIKILINK` regex:

```typescript
const EMBED_WIKILINK = /!\[\[([^[\]|#]+?)(?:#([^[\]]+?))?\]\]/g;
```

- [ ] **Step 2: Add vaultPathToSlug import**

Add at the top of the file:

```typescript
import { vaultPathToSlug } from './base-parser.ts'
```

- [ ] **Step 3: Add handleBaseEmbed function**

Add a new function that converts a `.base` embed wikilink into a JSX element string. Since the existing plugin works at the MDAST text level, embeds need to become MDX JSX nodes. However, the current plugin only handles text nodes. The cleanest approach for v1 is to handle `.base` embeds as a post-pass on the MDAST tree.

Add this function before `splitWikilinks`:

```typescript
const EMBED_BASE = /!\[\[([^[\]#|]+\.base)(?:#([^[\]]+))?\]\]/g;

function resolveBaseEmbed(target: string, viewName?: string): string {
  const slug = vaultPathToSlug(target)
  const src = `/bases/${slug}.json`
  const initialViewAttr = viewName ? ` initialView="${viewName.trim()}"` : ''
  return `<BasesInlineView src="${src}"${initialViewAttr} />`
}
```

- [ ] **Step 4: Add a base-embed transform pass to the returned plugin function**

In `remarkWikilinks`, before returning, add a tree traversal for embed nodes. Append this to the returned function body:

```typescript
// Handle ![[Name.base]] and ![[Name.base#View]] embeds
visit(tree as MdastParent, 'text', (node: MdastText, index, parent) => {
  if (!node.value.includes('![[') || !node.value.includes('.base')) return
  if (!parent || index === undefined) return

  const parts: MdastNode[] = []
  let last = 0
  for (const match of node.value.matchAll(EMBED_BASE)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ type: 'text', value: node.value.slice(last, start) })
    const target = match[1].trim()
    const viewName = match[2]?.trim()
    // Emit as a raw HTML node (fumadocs will forward it through rehype)
    parts.push({ type: 'html', value: resolveBaseEmbed(target, viewName) } as unknown as MdastNode)
    last = start + match[0].length
  }
  if (parts.length === 0) return
  if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) })
  parent.children.splice(index as number, 1, ...parts)
})
```

Note: This requires importing `visit` from `unist-util-visit`. Add the import at the top:

```typescript
import { visit } from 'unist-util-visit'
```

- [ ] **Step 5: Run type check**

```
pnpm types:check 2>&1 | grep "remark-wikilinks" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add lib/remark-wikilinks.ts
git commit -m "feat: extend remarkWikilinks to handle ![[Name.base]] embed wikilinks"
```

---

## Task 15: Wire remarkInlineBase into source.config.ts + update CLAUDE.md

**Files:**
- Modify: `source.config.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Import remarkInlineBase in source.config.ts**

Open `source.config.ts`. Add import:

```typescript
import { remarkInlineBase } from './lib/remark-inline-base'
```

- [ ] **Step 2: Add to remarkPlugins array**

Find the `remarkPlugins` array and add `remarkInlineBase` before `remarkWikilinks` (inline base blocks must be processed first, before wikilinks, to avoid interference):

```typescript
remarkPlugins: [remarkInlineBase, remarkWikilinks, remarkMdxMermaid, remarkMath],
```

- [ ] **Step 3: Add footgun to CLAUDE.md**

Open `CLAUDE.md` and add to the `## Footguns` section:

```markdown
- A `.base` file and a `.md` note with the same stem in the same vault folder both generate `content/<path>.mdx`. The Base is written last and silently overwrites the note. This mirrors how canvas/note collisions are handled — no runtime check.
- A folder-index `.base` file (`dictionary/dictionary.base` or `dictionary/index.base`) writes to `content/dictionary/index.mdx`. If a vault note `dictionary/index.md` also exists, the Base overwrites it. Intentional — the Base is the folder landing page.
- Folders in `GENERATE_INCLUDE` automatically get a `content/<folder>/index.mdx` generated even with no `.base` file in the vault. To suppress auto-generation for a folder, add a hand-maintained `content/<folder>/index.mdx` (it is preserved because it's not in `public/`).
```

- [ ] **Step 4: Run type check and lint**

```
pnpm types:check && pnpm lint
```

Fix any errors. Common issue: `remarkInlineBase` may need to be called as a function (it returns a plugin) — check the fumadocs mdxOptions docs for the correct form.

- [ ] **Step 5: Commit**

```bash
git add source.config.ts CLAUDE.md
git commit -m "feat: wire remarkInlineBase into source.config.ts; document .base/.md collision footgun"
```

---

## Task 16: Integration smoke test

Verify the full pipeline against a real vault.

**Files:** none created

- [ ] **Step 1: Run generate**

```
pnpm generate
```

Watch for:
- No crash during the `base-pages` step
- `public/notes-index.json` created
- Any `.base` files in the vault produce `public/bases/<slug>.json` and `content/<slug>.mdx`

If there are no `.base` files in the vault, create a minimal one for testing:

Create `<VAULT_PATH>/test-base.base` with:
```yaml
filters: "file.inFolder(\"dictionary\")"
views:
  - type: table
    name: Table
```

Then re-run `pnpm generate`.

- [ ] **Step 2: Check generated outputs**

```
Get-ChildItem public/bases -Recurse | Select-Object FullName
Get-ChildItem content -Recurse -Filter "*test-base*"
```

Expected: `public/bases/test-base.json` and `content/test-base.mdx` (or the vault-mirrored equivalent).

- [ ] **Step 3: Start dev server and check the base page**

```
pnpm dev
```

Navigate to the base page URL (e.g. `http://localhost:3000/test-base`). Verify:
- Page renders without error
- Table view shows notes from the dictionary folder
- Title/link column is clickable

- [ ] **Step 4: Run final type check and lint**

```
pnpm types:check && pnpm lint
```

Both must pass before this task is complete.

- [ ] **Step 5: Clean up test .base file from vault (if created for testing)**

Remove the test-base.base file from the vault, then run `pnpm generate` once more to confirm a clean build.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Obsidian Bases v1 — standalone pages, inline embeds, wikilink embeds"
```

---

## Self-review notes

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Extract .base before convertVaultFiles | Task 9 |
| Build NoteRecord[] from OutputFile[] | Task 8 |
| Emit public/notes-index.json | Task 8 |
| Per-base public/bases/<slug>.json (or index.json for folder-index) | Task 8 |
| Per-base content/<slug>.mdx (or index.mdx for folder-index) | Task 8 |
| Folder-index detection: same stem as parent folder or `index` | Task 8 |
| Auto-infer `file.inFolder()` filter for empty folder-index .base | Task 8 |
| Auto-generate folder index pages for folders with no explicit .base | Task 8 |
| Port aarnphm VM (lexer/parser/ir/interpreter) | Tasks 3–5 |
| EvalContext uses NoteRecord | Task 4 |
| file.hasTag / file.inFolder / file.hasProperty | Task 4 |
| Compile filter expressions to bytecode | Task 6 |
| Synthesise default table view | Task 6 |
| GENERATE_INCLUDE warning | Task 8 |
| BasesPageContent RSC (first view from disk, no fetch) | Task 10 |
| BasesInlineView client component (lazy VM) | Task 11 |
| Table / gallery / list renderers | Task 12 |
| Protected notes: only title/description/tags in index | Task 8 |
| remarkInlineBase for ```base``` blocks | Task 13 |
| Extend remarkWikilinks for ![[Name.base]] | Task 14 |
| Wire into source.config.ts | Task 15 |
| .base/.md collision documented | Task 15 |
| CLAUDE.md footgun | Task 15 |
| Integration smoke test | Task 16 |

**Deferred (tracked in .scratch/bases/):**
- `summaries-v2.md` — aggregate expressions
- `formulas-v2.md` — computed per-row columns
- `view-types-v2.md` — board / calendar / map views
- `notes-index-chunking-v2.md` — chunk index by top-level folder
