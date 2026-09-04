'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
} from '@xyflow/react';
import type { CanvasEnd } from '@/lib/canvas-types';

type CanvasConnectorData = {
  mode: 'straight' | 'orthogonal' | 'curve';
  fromEnd: CanvasEnd;
  toEnd: CanvasEnd;
};

type CanvasConnectorEdge = Edge<CanvasConnectorData, 'canvasConnector'>;

function arrowPoints(
  x: number,
  y: number,
  position: Position,
  strokeWidth: number,
) {
  // BlockSuite's Arrow endpoint is an open 90-degree chevron whose length is
  // DEFAULT_ARROW_SIZE (15) scaled by half the connector stroke width.
  const outward =
    position === Position.Left
      ? [-1, 0]
      : position === Position.Right
        ? [1, 0]
        : position === Position.Top
          ? [0, -1]
          : [0, 1];
  // Both front and rear arrows point into the element they are attached to.
  // At the front endpoint this is opposite the connector's travel direction.
  const direction = [-outward[0], -outward[1]];
  const size = 15 * (strokeWidth / 2);
  const backX = -direction[0] * size * Math.SQRT1_2;
  const backY = -direction[1] * size * Math.SQRT1_2;
  const wingX = -direction[1] * size * Math.SQRT1_2;
  const wingY = direction[0] * size * Math.SQRT1_2;
  return `${x + backX + wingX},${y + backY + wingY} ${x},${y} ${x + backX - wingX},${y + backY - wingY}`;
}

function CanvasConnector({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  style,
  interactionWidth,
}: EdgeProps<CanvasConnectorEdge>) {
  const pathInput = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [path, labelX, labelY] =
    data?.mode === 'straight'
      ? getStraightPath(pathInput)
      : data?.mode === 'curve'
        ? getBezierPath(pathInput)
        : getSmoothStepPath({ ...pathInput, borderRadius: 0, offset: 18 });
  const color = typeof style?.stroke === 'string' ? style.stroke : 'var(--color-fd-muted-foreground)';
  const strokeWidth = typeof style?.strokeWidth === 'number' ? style.strokeWidth : 2;

  return (
    <>
      <BaseEdge path={path} style={style} interactionWidth={interactionWidth ?? 14} />
      {data?.fromEnd === 'arrow' && (
        <polyline
          className="canvas-connector-arrow"
          points={arrowPoints(sourceX, sourceY, sourcePosition, strokeWidth)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {data?.toEnd === 'arrow' && (
        <polyline
          className="canvas-connector-arrow"
          points={arrowPoints(targetX, targetY, targetPosition, strokeWidth)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {label != null && label !== '' && (
        <EdgeLabelRenderer>
          <div
            className="canvas-connector-label nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const canvasEdgeTypes = {
  canvasConnector: CanvasConnector,
} satisfies EdgeTypes;
