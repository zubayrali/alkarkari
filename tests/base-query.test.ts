import { describe, it, expect } from 'vitest'
import { parseExpressionSource, compileExpression } from '../lib/base-compiler/index'
import { applyFilter, applySort, groupNotes } from '../lib/base-query'
import type { NoteRecord } from '../lib/base-types'

const note = (overrides: Partial<NoteRecord>): NoteRecord => ({
  slug: '/test', title: 'Test', path: 'test.md', folder: '',
  tags: [], protected: false, frontmatter: {},
  ...overrides,
})

const compileExpr = (src: string) => {
  const { program } = parseExpressionSource(src)
  return compileExpression(program.body!)
}

describe('applyFilter', () => {
  it('returns all notes when filter is null', () => {
    const notes = [note({ slug: '/a' }), note({ slug: '/b' })]
    expect(applyFilter(notes, null)).toEqual(notes)
  })

  it('filters by tag', () => {
    const notes = [
      note({ slug: '/a', tags: ['review'] }),
      note({ slug: '/b', tags: ['draft'] }),
    ]
    const filter = compileExpr('file.hasTag("review")')
    expect(applyFilter(notes, filter)).toHaveLength(1)
    expect(applyFilter(notes, filter)[0].slug).toBe('/a')
  })

  it('filters by folder', () => {
    const notes = [
      note({ slug: '/dict/a', folder: 'dictionary' }),
      note({ slug: '/books/b', folder: 'books' }),
    ]
    const filter = compileExpr('file.inFolder("dictionary")')
    expect(applyFilter(notes, filter)).toHaveLength(1)
  })

  it('filters by frontmatter property', () => {
    const notes = [
      note({ frontmatter: { rating: 9 } }),
      note({ frontmatter: { rating: 5 } }),
    ]
    const filter = compileExpr('rating >= 8')
    expect(applyFilter(notes, filter)).toHaveLength(1)
  })
})

describe('applySort', () => {
  it('sorts ascending by title', () => {
    const notes = [note({ title: 'Zeta' }), note({ title: 'Alpha' })]
    const sorted = applySort(notes, [{ property: 'title', direction: 'ASC' }])
    expect(sorted[0].title).toBe('Alpha')
  })

  it('sorts descending', () => {
    const notes = [note({ title: 'Alpha' }), note({ title: 'Zeta' })]
    const sorted = applySort(notes, [{ property: 'title', direction: 'DESC' }])
    expect(sorted[0].title).toBe('Zeta')
  })
})

describe('groupNotes', () => {
  it('returns single empty-key group when groupBy is undefined', () => {
    const notes = [note({}), note({})]
    const groups = groupNotes(notes, undefined)
    expect(groups.size).toBe(1)
    expect(groups.get('')).toHaveLength(2)
  })

  it('groups by frontmatter property', () => {
    const notes = [
      note({ frontmatter: { status: 'done' } }),
      note({ frontmatter: { status: 'wip' } }),
      note({ frontmatter: { status: 'done' } }),
    ]
    const groups = groupNotes(notes, { property: 'status', direction: 'ASC' })
    expect(groups.size).toBe(2)
    expect(groups.get('done')).toHaveLength(2)
  })
})
