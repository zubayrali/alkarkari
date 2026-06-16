import Link from 'next/link'
import { Fragment } from 'react'
import type { NoteRecord, WikilinkRef } from '@/lib/base-types'

/** Render a list of pre-resolved wikilink tokens, joined by commas. */
export function WikilinkRefs({ refs }: { refs: WikilinkRef[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-1 gap-y-0.5">
      {refs.map((ref, i) => (
        <Fragment key={i}>
          {ref.href ? (
            <Link href={ref.href} className="underline underline-offset-2 whitespace-nowrap">
              {ref.text}
            </Link>
          ) : (
            <span className="whitespace-nowrap">{ref.text}</span>
          )}
          {i < refs.length - 1 && <span className="text-neutral-400">,</span>}
        </Fragment>
      ))}
    </span>
  )
}

/**
 * Shared frontmatter-value renderer for every base view. Prefers pre-resolved
 * `[[wikilinks]]` (real links with titles); otherwise plain text, kept on one
 * line for short values so hyphenated tokens like "ذ-ك-ر" don't break.
 */
export function basesCellContent(note: NoteRecord, col: string): React.ReactNode {
  const refs = note.wikilinks?.[col]
  if (refs) return <WikilinkRefs refs={refs} />

  const val = note.frontmatter[col]
  if (val === null || val === undefined) return null

  const text = Array.isArray(val) ? val.join(', ') : String(val)
  return <span className={text.length > 48 ? '' : 'whitespace-nowrap'}>{text}</span>
}
