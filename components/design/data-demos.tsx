/**
 * Wave 3 — Data-view & interactive component demos for the /design showcase.
 *
 * Static, inert look-alikes of the site's data surfaces (base views, graph,
 * canvas, review widget, link previews, comments) restyled in the patchwork
 * language. Nothing here touches the real components — each demo carries a
 * caption naming its production target.
 *
 * Server component; the only client island is <StitchFrame> (already
 * 'use client'). Colours are assigned via patchOf(key) — never arrayed;
 * everything is deterministic (no Math.random / Date.now), hover is CSS-only.
 * Hardcoded English copy is intentional (preview page, locale-rule exempt).
 */

import type { CSSProperties } from 'react';
import { StitchFrame } from '@/components/sewn/stitch-frame';
import { Swatch } from '@/components/sewn/swatch';
import { patchOf } from '@/lib/patch';

/** Deterministic hand-cut tilts (assigned, never randomized — hydration-safe). */
function tiltOf(key: string): string {
  const patch = patchOf(key);
  const magnitude = 0.3 + (patch % 3) * 0.15;
  return `${patch % 2 === 0 ? '' : '-'}${magnitude.toFixed(2)}deg`;
}

function DemoLabel({ name, target }: { name: string; target: string }) {
  return (
    <p className="kk-label mt-3">
      {name} <span className="opacity-60">· {target}</span>
    </p>
  );
}

function DemoTitle({ children }: { children: string }) {
  return <h3 className="text-base font-medium mb-3">{children}</h3>;
}

/** Demo-only stitched link — real views render resolved page links. */
function DemoLink({ children }: { children: string }) {
  return (
    <a href="#" className="kk-link-stitch">
      {children}
    </a>
  );
}

/* ── Sample data (generic docs content, deterministic) ─────────────────── */

const TABLE_ROWS = [
  { title: 'Getting started', tags: 'guides', modified: 'Jun 28' },
  { title: 'Graph view', tags: 'reference', modified: 'Jun 21' },
  { title: 'Search', tags: 'reference', modified: 'Jun 14' },
  { title: 'Canvas basics', tags: 'notes', modified: 'Jun 07' },
] as const;

const GALLERY_CARDS = [
  { title: 'Getting started', meta: '4 sections · guides' },
  { title: 'Graph view', meta: '3 sections · reference' },
  { title: 'Search', meta: '2 sections · reference' },
] as const;

const LIST_GROUPS = [
  {
    group: 'guides',
    items: [
      { title: 'Getting started', meta: 'Jun 28' },
      { title: 'Search', meta: 'Jun 14' },
    ],
  },
  {
    group: 'reference',
    items: [
      { title: 'Graph view', meta: 'Jun 21' },
      { title: 'Canvas basics', meta: 'Jun 07' },
    ],
  },
] as const;

/* Graph sketch — fixed coordinates (centres), square page nodes + outlined
   tag nodes, dashed thread edges. */
const GRAPH_NODES = [
  { label: 'Getting started', x: 96, y: 62, size: 14 },
  { label: 'Graph view', x: 208, y: 40, size: 12 },
  { label: 'Search', x: 306, y: 92, size: 14 },
  { label: 'Canvas basics', x: 158, y: 148, size: 12 },
  { label: 'Shortcuts', x: 402, y: 48, size: 10 },
  { label: 'Publishing', x: 466, y: 132, size: 12 },
  { label: 'Themes', x: 342, y: 178, size: 10 },
  { label: 'Sync', x: 58, y: 172, size: 10 },
] as const;

const GRAPH_TAGS = [
  { label: '#guides', x: 252, y: 130, size: 12 },
  { label: '#reference', x: 428, y: 188, size: 12 },
] as const;

/** Edges as [fromX, fromY, toX, toY] between node centres above. */
const GRAPH_EDGES = [
  [96, 62, 208, 40],
  [96, 62, 158, 148],
  [208, 40, 306, 92],
  [306, 92, 402, 48],
  [306, 92, 342, 178],
  [402, 48, 466, 132],
  [58, 172, 96, 62],
  [96, 62, 252, 130],
  [158, 148, 252, 130],
  [466, 132, 428, 188],
  [342, 178, 428, 188],
] as const;

