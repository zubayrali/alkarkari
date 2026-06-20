import { getSiteLanguage } from '@/lib/locale';
import { hasProtectedAccess } from '@/lib/protected';
import { source } from '@/lib/source';
import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(source, {
  language: getSiteLanguage().searchLanguage,
  buildIndex: async (page) => {
    const data = page.data as {
      title?: string;
      description?: string;
      structuredData?: unknown;
      protected?: boolean;
      unlisted?: boolean;
      load?: () => Promise<{ structuredData?: unknown }>;
    };

    let structuredData = data.structuredData;
    if (!structuredData && typeof data.load === 'function') {
      structuredData = (await data.load()).structuredData;
    }

    if (!structuredData) {
      throw new Error(`Cannot index page: ${page.url}`);
    }

    const tag = data.unlisted ? 'unlisted' : data.protected ? 'protected' : 'public';
    return {
      title: data.title ?? page.url,
      description: data.description,
      url: page.url,
      id: page.url,
      structuredData: structuredData as StructuredData,
      tag,
    };
  },
});

export async function GET(request: Request) {
  const hasAccess = await hasProtectedAccess();
  const url = new URL(request.url);

  if (!url.searchParams.has('tag')) {
    url.searchParams.set('tag', hasAccess ? 'public,protected' : 'public');
  }

  return server.GET(new Request(url, request));
}
