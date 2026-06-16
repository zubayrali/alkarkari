import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

function toSlugSegments(slug?: string | string[]) {
  if (!slug) return undefined;
  return (Array.isArray(slug) ? slug : slug.split('/')).filter((segment) => segment.length > 0);
}

function encodeSlugSegment(segment: string) {
  try {
    return encodeURI(decodeURIComponent(segment));
  } catch {
    return encodeURI(segment);
  }
}

/** Resolve pages for catch-all routes; handles encoded/decoded non-ASCII slugs. */
export function resolvePage(slug?: string | string[]) {
  const segments = toSlugSegments(slug);
  if (!segments || segments.length === 0) return source.getPage([]);

  const candidates = [
    segments,
    segments.map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }),
    segments.map(encodeSlugSegment),
  ];

  for (const candidate of candidates) {
    const page = source.getPage(candidate);
    if (page) return page;
  }
}

/**
 * Resolve an extracted link reference (from `extractedReferences`) to a page.
 * Wikilink-resolved hrefs are URL-relative without a file extension
 * ("./wird"), which `source.getPageByHref` cannot resolve — its relative
 * branch looks pages up by file path including extension. Resolve relative
 * hrefs against the referencing page's slugs instead.
 */
export function resolveReference(
  page: (typeof source)['$inferPage'],
  href: string,
) {
  const [value] = href.split('#', 2);
  if (!value) return undefined;

  if (value.startsWith('./') || value.startsWith('../')) {
    // An index page's siblings live inside its own slug folder.
    const stem = page.path.replace(/\.mdx?$/, '');
    const segments =
      stem === 'index' || stem.endsWith('/index')
        ? [...page.slugs]
        : page.slugs.slice(0, -1);
    for (const part of value.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') segments.pop();
      else segments.push(part.replace(/\.mdx?$/, ''));
    }
    return resolvePage(segments);
  }

  return source.getPageByHref(value)?.page;
}

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.webp'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
