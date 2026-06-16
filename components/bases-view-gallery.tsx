import Link from 'next/link'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { basesCellContent } from './bases-cell'

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
                    {basesCellContent(note, col)}
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
