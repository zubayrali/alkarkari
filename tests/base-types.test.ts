import { describe, it, expectTypeOf } from 'vitest'
import type { NoteRecord, BaseConfig, CompiledBase } from '../lib/base-types'

describe('NoteRecord', () => {
  it('has required shape', () => {
    expectTypeOf<NoteRecord>().toHaveProperty('slug')
    expectTypeOf<NoteRecord>().toHaveProperty('title')
    expectTypeOf<NoteRecord>().toHaveProperty('path')
    expectTypeOf<NoteRecord>().toHaveProperty('folder')
    expectTypeOf<NoteRecord>().toHaveProperty('tags')
    expectTypeOf<NoteRecord>().toHaveProperty('frontmatter')
  })
})
