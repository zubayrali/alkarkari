import { evaluateFilterExpression } from './base-compiler/index.ts'
import type { EvalContext } from './base-compiler/index.ts'
import type { ProgramIR } from './base-compiler/index.ts'
import type { NoteRecord } from './base-types.ts'

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
