import fs from 'node:fs';
import path from 'node:path';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { vaultPathToSlug } from './base-parser.ts';

const WIKILINK = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
const EMBED_BASE = /!\[\[([^[\]#|]+\.base)(?:#([^[\]]+))?\]\]/g;
// A standalone note transclusion occupying a whole paragraph: ![[Note]],
// ![[Note#Section]], ![[Note|Label]]. `.base` embeds are handled separately.
const EMBED_NOTE_STANDALONE =
  /^!\[\[([^[\]#|]+?)(?:#([^[\]|]+))?(?:\|([^[\]]+))?\]\]$/;

type MdastText = { type: 'text'; value: string };
type MdastAttribute = { type: 'mdxJsxAttribute'; name: string; value: string };
type MdastJsx = {
  type: 'mdxJsxTextElement';
  name: string;
  attributes: MdastAttribute[];
  children: MdastNode[];
};
type MdastJsxFlow = {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdastAttribute[];
  children: MdastNode[];
};
type MdastLink = {
  type: 'link';
  url: string;
  children: { type: 'text'; value: string }[];
};
type MdastParent = { type?: string; children: MdastNode[] };
type MdastNode = MdastText | MdastJsx | MdastJsxFlow | MdastLink | MdastParent;

// Emits a real MDX JSX node — raw `html` nodes are unparsable in the MDX
// pipeline (MODULE_UNPARSABLE for the whole file).
function resolveBaseEmbed(target: string, viewName?: string): MdastJsx {
  const slug = vaultPathToSlug(target);
  const attributes: MdastJsx['attributes'] = [
    { type: 'mdxJsxAttribute', name: 'src', value: `/bases/${slug}.json` },
  ];
  if (viewName) {
    attributes.push({
      type: 'mdxJsxAttribute',
      name: 'initialView',
      value: viewName.trim(),
    });
  }
  return {
    type: 'mdxJsxTextElement',
    name: 'BasesInlineView',
    attributes,
    children: [],
  };
}

// A whole-paragraph note transclusion → block-level <NoteEmbed>. Resolution to
// the target page happens at render time (see lib/note-embed.ts); remark only
// carries the raw wikilink target so Obsidian's name-based linking is preserved.
function resolveNoteEmbed(
  target: string,
  section?: string,
  label?: string,
): MdastJsxFlow {
  const attributes: MdastAttribute[] = [
    { type: 'mdxJsxAttribute', name: 'target', value: target.trim() },
  ];
  if (section) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'section', value: section.trim() });
  }
  if (label) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'label', value: label.trim() });
  }
  return { type: 'mdxJsxFlowElement', name: 'NoteEmbed', attributes, children: [] };
}

// Match a paragraph whose entire text is a single note embed. `.base` embeds
// are left for splitBaseEmbeds; inline (mid-sentence) embeds fall through to the
// wikilink pass and render as ordinary links.
function noteEmbedFromParagraph(paragraph: MdastParent): MdastJsxFlow | null {
  if (paragraph.children.length !== 1) return null;
  const [child] = paragraph.children;
  if (!child || child.type !== 'text' || !('value' in child)) return null;

  const match = child.value.trim().match(EMBED_NOTE_STANDALONE);
  if (!match) return null;

  const target = match[1].trim();
  if (target.toLowerCase().endsWith('.base')) return null;

  return resolveNoteEmbed(target, match[2], match[3]);
}

// Replace standalone-embed paragraphs with block-level <NoteEmbed> elements,
// from the grandparent so the paragraph node itself is swapped out.
function transformNoteEmbeds(parent: MdastParent) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.type === 'paragraph' && 'children' in child) {
      const embed = noteEmbedFromParagraph(child);
      if (embed) {
        parent.children.splice(i, 1, embed);
        continue;
      }
    }
    if ('children' in child && Array.isArray(child.children)) {
      transformNoteEmbeds(child);
    }
  }
}

