import type { NoteRecord, PropertyConfig } from './base-types'

const WIKILINK_RE = /^\[\[(.+?)]]$/
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * Resolve an image property value to a URL.
 * Handles `[[file.webp]]` wikilinks (vault attachments) and plain URLs.
 */
export function resolveImageUrl(note: NoteRecord, prop: string): string {
  const raw = note.frontmatter?.[prop]
  if (!raw || typeof raw !== 'string') return ''
  const m = raw.match(WIKILINK_RE)
  if (!m) return raw
  // ponytail: vault attachment in same folder → public/<folder>/<file>
  return `${basePath}/${note.folder}/${m[1]}`
}

/**
 * Resolve a column identifier to its value on a NoteRecord.
 * Handles both `file.*` built-in properties and frontmatter keys.
 * This is the single source of truth for column → value mapping,
 * shared by all view components.
 */
export function resolveNoteProperty(note: NoteRecord, col: string): unknown {
  // Strip file./note. prefix for built-in resolution
  const prop = col.startsWith('file.') ? col.slice(5)
    : col.startsWith('note.') ? col.slice(5)
    : col

  switch (prop) {
    case 'name':
    case 'title':
    case 'basename':
      return note.title
    case 'folder':
      return note.folder
    case 'path':
      return note.path
    case 'tags':
      return note.tags.join(', ')
    case 'aliases': {
      const aliases = note.frontmatter?.aliases
      if (!aliases) return undefined
      const list = Array.isArray(aliases) ? aliases : [aliases]
      return list.join(', ')
    }
    case 'slug':
    case 'link':
      return note.slug
    default:
      break
  }

  return note.frontmatter?.[col]
}

/** Whether this column identifies the note's name/title (rendered as a link). */
export function isNameColumn(col: string): boolean {
  const prop = col.startsWith('file.') ? col.slice(5)
    : col.startsWith('note.') ? col.slice(5)
    : col
  return prop === 'name' || prop === 'title' || prop === 'basename'
}

const FILE_PROPERTY_LABELS: Record<string, string> = {
  'file.name': 'Name',
  'file.folder': 'Folder',
  'file.path': 'Path',
  'file.tags': 'Tags',
  'file.aliases': 'Aliases',
  'title': 'Name',
  'folder': 'Folder',
  'path': 'Path',
  'tags': 'Tags',
}

/**
 * Resolve the display label for a column header.
 * Checks PropertyConfig.displayName first, then built-in labels,
 * with alias resolution (file.name ↔ name).
 */
export function resolveDisplayName(
  col: string,
  properties: Record<string, PropertyConfig>,
): string {
  if (properties[col]?.displayName) return properties[col].displayName!

  // Strip file./note. prefix: "file.name" → "name"
  if (col.startsWith('file.') || col.startsWith('note.')) {
    const short = col.split('.').pop()!
    if (properties[short]?.displayName) return properties[short].displayName!
  }
  // Add file. prefix: "name" → "file.name"
  if (properties[`file.${col}`]?.displayName) return properties[`file.${col}`].displayName!

  return FILE_PROPERTY_LABELS[col] ?? col
}
