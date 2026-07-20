const YT_ID_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/

/** Extract the 11-char video id from any common YouTube URL shape. */
export function extractYouTubeId(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const m = url.match(YT_ID_RE)
  return m ? m[1] : null
}

/** Thumbnail URL for a video id (480×360, always exists). */
export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
