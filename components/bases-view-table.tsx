'use client'

import Link from 'next/link'
import { Fragment, useState } from 'react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { resolveNoteProperty, isNameColumn, resolveDisplayName } from '@/lib/base-properties'
import { basesCellContent } from './bases-cell'
import { entryTransitionName } from '@/lib/transition-name'

const PAGE_SIZE = 100

interface Props {
  notes: NoteRecord[]
  properties: Record<string, PropertyConfig>
  order?: string[]
  hideHeader?: boolean
  groupBy?: { property: string; direction: string }
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
  if (isNameColumn(col)) {
    return note.protected ? (
      <span className="text-fd-muted-foreground">{note.title}</span>
    ) : (
      <Link
        href={note.slug}
        className="underline underline-offset-2"
        onClick={(e) => {
          const name = entryTransitionName(note.slug)
          if (name) (e.currentTarget as HTMLElement).style.viewTransitionName = name
        }}
      >
        {note.title}
      </Link>
    )
  }
  if (note.protected) return null
  const val = resolveNoteProperty(note, col)
  if (val !== undefined && val !== note.frontmatter?.[col]) {
    return <span>{String(val)}</span>
  }
  return basesCellContent(note, col)
}

function computeSummary(notes: NoteRecord[], col: string): string | null {
  if (isNameColumn(col)) return `${notes.length} items`
  const values = notes
    .map(n => n.frontmatter[col])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return `Σ ${sum}`
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

export function BasesViewTable({ notes, properties, order, hideHeader, groupBy }: Props) {
  const columns = getColumns(notes, order)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const groups = groupBy
    ? groupByProperty(notes, groupBy)
    : null
  const isGrouped = groups !== null && groups.size > 0

  const hasNumericColumn = columns.some(col =>
    notes.some(n => typeof n.frontmatter[col] === 'number'),
  )

  return (
    <div className="base-table-wrapper">
      <table className="base-table">
        {!hideHeader && (
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={col} className={i === 0 ? 'base-first-col' : ''}>
                  {resolveDisplayName(col, properties)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {isGrouped
            ? Array.from(groups.entries()).map(([groupName, groupedNotes]) => (
                <Fragment key={groupName}>
                  <tr className="base-group-header">
                    <td colSpan={columns.length}>
                      <span className="base-group-label">
                        {resolveDisplayName(groupBy!.property, properties)}
                      </span>{' '}
                      {groupName}
                      <span className="base-group-count">{groupedNotes.length}</span>
                    </td>
                  </tr>
                  {groupedNotes.map(note => (
                    <tr key={note.slug}>
                      {columns.map((col, i) => (
                        <td key={col} className={i === 0 ? 'base-first-col' : ''}>
                          <div className="base-cell-content">
                            {renderCell(note, col)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))
            : notes.slice(0, visibleCount).map(note => (
                <tr key={note.slug}>
                  {columns.map((col, i) => (
                    <td key={col} className={i === 0 ? 'base-first-col' : ''}>
                      <div className="base-cell-content">
                        {renderCell(note, col)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
        {hasNumericColumn && notes.length > 0 && (
          <tfoot>
            <tr>
              {columns.map(col => (
                <td key={col}>{computeSummary(notes, col)}</td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      {notes.length === 0 && (
        <p className="py-4 text-center text-sm text-fd-muted-foreground">No results.</p>
      )}
      {!isGrouped && visibleCount < notes.length && (
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
