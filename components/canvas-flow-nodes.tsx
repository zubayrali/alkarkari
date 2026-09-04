'use client';

import { memo, useLayoutEffect, useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'fumadocs-core/link';
import { useRouter } from 'next/navigation';
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import { useCanvasMdxPreview } from '@/components/canvas-mdx-preview-context';
import { CanvasTextContent } from '@/components/canvas-text-content';
import { canvasNodeStyle, resolveCanvasColor, resolveCanvasInkColor } from '@/lib/canvas-colors';
import { getCanvasFileExtensionLabel } from '@/lib/canvas-paths';
import type { RenderableCanvasNode } from '@/lib/canvas-renderable';
import type { CanvasSide } from '@/lib/canvas-types';

export type CanvasFlowHandle = {
  id: string;
  type: 'source' | 'target';
  side: CanvasSide;
  position: [number, number];
};

export type CanvasFlowNodeData = {
  node: RenderableCanvasNode;
  handles: CanvasFlowHandle[];
};

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const;

const handleClass =
  '!opacity-0 !min-h-0 !min-w-0 !h-1 !w-1 !border-0 !bg-transparent !pointer-events-none';

function CanvasSideHandles({ handles }: { handles: CanvasFlowHandle[] }) {
  return (
    <>
      {handles.map((handle) => {
        const side = SIDES.find((candidate) => candidate.id === handle.side)!;
        const [x, y] = handle.position;
        return (
          <Handle
            key={`${handle.type}-${handle.id}`}
            type={handle.type}
            position={side.position}
            id={handle.id}
            className={handleClass}
            style={
              handle.side === 'top' || handle.side === 'bottom'
                ? { left: `${x * 100}%` }
                : { top: `${y * 100}%` }
            }
          />
        );
      })}
    </>
  );
}

function getFileDisplayName(filePath: string) {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

function CanvasNodeLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full left-0 mb-1 max-w-full truncate text-xs font-medium text-fd-muted-foreground">
      {children}
    </div>
  );
}

function LabeledNodeWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="canvas-labeled-node relative h-full w-full">
      <CanvasNodeLabel>{label}</CanvasNodeLabel>
      {children}
    </div>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest('a, button, input, textarea, select, label, [role="button"]'),
  );
}

function getLinkLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

const cardClass =
  'h-full w-full overflow-hidden rounded-[6px] border text-fd-card-foreground shadow-sm';

const groupFrameClass = 'canvas-group-frame pointer-events-none h-full w-full';

