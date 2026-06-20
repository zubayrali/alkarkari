import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.SITE_URL ?? 'https://example.com';

  return source
    .getPages()
    .filter(
      (page) =>
        !page.data.unlisted &&
        !page.data.draft &&
        !page.data.tagPage,
    )
    .map((page) => ({
      url: `${siteUrl}${page.url}`,
      changeFrequency: 'weekly' as const,
    }));
}
