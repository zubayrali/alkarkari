'use client';

import { AffineDatabaseView } from '@/components/affine-database-view';
import type { RenderableCanvasNode } from '@/lib/canvas-renderable';

type CanvasTextContentProps = {
  html: string;
  segments?: Extract<RenderableCanvasNode, { type: 'text' }>['contentHtml'];
};

export function CanvasTextContent({ html, segments }: CanvasTextContentProps) {
  const safeHref = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? value : '#';
    } catch {
      return value.startsWith('/') ? value : '#';
    }
  };

  return (
    <div className="canvas-text-content canvas-mdx-content nowheel h-full overflow-auto text-sm leading-relaxed break-words">
      {segments?.length ? segments.map((segment, index) => {
        if (segment.type === 'database') return <AffineDatabaseView key={`database-${segment.snapshot.databaseBlockId}`} snapshot={segment.snapshot} />;
        if (segment.type === 'markdown') return <div key={`markdown-${index}`} dangerouslySetInnerHTML={{ __html: segment.html }} />;
        if (segment.type === 'divider') return <hr key={`divider-${index}`} className="my-3 border-fd-border" />;
        if (segment.type === 'image') return (
          <figure key={`image-${index}`} className="my-3 overflow-hidden rounded-md border border-fd-border bg-fd-muted/20">
            {/* AFFiNE blob dimensions are not always available in the block payload. */}
            {/* oxlint-disable-next-line nextjs/no-img-element */}
            <img src={segment.src} alt={segment.alt ?? ''} className="max-h-[32rem] w-full object-contain" loading="lazy" />
            {segment.caption && <figcaption className="border-t border-fd-border px-3 py-2 text-xs text-fd-muted-foreground">{segment.caption}</figcaption>}
          </figure>
        );
        if (segment.type === 'bookmark') return (
          <a key={`bookmark-${index}`} href={safeHref(segment.url)} target="_blank" rel="noreferrer" className="my-3 block rounded-md border border-fd-border bg-fd-card p-3 no-underline transition-colors hover:bg-fd-accent/40">
            <span className="block font-medium text-fd-foreground">{segment.title || segment.url || 'Bookmark'}</span>
            {segment.description && <span className="mt-1 line-clamp-2 block text-xs text-fd-muted-foreground">{segment.description}</span>}
            {segment.url && <span className="mt-2 block truncate text-[11px] text-fd-muted-foreground">{segment.url}</span>}
          </a>
        );
        if (segment.type === 'latex') return <div key={`latex-${index}`} className="my-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: segment.html }} />;
        if (segment.type === 'table') return (
          <div key={`table-${index}`} className="my-3 overflow-auto">
            <table>
              {segment.rows[0] && <thead><tr>{segment.rows[0].map((cell, cellIndex) => <th key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr></thead>}
              <tbody>{segment.rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>)}</tbody>
            </table>
          </div>
        );
        return (
          <div key={`unsupported-${index}`} className="my-3 rounded-md border border-dashed border-fd-border bg-fd-muted/20 px-3 py-2">
            <span className="text-xs font-medium text-fd-muted-foreground">{segment.label}</span>
          </div>
        );
      })
        : <div dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