function useExpandedTextNode(id: string, authoredHeight: number) {
  const contentRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  useLayoutEffect(() => {
    const content = contentRef.current;
    const flowNode = content?.closest<HTMLElement>('.react-flow__node');
    if (!content || !flowNode) return;

    const resize = () => {
      const contentHeight = Math.ceil(content.scrollHeight);
      const nextHeight = Math.max(authoredHeight, contentHeight);
      // offsetHeight stays in canvas coordinates; getBoundingClientRect() is
      // scaled by the current React Flow zoom and would cause resize loops.
      if (Math.abs(flowNode.offsetHeight - nextHeight) < 1) return;
      flowNode.style.height = `${nextHeight}px`;
      updateNodeInternals(id);
    };

    const frame = requestAnimationFrame(resize);
    const observer = new ResizeObserver(resize);
    observer.observe(content);
    if (content.firstElementChild) observer.observe(content.firstElementChild);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [authoredHeight, id, updateNodeInternals]);

  return contentRef;
}

const TextFlowNode = memo(function TextFlowNode({ id, data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  const contentRef = useExpandedTextNode(id, node.height);
  if (node.type !== 'text') return null;

  if (node.variant === 'label') {
    return (
      <div
        className="canvas-surface-label relative flex h-full w-full items-center overflow-visible"
        style={{
          color: resolveCanvasInkColor(node.color) ?? 'var(--color-fd-foreground)',
          fontSize: node.fontSize ?? 16,
          fontWeight: node.fontWeight ?? 500,
          justifyContent:
            node.textAlign === 'left'
              ? 'flex-start'
              : node.textAlign === 'right'
                ? 'flex-end'
                : 'center',
          textAlign: node.textAlign ?? 'center',
          transform: node.rotate ? `rotate(${node.rotate}deg)` : undefined,
        }}
      >
        <CanvasSideHandles handles={data.handles} />
        <span className="whitespace-pre-wrap leading-tight">{node.text}</span>
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      className={`${cardClass} flex flex-col justify-start px-3 py-2`}
      style={canvasNodeStyle(node.color)}
    >
      <CanvasSideHandles handles={data.handles} />
      {node.textHtml ? (
        <CanvasTextContent html={node.textHtml} segments={node.contentHtml} />
      ) : (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{node.text}</div>
      )}
    </div>
  );
});

const ShapeFlowNode = memo(function ShapeFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'shape') return null;

  const strokeWidth = Math.max(0, node.strokeWidth ?? 2);
  const inset = strokeWidth / 2;
  const width = Math.max(1, node.width);
  const height = Math.max(1, node.height);
  const fill = resolveCanvasColor(node.fillColor) ?? 'var(--color-fd-card)';
  const stroke = resolveCanvasColor(node.strokeColor) ?? 'var(--color-fd-border)';
  const common = { fill, stroke, strokeWidth, vectorEffect: 'non-scaling-stroke' as const };
  const shape = node.shape === 'ellipse' ? (
    <ellipse cx={width / 2} cy={height / 2} rx={Math.max(0, width / 2 - inset)} ry={Math.max(0, height / 2 - inset)} {...common} />
  ) : node.shape === 'diamond' ? (
    <polygon points={`${width / 2},${inset} ${width - inset},${height / 2} ${width / 2},${height - inset} ${inset},${height / 2}`} {...common} />
  ) : node.shape === 'triangle' ? (
    <polygon points={`${width / 2},${inset} ${width - inset},${height - inset} ${inset},${height - inset}`} {...common} />
  ) : (
    <rect
      x={inset}
      y={inset}
      width={Math.max(0, width - strokeWidth)}
      height={Math.max(0, height - strokeWidth)}
      rx={node.radius && node.radius <= 1 ? Math.min(width, height) * node.radius : node.radius ?? 0}
      {...common}
    />
  );

  return (
    <div className="relative h-full w-full" style={{ transform: node.rotate ? `rotate(${node.rotate}deg)` : undefined }}>
      <CanvasSideHandles handles={data.handles} />
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} role={node.text ? 'img' : undefined} aria-label={node.text}>
        {shape}
        {node.text && (
          <foreignObject x={0} y={0} width={width} height={height}>
            <div
              className="flex h-full w-full items-center justify-center overflow-hidden px-[4%] py-[3%] text-center leading-tight"
              style={{
                color: resolveCanvasColor(node.textColor) ?? 'var(--color-fd-foreground)',
                fontSize: node.fontSize ?? 16,
                fontWeight: node.fontWeight ?? 600,
              }}
            >
              {node.text}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
});

const BrushFlowNode = memo(function BrushFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'brush') return null;
  const points = node.points.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <div className="pointer-events-none relative h-full w-full" style={{ transform: node.rotate ? `rotate(${node.rotate}deg)` : undefined }}>
      <CanvasSideHandles handles={data.handles} />
      <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} aria-hidden="true" overflow="visible">
        <polyline
          points={points}
          fill="none"
          stroke={resolveCanvasColor(node.strokeColor) ?? 'var(--color-fd-foreground)'}
          strokeWidth={node.strokeWidth ?? 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
});

const FileFlowNode = memo(function FileFlowNode({
  id,
  data,
}: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  const mdxPreview = useCanvasMdxPreview(id);
  const router = useRouter();
  if (node.type !== 'file') return null;

  const href = node.href ?? `/${node.file}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  // ponytail: <Link> auto-prepends basePath, raw src attrs don't
  const assetSrc = `${basePath}${href}`;

  const openNode = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    router.push(href);
  };
  const displayName = getFileDisplayName(node.file);
  const nodeStyle = canvasNodeStyle(node.color);
  const fileKind = node.fileKind ?? 'other';

  if (fileKind === 'image') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <a
          href={assetSrc}
          aria-label={displayName}
          className={`${cardClass} relative block hover:opacity-90 transition-opacity`}
          style={nodeStyle}
        >
          <CanvasSideHandles handles={data.handles} />
          <Image
            src={assetSrc}
            alt=""
            fill
            className="object-cover"
            sizes={`${Math.round(node.width)}px`}
          />
        </a>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'video') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div className={cardClass} style={nodeStyle}>
          <CanvasSideHandles handles={data.handles} />
          <video
            src={assetSrc}
            className="h-full w-full object-cover"
            controls
            preload="metadata"
            playsInline
          />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'audio') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div
          className={`${cardClass} flex flex-col justify-center px-3 py-2`}
          style={nodeStyle}
        >
          <CanvasSideHandles handles={data.handles} />
          <audio src={assetSrc} controls preload="metadata" className="w-full" />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'pdf') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div className={cardClass} style={nodeStyle}>
          <CanvasSideHandles handles={data.handles} />
          <iframe
            src={assetSrc}
            title={displayName}
            className="h-full w-full border-0 bg-fd-background"
          />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'markdown') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div
          role="link"
          tabIndex={0}
          onClick={openNode}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isInteractiveTarget(event.target)) {
              router.push(href);
            }
          }}
          className={`${cardClass} block cursor-pointer hover:bg-fd-accent/40 transition-colors`}
          style={nodeStyle}
        >
          <CanvasSideHandles handles={data.handles} />
          <div className="h-full overflow-auto px-3 py-2">
            {mdxPreview ?? (
              <span className="text-xs text-fd-muted-foreground">Note</span>
            )}
          </div>
        </div>
      </LabeledNodeWrapper>
    );
  }

  const typeLabel = getCanvasFileExtensionLabel(node.file);

  return (
    <LabeledNodeWrapper label={displayName}>
      <a
        href={assetSrc}
        className={`${cardClass} flex flex-col justify-center px-3 py-2 text-sm hover:bg-fd-accent/40 transition-colors`}
        style={nodeStyle}
      >
        <CanvasSideHandles handles={data.handles} />
        <span className="text-xs text-fd-muted-foreground">{typeLabel}</span>
      </a>
    </LabeledNodeWrapper>
  );
});

const LinkFlowNode = memo(function LinkFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'link') return null;

  const label = getLinkLabel(node.url);

  return (
    <Link
      href={node.href ?? node.url}
      external
      className={`${cardClass} flex flex-col justify-center gap-0.5 px-3 py-2 text-sm hover:bg-fd-accent/40 transition-colors`}
      style={canvasNodeStyle(node.color)}
    >
      <CanvasSideHandles handles={data.handles} />
      <span className="truncate font-medium">{label}</span>
      <span className="truncate text-xs text-fd-muted-foreground">{node.url}</span>
    </Link>
  );
});

const GroupFlowNode = memo(function GroupFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'group') return null;

  const backgroundSize =
    node.backgroundStyle === 'repeat'
      ? 'auto'
      : node.backgroundStyle === 'ratio'
        ? 'contain'
        : 'cover';

  return (
    <div className="canvas-labeled-node canvas-group-node pointer-events-none relative h-full w-full">
      {node.label && (
        <div className="canvas-group-label absolute -top-2.5 left-4 z-10 px-2 text-xs font-semibold text-fd-muted-foreground">
          {node.label}
        </div>
      )}
      <div
        className={groupFrameClass}
        style={{
          backgroundImage: node.backgroundUrl ? `url(${node.backgroundUrl})` : undefined,
          backgroundRepeat: node.backgroundStyle === 'repeat' ? 'repeat' : 'no-repeat',
          backgroundSize,
          backgroundPosition: 'center',
        }}
      >
        <CanvasSideHandles handles={data.handles} />
      </div>
    </div>
  );
});

export const canvasNodeTypes = {
  text: TextFlowNode,
  shape: ShapeFlowNode,
  file: FileFlowNode,
  link: LinkFlowNode,
  brush: BrushFlowNode,
  canvasGroup: GroupFlowNode,
} satisfies NodeTypes;
