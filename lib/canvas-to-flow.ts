import type { Edge, Node } from '@xyflow/react';
import type { CanvasFlowHandle, CanvasFlowNodeData } from '../components/canvas-flow-nodes';
import { resolveCanvasColor } from './canvas-colors';
import type { CanvasNode, CanvasSide } from './canvas-types';
import type { RenderableCanvasData } from './canvas-renderable';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function inferredSide(node: CanvasNode, other: CanvasNode): CanvasSide {
  const dx = other.x + other.width / 2 - (node.x + node.width / 2);
  const dy = other.y + other.height / 2 - (node.y + node.height / 2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function handlePosition(
  node: CanvasNode,
  other: CanvasNode,
  side: CanvasSide,
  explicit?: [number, number],
): [number, number] {
  if (explicit) return [clamp(explicit[0], 0.04, 0.96), clamp(explicit[1], 0.04, 0.96)];

  const otherCenterX = other.x + other.width / 2;
  const otherCenterY = other.y + other.height / 2;
  if (side === 'top' || side === 'bottom') {
    return [clamp((otherCenterX - node.x) / node.width, 0.12, 0.88), side === 'top' ? 0 : 1];
  }
  return [side === 'left' ? 0 : 1, clamp((otherCenterY - node.y) / node.height, 0.12, 0.88)];
}

export function canvasToFlow(data: RenderableCanvasData) {
  const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
  const handlesByNode = new Map<string, CanvasFlowHandle[]>();
  const addHandle = (nodeId: string, handle: CanvasFlowHandle) => {
    const handles = handlesByNode.get(nodeId) ?? [];
    handles.push(handle);
    handlesByNode.set(nodeId, handles);
  };

  for (const edge of data.edges) {
    const source = nodesById.get(edge.fromNode);
    const target = nodesById.get(edge.toNode);
    if (!source || !target) continue;
    const sourceSide = edge.fromSide ?? inferredSide(source, target);
    const targetSide = edge.toSide ?? inferredSide(target, source);
    addHandle(source.id, {
      id: `source-${edge.id}`,
      type: 'source',
      side: sourceSide,
      position: handlePosition(source, target, sourceSide, edge.fromPosition),
    });
    addHandle(target.id, {
      id: `target-${edge.id}`,
      type: 'target',
      side: targetSide,
      position: handlePosition(target, source, targetSide, edge.toPosition),
    });
  }

  const nodes: Node<CanvasFlowNodeData>[] = data.nodes.map((node, index) => ({
    id: node.id,
    type: node.type === 'group' ? 'canvasGroup' : node.type,
    position: { x: node.x, y: node.y },
    data: { node, handles: handlesByNode.get(node.id) ?? [] },
    style: {
      width: node.width,
      height: node.height,
      ...(node.type === 'group' || node.type === 'file' ? { overflow: 'visible' } : {}),
    },
    // AFFiNE frames are visual backplates. Keeping them below their children
    // prevents a large transparent frame from dimming or intercepting content.
    zIndex: node.type === 'group' ? -1 : index + 1,
    draggable: false,
    selectable: node.type === 'text' && Boolean(node.content?.some((segment) => segment.type === 'database')),
    connectable: false,
    ...(node.type === 'group' ? { focusable: false } : {}),
  }));

  const edges: Edge[] = data.edges.flatMap((edge) => {
    const sourceExists = nodes.some((node) => node.id === edge.fromNode);
    const targetExists = nodes.some((node) => node.id === edge.toNode);
    if (!sourceExists || !targetExists) return [];

    const stroke = resolveCanvasColor(edge.color) ?? 'var(--color-fd-muted-foreground)';
    const strokeWidth = edge.strokeWidth ?? 2;
    return [
      {
        id: edge.id,
        source: edge.fromNode,
        target: edge.toNode,
        sourceHandle: `source-${edge.id}`,
        targetHandle: `target-${edge.id}`,
        label: edge.label,
        type: 'canvasConnector',
        data: {
          mode: edge.mode ?? 'orthogonal',
          fromEnd: edge.fromEnd ?? 'none',
          toEnd: edge.toEnd ?? 'arrow',
        },
        selectable: false,
        focusable: false,
        style: {
          stroke,
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity: 1,
          strokeDasharray: edge.strokeStyle === 'dash' ? '10 8' : undefined,
        },
      },
    ];
  });

  return { nodes, edges };
}
