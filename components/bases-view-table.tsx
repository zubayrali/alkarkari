import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { basesCellContent } from './bases-cell'
import { entryTransitionName } from '@/lib/transition-name'

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
  hideHeader?: boolean
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
      <Link
        href={note.slug}
        className="underline underline-offset-2"
        // "Magic move": this row title morphs into the entry page's H1.
        style={{ viewTransitionName: entryTransitionName(note.slug) }}
      >
        {note.title}
      </Link>
    )
  }
  if (note.protected) return null
  return basesCellContent(note, col)
}

export function BasesViewTable({ notes, properties, order, hideHeader }: Props) {
  const columns = getColumns(notes, order)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {!hideHeader && (
          <thead>
            <tr className="border-b text-left">
              {columns.map(col => (
                <th key={col} className="px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                  {properties[col]?.displayName ?? col}
                </th>
              ))}
            </tr>
          </thead>
        )}
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
