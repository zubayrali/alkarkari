'use client';

import {
  type ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';

interface SearchEntry {
  url: string;
  title: string;
  section?: string;
  sectionId?: string;
  content: string;
}

interface FlexIndex {
  add(id: number, content: string): void;
  search(query: string, limit?: number): number[];
}

let cached: { entries: SearchEntry[]; index: FlexIndex } | null = null;

async function loadIndex(): Promise<{
  entries: SearchEntry[];
  index: FlexIndex;
}> {
  if (cached) return cached;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const res = await fetch(`${basePath}/api/search-index`);
  const entries: SearchEntry[] = await res.json();

  const { Index } = await import('flexsearch');
  const index = new Index({ tokenize: 'forward' }) as unknown as FlexIndex;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    index.add(i, `${e.title} ${e.section || ''} ${e.content}`);
  }

  cached = { entries, index };
  return cached;
}

function highlightText(text: string, query: string): ReactNode {
  if (!text || !query.trim()) return text;
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-fd-primary/20 text-fd-primary rounded-sm px-px">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}


export default function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(cached);
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => onOpenChange(false);
    el.addEventListener('close', onClose);
    return () => el.removeEventListener('close', onClose);
  }, [onOpenChange]);

  useEffect(() => {
    if (open && !data) {
      loadIndex().then(setData).catch(() => {});
    }
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open, data]);

  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const ids = data.index.search(query, 25);
    return ids.map((id) => data.entries[id]).filter(Boolean);
  }, [data, query]);

  useEffect(() => {
    setActive(0);
  }, [results]);

  const go = useCallback(
    (entry: SearchEntry) => {
      const url = entry.sectionId
        ? `${entry.url}#${entry.sectionId}`
        : entry.url;
      onOpenChange(false);
      router.push(url);
    },
    [router, onOpenChange],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActive((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActive((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          if (
            results[active] &&
            !(e.nativeEvent as KeyboardEvent).isComposing
          ) {
            e.preventDefault();
            go(results[active]);
          }
          break;
      }
    },
    [results, active, go],
  );

  useEffect(() => {
    resultsRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const activeEntry = results[active] ?? null;

  return (
    <dialog
      ref={dialogRef}
      className="fd-search-dialog"
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === dialogRef.current) onOpenChange(false);
      }}
    >
      <div className="fd-search-panel">
        {/* Header */}
        <div className="fd-search-header">
          <svg
            className="fd-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className="fd-search-input"
            placeholder="Search documentation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="fd-search-close"
            onClick={() => onOpenChange(false)}
          >
            <kbd>Esc</kbd>
          </button>
        </div>

        {/* Body: results + preview */}
        <div className="fd-search-body">
          {/* Results list */}
          <div className="fd-search-results" ref={resultsRef}>
            {!data && (
              <div className="fd-search-empty">Loading search index…</div>
            )}
            {data && !query.trim() && (
              <div className="fd-search-empty">Type to search…</div>
            )}
            {data && query.trim() && results.length === 0 && (
              <div className="fd-search-empty">No results found</div>
            )}
            {results.map((entry, i) => (
              <button
                key={`${entry.url}#${entry.sectionId || ''}-${i}`}
                type="button"
                className={`fd-search-item${i === active ? ' active' : ''}`}
                data-active={i === active}
                onClick={() => go(entry)}
                onMouseEnter={() => setActive(i)}
              >
                <div className="fd-search-item-icon">
                  {entry.section ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h16" /><path d="M4 6h16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                  )}
                </div>
                <div className="fd-search-item-content">
                  {entry.section && (
                    <span className="fd-search-item-breadcrumb">
                      {entry.title}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                  )}
                  <span className="fd-search-item-title">
                    {highlightText(entry.section || entry.title, query)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Preview pane */}
          {results.length > 0 && (
            <div className="fd-search-preview">
              {activeEntry && (
                <>
                  <div className="fd-search-preview-title">
                    {activeEntry.title}
                  </div>
                  {activeEntry.section && (
                    <div className="fd-search-preview-section">
                      {activeEntry.section}
                    </div>
                  )}
                  <div className="fd-search-preview-content">
                    {highlightText(activeEntry.content, query)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fd-search-footer">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
          <span><kbd>&crarr;</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </dialog>
  );
}
