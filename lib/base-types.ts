/** One rendered token of a wikilink-bearing frontmatter value. */
export interface WikilinkRef {
  /** Display text: explicit [[t|label]], else the target note's title, else raw. */
  text: string
  /** Resolved note URL; absent when the target doesn't match a real note. */
  href?: string
}

export interface NoteRecord {
  slug: string
  title: string
  path: string
  folder: string
  tags: string[]
  protected: boolean
  frontmatter: Record<string, unknown>
  /**
   * Frontmatter values that contain `[[wikilinks]]`, pre-resolved at generation
   * (where the global title map exists) so client base views can render real
   * links with titles. Keyed by property name; each entry is the ordered tokens
   * to render (joined by ", "). Absent when a note has no wikilink properties.
   */
  wikilinks?: Record<string, WikilinkRef[]>
}

export interface NotesIndex {
  version: 1
  notes: NoteRecord[]
}

export type FilterNode =
  | { and: FilterNode[] }
  | { or: FilterNode[] }
  | { not: FilterNode[] }
  | string

export interface PropertyConfig {
  displayName?: string
}

export interface BaseView {
  type: 'table' | 'gallery' | 'list'
  name: string
  filters?: FilterNode
  groupBy?: { property: string; direction: 'ASC' | 'DESC' }
  sort?: Array<{ property: string; direction: 'ASC' | 'DESC' }>
  order?: string[]
  cardSize?: number
  image?: string
  hideHeader?: boolean
}

export interface BaseConfig {
  filters?: FilterNode
  properties?: Record<string, PropertyConfig>
  views?: BaseView[]
}

export interface CompiledView {
  name: string
  type: BaseView['type']
  compiledFilter: string
  precomputedNotes: NoteRecord[]
  sortedBy: Array<{ property: string; direction: string }>
  groupBy?: { property: string; direction: string }
  order?: string[]
  hideHeader?: boolean
}

export interface CompiledBase {
  version: 1
  config: BaseConfig
  views: CompiledView[]
}
