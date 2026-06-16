// Rough-notation annotation syntax, ported from kufrCleaner
// (astro-modular) remark-annotations.ts. Marked spans render normally and are
// hand-annotated at runtime by components/rough-annotations.tsx.
//
// INLINE (within a sentence):
//   ==text==     highlight   (matches Obsidian's native highlight syntax)
//   !!text!!     underline
//   ^^text^^     box
//   ((text))     circle
//   ||text||     bracket
//
// BLOCK (code fence around a whole phrase/sentence):
//   ```highlight
//   Full sentence here.
//   ```
// (any of the five type names works as the fence language)

const PATTERNS = [
  { type: 'highlight', open: '==', close: '==' },
  { type: 'underline', open: '!!', close: '!!' },
  { type: 'box', open: '^^', close: '^^' },
  { type: 'circle', open: '((', close: '))' },
  { type: 'bracket', open: '||', close: '||' },
] as const;

type Pattern = (typeof PATTERNS)[number];

const BLOCK_TYPES = new Set<string>(PATTERNS.map((p) => p.type));
const DELIM = 2;
const HAS_ANN = /==|!!|\^\^|\(\(|\|\|/;

type MdastNode = {
  type: string;
  value?: string;
  lang?: string | null;
  name?: string;
  attributes?: { type: string; name: string; value: string }[];
  children?: MdastNode[];
};

// Emit real MDX JSX nodes (same idiom as remark-inline-base) — raw `html`
// nodes are not parseable in the MDX pipeline, and JSX text children need
// no escaping.
function annSpan(type: string, content: string, tag: 'span' | 'p' = 'span'): MdastNode {
  return {
    type: tag === 'p' ? 'mdxJsxFlowElement' : 'mdxJsxTextElement',
    name: tag,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'className', value: 'rough-ann' },
      { type: 'mdxJsxAttribute', name: 'data-ann-type', value: type },
    ],
    children: [{ type: 'text', value: content }],
  };
}

/** Split plain text into alternating text/annotation nodes via indexOf. */
function convert(text: string): MdastNode[] {
  let bestIdx = Infinity;
  let best: Pattern | null = null;

  for (const p of PATTERNS) {
    const idx = text.indexOf(p.open);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      best = p;
    }
  }

  if (!best) return [{ type: 'text', value: text }];

  const closeIdx = text.indexOf(best.close, bestIdx + DELIM);
  if (closeIdx === -1) {
    // Unclosed — emit the opener as literal text and recurse on the tail.
    return [
      { type: 'text', value: text.slice(0, bestIdx + DELIM) },
      ...convert(text.slice(bestIdx + DELIM)),
    ];
  }

  const content = text.slice(bestIdx + DELIM, closeIdx);
  const rest = text.slice(closeIdx + DELIM);
  const result: MdastNode[] = [];

  if (bestIdx > 0) result.push({ type: 'text', value: text.slice(0, bestIdx) });
  result.push(annSpan(best.type, content));
  if (rest) result.push(...convert(rest));

  return result;
}

function walk(parent: MdastNode, insideHeading: boolean) {
  const children = parent.children;
  if (!children) return;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // Block form: ```highlight … ```
    if (child.type === 'code' && child.lang && BLOCK_TYPES.has(child.lang)) {
      children[i] = annSpan(
        child.lang,
        (child.value ?? '').replace(/\n+/g, ' ').trim(),
        'p',
      );
      continue;
    }

    if (child.type === 'text' && typeof child.value === 'string' && !insideHeading) {
      if (!HAS_ANN.test(child.value)) continue;
      const nodes = convert(child.value);
      children.splice(i, 1, ...nodes);
      i += nodes.length - 1;
      continue;
    }

    if (child.children) {
      walk(child, insideHeading || child.type === 'heading');
    }
  }
}

export function remarkAnnotations() {
  return (tree: MdastNode) => {
    walk(tree, false);
  };
}
