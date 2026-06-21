'use client';

import { useState, useMemo } from 'react';
import Link from 'fumadocs-core/link';

export type TagEntry = {
  tag: string;
  count: number;
  depth: number;
  href: string;
  description?: string;
};

export function TagsFilter({ tags }: { tags: TagEntry[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return tags;
    const q = query.toLowerCase();
    return tags.filter((t) => t.tag.toLowerCase().includes(q));
  }, [tags, query]);

  return (
    <>
      <div className="tags-filter-wrap">
        <svg
          className="tags-filter-icon"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="tags-filter-input"
          placeholder="Filter tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-fd-muted-foreground mt-4">No matching tags.</p>
      ) : (
        <div className="tags-grid">
          {filtered.map((t) => (
            <Link key={t.tag} href={t.href} className="tag-card">
              <span className="tag-card-name">
                {t.depth > 0 && (
                  <span className="tag-card-prefix">
                    {t.tag.split('/').slice(0, -1).join('/') + '/'}
                  </span>
                )}
                {t.tag.split('/').pop()}
              </span>
              <span className="tag-card-count">{t.count}</span>
              {t.description && (
                <span className="tag-card-desc">{t.description}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
