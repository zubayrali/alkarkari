import { getSiteLanguage } from '@/lib/locale';
import { source } from '@/lib/source';

export const dynamic = 'force-static';
import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(source, {
  language: getSiteLanguage().searchLanguage,
  buildIndex: async (page) => {
    const data = page.data as {
      title?: string;
      description?: string;
      structuredData?: unknown;
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

    const tag = data.unlisted ? 'unlisted' : 'public';
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

export const GET = server.staticGET;
