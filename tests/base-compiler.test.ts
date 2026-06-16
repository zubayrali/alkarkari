import { describe, it, expect } from 'vitest'
import { parseExpressionSource, compileExpression, evaluateFilterExpression } from '../lib/base-compiler/index'
import type { NoteRecord } from '../lib/base-types'

describe('base-compiler lexer', () => {
  it('tokenises a simple expression', () => {
    const result = parseExpressionSource('rating >= 8')
    expect(result.diagnostics).toHaveLength(0)
    expect(result.program.body).not.toBeNull()
  })
})

describe('base-compiler ir', () => {
  it('compiles an expression to bytecode', () => {
    const result = parseExpressionSource('file.hasTag("review")')
    expect(result.program.body).not.toBeNull()
    const bytecode = compileExpression(result.program.body!)
    expect(bytecode.instructions.length).toBeGreaterThan(0)
  })
})

describe('evaluateFilterExpression', () => {
  it('filters notes by tag', () => {
    const { program } = parseExpressionSource('file.hasTag("review")')
    const bytecode = compileExpression(program.body!)
    const note: NoteRecord = {
      slug: '/dict/test', title: 'Test', path: 'dict/test.md',
      folder: 'dict', tags: ['review'], protected: false, frontmatter: {},
    }
    const ctx = { file: note, allFiles: [note] }
    expect(evaluateFilterExpression(bytecode, ctx)).toBe(true)
  })

  it('returns false when tag absent', () => {
    const { program } = parseExpressionSource('file.hasTag("review")')
    const bytecode = compileExpression(program.body!)
    const note: NoteRecord = {
      slug: '/dict/other', title: 'Other', path: 'dict/other.md',
      folder: 'dict', tags: [], protected: false, frontmatter: {},
    }
    expect(evaluateFilterExpression(bytecode, { file: note, allFiles: [note] })).toBe(false)
  })
})
