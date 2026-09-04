import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

function resolveCanvasWikilinks(
  text: string,
  resolveWikilink?: (target: string) => string | null,
) {
  return text.replace(
    /\[\[([^|]+?)(?:\|(.+?))?\]\]/g,
    (_, rawTarget: string, rawLabel?: string) => {
      const target = rawTarget.trim();
      const label = (rawLabel ?? rawTarget)
        .trim()
        .replaceAll('[', '\\[')
        .replaceAll(']', '\\]');
      const href = resolveWikilink?.(target);
      return href ? `[${label}](${href})` : label;
    },
  );
}

export function renderCanvasMarkdown(
  text: string,
  resolveWikilink?: (target: string) => string | null,
) {
  const markdown = resolveCanvasWikilinks(text, resolveWikilink);
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .processSync(markdown);

  return String(result);
}