function buildPageIndex(contentDir: string) {
  const map = new Map<string, string>();

  function scan(dir: string, prefix: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const sub = prefix ? `${prefix}/${entry.name}` : entry.name;
        scan(path.join(dir, entry.name), sub);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;

      const stem = entry.name.replace(/\.mdx?$/, '');
      if (stem === 'index') continue;

      const rel = prefix ? `/${prefix}/${stem}` : `/${stem}`;

      // Folder-qualified key (e.g. "dictionary/wird") always indexed.
      if (prefix) {
        map.set(`${prefix}/${stem}`.toLowerCase(), rel);
      }

      // Bare stem: first occurrence wins (Obsidian "shortest path" heuristic).
      const bareStem = stem.toLowerCase();
      if (!map.has(bareStem)) {
        map.set(bareStem, rel);
      }

      const raw = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const { data } = frontmatter(raw);
      const { title, aliases } = data as { title?: string; aliases?: string | string[] };
      if (title) {
        const titleKey = title.toLowerCase();
        if (!map.has(titleKey)) map.set(titleKey, rel);
      }

      for (const alias of Array.isArray(aliases) ? aliases : aliases ? [aliases] : []) {
        const key = alias.trim().toLowerCase();
        if (key && !map.has(key)) map.set(key, rel);
      }
    }
  }

  scan(contentDir, '');
  return map;
}

function splitBaseEmbeds(node: { type: 'text'; value: string }): MdastNode[] | null {
  const { value } = node;
  if (!value.includes('![[') || !value.includes('.base')) return null;

  const parts: MdastNode[] = [];
  let last = 0;

  for (const match of value.matchAll(EMBED_BASE)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: 'text', value: value.slice(last, start) });
    const target = match[1].trim();
    const viewName = match[2]?.trim();
    parts.push(resolveBaseEmbed(target, viewName));
    last = start + match[0].length;
  }

  if (parts.length === 0) return null;
  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
  return parts;
}

function splitWikilinks(
  node: { type: 'text'; value: string },
  resolve: (target: string) => string,
  isKnown: (target: string) => boolean,
  asLink: boolean,
): MdastNode[] | null {
  const { value } = node;
  if (!value.includes('[[')) return null;

  const parts: MdastNode[] = [];
  let last = 0;

  for (const match of value.matchAll(WIKILINK)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: 'text', value: value.slice(last, start) });

    const target = match[1].trim();
    const label = (match[2] ?? target).trim();
    if (asLink) {
      const link: Record<string, unknown> = {
        type: 'link',
        url: resolve(target),
        children: [{ type: 'text', value: label }],
      };
      if (!isKnown(target)) {
        link.data = { hProperties: { 'data-orphan': '' } };
      }
      parts.push(link as unknown as MdastNode);
    } else {
      parts.push({ type: 'text', value: label });
    }
    last = start + match[0].length;
  }

  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
  return parts.length > 0 ? parts : null;
}

function transformWikilinks(
  parent: MdastParent,
  resolve: (target: string) => string,
  isKnown: (target: string) => boolean,
  insideHeading = false,
) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];

    if (child.type === 'text' && 'value' in child) {
      if (!insideHeading) {
        const baseParts = splitBaseEmbeds(child);
        if (baseParts) {
          parent.children.splice(i, 1, ...baseParts);
          // re-examine inserted nodes (some may be text nodes with wikilinks)
          i--;
          continue;
        }
      }
      // Headings are wrapped in their own <a data-card> anchor by fumadocs-ui;
      // rendering wikilinks as <a> there would nest anchors, which is invalid HTML.
      const parts = splitWikilinks(child, resolve, isKnown, !insideHeading);
      if (parts) parent.children.splice(i, 1, ...parts);
      continue;
    }

    if ('children' in child && Array.isArray(child.children)) {
      transformWikilinks(child, resolve, isKnown, insideHeading || child.type === 'heading');
    }
  }
}

export function remarkWikilinks(contentDir = 'content') {
  const index = buildPageIndex(contentDir);

  const resolve = (target: string) =>
    index.get(target.toLowerCase()) ??
    `/${target.toLowerCase().replace(/\s+/g, '-')}`;

  const isKnown = (target: string) => index.has(target.toLowerCase());

  return (tree: MdastParent) => {
    transformNoteEmbeds(tree);
    transformWikilinks(tree, resolve, isKnown);
  };
}
