'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CanvasMdxPreviewContext } from '@/components/canvas-mdx-preview-context';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { RenderableCanvasData } from '@/lib/canvas-renderable';
import { canvasToFlow } from '@/lib/canvas-to-flow';
import { CanvasControls } from '@/components/canvas-controls';
import { canvasEdgeTypes } from '@/components/canvas-flow-edge';
import { canvasNodeTypes } from '@/components/canvas-flow-nodes';
import type { Edge, Node } from '@xyflow/react';

export type CanvasViewProps = {
  data: RenderableCanvasData;
  title?: string;
  mdxPreviews?: Record<string, ReactNode>;
  fullBleed?: boolean;
};

function getPrimaryDiagramNodes(nodes: Node[], edges: Edge[]) {
  if (edges.length === 0) return nodes;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const neighbors = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) continue;
    if (!neighbors.has(edge.source)) neighbors.set(edge.source, new Set());
    if (!neighbors.has(edge.target)) neighbors.set(edge.target, new Set());
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  let primaryIds: string[] = [];
  for (const startId of neighbors.keys()) {
    if (visited.has(startId)) continue;
    const component: string[] = [];
    const queue = [startId];
    visited.add(startId);

    for (let index = 0; index < queue.length; index += 1) {
      const id = queue[index];
      component.push(id);
      for (const neighborId of neighbors.get(id) ?? []) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }

    if (component.length > primaryIds.length) primaryIds = component;
  }

  return primaryIds.length > 1
    ? primaryIds.flatMap((id) => (nodesById.has(id) ? [nodesById.get(id)!] : []))
    : nodes;
}

function CanvasFlow({ data }: CanvasViewProps) {
  const { setViewport } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const { nodes, edges } = useMemo(() => canvasToFlow(data), [data]);
  const primaryDiagramNodes = useMemo(
    () => getPrimaryDiagramNodes(nodes, edges),
    [nodes, edges],
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setColorMode(root.classList.contains('dark') ? 'dark' : 'light');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container || primaryDiagramNodes.length === 0) return;
      const rect = container.getBoundingClientRect();
      const minX = Math.min(...primaryDiagramNodes.map((node) => node.position.x));
      const minY = Math.min(...primaryDiagramNodes.map((node) => node.position.y));
      const maxX = Math.max(...primaryDiagramNodes.map((node) => node.position.x + Number(node.style?.width ?? 0)));
      const maxY = Math.max(...primaryDiagramNodes.map((node) => node.position.y + Number(node.style?.height ?? 0)));
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const padding = 32;
      const zoom = Math.max(0.18, Math.min(1.25, (rect.width - padding * 2) / width, (rect.height - padding * 2) / height));
      void setViewport({
        x: (rect.width - width * zoom) / 2 - minX * zoom,
        y: (rect.height - height * zoom) / 2 - minY * zoom,
        zoom,
      }, { duration: 0 });
    });
    return () => cancelAnimationFrame(id);
  }, [primaryDiagramNodes, setViewport]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={canvasEdgeTypes}
      nodeTypes={canvasNodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.08}
      maxZoom={2.5}
      panOnDrag
      panOnScroll={false}
      zoomOnScroll
      zoomOnPinch
      colorMode={colorMode}
      proOptions={{ hideAttribution: true }}
      className="canvas-flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} />
        <CanvasControls fitViewPadding={0.15} />
      </ReactFlow>
    </div>
  );
}

function useCanvasFullbleed(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const page = document.getElementById('nd-page');
    if (!page) return;

    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const pageStyle = page.getAttribute('style');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    page.style.maxWidth = 'none';
    page.style.padding = '0';
    page.style.paddingInline = '0';
    page.style.paddingBlock = '0';
    page.style.margin = '0';
    page.style.marginInline = '0';
    page.style.gap = '0';
    page.style.overflow = 'hidden';
    page.style.position = 'relative';
    page.style.gridColumn = '3 / -1';
    const h1 = page.querySelector('h1');
    const h1Display = h1?.style.display;
    if (h1 instanceof HTMLElement) h1.style.display = 'none';
    return () => {
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
      if (pageStyle === null) page.removeAttribute('style');
      else page.setAttribute('style', pageStyle);
      if (h1 instanceof HTMLElement) h1.style.display = h1Display ?? '';
    };
  }, [enabled]);
}

export function CanvasView({ data, title, mdxPreviews = {}, fullBleed = true }: CanvasViewProps) {
  useCanvasFullbleed(fullBleed);
  if (data.nodes.length === 0) {
    return (
      <div className="not-prose flex h-[min(480px,60vh)] items-center justify-center border bg-fd-background text-sm text-fd-muted-foreground">
        Empty canvas
      </div>
    );
  }

  return (
    <div
      className={
        fullBleed
          ? 'canvas-stage canvas-stage--full not-prose relative h-[max(28rem,calc(100dvh-15.25rem))] min-h-0 overflow-hidden [&_.canvas-flow]:h-full'
          : 'not-prose relative min-h-[32rem] overflow-hidden border border-fd-border [&_.canvas-flow]:h-[min(72vh,52rem)]'
      }
    >
      <CanvasMdxPreviewContext.Provider value={mdxPreviews}>
        <ReactFlowProvider>
          <CanvasFlow data={data} />
        </ReactFlowProvider>
      </CanvasMdxPreviewContext.Provider>
      {title && (
        <div className="canvas-identity pointer-events-none absolute left-3 top-3 z-10">
          <span>Canvas</span>
          <strong>{title}</strong>
        </div>
      )}
      <div className="canvas-navigation-hint pointer-events-none absolute bottom-3 right-3 z-10">
        Drag to pan <span aria-hidden>·</span> Scroll to zoom
      </div>
    </div>
  );
}
