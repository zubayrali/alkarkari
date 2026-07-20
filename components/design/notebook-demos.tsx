/**
 * Wave 2 — Notebook component demos for the /design showcase page.
 *
 * Self-contained mockups of the sewn system applied to notebook (docs page)
 * chrome: wikilinks, tag chips, callouts, orbit review cards, the properties
 * infobox, sidenotes, code blocks, h2 underlines, and backlinks. Nothing here
 * touches the real components — each demo carries a caption naming its
 * production target.
 *
 * Server component; the only client island is <StitchFrame> (already
 * 'use client'). Colours are assigned via patchOf(key) — never arrayed.
 * Hardcoded English copy is intentional (preview page, locale-rule exempt).
 *
 * Follows DESIGN.md §3 "Notebook chrome": containers are hairline + surface
 * contrast; dashed strokes only for state pairs or single-edge dividers;
 * patch colour = identity (dots/tabs), gold = position; StitchFrame is
 * reserved for the one focal component (the review card).
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

/** Demo-only stitched link — real pages use resolved wikilink anchors. */
function DemoLink({ children }: { children: string }) {
  return (
    <a href="#" className="kk-link-stitch">
      {children}
    </a>
  );
}

const DEMO_TAGS = ['guides', 'reference/api', 'notes', 'howto'];

/**
 * Night-palette hem — pearl/gray/gold segments over the dark ground showing
 * through as grout. The only patchwork allowed at chrome scale (§3 rule 5);
 * widths are fixed and uneven so it reads hand-cut, not striped.
 */
const NIGHT_HEM: ReadonlyArray<{ token: string; grow: number }> = [
  { token: '--kk-moon', grow: 3 },
  { token: '--kk-lamp', grow: 2 },
  { token: '--kk-pearl', grow: 4 },
  { token: '--kk-mist', grow: 2 },
  { token: '--kk-halo-c', grow: 3 },
  { token: '--kk-glass', grow: 4 },
  { token: '--kk-lamp', grow: 1 },
  { token: '--kk-moon', grow: 3 },
];

function NightHem() {
  return (
    // inset from the block's edges so the dark ground reads as grout around
    // the light segments (pearl on the white page edge would look like a notch)
    <div className="mx-1 mt-1.5 flex h-[3px] gap-px" aria-hidden>
      {NIGHT_HEM.map(({ token, grow }, i) => (
        <span key={i} style={{ flexGrow: grow, background: `var(${token})` }} />
      ))}
    </div>
  );
}

const PROPERTY_ROWS: Array<{ key: string; value: string; arabic?: boolean; link?: boolean }> = [
  { key: 'arabic', value: 'كتاب', arabic: true },
  { key: 'root', value: 'ك-ت-ب', arabic: true },
  { key: 'category', value: 'reference' },
  { key: 'related', value: 'Backlinks', link: true },
];

