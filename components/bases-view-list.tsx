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
  const secondaryCols = columns.filter(c => !isNameColumn(c) && c !== 'description' && c !== 'tags')
  const description = note.frontmatter.description as string | undefined
  const tags = note.tags.length > 0 ? note.tags : null

  if (nestedProperties) {
    const hasSecondary = secondaryCols.some(col => {
      const val = resolveNoteProperty(note, col)
      return val !== null && val !== undefined
    })

    return (
      <li className="base-list-entry">
        <Link href={note.slug} className="base-list-entry-link">
          <div className="base-list-entry-header">
            <h3 className="base-list-entry-title">{note.title}</h3>
            {tags && (
              <div className="base-list-entry-tags">
                {tags.slice(0, 3).map(t => (
                  <span key={t} className="base-card-tag">{t}</span>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="base-list-entry-desc">{description}</p>
          )}
          {hasSecondary && (
            <div className="base-list-entry-meta">
              {secondaryCols.map(col => {
                const val = resolveNoteProperty(note, col)
                if (val === null || val === undefined) return null
                return (
                  <span key={col} className="base-list-entry-meta-item">
                    <span className="base-list-entry-meta-label">
                      {resolveDisplayName(col, properties)}
                    </span>
                    {basesCellContent(note, col)}
                  </span>
                )
              })}
            </div>
          )}
        </Link>
      </li>
    )
  }

  return (
    <li className="base-list-entry">
      <Link href={note.slug} className="base-list-entry-link">
        <div className="base-list-entry-header">
          <h3 className="base-list-entry-title">{note.title}</h3>
          {tags && (
            <div className="base-list-entry-tags">
              {tags.slice(0, 3).map(t => (
                <span key={t} className="base-card-tag">{t}</span>
              ))}
            </div>
          )}
        </div>
        {description && (
          <p className="base-list-entry-desc">{description}</p>
        )}
        {secondaryCols.length > 0 && (
          <div className="base-list-entry-meta">
            {secondaryCols.map((col, i) => {
              const val = resolveNoteProperty(note, col)
              if (val === null || val === undefined) return null
              return (
                <Fragment key={col}>
                  {i > 0 && <span className="base-list-entry-sep">{separator}</span>}
                  <span className="base-list-entry-meta-item">
                    <span className="base-list-entry-meta-label">
                      {resolveDisplayName(col, properties)}
                    </span>
                    {basesCellContent(note, col)}
                  </span>
                </Fragment>
              )
            })}
          </div>
        )}
      </Link>
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
          <p className="base-empty">No results.</p>
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
        <p className="base-empty">No results.</p>
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
