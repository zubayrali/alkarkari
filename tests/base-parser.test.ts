import { describe, it, expect } from 'vitest'
import { parseBaseConfig, vaultPathToSlug } from '../lib/base-parser'

describe('vaultPathToSlug', () => {
  it('slugifies a simple path', () => {
    expect(vaultPathToSlug('dictionary/My Note.md')).toBe('dictionary/my-note')
  })

  it('slugifies a base file path', () => {
    expect(vaultPathToSlug('dictionary/Books Overview.base')).toBe('dictionary/books-overview')
  })

  it('handles vault root file', () => {
    expect(vaultPathToSlug('Wird.md')).toBe('wird')
  })
})

describe('parseBaseConfig', () => {
  it('parses a minimal config with no views', () => {
    const yaml = `filters: "file.inFolder(\\"dictionary\\")"\n`
    const { config } = parseBaseConfig(yaml)
    expect(config.filters).toBe('file.inFolder("dictionary")')
    expect(config.views).toHaveLength(1)
    expect(config.views![0]).toMatchObject({ type: 'table', name: 'Table' })
  })

  it('synthesises default table view when views array is absent', () => {
    const { config } = parseBaseConfig('')
    expect(config.views).toHaveLength(1)
    expect(config.views![0].type).toBe('table')
  })

  it('compiles a top-level filter to bytecode', () => {
    const yaml = `filters: "file.hasTag(\\"review\\")"\n`
    const { topLevelFilter } = parseBaseConfig(yaml)
    expect(topLevelFilter).not.toBeNull()
    expect(topLevelFilter!.instructions.length).toBeGreaterThan(0)
  })

  it('compiles view-level filter combined with top-level', () => {
    const yaml = `
filters: "file.inFolder(\\"dictionary\\")"
views:
  - type: table
    name: Reviews
    filters: "file.hasTag(\\"review\\")"
`
    const { viewFilters } = parseBaseConfig(yaml)
    expect(viewFilters[0]).not.toBeNull()
  })

  it('parses display names from properties', () => {
    const yaml = `
properties:
  rating:
    displayName: Rating (1-10)
`
    const { config } = parseBaseConfig(yaml)
    expect(config.properties?.rating?.displayName).toBe('Rating (1-10)')
  })
})

describe('vaultPathToSlug — folder-index convention', () => {
  it('slugifies folder-index path correctly', () => {
    expect(vaultPathToSlug('dictionary/dictionary.base')).toBe('dictionary/dictionary')
    expect(vaultPathToSlug('dictionary/index.base')).toBe('dictionary/index')
  })
})
