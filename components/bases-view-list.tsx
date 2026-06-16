import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { basesCellContent } from './bases-cell'

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
                {basesCellContent(note, col)}
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
