import { describe, it, expect } from 'vitest'
import { transformSidenoteSyntax } from '../lib/remark-sidenote-syntax'

describe('transformSidenoteSyntax', () => {
  it('passes through content without braces', () => {
    const input = 'Plain text with a [^1] footnote.\n\n[^1]: note\n'
    expect(transformSidenoteSyntax(input)).toBe(input)
  })

  it('converts the labeled form', () => {
    const out = transformSidenoteSyntax('objects genuinely {{sidenotes[possess.]: the challenge}}\n')
    expect(out).toContain('objects genuinely possess.[^_sn_1]')
    expect(out).toContain('[^_sn_1]: the challenge')
  })

  it('converts the bare kufrCleaner form, gluing the marker to the prior word', () => {
    const out = transformSidenoteSyntax('The web was static. {{Well, mostly static.}} More text.\n')
    expect(out).toContain('The web was static.[^_sn_1] More text.')
    expect(out).toContain('[^_sn_1]: Well, mostly static.')
  })

  it('handles both forms in one document', () => {
    const out = transformSidenoteSyntax(
      'A {{sidenotes[label]: first}} and B {{second}} end.\n',
    )
    expect(out).toContain('A label[^_sn_1] and B[^_sn_2] end.')
    expect(out).toContain('[^_sn_1]: first')
    expect(out).toContain('[^_sn_2]: second')
  })

  it('supports markdown inside bare notes', () => {
    const out = transformSidenoteSyntax('Text {{a **bold** [link](https://x.y) note}}\n')
    expect(out).toContain('[^_sn_1]: a **bold** [link](https://x.y) note')
  })

  it('transforms a note that contains an inline code span', () => {
    const out = transformSidenoteSyntax('Text {{a note with `inline code` inside}} end.\n')
    expect(out).toContain('Text[^_sn_1] end.')
    expect(out).toContain('[^_sn_1]: a note with `inline code` inside')
  })

  it('folds multi-line note bodies into one definition line', () => {
    const out = transformSidenoteSyntax('Text {{line one\nline two}}\n')
    expect(out).toContain('[^_sn_1]: line one line two')
  })

  it('leaves code fences, orbit fences, and inline code untouched', () => {
    const input = [
      'Prose {{a note}} here.',
      '```txt',
      'template {{not a note}}',
      '```',
      '```orbit',
      'Q: what is {{this}}?',
      'A: braces',
      '```',
      'Inline `{{also not}}` code.',
      '',
    ].join('\n')
    const out = transformSidenoteSyntax(input)
    expect(out).toContain('Prose[^_sn_1] here.')
    expect(out).toContain('template {{not a note}}')
    expect(out).toContain('Q: what is {{this}}?')
    expect(out).toContain('`{{also not}}`')
    expect(out).not.toContain('_sn_2')
  })

  it('leaves YAML frontmatter untouched', () => {
    const input = '---\ntitle: T\ndate: "{{date}}"\n---\nBody {{note}}\n'
    const out = transformSidenoteSyntax(input)
    expect(out).toContain('date: "{{date}}"')
    expect(out).toContain('Body[^_sn_1]')
    expect(out).toContain('[^_sn_1]: note')
  })
})
