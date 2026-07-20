/**
 * Wave 3 — Homepage component demos for the /design showcase page.
 *
 * Self-contained mockups of the sewn system applied to home surfaces —
 * pathway cards, section headers, recent notes, key-term pills, the featured
 * card, and the gallery image frames. The real components in
 * components/home/* are NOT modified; each demo carries a `.kk-label`
 * caption naming the technique and its production target.
 *
 * Server component: <Swatch> is server-compatible and <StitchFrame> is its
 * own client island. Hardcoded English copy is intentional (preview page,
 * locale-rule exempt). Everything is deterministic — tilts and colours come
 * from patchOf(key), never from randomness.
 */

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { StitchFrame } from '@/components/sewn/stitch-frame';
import { Swatch } from '@/components/sewn/swatch';
import { patchOf } from '@/lib/patch';
import cloak from '@/components/home/images/cloak.png';

/** Deterministic hand-cut tilt, assigned from the key's patch (same recipe as /design Wave 1). */
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

/* ── 1 · Sewn pathway card ──────────────────────────────────────────────── */

const MOCK_PATHWAYS = [
  {
    key: 'dictionary',
    tag: 'Reference',
    title: 'Dictionary',
    arabic: 'القاموس',
    description: 'Every term defined in one place — each entry a patch in the index.',
  },
  {
    key: 'guides',
    tag: 'Guides',
    title: 'Guides',
    arabic: 'الأدلة',
    description: 'Step-by-step walkthroughs — how the notebook works, and how to read it.',
  },
] as const;

function SewnPathwayCards() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_PATHWAYS.map((p) => (
          <div
            key={p.key}
            tabIndex={0}
            className="kk-tighten kk-seam-hover outline-none h-full"
            style={{ '--kk-tilt': tiltOf(p.key) } as CSSProperties}
          >
            <StitchFrame className="rounded-xl h-full" inset={6} radius={12}>
              <div className="relative p-5 pt-6 h-full">
                {/* The corner patch — replaces the old 3px top bar. */}
                <Swatch patch={patchOf(p.key)} size="1.05em" className="absolute top-4 right-4" />
                <span className="kk-label block mb-3">{p.tag}</span>
                <span className="flex items-baseline gap-2.5 mb-1.5">
                  <span className="text-lg font-medium text-fd-foreground">{p.title}</span>
                  <span className="kk-arabic text-base" style={{ color: 'var(--kk-gold-ink)' }}>
                    {p.arabic}
                  </span>
                </span>
                <span className="block text-sm leading-relaxed text-fd-muted-foreground">
                  {p.description}
                </span>
              </div>
            </StitchFrame>
          </div>
        ))}
      </div>
      <DemoLabel
        name="Sewn pathway card"
        target="NavCardGrid (components/home/sections.tsx) — stitch border, corner patch, hand-cut tilt that straightens on hover"
      />
    </div>
  );
}

/* ── 2 · Section header swatch ──────────────────────────────────────────── */

function SectionHeaderSwatch() {
  return (
    <div className="mt-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="kk-stitch-border rounded-xl p-5">
          <p className="kk-label opacity-50 mb-4">Current</p>
          <div className="flex items-baseline gap-3">
            <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }} aria-hidden>
              ۞
            </span>
            <p className="kk-label !text-xs">Ways in</p>
          </div>
        </div>
        <div className="kk-stitch-border rounded-xl p-5">
          <p className="kk-label opacity-50 mb-4">Proposed</p>
          <div className="flex items-center gap-3">
            <Swatch patch={patchOf('ways-in')} size="0.8em" />
            <p className="kk-label !text-xs">Ways in</p>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Swatch patch={patchOf('recently-inscribed')} size="0.8em" />
            <p className="kk-label !text-xs">Recently inscribed</p>
          </div>
        </div>
      </div>
      <DemoLabel
        name="Section header swatch"
        target="all section headers in sections.tsx — the ۞ glyph becomes that section's assigned patch"
      />
    </div>
  );
}

/* ── 3 · Recent notes with patch index ──────────────────────────────────── */

const MOCK_RECENT = [
  { slug: 'search', title: 'Search — find anything fast', when: '3d ago' },
  { slug: 'graph-view', title: 'Graph view — how notes connect', when: '5d ago' },
  { slug: 'canvas-basics', title: 'Canvas basics — spatial notes', when: '2w ago' },
  { slug: 'writing-notes', title: 'Writing notes — the authoring flow', when: '1mo ago' },
] as const;

