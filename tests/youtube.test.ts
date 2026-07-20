import { describe, it, expect } from 'vitest'
import { extractYouTubeId } from '../lib/youtube'

describe('extractYouTubeId', () => {
  it('handles common URL shapes', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=bW4UZSwrqMQ')).toBe('bW4UZSwrqMQ')
    expect(extractYouTubeId('https://www.youtube.com/watch?list=PL123&v=bW4UZSwrqMQ')).toBe('bW4UZSwrqMQ')
    expect(extractYouTubeId('https://youtu.be/bW4UZSwrqMQ')).toBe('bW4UZSwrqMQ')
    expect(extractYouTubeId('https://youtube.com/shorts/bW4UZSwrqMQ')).toBe('bW4UZSwrqMQ')
    expect(extractYouTubeId('https://www.youtube.com/embed/bW4UZSwrqMQ')).toBe('bW4UZSwrqMQ')
  })

  it('rejects non-YouTube and non-string values', () => {
    expect(extractYouTubeId('https://vimeo.com/12345')).toBeNull()
    expect(extractYouTubeId(undefined)).toBeNull()
    expect(extractYouTubeId(42)).toBeNull()
  })
})
