/**
 * Wave 3 — Navigation & chrome demos for the /design showcase page.
 *
 * Static mockups of the sewn system applied to site chrome: top nav, sidebar
 * tree, breadcrumbs, TOC, prev/next footer, locale switcher, search dialog,
 * nav progress bar, and the reader-mode exit bar. Nothing here touches the
 * real components — each card carries a caption naming its production target.
 *
 * Server component; the only client island is <StitchFrame> (already
 * 'use client'). Colours are assigned via patchOf(key) — never arrayed.
 * Hardcoded English copy is intentional (preview page, locale-rule exempt).
 *
 * Follows DESIGN.md §3 "Notebook chrome": containers are hairline + surface
 * contrast; dashed strokes only for state pairs or single-edge dividers;
 * patch colour = identity (dots/tabs), gold = position; StitchFrame is
 * reserved for the one focal component (the search dialog).
 */

import type { CSSProperties, ReactNode } from 'react';
import { StitchFrame } from '@/components/sewn/stitch-frame';
import { Swatch } from '@/components/sewn/swatch';
import { patchOf } from '@/lib/patch';

/** Deterministic hand-cut tilts (assigned, never randomized — hydration-safe). */
function tiltOf(key: string): string {
  const patch = patchOf(key);
  const magnitude = 0.3 + (patch % 3) * 0.15;
  return `${patch % 2 === 0 ? '' : '-'}${magnitude.toFixed(2)}deg`;
}

/** Hairline separator segment — solid, per §3 rule 2 (dashes are state, not decoration). */
const HAIRLINE_SEGMENT: CSSProperties = {
  borderTop: '1px solid var(--color-fd-border)',
};

function DemoCard({
  title,
  target,
  children,
}: {
  title: string;
  target: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-12 first:mt-0">
      <h3 className="text-base font-medium">{title}</h3>
      <div className="mt-4">{children}</div>
      <p className="kk-label mt-3">
        {title.toLowerCase()} <span className="opacity-60">· {target}</span>
      </p>
    </div>
  );
}

/** Muted skeleton line standing in for body copy inside viewport mocks. */
function GhostLine({ width }: { width: string }) {
  return <div className="h-2 rounded bg-fd-muted" style={{ width }} aria-hidden />;
}

const NAV_ITEMS = ['Start here', 'Guides', 'Dictionary', 'Graph'] as const;
const NAV_ACTIVE = 'Guides';

const SIDEBAR_TREE = [
  { folder: 'Guides', items: ['Getting around', 'Writing notes', 'Publishing'] },
  { folder: 'Reference', items: ['Dictionary', 'Tags', 'Graph'] },
] as const;
const SIDEBAR_ACTIVE = 'Writing notes';

const TOC_ITEMS = ['Overview', 'Usage', 'Examples', 'Related pages'] as const;
const TOC_ACTIVE = 'Usage';

const SEARCH_RESULTS = [
  { section: 'Guides', title: 'Publishing a note' },
  { section: 'Dictionary', title: 'Example term' },
  { section: 'Reference', title: 'Frontmatter fields' },
] as const;

const LOCALES = [
  { code: 'en', label: 'English', current: true },
  { code: 'fr', label: 'Français', current: false },
  { code: 'cn', label: '中文', current: false },
] as const;

