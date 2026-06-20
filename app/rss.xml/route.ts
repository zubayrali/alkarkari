import { source } from '@/lib/source';
import { appName } from '@/lib/shared';
import { pageRequiresAuth } from '@/lib/protected';
import { getSiteLanguage } from '@/lib/locale';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRFC822(date: Date): string {
  return date.toUTCString();
}

function parseCreatedDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function GET() {
  const siteUrl = process.env.SITE_URL ?? 'https://example.com';
  const lang = getSiteLanguage();

  const pages = source
    .getPages()
    .filter(
      (page) =>
        !pageRequiresAuth(page) &&
        !page.data.tagPage &&
        !page.data.unlisted &&
        !page.data.base,
    );

  const withDates = pages.map((page) => {
    const fm = page.data as Record<string, unknown>;
    const created = parseCreatedDate(fm.created);
    return { page, created };
  });

  withDates.sort((a, b) => {
    if (a.created && b.created) return b.created.getTime() - a.created.getTime();
    if (a.created) return -1;
    if (b.created) return 1;
    return 0;
  });

  const items = withDates
    .slice(0, 50)
    .map(({ page, created }) => {
      const link = `${siteUrl}${page.url}`;
      const description = page.data.description ?? '';
      const tags = page.data.tags ?? [];

      const pubDate = created ? `\n      <pubDate>${toRFC822(created)}</pubDate>` : '';
      const categories = tags
        .map((tag: string) => `\n      <category><![CDATA[${tag}]]></category>`)
        .join('');

      return `    <item>
      <title><![CDATA[${page.data.title}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description><![CDATA[${description}]]></description>${pubDate}${categories}
    </item>`;
    })
    .join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(appName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(appName)} RSS feed</description>
    <language>${escapeXml(lang.htmlLang)}</language>
    <lastBuildDate>${toRFC822(new Date())}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
