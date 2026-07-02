// React-free home-page data (repo convention: lib/ holds domain logic).
import { source } from '@/lib/source';

export interface LinkItem {
  title: string;
  href: string;
}
export interface RecentItem extends LinkItem {
  /** ISO date-time; formatted as relative time client-side (static export). */
  modified: string;
}
export interface HomeData {
  dictionaryPages: LinkItem[];
  recentNotes: RecentItem[];
  featured: { title: string; href: string; description: string } | null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function getHomeData(): HomeData {
  const pages = source.getPages();

  const dictionaryPages: LinkItem[] = pages
    .filter((p) => p.slugs[0] === 'dictionary' && p.slugs.length > 1)
    .slice(0, 12)
    .map((p) => ({ title: String(p.data.title), href: p.url }));

  const recentNotes: RecentItem[] = pages
    .filter((p) => !p.data.tagPage && !p.data.base && !p.data.unlisted && p.slugs.length > 1)
    .map((p) => {
      const date = parseDate(p.data.modified) ?? parseDate(p.data.created);
      return { page: p, date };
    })
    .filter((entry): entry is { page: (typeof pages)[number]; date: Date } => entry.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)
    .map(({ page, date }) => ({
      title: String(page.data.title),
      href: page.url,
      modified: date.toISOString(),
    }));

  // "Start here" — the (single) note marked `featured: true` in frontmatter.
  const intro = pages.find((p) => p.data.featured === true && !p.data.unlisted);
  const featured = intro
    ? {
        title: String(intro.data.title),
        href: intro.url,
        description: String(intro.data.description ?? ''),
      }
    : null;

  return { dictionaryPages, recentNotes, featured };
}
