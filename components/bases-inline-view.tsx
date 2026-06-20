'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { List, LayoutGrid, Table2, Search, X } from 'lucide-react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { BasesViewTable } from './bases-view-table'
import { BasesViewGallery } from './bases-view-gallery'
import { BasesViewList } from './bases-view-list'

interface ViewMeta {
  name: string
  type: 'table' | 'gallery' | 'list'
  hideHeader?: boolean
  groupBy?: { property: string; direction: string }
  order?: string[]
  cardSize?: number
  cardAspect?: number
  image?: string
  limit?: number
  nestedProperties?: boolean
  separator?: string
}

interface Props {
  src?: string
  precomputedNotes?: NoteRecord[]
  views?: ViewMeta[]
  properties?: Record<string, PropertyConfig>
  initialView?: string
  configBase64?: string
  hideToolbar?: boolean
}

const viewIcons: Record<string, React.ReactNode> = {
  table: <Table2 className="size-3.5" />,
  list: <List className="size-3.5" />,
  gallery: <LayoutGrid className="size-3.5" />,
}

export function BasesInlineView({
  src,
  precomputedNotes = [],
  views = [],
  properties = {},
  initialView,
  configBase64: _configBase64,
  hideToolbar,
}: Props) {
  const [activeViewName, setActiveViewName] = useState(
    initialView ?? views[0]?.name ?? '',
  )
  const [notes, setNotes] = useState<NoteRecord[]>(precomputedNotes)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [, startTransition] = useTransition()

  const activeView = views.find(v => v.name === activeViewName) ?? views[0]

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(note => {
      if (note.title.toLowerCase().includes(q)) return true
      for (const val of Object.values(note.frontmatter)) {
        if (val !== null && val !== undefined && String(val).toLowerCase().includes(q)) return true
      }
      if (note.tags.some(t => t.toLowerCase().includes(q))) return true
      return false
    })
  }, [notes, searchQuery])

  const switchView = useCallback(
    async (viewName: string) => {
      if (viewName === activeViewName) return
      setActiveViewName(viewName)

      if (!src) return

      setLoading(true)
      try {
        const [indexRes, baseRes] = await Promise.all([
          fetch('/notes-index.json'),
          fetch(src.startsWith('/') ? src : `/${src}`),
        ])
        const [indexData, baseData] = await Promise.all([
          indexRes.json() as Promise<{ notes: NoteRecord[] }>,
          baseRes.json() as Promise<{
            views: Array<{
              name: string
              compiledFilter: string
              sortedBy: Array<{ property: string; direction: string }>
            }>
          }>,
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

        const { evaluateFilterExpression } = await import('@/lib/base-compiler/interpreter')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const bytecode = JSON.parse(atob(viewData.compiledFilter))

        startTransition(() => {
          const filtered = indexData.notes.filter(record => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      {!hideToolbar && (
      <div className="base-toolbar">
        {views.length > 1 && (
          <div className="base-view-tabs">
            {views.map(v => (
              <button
                key={v.name}
                onClick={() => { void switchView(v.name) }}
                className={`base-view-tab ${v.name === activeViewName ? 'active' : ''}`}
              >
                {viewIcons[v.type] ?? viewIcons.table}
                <span>{v.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="base-toolbar-right">
          <span className="base-results-count">
            {filteredNotes.length === notes.length
              ? `${notes.length} results`
              : `${filteredNotes.length} of ${notes.length}`}
          </span>
          <div className="base-search">
            <Search className="base-search-icon" />
            <input
              type="text"
              placeholder="Filter…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="base-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="base-search-clear"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {loading && (
        <div className="h-8 animate-pulse rounded bg-fd-muted mb-3" />
      )}

      {viewType === 'table' && (
        <BasesViewTable
          notes={filteredNotes}
          properties={properties}
          order={activeView?.order}
          hideHeader={activeView?.hideHeader}
          groupBy={activeView?.groupBy}
        />
      )}
      {viewType === 'gallery' && (
        <BasesViewGallery
          notes={filteredNotes}
          properties={properties}
          order={activeView?.order}
          cardSize={activeView?.cardSize}
          cardAspect={activeView?.cardAspect}
          imageProperty={activeView?.image}
          groupBy={activeView?.groupBy}
        />
      )}
      {viewType === 'list' && (
        <BasesViewList
          notes={filteredNotes}
          properties={properties}
          order={activeView?.order}
          groupBy={activeView?.groupBy}
          nestedProperties={activeView?.nestedProperties}
          separator={activeView?.separator}
        />
      )}
    </div>
  )
}
