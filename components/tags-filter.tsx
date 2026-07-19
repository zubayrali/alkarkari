'use client';

import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import Link from 'fumadocs-core/link';

export type TagEntry = {
  tag: string;
  count: number;
  depth: number;
  href: string;
  description?: string;
};

export type TagsFilterStrings = {
  label: string;
  placeholder: string;
  empty: string;
  pageSingular: string;
  pagePlural: string;
  countOf: string;
};

const DEFAULT_STRINGS: TagsFilterStrings = {
  label: "Filter the index",
  placeholder: "Filter tags…",
  empty: "No matching tags.",
  pageSingular: "page",
  pagePlural: "pages",
  countOf: "of",
};

export function TagsFilter({
  tags,
  strings = DEFAULT_STRINGS,
}: {
  tags: TagEntry[];
  strings?: TagsFilterStrings;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return tags;
    const q = query.toLowerCase();
    return tags.filter((t) => t.tag.toLowerCase().includes(q));
  }, [tags, query]);

  return (
    <>
      <div className="tags-filter-wrap">
        <label className="tags-filter-label" htmlFor="tags-filter-input">
          {strings.label}
        </label>
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
          id="tags-filter-input"
          className="tags-filter-input"
          placeholder={strings.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="tags-filter-count" aria-live="polite">
          {filtered.length} {strings.countOf} {tags.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-fd-muted-foreground mt-4">{strings.empty}</p>
      ) : (
        <div className="tags-ledger">
          {filtered.map((t) => (
            <Link
              key={t.tag}
              href={t.href}
              className="tag-entry"
              data-nested={t.depth > 0}
              style={{
                "--tag-indent": `${Math.min(t.depth, 3) * 0.75}rem`,
                "--tag-rail": `${Math.min(t.depth, 3) * 0.5}rem`,
              } as CSSProperties}
            >
              <span className="tag-entry-name">
                {t.depth > 0 && (
                  <span className="tag-entry-prefix">
                    {t.tag.split('/').slice(0, -1).join('/') + '/'}
                  </span>
                )}
                {t.tag.split('/').pop()}
              </span>
              <span className="tag-entry-count">
                {t.count} {t.count === 1 ? strings.pageSingular : strings.pagePlural}
              </span>
              {t.description && (
                <span className="tag-entry-description">{t.description}</span>
              )}
              <span className="tag-entry-arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
