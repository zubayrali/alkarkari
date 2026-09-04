import { describe, expect, it } from 'vitest';
import { canvasToFlow } from '../lib/canvas-to-flow';

describe('canvas connector routing', () => {
  it('creates a distinct, positioned handle for every edge endpoint', () => {
    const flow = canvasToFlow({
      nodes: [
        { id: 'source', type: 'text', text: 'Source', x: 0, y: 0, width: 200, height: 400 },
        { id: 'top', type: 'text', text: 'Top', x: 500, y: 20, width: 160, height: 80 },
        { id: 'bottom', type: 'text', text: 'Bottom', x: 500, y: 300, width: 160, height: 80 },
      ],
      edges: [
        { id: 'top-edge', fromNode: 'source', toNode: 'top', fromSide: 'right', toSide: 'left', strokeWidth: 4 },
        { id: 'bottom-edge', fromNode: 'source', toNode: 'bottom', fromSide: 'right', toSide: 'left' },
      ],
    });

    const source = flow.nodes.find((node) => node.id === 'source')!;
    expect(source.data.handles.map((handle) => handle.id)).toEqual([
      'source-top-edge',
      'source-bottom-edge',
    ]);
    expect(source.data.handles[0]?.position[1]).toBeLessThan(
      source.data.handles[1]!.position[1],
    );
    expect(flow.edges[0]).toMatchObject({
      sourceHandle: 'source-top-edge',
      targetHandle: 'target-top-edge',
      type: 'canvasConnector',
      data: { mode: 'orthogonal', fromEnd: 'none', toEnd: 'arrow' },
      style: { strokeWidth: 4 },
    });
  });
});
