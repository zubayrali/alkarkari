import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { pageRequiresAuth } from '@/lib/protected';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.SITE_URL ?? 'https://example.com';

  return source
    .getPages()
    .filter(
      (page) =>
        !pageRequiresAuth(page) &&
        !page.data.unlisted &&
        !page.data.draft &&
        !page.data.tagPage,
    )
    .map((page) => ({
      url: `${siteUrl}${page.url}`,
      changeFrequency: 'weekly' as const,
    }));
}