/* Proposed --rv-color-* → --kk-patch-N mapping (review widget palettes).
   Patches 4 (lime) and 12 (deep green) stay unassigned. Enumerating patch
   numbers directly is allowed only on spec-sheet surfaces like this one. */
const REVIEW_PALETTE_MAP = [
  { name: 'red', patch: 1 },
  { name: 'orange', patch: 2 },
  { name: 'yellow', patch: 3 },
  { name: 'green', patch: 5 },
  { name: 'turquoise', patch: 6 },
  { name: 'cyan', patch: 7 },
  { name: 'blue', patch: 8 },
  { name: 'violet', patch: 9 },
  { name: 'purple', patch: 10 },
  { name: 'pink', patch: 11 },
] as const;

export function DataDemos() {
  return (
    <div>
      {/* (1) Base view tabs */}
      <div>
        <DemoTitle>Base view tabs</DemoTitle>
        <div className="kk-stitch-b flex items-end gap-6 px-1 pb-px max-w-md">
          <span
            className="inline-flex items-center gap-2 pb-2 text-sm font-medium"
            style={{ borderBottom: `2px solid var(--kk-patch-${patchOf('table')})` }}
          >
            <Swatch patch={patchOf('table')} size="0.7em" />
            Table
          </span>
          {(['Gallery', 'List'] as const).map((tab) => (
            <span
              key={tab}
              className="pb-2 text-sm text-fd-muted-foreground"
              style={{
                borderBottom: '1px dashed color-mix(in srgb, currentColor 35%, transparent)',
              }}
            >
              {tab}
            </span>
          ))}
        </div>
        <DemoLabel
          name="view tabs = seam with one solid stitch"
          target="components/bases-inline-view.tsx tab row — active tab sewn solid, the rest tacked"
        />
      </div>

      {/* (2) Table view */}
      <div className="mt-12">
        <DemoTitle>Table view</DemoTitle>
        <div className="kk-stitch-border rounded-lg overflow-hidden max-w-2xl">
          <div className="kk-stitch-b grid grid-cols-[1.6fr_1fr_auto] gap-3 px-4 py-2">
            {(['Title', 'Tags', 'Modified'] as const).map((col) => (
              <span key={col} className="kk-label">
                {col}
              </span>
            ))}
          </div>
          {TABLE_ROWS.map(({ title, tags, modified }, i) => (
            <div key={title} className="kk-seam-hover">
              <div
                className={`grid grid-cols-[1.6fr_1fr_auto] gap-3 px-4 py-2.5 text-sm items-center ${
                  i < TABLE_ROWS.length - 1 ? 'kk-stitch-b' : ''
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Swatch patch={patchOf(title)} size="0.65em" />
                  <DemoLink>{title}</DemoLink>
                </span>
                <span className="text-fd-muted-foreground text-xs">#{tags}</span>
                <span className="text-fd-muted-foreground text-xs">{modified}</span>
              </div>
            </div>
          ))}
        </div>
        <DemoLabel
          name="table = a bolt of cloth, row seams"
          target="components/bases-view-table.tsx — stitched border, header seam, first-column swatches, row-hover tightens its seam"
        />
      </div>

      {/* (3) Gallery view */}
      <div className="mt-12">
        <DemoTitle>Gallery view</DemoTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          {GALLERY_CARDS.map(({ title, meta }) => (
            <div
              key={title}
              className="kk-tighten kk-stitch-border rounded-lg overflow-hidden"
              style={{ '--kk-tilt': tiltOf(title) } as CSSProperties}
            >
              <span
                className="block h-1.5"
                style={{ background: `var(--kk-patch-${patchOf(title)})` }}
                aria-hidden
              />
              <div className="p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-fd-muted-foreground">{meta}</p>
              </div>
            </div>
          ))}
        </div>
        <DemoLabel
          name="gallery = pinned swatch cards"
          target="components/bases-view-gallery.tsx — patch tab strip, stitch border, assigned tilt that straightens on hover"
        />
      </div>

      {/* (4) List view */}
      <div className="mt-12">
        <DemoTitle>List view</DemoTitle>
        <div className="max-w-md">
          {LIST_GROUPS.map(({ group, items }) => (
            <div key={group} className="mt-4 first:mt-0">
              <p className="kk-label inline-flex items-center gap-2">
                <Swatch patch={patchOf(group)} size="0.7em" />
                {group}
              </p>
              <div className="kk-thread-run mt-1.5" aria-hidden />
              {items.map(({ title, meta }) => (
                <div
                  key={title}
                  className="flex items-baseline justify-between gap-4 px-1 py-2 text-sm"
                >
                  <DemoLink>{title}</DemoLink>
                  <span className="text-xs text-fd-muted-foreground">{meta}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <DemoLabel
          name="list = grouped by thread"
          target="components/bases-view-list.tsx — group headers wear the group's swatch over a running thread"
        />
      </div>

      {/* (5) Graph view — proposal sketch */}
      <div className="mt-12">
        <DemoTitle>Graph view</DemoTitle>
        <div className="kk-stitch-border rounded-lg p-2 max-w-2xl">
          <svg viewBox="0 0 560 220" className="block w-full h-auto" role="img" aria-label="Graph view proposal sketch">
            {/* dashed thread edges */}
            {GRAPH_EDGES.map(([x1, y1, x2, y2]) => (
              <line
                key={`${x1}-${y1}-${x2}-${y2}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeOpacity={0.28}
                strokeWidth={1.2}
                strokeDasharray="6 5"
                strokeLinecap="round"
              />
            ))}
            {/* page nodes = filled patch squares */}
            {GRAPH_NODES.map(({ label, x, y, size }) => (
              <g key={label}>
                <rect
                  x={x - size / 2}
                  y={y - size / 2}
                  width={size}
                  height={size}
                  rx={2}
                  fill={`var(--kk-patch-${patchOf(label)})`}
                />
                <text
                  x={x}
                  y={y + size / 2 + 11}
                  textAnchor="middle"
                  fontSize={9}
                  fill="currentColor"
                  fillOpacity={0.65}
                >
                  {label}
                </text>
              </g>
            ))}
            {/* tag nodes = outlined squares */}
            {GRAPH_TAGS.map(({ label, x, y, size }) => (
              <g key={label}>
                <rect
                  x={x - size / 2}
                  y={y - size / 2}
                  width={size}
                  height={size}
                  rx={2}
                  fill="none"
                  stroke={`var(--kk-patch-${patchOf(label.slice(1))})`}
                  strokeWidth={1.2}
                />
                <text
                  x={x}
                  y={y + size / 2 + 11}
                  textAnchor="middle"
                  fontSize={9}
                  fill="currentColor"
                  fillOpacity={0.65}
                >
                  {label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <DemoLabel
          name="graph = patches joined by threads"
          target="components/graph-view.tsx. Proposal sketch — the graph restyle is deferred pending its own design pass"
        />
      </div>

      {/* (6) Canvas node cluster */}
      <div className="mt-12">
        <DemoTitle>Canvas node</DemoTitle>
        <div className="flex items-center flex-wrap gap-y-4">
          <div className="kk-stitch-border rounded-lg overflow-hidden w-44">
            <span
              className="block h-1.5"
              style={{ background: `var(--kk-patch-${patchOf('Canvas basics')})` }}
              aria-hidden
            />
            <div className="p-3">
              <p className="text-sm font-medium">Canvas basics</p>
              <p className="mt-1 text-xs text-fd-muted-foreground">A card on the board.</p>
            </div>
          </div>
          <svg width="72" height="24" viewBox="0 0 72 24" className="shrink-0" aria-hidden>
            <line
              x1={2}
              y1={12}
              x2={60}
              y2={12}
              stroke="currentColor"
              strokeOpacity={0.45}
              strokeWidth={1.2}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <polygon points="60,7 70,12 60,17" fill="currentColor" fillOpacity={0.45} />
          </svg>
          <div className="kk-stitch-border rounded-lg w-44 p-3">
            <p className="text-sm font-medium">Getting started</p>
            <p className="mt-1 text-xs text-fd-muted-foreground">Linked by one thread.</p>
          </div>
        </div>
        <DemoLabel
          name="canvas = cards tacked to the board"
          target="components/canvas-flow-nodes.tsx — stitch-border nodes, patch tab per group, dashed thread edges"
        />
      </div>

      {/* (7) Review card palettes */}
      <div className="mt-12">
        <DemoTitle>Review card palettes</DemoTitle>
        <StitchFrame className="rounded-xl max-w-2xl" inset={6} radius={12} draw={false}>
          <div className="px-5 py-4 flex flex-wrap gap-x-4 gap-y-2">
            {REVIEW_PALETTE_MAP.map(({ name, patch }) => (
              <span key={name} className="inline-flex items-center gap-1.5">
                <Swatch patch={patch} size="0.9em" />
                <span className="kk-label">
                  {name}
                  <span className="opacity-60">→{patch}</span>
                </span>
              </span>
            ))}
          </div>
        </StitchFrame>
        <DemoLabel
          name="review palettes = ten patches from the spectrum"
          target="components/review-block.tsx + app/review.css — proposed --rv-color-* → patch mapping (patches 4 and 12 unassigned)"
        />
      </div>

      {/* (8) Link preview popover */}
      <div className="mt-12">
        <DemoTitle>Link preview popover</DemoTitle>
        <div className="max-w-md">
          <p className="text-sm leading-relaxed">
            Every page links onward — hover <DemoLink>Graph view</DemoLink> to peek before you
            follow the thread.
          </p>
          <svg width="24" height="26" viewBox="0 0 24 26" className="ml-16 block" aria-hidden>
            <line
              x1={12}
              y1={0}
              x2={12}
              y2={26}
              stroke="currentColor"
              strokeOpacity={0.45}
              strokeWidth={1.2}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </svg>
          <div className="kk-stitch-border rounded-lg bg-fd-background p-4 max-w-xs shadow-sm">
            <h4 className="text-sm font-medium inline-flex items-center gap-2">
              <Swatch patch={patchOf('Graph view')} size="0.65em" />
              Graph view
            </h4>
            <p className="mt-1.5 text-xs text-fd-muted-foreground leading-relaxed">
              See how pages connect across the whole site. Nodes size with their links; the
              local view keeps just the neighbourhood.
            </p>
          </div>
        </div>
        <DemoLabel
          name="link preview = a patch held up to the light"
          target="components/link-popover.tsx — stitch-border panel sewn to its link by a short thread"
        />
      </div>

      {/* (9) Comments block */}
      <div className="mt-12">
        <DemoTitle>Comments block</DemoTitle>
        <div className="kk-stitch-t max-w-md pt-4">
          <p className="kk-label">Comments</p>
          <button
            type="button"
            className="kk-tighten kk-stitch-border mt-3 rounded-full px-4 py-1.5 text-sm inline-flex items-center gap-2 bg-transparent"
            style={
              {
                '--kk-tilt': tiltOf('comments'),
                color: 'var(--kk-gold-ink)',
                borderColor: 'color-mix(in srgb, var(--kk-gold) 55%, transparent)',
              } as CSSProperties
            }
          >
            Load comments
          </button>
          <p className="mt-2 text-xs text-fd-muted-foreground">
            Nothing is fetched until you ask for it.
          </p>
        </div>
        <DemoLabel
          name="comments = an optional extra panel"
          target="components/cusdis-comments.tsx — lazy-load state; gold thread on the invitation, no network until clicked"
        />
      </div>
    </div>
  );
}
