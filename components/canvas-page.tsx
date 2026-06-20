import type { ReactNode } from 'react';
import { CanvasMdxPreview } from '@/components/canvas-mdx-preview';
import { CanvasView } from '@/components/canvas-view';
import { prepareCanvasFromPublic } from '@/lib/prepare-canvas';

export async function CanvasPageContent({ src }: { src: string }) {
  const data = await prepareCanvasFromPublic(src);
  const mdxPreviews: Record<string, ReactNode> = {};

  for (const node of data.nodes) {
    if (node.type !== 'file' || node.fileKind !== 'markdown') continue;

    mdxPreviews[node.id] = (
      <CanvasMdxPreview file={node.file} />
    );
  }

  return <CanvasView data={data} mdxPreviews={mdxPreviews} />;
}
