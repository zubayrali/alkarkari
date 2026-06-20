'use client'

import Link from 'next/link'
import { Fragment, useState } from 'react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { resolveNoteProperty, isNameColumn, resolveDisplayName } from '@/lib/base-properties'
import { basesCellContent } from './bases-cell'

const PAGE_SIZE = 200

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
  groupBy?: { property: string; direction: string }
  nestedProperties?: boolean
  separator?: string
}

function groupByProperty(
  notes: NoteRecord[],
  groupBy: { property: string; direction: string },
): Map<string, NoteRecord[]> {
  const grouped = new Map<string, NoteRecord[]>()
  for (const note of notes) {
    const val = resolveNoteProperty(note, groupBy.property)
    const key = val === null || val === undefined ? '(empty)' : String(val)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(note)
  }
  const sorted = [...grouped.entries()].sort(([a], [b]) => {
    const cmp = a.localeCompare(b)
    return groupBy.direction === 'DESC' ? -cmp : cmp
  })
  return new Map(sorted)
}

function ListItem({
  note,
  columns,
  properties,
  nestedProperties,
  separator = ', ',
}: {
  note: NoteRecord
  columns: string[]
  properties: Record<string, PropertyConfig>
  nestedProperties?: boolean
  separator?: string
}) {
  const secondaryCols = columns.filter(c => !isNameColumn(c))
  const hasSecondary = secondaryCols.some(col => {
    const val = resolveNoteProperty(note, col)
    return val !== null && val !== undefined
  })

  if (nestedProperties && hasSecondary) {
    return (
      <li className="base-list-item">
        <Link href={note.slug} className="text-sm font-medium hover:underline">
          {note.title}
        </Link>
        <ul className="base-list-nested">
          {secondaryCols.map(col => {
            const val = resolveNoteProperty(note, col)
            if (val === null || val === undefined) return null
            return (
              <li key={col}>
                <span className="base-list-meta-label">
                  {resolveDisplayName(col, properties)}:
                </span>{' '}
                {basesCellContent(note, col)}
              </li>
            )
          })}
        </ul>
      </li>
    )
  }

  return (
    <li className="base-list-item">
      <Link href={note.slug} className="text-sm font-medium hover:underline">
        {note.title}
      </Link>
      {secondaryCols.map(col => {
        const val = resolveNoteProperty(note, col)
        if (val === null || val === undefined) return null
        return (
          <Fragment key={col}>
            <span className="text-fd-muted-foreground text-xs">{separator}</span>
            <span className="text-xs text-fd-muted-foreground">
              {basesCellContent(note, col)}
            </span>
          </Fragment>
        )
      })}
    </li>
  )
}

export function BasesViewList({
  notes,
  properties,
  order,
  groupBy,
  nestedProperties,
  separator,
}: Props) {
  const columns = order ?? []
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const groups = groupBy ? groupByProperty(notes, groupBy) : null
  const isGrouped = groups !== null && groups.size > 0

  if (isGrouped) {
    return (
      <div className="base-list-container">
        {Array.from(groups!.entries()).map(([groupName, groupedNotes]) => (
          <div key={groupName} className="base-list-group">
            <h3 className="base-list-group-header">{groupName}</h3>
            <ul className="base-list">
              {groupedNotes.map(note => (
                <ListItem
                  key={note.slug}
                  note={note}
                  columns={columns}
                  properties={properties}
                  nestedProperties={nestedProperties}
                  separator={separator}
                />
              ))}
            </ul>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="py-4 text-center text-sm text-fd-muted-foreground">No results.</p>
        )}
      </div>
    )
  }

  const displayed = notes.slice(0, visibleCount)

  return (
    <div>
      <ul className="base-list">
        {displayed.map(note => (
          <ListItem
            key={note.slug}
            note={note}
            columns={columns}
            properties={properties}
            nestedProperties={nestedProperties}
            separator={separator}
          />
        ))}
      </ul>
      {notes.length === 0 && (
        <p className="py-4 text-center text-sm text-fd-muted-foreground">No results.</p>
      )}
      {visibleCount < notes.length && (
        <button
          type="button"
          className="base-load-more"
          onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
        >
          Show more ({notes.length - visibleCount} remaining)
        </button>
      )}
    </div>
  )
}
