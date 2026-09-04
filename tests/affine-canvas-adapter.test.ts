import { describe, expect, it } from 'vitest';
import { affineCanvasToCanvasData } from '../lib/affine/canvas-adapter';
import { parseCanvasData } from '../lib/load-canvas';

describe('AFFiNE edgeless canvas adapter', () => {
  it('maps structured notes, frames, shapes, groups, text, and connectors', () => {
    const canvas = affineCanvasToCanvasData({
      exists: true,
      edgelessBlocks: [
        {
          id: 'frame',
          flavour: 'affine:frame',
          title: 'Practice map',
          bounds: { x: 0, y: 0, width: 700, height: 500 },
        },
        {
          id: 'note',
          flavour: 'affine:note',
          bounds: { x: 50, y: 70, width: 260, height: 180 },
          text: 'flat fallback',
          background: { light: '#ffffff', dark: '#000000' },
          children: [
            { type: 'h2', text: 'The Wird' },
            { type: 'text', text: 'Daily remembrance' },
            { type: 'todo', text: 'Read after Fajr', checked: true },
          ],
        },
      ],
      surfaceElements: [
        {
          id: 'shape',
          type: 'shape',
          shapeType: 'diamond',
          text: 'Intention',
          fillColor: '--affine-palette-shape-yellow',
          strokeColor: '#a16207',
          color: '#111827',
          fontSize: 18,
          bounds: { x: 400, y: 100, width: 180, height: 100 },
        },
        {
          id: 'label',
          type: 'text',
          text: 'Begin here',
          color: '#111827',
          bounds: { x: 400, y: 260, width: 160, height: 40 },
        },
        {
          id: 'surface-group',
          type: 'group',
          label: 'Sequence',
          bounds: { x: 350, y: 50, width: 280, height: 300 },
        },
        {
          id: 'edge',
          type: 'connector',
          source: { id: 'note', position: [1, 0.5] },
          target: { id: 'shape', position: [0, 0.5] },
          frontEndpointStyle: 'None',
          rearEndpointStyle: 'Arrow',
          mode: 1,
          strokeStyle: 'dash',
          strokeWidth: 4,
          stroke: '#929292',
          label: 'leads to',
        },
      ],
    });

    expect(canvas.nodes).toHaveLength(5);
    expect(canvas.nodes.find((node) => node.id === 'note')).toMatchObject({
      type: 'text',
      text: '## The Wird\n\nDaily remembrance\n\n- [x] Read after Fajr',
      color: { light: '#ffffff', dark: '#000000' },
    });
    expect(canvas.nodes.find((node) => node.id === 'shape')).toMatchObject({
      type: 'shape',
      shape: 'diamond',
      fillColor: '#fcd34d',
      text: 'Intention',
    });
    expect(canvas.nodes.find((node) => node.id === 'label')).toMatchObject({
      type: 'text',
      variant: 'label',
      text: 'Begin here',
      textAlign: 'center',
      color: { light: '#111827', dark: '#f8fafc' },
    });
    expect(canvas.edges).toEqual([
      expect.objectContaining({
        id: 'edge',
        fromNode: 'note',
        toNode: 'shape',
        fromSide: 'right',
        toSide: 'left',
        fromPosition: [1, 0.5],
        toPosition: [0, 0.5],
        mode: 'orthogonal',
        strokeStyle: 'dash',
        strokeWidth: 4,
        fromEnd: 'none',
        toEnd: 'arrow',
        label: 'leads to',
      }),
    ]);
  });

  it('drops unbound connectors and malformed elements', () => {
    const canvas = affineCanvasToCanvasData({
      edgelessBlocks: [{ id: 'bad', flavour: 'affine:note', bounds: null }],
      surfaceElements: [{ id: 'edge', type: 'connector', source: { id: 'missing' } }],
    });
    expect(canvas).toEqual({ nodes: [], edges: [] });
  });

  it('maps a standalone AFFiNE surface image to a positioned canvas file node', () => {
    const canvas = affineCanvasToCanvasData({
      edgelessBlocks: [{
        id: 'image',
        flavour: 'affine:image',
        bounds: { x: 80, y: 120, width: 640, height: 360 },
        sourceId: 'blob-key',
        caption: 'Canvas-only image',
      }],
    });

    expect(canvas.nodes).toEqual([{
      id: 'image',
      type: 'file',
      file: 'affine://blob/blob-key',
      x: 80,
      y: 120,
      width: 640,
      height: 360,
    }]);
  });

  it('keeps native database views in their note position', () => {
    const snapshot = {
      databaseBlockId: 'database',
      title: 'Reading list',
      columns: [],
      views: [{ id: 'kanban', name: 'Board', mode: 'kanban' }],
      rows: [],
    };
    const canvas = affineCanvasToCanvasData({
      edgelessBlocks: [{
        id: 'note', flavour: 'affine:note', bounds: { x: 0, y: 0, width: 400, height: 500 },
        children: [
          { type: 'h2', text: 'Before' },
          { id: 'database', flavour: 'affine:database', database: snapshot },
          { type: 'text', text: 'After' },
        ],
      }],
    });
    const note = canvas.nodes[0];
    expect(note).toMatchObject({
      type: 'text',
      content: [
        { type: 'markdown', text: '## Before' },
        { type: 'database', snapshot },
        { type: 'markdown', text: 'After' },
      ],
    });
    expect(parseCanvasData(JSON.stringify(canvas)).nodes[0]).toMatchObject({ content: note && 'content' in note ? note.content : undefined });
  });

  it('round-trips native shape fields through the public canvas parser', () => {
    const parsed = parseCanvasData(JSON.stringify({
      nodes: [{
        id: 'shape', type: 'shape', shape: 'ellipse', x: 1, y: 2, width: 100, height: 60,
        text: 'Circle', fillColor: '#fff', strokeColor: '#000', rotate: 15,
      }],
      edges: [],
    }));
    expect(parsed.nodes[0]).toMatchObject({
      id: 'shape', type: 'shape', shape: 'ellipse', text: 'Circle', rotate: 15,
    });
  });

  it('publishes rich AFFiNE blocks, removes legacy publication YAML, and expands collapsed page notes', () => {
    const canvas = affineCanvasToCanvasData({
      edgelessBlocks: [{
        id: 'note', flavour: 'affine:note', bounds: { x: 0, y: 0, width: 800, height: 95 },
        children: [
          { flavour: 'affine:code', language: 'yaml', text: 'publish: true\nslug: hidden' },
          { flavour: 'affine:paragraph', type: 'h2', text: 'Visible heading' },
          { flavour: 'affine:divider' },
          { flavour: 'affine:image', props: { sourceId: 'blob-key', caption: 'A plate' } },
          { flavour: 'affine:bookmark', props: { url: 'https://example.com', title: 'Source' } },
          { flavour: 'affine:latex', props: { latex: 'x^2=1' } },
          { flavour: 'affine:table', props: {
            'rows.r1.rowId': 'r1', 'rows.r1.order': 'a0',
            'columns.c1.columnId': 'c1', 'columns.c1.order': 'a0',
            'cells.r1:c1.text': { text: 'Cell', delta: [{ insert: 'Cell' }] },
          } },
        ],
      }],
    });
    expect(canvas.nodes[0]).toMatchObject({
      type: 'text',
      text: '## Visible heading',
      content: [
        { type: 'markdown', text: '## Visible heading' },
        { type: 'divider' },
        { type: 'image', src: 'affine://blob/blob-key', caption: 'A plate' },
        { type: 'bookmark', url: 'https://example.com', title: 'Source' },
        { type: 'latex', formula: 'x^2=1' },
        { type: 'table', rows: [['Cell']] },
      ],
    });
    expect(canvas.nodes[0]!.height).toBeGreaterThan(95);
  });

  it('derives group and mind-map geometry and preserves freehand strokes', () => {
    const canvas = affineCanvasToCanvasData({ surfaceElements: [
      { id: 'root', type: 'shape', text: 'Root', bounds: { x: 0, y: 0, width: 100, height: 40 } },
      { id: 'child', type: 'shape', text: 'Child', bounds: { x: 240, y: 80, width: 100, height: 40 } },
      { id: 'map', type: 'mindmap', children: { root: { index: 'a0' }, child: { index: 'a1', parent: 'root' } } },
      { id: 'stroke', type: 'brush', bounds: { x: 10, y: 200, width: 80, height: 40 }, points: [[0, 0], [80, 40]], lineWidth: 5 },
    ] });
    expect(canvas.nodes.find((node) => node.id === 'map')).toBeUndefined();
    expect(canvas.nodes.find((node) => node.id === 'stroke')).toMatchObject({ type: 'brush', strokeWidth: 5, points: [[0, 0], [80, 40]] });
    expect(canvas.edges).toContainEqual(expect.objectContaining({ fromNode: 'root', toNode: 'child', mode: 'curve' }));
    expect(parseCanvasData(JSON.stringify(canvas)).nodes.find((node) => node.id === 'stroke')).toMatchObject({ type: 'brush' });
  });
});