function RecentNotesPatchIndex() {
  return (
    <div className="mt-12">
      <div className="flex flex-col">
        {MOCK_RECENT.map((n) => (
          <div
            key={n.slug}
            className="flex items-baseline justify-between gap-4 py-3.5 px-1 border-b border-fd-border"
          >
            <span className="flex items-baseline gap-3 min-w-0">
              <Swatch patch={patchOf(n.slug)} size="0.55em" className="shrink-0 self-center" />
              <span className="kk-link-stitch text-[15px] text-fd-foreground truncate cursor-pointer">
                {n.title}
              </span>
            </span>
            <span className="kk-label !tracking-normal !text-[11px] whitespace-nowrap shrink-0">
              {n.when}
            </span>
          </div>
        ))}
      </div>
      <DemoLabel
        name="Recent notes patch index"
        target="RecentNotes — each row led by patchOf(slug); the title wears .kk-link-stitch"
      />
    </div>
  );
}

/* ── 4 · Key terms swatch pills ─────────────────────────────────────────── */

const MOCK_TERMS = ['backlink', 'wikilink', 'canvas', 'base', 'sidenote', 'transclusion'] as const;

function KeyTermsSwatchPills() {
  return (
    <div className="mt-12">
      <div className="flex flex-wrap gap-2">
        {MOCK_TERMS.map((term) => (
          <span
            key={term}
            tabIndex={0}
            className="kk-tighten kk-stitch-border inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] text-fd-foreground outline-none capitalize"
            style={{ '--kk-tilt': tiltOf(term) } as CSSProperties}
          >
            <Swatch patch={patchOf(term)} size="0.55em" />
            {term}
          </span>
        ))}
      </div>
      <DemoLabel
        name="Key terms swatch pills"
        target="KeyTerms — a tin of fabric swatches; patch dot per term, hand-cut tilt tightens under the hand"
      />
    </div>
  );
}

/* ── 5 · Featured card as garment label ─────────────────────────────────── */

function FeaturedGarmentLabel() {
  const patch = patchOf('start-here');
  return (
    <div className="mt-12">
      <StitchFrame className="rounded-2xl" inset={6} radius={14}>
        <div
          className="relative flex items-center gap-6 rounded-2xl px-7 py-6 overflow-hidden"
          style={{ background: 'var(--kk-soft)' }}
        >
          {/* The folded patch-corner — the label is sewn onto the garment. */}
          <span
            aria-hidden
            className="absolute top-0 right-0"
            style={{
              width: 26,
              height: 26,
              background: `var(--kk-patch-${patch})`,
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            }}
          />
          <span className="kk-arabic text-5xl leading-none shrink-0" style={{ color: 'var(--kk-gold)' }} aria-hidden>
            ۞
          </span>
          <span className="flex-1">
            <span className="block kk-label mb-2" style={{ color: 'var(--kk-gold-ink)' }}>
              Start here
            </span>
            <span className="block text-xl font-medium text-fd-foreground mb-1">
              What is this notebook?
            </span>
            <span className="block text-sm leading-relaxed text-fd-muted-foreground">
              A first orientation — what this notebook is and how to read it.
            </span>
          </span>
          <span className="text-2xl shrink-0" style={{ color: 'var(--kk-gold)' }} aria-hidden>
            →
          </span>
        </div>
      </StitchFrame>
      <DemoLabel
        name="Garment label"
        target="FeaturedCard — stitch border replaces the gold rule; a folded patch-corner tab marks it as sewn on"
      />
    </div>
  );
}

/* ── 6 · Stitched image frame ───────────────────────────────────────────── */

function StitchedImageFrame() {
  return (
    <div className="mt-12">
      <figure className="m-0 max-w-[260px]">
        <StitchFrame className="rounded-2xl" inset={10} radius={12} color="#fff">
          <div className="kk-veil-lift relative aspect-[3/4] overflow-hidden rounded-2xl">
            <Image
              src={cloak}
              alt="Patchwork textile sample"
              fill
              placeholder="blur"
              className="object-cover"
              sizes="260px"
            />
            <span className="kk-veil" aria-hidden />
          </div>
        </StitchFrame>
        <figcaption className="kk-arabic text-center text-sm mt-2" style={{ color: 'var(--kk-gold-ink)' }}>
          Patchwork sample
        </figcaption>
      </figure>
      <DemoLabel
        name="Stitched image frame"
        target="ImageGallery / FeatureSplit — white thread sewn just inside the image edge; the veil lifts on hover"
      />
    </div>
  );
}

/* ── Wave 3 assembly ────────────────────────────────────────────────────── */

export function HomeDemos() {
  return (
    <div>
      <SewnPathwayCards />
      <SectionHeaderSwatch />
      <RecentNotesPatchIndex />
      <KeyTermsSwatchPills />
      <FeaturedGarmentLabel />
      <StitchedImageFrame />
    </div>
  );
}