export function ChromeDemos() {
  return (
    <div>
      {/* 1 — Top nav band */}
      <DemoCard
        title="Top nav band"
        target="the fumadocs navbar — bottom seam brightens under the hand; active link wears a running thread"
      >
        <div className="kk-seam-hover kk-stitch-b flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium">VaultPress</span>
          <nav className="flex items-center gap-5 text-sm text-fd-muted-foreground">
            {NAV_ITEMS.map((item) =>
              item === NAV_ACTIVE ? (
                <span key={item} className="relative text-fd-foreground">
                  {item}
                  <span
                    className="kk-thread-run absolute -bottom-1.5 left-0 right-0"
                    style={{ color: 'var(--kk-gold-ink)' }}
                    aria-hidden
                  />
                </span>
              ) : (
                <span key={item}>{item}</span>
              ),
            )}
          </nav>
        </div>
      </DemoCard>

      {/* 2 — Sidebar tree */}
      <DemoCard
        title="Sidebar tree"
        target="the fumadocs sidebar (lib/page-tree.ts) — folder swatches for identity; a 2px gold bar marks the active item"
      >
        <div className="max-w-xs space-y-5 text-sm">
          {SIDEBAR_TREE.map(({ folder, items }) => (
            <div key={folder}>
              <p className="kk-label inline-flex items-center gap-2">
                <Swatch patch={patchOf(folder)} size="0.7em" />
                {folder}
              </p>
              <div className="mt-1.5">
                {items.map((item) =>
                  item === SIDEBAR_ACTIVE ? (
                    <div
                      key={item}
                      className="py-1 pl-3 text-fd-foreground"
                      style={{ borderLeft: '2px solid var(--kk-gold-ink)' }}
                    >
                      {item}
                    </div>
                  ) : (
                    <div
                      key={item}
                      className="border-l border-dashed border-transparent py-1 pl-3 text-fd-muted-foreground hover:border-fd-muted-foreground"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </DemoCard>

      {/* 3 — Breadcrumbs */}
      <DemoCard
        title="Breadcrumbs"
        target="the docs breadcrumb trail — hairline segments as separators, a swatch on the root crumb"
      >
        <nav className="flex items-center gap-2.5 text-sm">
          <span className="inline-flex items-center gap-2">
            <Swatch patch={patchOf('dictionary')} size="0.7em" />
            <span className="text-fd-muted-foreground">Dictionary</span>
          </span>
          <span className="inline-block w-4" style={HAIRLINE_SEGMENT} aria-hidden />
          <span className="text-fd-muted-foreground">Terms</span>
          <span className="inline-block w-4" style={HAIRLINE_SEGMENT} aria-hidden />
          <span className="text-fd-foreground">Example</span>
        </nav>
      </DemoCard>

      {/* 4 — Table of contents */}
      <DemoCard
        title="Table of contents"
        target="the fumadocs clerk TOC — solid hairline rail, a gold segment at the active item"
      >
        <div className="max-w-xs">
          <p className="kk-label">On this page</p>
          <div className="mt-2 border-l border-fd-border pl-4 text-sm">
            {TOC_ITEMS.map((item) =>
              item === TOC_ACTIVE ? (
                <div key={item} className="relative py-1 text-fd-foreground">
                  <span
                    className="absolute -left-[17px] top-1 bottom-1 w-[2px] rounded-full"
                    style={{ background: 'var(--kk-gold-ink)' }}
                    aria-hidden
                  />
                  {item}
                </div>
              ) : (
                <div key={item} className="py-1 text-fd-muted-foreground">
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </DemoCard>

      {/* 5 — Prev / next footer cards */}
      <DemoCard
        title="Prev / next footer cards"
        target="the docs page footer — ground cards; destination swatch in the corner; the tilt straightens on hover"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              { dir: 'Previous', page: 'Start here' },
              { dir: 'Next', page: 'Dictionary' },
            ] as const
          ).map(({ dir, page }) => (
            <div
              key={dir}
              className="kk-tighten relative rounded-lg border border-fd-border bg-fd-card p-4"
              style={{ '--kk-tilt': tiltOf(page) } as CSSProperties}
            >
              <Swatch patch={patchOf(page)} size="0.7em" className="absolute right-3 top-3" />
              <p className="kk-label">{dir}</p>
              <p className={`mt-1 text-sm ${dir === 'Next' ? 'text-right' : ''}`}>{page}</p>
            </div>
          ))}
        </div>
      </DemoCard>

      {/* 6 — Locale switcher */}
      <DemoCard
        title="Locale switcher"
        target="components/locale-switcher.tsx — the dropdown panel; current locale sewn solid, others still dashed"
      >
        <div className="max-w-[14rem] rounded-xl border border-fd-border bg-fd-card py-1.5 text-sm">
          {LOCALES.map(({ code, label, current }) => (
            <div
              key={code}
              className={`flex items-center gap-2.5 px-3.5 py-2 ${current ? '' : 'text-fd-muted-foreground'}`}
            >
              {current ? (
                <>
                  <Swatch patch={patchOf(code)} size="0.7em" />
                  <span style={{ borderBottom: '1.2px solid currentColor' }}>{label}</span>
                </>
              ) : (
                <>
                  <span className="w-[0.7em]" aria-hidden />
                  <span
                    style={{
                      borderBottom:
                        '1.2px dashed color-mix(in srgb, currentColor 45%, transparent)',
                    }}
                  >
                    {label}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </DemoCard>

      {/* 7 — Search dialog */}
      <DemoCard
        title="Search dialog"
        target="components/search-dialog.tsx — split panes joined by a dashed seam; result sections wear their patches"
      >
        <StitchFrame className="rounded-xl" inset={6} radius={12}>
          <div className="p-1.5">
            <div className="kk-stitch-b flex items-center gap-1 px-4 py-2.5 text-sm">
              <span>muraqqa</span>
              <span className="inline-block h-4 w-px bg-current" aria-hidden />
              <span className="kk-label ml-auto">Search</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr]">
              <div className="border-b border-dashed border-fd-border py-2 sm:border-b-0 sm:border-r">
                {SEARCH_RESULTS.map(({ section, title }) => (
                  <div key={title} className="px-4 py-2">
                    <p className="text-sm">
                      <a href="#" className="kk-link-stitch">
                        {title}
                      </a>
                    </p>
                    <p className="kk-label mt-0.5 inline-flex items-center gap-1.5">
                      <Swatch patch={patchOf(section)} size="0.6em" />
                      {section}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-medium">Publishing a note</p>
                <div className="mt-2.5 space-y-2">
                  <GhostLine width="100%" />
                  <GhostLine width="88%" />
                  <GhostLine width="94%" />
                  <GhostLine width="60%" />
                </div>
              </div>
            </div>
          </div>
        </StitchFrame>
      </DemoCard>

      {/* 8 — Navigation progress bar */}
      <DemoCard
        title="Navigation progress bar"
        target="components/nav-progress.tsx — a gold thread sewn solid across the top while the server round-trip fills"
      >
        <div className="overflow-hidden rounded-lg border border-fd-border">
          <div className="relative h-[3px]" style={{ color: 'var(--kk-gold)' }}>
            {/* the path still to be sewn: canonical dashed thread */}
            <span
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, color-mix(in srgb, currentColor 40%, transparent) 0 6px, transparent 6px 11px)',
                backgroundSize: '11px 1.2px',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: '0 50%',
              }}
              aria-hidden
            />
            {/* sewn solid so far (~60%) */}
            <span
              className="absolute inset-y-0 left-0 w-[60%]"
              style={{ background: 'var(--kk-gold)' }}
              aria-hidden
            />
          </div>
          <div className="space-y-2 px-4 py-4">
            <GhostLine width="40%" />
            <GhostLine width="92%" />
            <GhostLine width="78%" />
          </div>
        </div>
        <p className="mt-2 text-xs text-fd-muted-foreground">
          The bar fills during the server round-trip: the dashed path is sewn solid as the
          navigation completes, then fades under the page crossfade.
        </p>
      </DemoCard>

      {/* 9 — Reader-mode exit bar */}
      <DemoCard
        title="Reader-mode exit bar"
        target="components/reader-toggle.tsx — the floating exit pill; gold dot marks the live mode"
      >
        <div className="inline-flex items-center gap-2.5 rounded-full border border-fd-border bg-fd-card px-4 py-1.5 text-sm shadow-sm">
          <span
            className="size-1.5 rounded-full"
            style={{ background: 'var(--kk-gold)' }}
            aria-hidden
          />
          <span>Exit reader</span>
          <span className="opacity-40">·</span>
          <kbd className="kk-label rounded border border-fd-border px-1.5 py-0.5">ESC</kbd>
        </div>
      </DemoCard>
    </div>
  );
}
