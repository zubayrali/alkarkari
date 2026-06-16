import fs from 'node:fs/promises'
import path from 'node:path'
import type { CompiledBase } from '@/lib/base-types'
import { BasesInlineView } from './bases-inline-view'

interface Props {
  src: string
}

export async function BasesPageContent({ src }: Props) {
  const filePath = path.join(process.cwd(), 'public', src)

  let compiled: CompiledBase
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    compiled = JSON.parse(raw) as CompiledBase
  } catch {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Base not found: {src}
      </div>
    )
  }

  const firstView = compiled.views[0]
  if (!firstView) {
    return <div className="text-sm text-neutral-500">No views defined.</div>
  }

  return (
    <BasesInlineView
      src={src}
      precomputedNotes={firstView.precomputedNotes}
      views={compiled.views.map(v => ({ name: v.name, type: v.type, hideHeader: v.hideHeader }))}
      properties={compiled.config.properties ?? {}}
    />
  )
}