export function NotebookDemos() {
  return (
    <div>
      {/* (a) Wikilinks = stitches */}
      <div>
        <p className="max-w-prose text-sm leading-relaxed">
          The <DemoLink>Graph view</DemoLink> shows how notes connect;{' '}
          <DemoLink>Search</DemoLink> finds anything by heading or body text. Every new
          page begins as a <DemoLink>Draft</DemoLink> — another patch stitched onto the
          site.
        </p>
        <DemoLabel
          name="wikilinks = stitches"
          target="wikilink anchors in article prose; components/link-popover.tsx previews get a StitchFrame"
        />
      </div>

      {/* (b) Tags = swatches */}
      <div className="mt-12">
        <div className="flex flex-wrap gap-2">
          {DEMO_TAGS.map((tag) => (
            <a
              key={tag}
              href="#"
              className="kk-tighten kk-stitch-border rounded-full px-3 py-1 text-sm inline-flex items-center gap-2 no-underline"
              style={{ '--kk-tilt': tiltOf(tag) } as CSSProperties}
            >
              <Swatch patch={patchOf(tag)} size="0.7em" />
              <span>#{tag}</span>
            </a>
          ))}
        </div>
        <DemoLabel
          name="tags = swatches"
          target="components/page-tags.tsx chips + the tags index — colour by patchOf(tag)"
        />
      </div>

      {/* (c) Callouts = sewn patches */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            {
              type: 'note',
              title: 'Note',
              body: 'A remark sewn onto the page — same cloth, its own patch.',
            },
            {
              type: 'warning',
              title: 'Warning',
              body: 'Handle this thread with care; it frays when pulled too fast.',
            },
          ] as const
        ).map(({ type, title, body }) => (
          <div key={type} className="rounded-lg border border-fd-border bg-fd-card overflow-hidden flex">
            <span
              className="w-1.5 shrink-0"
              style={{ background: `var(--kk-patch-${patchOf(type)})` }}
              aria-hidden
            />
            <div className="p-4">
              <p className="text-sm font-medium inline-flex items-center gap-2">
                <Swatch patch={patchOf(type)} size="0.7em" />
                {title}
              </p>
              <p className="mt-1.5 text-sm text-fd-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
        <div className="sm:col-span-2">
          <DemoLabel
            name="callouts"
            target="Obsidian callouts — ground card (hairline + fd-card), solid patch tab by callout type"
          />
        </div>
      </div>

      {/* (d) Orbit review card */}
      <div className="mt-12">
        <StitchFrame className="rounded-xl" inset={6} radius={12}>
          <div className="p-1.5">
            <div
              className="rounded-t-lg px-5 py-2.5 flex items-center gap-2"
              style={{
                background: `color-mix(in srgb, var(--kk-patch-${patchOf('review')}) 14%, transparent)`,
              }}
            >
              <Swatch patch={patchOf('review')} size="0.7em" />
              <span className="kk-label">Review · orbit</span>
            </div>
            <div className="px-5 py-5">
              <p className="text-base">What does patchOf(key) return?</p>
              <p
                className="kk-label mt-4 rounded px-3 py-2.5 text-center"
                style={{
                  border: '1px dashed color-mix(in srgb, currentColor 35%, transparent)',
                }}
              >
                Answer hidden · space to reveal
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['forgot', 'skip', 'remembered'] as const).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    className="kk-tighten kk-stitch-border rounded-full px-3 py-1 text-xs inline-flex items-center gap-1.5 bg-transparent"
                    style={{ '--kk-tilt': tiltOf(grade) } as CSSProperties}
                  >
                    <Swatch patch={patchOf(grade)} size="0.65em" />
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </StitchFrame>
        <DemoLabel
          name="orbit review card"
          target="app/review.css — --rv-color-* remapped onto the patch spectrum; grades as three small patches"
        />
      </div>

      {/* (e) Properties panel = garment label */}
      <div className="mt-12">
        <div className="rounded-lg border border-fd-border bg-fd-card max-w-md">
          <div className="kk-stitch-b px-4 py-2">
            <p className="kk-label">Properties</p>
          </div>
          <dl className="px-4 py-3 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
            {PROPERTY_ROWS.map(({ key, value, arabic, link }) => (
              <div key={key} className="contents">
                <dt className="kk-label self-center">{key}</dt>
                <dd className={arabic ? 'kk-arabic' : undefined}>
                  {link ? <DemoLink>{value}</DemoLink> : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <DemoLabel
          name="properties panel"
          target="components/properties-panel.tsx — ground card; the dashed divider under the header is the only stitch"
        />
      </div>

      {/* (f) Sidenote = margin patch */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-4 items-start">
        <p className="max-w-prose text-sm leading-relaxed">
          Long-form notes collect margin commentary as they grow, one remark at a
          time<sup className="kk-label" style={{ letterSpacing: '0.08em' }}>1</sup>. What
          matters is the thread that ties each note to its source.
        </p>
        <aside
          className="kk-tighten rounded-r-lg bg-fd-muted p-3 text-xs text-fd-muted-foreground"
          style={
            {
              '--kk-tilt': tiltOf('sidenote'),
              borderLeft: '1.2px dashed color-mix(in srgb, currentColor 45%, transparent)',
            } as CSSProperties
          }
        >
          <span className="kk-label" style={{ letterSpacing: '0.08em' }}>1</span>{' '}
          A margin patch: the note sits beside the prose, sewn to it by its label.
        </aside>
        <div className="sm:col-span-2">
          <DemoLabel
            name="sidenotes"
            target="app/sidenotes.css rail cards — fd-muted fill, dashed seam on the prose-facing edge, tiny assigned tilt"
          />
        </div>
      </div>

      {/* (g) Code block seam */}
      <div className="mt-12">
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ background: 'var(--kk-night, #0a0a0a)', color: 'rgba(255,255,255,0.85)' }}
        >
          <NightHem />
          <span
            className="absolute top-0 right-4 rounded-b px-2 py-0.5 text-[0.65rem] font-mono"
            style={{
              background: `var(--kk-patch-${patchOf('ts')})`,
              color: 'var(--kk-night, #0a0a0a)',
            }}
          >
            ts
          </span>
          <pre className="px-5 py-4 text-xs font-mono leading-relaxed overflow-x-auto m-0">
            {'export function patchOf(key: string): number {\n  // the same key wears the same patch, forever\n  return ((hash(key) >>> 0) % 12) + 1;\n}'}
          </pre>
        </div>
        <DemoLabel
          name="code block hem"
          target="docs code blocks — night-palette hem on the header edge + patch-coloured language tab"
        />
      </div>

      {/* (h) H2 running-stitch underline */}
      <div className="mt-12">
        <h3 className="text-2xl" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
          On the sewing of patches
        </h3>
        <div
          className="kk-thread-run mt-2 w-24"
          style={{ color: 'var(--kk-gold-ink)' }}
          aria-hidden
        />
        <DemoLabel
          name="h2 running-stitch underline"
          target="docs h2s — a short thread pulled through, in gold ink"
        />
      </div>

      {/* (i) Backlinks = threads arriving */}
      <div className="mt-12">
        <p className="kk-label">Stitched from</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              {
                title: 'Getting started',
                excerpt: '…every page links back to the notes that cite it, stitched in…',
              },
              {
                title: 'Canvas basics',
                excerpt: '…the graph view draws a thread between a note and its sources…',
              },
            ] as const
          ).map(({ title, excerpt }) => (
            <div key={title} className="kk-seam-hover kk-stitch-t px-4 py-3">
              <p className="text-sm">
                <DemoLink>{title}</DemoLink>
              </p>
              <p className="mt-1 text-xs text-fd-muted-foreground">{excerpt}</p>
            </div>
          ))}
        </div>
        <DemoLabel
          name="backlinks = threads arriving"
          target="components/backlinks.tsx cards — stitch-top seams, stitched titles"
        />
      </div>
    </div>
  );
}
