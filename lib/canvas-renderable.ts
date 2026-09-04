import type { CanvasData, CanvasNode } from '@/lib/canvas-types';
import type { CanvasFileKind } from '@/lib/canvas-paths';

export type RenderableCanvasNode = CanvasNode & {
  href?: string;
  fileKind?: CanvasFileKind;
  backgroundUrl?: string;
  textHtml?: string;
  contentHtml?: Array<
    | { type: 'markdown'; html: string }
    | { type: 'database'; snapshot: import('./affine/database-types').AffineDatabaseSnapshot }
    | Exclude<import('./canvas-types').CanvasContentSegment, { type: 'markdown' | 'database' | 'latex' | 'table' }>
    | { type: 'latex'; html: string; formula: string }
    | { type: 'table'; rows: string[][] }
  >;
};

export type RenderableCanvasData = {
  nodes: RenderableCanvasNode[];
  edges: CanvasData['edges'];
};
