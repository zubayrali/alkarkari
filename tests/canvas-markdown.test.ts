import { describe, expect, it } from 'vitest';
import { renderCanvasMarkdown } from '../lib/canvas-markdown';

describe('canvas Markdown rendering', () => {
  it('renders GFM structure and resolved wikilinks', () => {
    const html = renderCanvasMarkdown(
      [
        '## Heading',
        '',
        '- [x] **Complete**',
        '- [ ] Pending',
        '',
        '| Term | Meaning |',
        '| --- | --- |',
        '| Wird | Litany |',
        '',
        'See [[Foundations|the foundations]].',
      ].join('\n'),
      (target) => target === 'Foundations' ? '/foundations' : null,
    );

    expect(html).toContain('<h2>Heading</h2>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<strong>Complete</strong>');
    expect(html).toContain('<table>');
    expect(html).toContain('<a href="/foundations">the foundations</a>');
  });

  it('does not pass raw HTML through to the canvas', () => {
    const html = renderCanvasMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });
});
