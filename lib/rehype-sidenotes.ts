// Margin sidenotes, ported from aarnphm/quartz sidenotes.ts. aarnphm sources
// sidenotes from a custom micromark syntax; this vault uses standard GFM
// footnotes, so the transform consumes the footnote section GFM emits instead:
// each `[^n]` reference becomes a `span.sidenote` label followed by a
// `span.sidenote-content` sibling holding the footnote body, and the bottom
// footnote list is removed. components/sidenotes.tsx lays the content spans
// out in the margins at runtime (or as a click-to-open popover when narrow).
//
// Everything stays a <span> because the pair lives inside a <p>; block
// elements would break HTML nesting and React hydration.

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

function isElement(node: HastNode, tagName?: string): boolean {
  return node.type === 'element' && (!tagName || node.tagName === tagName);
}

function hasProperty(node: HastNode, name: string): boolean {
  const value = node.properties?.[name];
  return value !== undefined && value !== null && value !== false;
}

function textContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textContent).join('');
}

function span(
  className: string[],
  properties: Record<string, unknown>,
  children: HastNode[],
): HastNode {
  return {
    type: 'element',
    tagName: 'span',
    properties: { ...properties, className },
    children,
  };
}

function arrowSvg(): HastNode {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: ['sidenote-arrow', 'sidenote-arrow-down'],
      width: '8',
      height: '5',
      viewBox: '0 0 8 5',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true',
    },
    children: [
      {
        type: 'element',
        tagName: 'path',
        properties: { d: 'M0 0L8 0L4 5Z', fill: 'currentColor' },
        children: [],
      },
    ],
  };
}

/** Footnote bodies arrive as <p>/<li> block content; flatten to spans. */
function toInlineContent(children: HastNode[]): HastNode[] {
  const result: HastNode[] = [];
  for (const child of children) {
    if (isElement(child, 'a') && hasProperty(child, 'dataFootnoteBackref')) continue;
    if (isElement(child, 'p')) {
      result.push(span(['sidenote-paragraph'], {}, toInlineContent(child.children ?? [])));
      continue;
    }
    if (child.type === 'text' && result.length === 0 && (child.value ?? '').trim() === '') {
      continue;
    }
    result.push(child);
  }
  return result;
}

function collectDefinitions(tree: HastNode): Map<string, HastNode[]> | undefined {
  const definitions = new Map<string, HastNode[]>();
  let found = false;

  const walk = (node: HastNode, parent?: HastNode, index?: number): boolean => {
    if (isElement(node, 'section') && hasProperty(node, 'dataFootnotes')) {
      for (const list of node.children ?? []) {
        if (!isElement(list, 'ol')) continue;
        for (const item of list.children ?? []) {
          if (!isElement(item, 'li')) continue;
          const id = item.properties?.id;
          if (typeof id !== 'string') continue;
          definitions.set(id, toInlineContent(item.children ?? []));
        }
      }
      if (parent?.children && typeof index === 'number') {
        parent.children.splice(index, 1);
      }
      found = true;
      return true;
    }

    const children = node.children ?? [];
    for (let i = 0; i < children.length; i++) {
      if (walk(children[i], node, i)) return true;
    }
    return false;
  };

  walk(tree);
  return found ? definitions : undefined;
}

function buildSidenotePair(
  refAnchor: HastNode,
  definition: HastNode[],
  sidenoteId: number,
): HastNode[] {
  const baseId = `sidenote-${sidenoteId}`;
  const marker = textContent(refAnchor) || String(sidenoteId);

  const label = span(
    ['sidenote-label'],
    {
      id: `${baseId}-label`,
      'aria-controls': `${baseId}-content`,
    },
    [span(['sidenote-number'], {}, [{ type: 'text', value: marker }]), arrowSvg()],
  );

  const sidenote = span(
    ['sidenote'],
    { id: baseId, 'data-sidenote-id': String(sidenoteId) },
    [label],
  );

  const content = span(
    ['sidenote-content'],
    {
      id: `${baseId}-content`,
      'data-sidenote-id': String(sidenoteId),
      'data-sidenote-for': baseId,
      'aria-hidden': 'true',
    },
    // The same footnote can be referenced more than once; clone so ids and
    // node identity stay unique per occurrence.
    structuredClone(definition),
  );

  return [sidenote, content];
}

export function rehypeSidenotes() {
  return (tree: HastNode) => {
    const definitions = collectDefinitions(tree);
    if (!definitions) return;

    let counter = 0;

    const walk = (node: HastNode) => {
      const children = node.children;
      if (!children) return;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // GFM emits <sup><a data-footnote-ref href="#fn-id">n</a></sup>.
        if (isElement(child, 'sup')) {
          const anchor = (child.children ?? []).find(
            (grandchild) => isElement(grandchild, 'a') && hasProperty(grandchild, 'dataFootnoteRef'),
          );
          const href = anchor?.properties?.href;
          if (anchor && typeof href === 'string' && href.startsWith('#')) {
            const definition = definitions.get(href.slice(1));
            if (definition) {
              const pair = buildSidenotePair(anchor, definition, ++counter);
              children.splice(i, 1, ...pair);
              i += pair.length - 1;
              continue;
            }
          }
        }

        walk(child);
      }
    };

    walk(tree);
  };
}
