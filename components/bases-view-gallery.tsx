'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { resolveNoteProperty, isNameColumn, resolveDisplayName, resolveImageUrl } from '@/lib/base-properties'
import { basesCellContent } from './bases-cell'

const PAGE_SIZE = 60

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
  cardSize?: number
  cardAspect?: number
  imageProperty?: string
  groupBy?: { property: string; direction: string }
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

function Card({
  note,
  imageProperty,
  cardAspect,
  columns,
  properties,
}: {
  note: NoteRecord
  imageProperty?: string
  cardAspect?: number
  columns: string[]
  properties: Record<string, PropertyConfig>
}) {
  const imageUrl = imageProperty ? resolveImageUrl(note, imageProperty) : ''
  const description = note.frontmatter.description as string | undefined
  const tags = note.tags.length > 0 ? note.tags : null

  return (
    <Link href={note.slug} className="base-card">
      {imageUrl && (
        <div
          className="base-card-image"
          style={{
            backgroundImage: `url(${imageUrl})`,
            aspectRatio: cardAspect ? `1 / ${cardAspect}` : undefined,
          }}
        />
      )}
      <div className="base-card-body">
        <h3 className="base-card-title">{note.title}</h3>
        {description && (
          <p className="base-card-desc">{description}</p>
        )}
        {(tags || columns.length > 0) && (
          <div className="base-card-footer">
            {tags && (
              <div className="base-card-tags">
                {tags.slice(0, 3).map(t => (
                  <span key={t} className="base-card-tag">{t}</span>
                ))}
                {tags.length > 3 && (
                  <span className="base-card-tag base-card-tag-more">+{tags.length - 3}</span>
                )}
              </div>
            )}
            {columns.map(col => {
              const val = resolveNoteProperty(note, col)
              if (val === null || val === undefined) return null
              return (
                <span key={col} className="base-card-meta-value">
                  {basesCellContent(note, col)}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </Link>
  )
}

export function BasesViewGallery({
  notes,
  properties,
  order,
  cardSize = 280,
  cardAspect,
  imageProperty,
  groupBy,
}: Props) {
  const columns = (order ?? []).filter(
    c => !isNameColumn(c) && c !== imageProperty && c !== 'description' && c !== 'tags',
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const gridStyle = {
    '--base-card-min': `${cardSize}px`,
    ...(cardAspect ? { '--base-card-aspect': String(cardAspect) } : {}),
  } as React.CSSProperties

  const groups = groupBy ? groupByProperty(notes, groupBy) : null
  const isGrouped = groups !== null && groups.size > 0

  if (isGrouped) {
    return (
      <div className="base-card-container" style={gridStyle}>
        {Array.from(groups!.entries()).map(([groupName, groupedNotes]) => (
          <div key={groupName} className="base-card-group">
            <h3 className="base-card-group-header">{groupName}</h3>
            <div className="base-card-grid">
              {groupedNotes.map(note => (
                <Card
                  key={note.slug}
                  note={note}
                  imageProperty={imageProperty}
                  cardAspect={cardAspect}
                  columns={columns}
                  properties={properties}
                />
              ))}
            </div>
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
      <div className="base-card-grid" style={gridStyle}>
        {displayed.map(note => (
          <Card
            key={note.slug}
            note={note}
            imageProperty={imageProperty}
            cardAspect={cardAspect}
            columns={columns}
            properties={properties}
          />
        ))}
      </div>
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
