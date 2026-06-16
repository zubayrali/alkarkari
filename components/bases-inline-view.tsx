'use client'

import { useState, useCallback, useTransition } from 'react'
import type { NoteRecord, PropertyConfig } from '@/lib/base-types'
import { BasesViewTable } from './bases-view-table'
import { BasesViewGallery } from './bases-view-gallery'
import { BasesViewList } from './bases-view-list'

interface ViewMeta {
  name: string
  type: 'table' | 'gallery' | 'list'
  hideHeader?: boolean
}

interface Props {
  src?: string
  precomputedNotes?: NoteRecord[]
  views?: ViewMeta[]
  properties?: Record<string, PropertyConfig>
  initialView?: string
  configBase64?: string
}

export function BasesInlineView({
  src,
  precomputedNotes = [],
  views = [],
  properties = {},
  initialView,
  configBase64: _configBase64,
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
      {views.length > 1 && (
        <div className="mb-3 flex gap-2 border-b pb-2">
          {views.map(v => (
            <button
              key={v.name}
              onClick={() => { void switchView(v.name) }}
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
        <BasesViewTable notes={notes} properties={properties} hideHeader={activeView?.hideHeader} />
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
