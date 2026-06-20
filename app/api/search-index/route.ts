import { source } from '@/lib/source';
import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';

export const dynamic = 'force-static';

interface SearchEntry {
  url: string;
  title: string;
  section?: string;
  sectionId?: string;
  content: string;
}

export async function GET() {
  const pages = source.getPages();
  const entries: SearchEntry[] = [];

  for (const page of pages) {
    const data = page.data as {
      title?: string;
      description?: string;
      structuredData?: StructuredData;
      unlisted?: boolean;
      load?: () => Promise<{ structuredData?: StructuredData }>;
    };

    if (data.unlisted) continue;

    let sd = data.structuredData;
    if (!sd && typeof data.load === 'function') {
      try {
        sd = (await data.load()).structuredData;
      } catch {
        continue;
      }
    }
    if (!sd) continue;

    const title = data.title ?? page.url;

    const topContent = sd.contents
      .filter((c) => !c.heading)
      .map((c) => c.content)
      .join(' ');

    entries.push({
      url: page.url,
      title,
      content: [data.description, topContent].filter(Boolean).join(' ').slice(0, 500),
    });

    for (const h of sd.headings) {
      const text = sd.contents
        .filter((c) => c.heading === h.id)
        .map((c) => c.content)
        .join(' ');
      if (text) {
        entries.push({
          url: page.url,
          title,
          section: h.content,
          sectionId: h.id,
          content: text.slice(0, 500),
        });
      }
    }
  }

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
