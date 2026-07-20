'use client'

import { useEffect, useRef, useState } from 'react'
import type { NoteRecord } from '@/lib/base-types'
import { resolveImageUrl } from '@/lib/base-properties'
import SphereImageGrid, { type ImageData } from '@/components/ui/img-sphere'
import { extractYouTubeId, youTubeThumbnail } from '@/lib/youtube'
import type { BasesStrings } from '@/lib/bases-strings'

interface Props {
  notes: NoteRecord[]
  /** View's `image:` property; falls back to a thumbnail derived from `youtube` frontmatter. */
  imageProperty?: string
  strings?: BasesStrings
}

const MAX_SIZE = 600

export function BasesViewSphere({ notes, imageProperty }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(MAX_SIZE)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setSize(Math.min(MAX_SIZE, el.clientWidth || MAX_SIZE))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const images: ImageData[] = notes.flatMap(note => {
    const youtube = typeof note.frontmatter?.youtube === 'string' ? note.frontmatter.youtube : undefined
    const videoId = extractYouTubeId(youtube)
    const explicit = imageProperty ? resolveImageUrl(note, imageProperty) : ''
    const src = explicit || (videoId ? youTubeThumbnail(videoId) : '')
    if (!src) return []
    const description = note.frontmatter?.description
    return [{
      id: note.slug,
      src,
      alt: note.title,
      title: note.title,
      description: typeof description === 'string' ? description : undefined,
      href: youtube,
      noteHref: note.slug,
    }]
  })

  return (
    <div ref={wrapRef} className="flex justify-center">
      <SphereImageGrid
        images={images}
        containerSize={size}
        sphereRadius={size / 3}
        dragSensitivity={0.8}
        momentumDecay={0.96}
        baseImageScale={0.15}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </div>
  )
}
