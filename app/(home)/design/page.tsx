import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { StitchFrame } from '@/components/sewn/stitch-frame';
import { Swatch, SwatchRow } from '@/components/sewn/swatch';
import { Foundations } from '@/components/design/foundations';
import { MuraqqaaGarment } from '@/components/ui/muraqqaa-garment';
import { LightBurst, LightBurstScroll } from '@/components/ui/light-burst';
import { TiledPortrait } from '@/components/ui/tiled-portrait';
import { LightBloom } from '@/components/ui/light-bloom';
import shaykh from '@/components/home/images/shaykh.png';
import { NotebookDemos } from '@/components/design/notebook-demos';
import { ChromeDemos } from '@/components/design/chrome-demos';
import { DataDemos } from '@/components/design/data-demos';
import { HomeDemos } from '@/components/design/home-demos';
import { HomeComponents } from '@/components/design/home-components';
import { patchOf } from '@/lib/patch';

/**
 * /design — the design-system reference. Foundations (color, type, spacing,
 * thread, motion) → primitives → every component group the site has, each
 * shown with its variants and states, for visual review before changes ship
 * to production surfaces.
 *
 * This is a preview/QA surface: hardcoded English copy is intentional and
 * exempt from the lib/locale.ts rule (it never ships as a reader-facing
 * page — noindex below, and it lives outside the notebook content tree).
 */

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
};

/** Spec-sheet exemption: only here may the 12 accents be enumerated 1..12. */
const ALL_PATCHES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Sample content keys — each wears its patchOf-assigned accent. */
const SAMPLE_KEYS = ['getting-started', 'graph', 'canvas', 'search', 'tags', 'review', 'glossary', 'notes'];

const PATCH_NAMES = [
  'crimson', 'orange', 'saffron', 'lime', 'emerald', 'teal',
  'cobalt', 'indigo', 'violet', 'magenta', 'rose-red', 'deep green',
];

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

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="mt-20 mb-8">
      <p className="kk-label">{kicker}</p>
      <h2 className="text-2xl mt-1">{title}</h2>
      <div className="kk-thread-run mt-4" aria-hidden />
    </header>
  );
}

export default function DesignPage() {
  return (
    <main className="flex flex-col">
      {/* ── Header ── */}
      <section className="kk-night-panel kk-stitch-b px-5 py-16">
        <div className="container max-w-3xl mx-auto">
          <p className="kk-label">Design system · reference</p>
          <h1 className="text-4xl mt-2">The patchwork system</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed" style={{ color: 'var(--kk-night-muted, rgba(255,255,255,0.72))' }}>
            A pure black-and-white ground, twelve assigned accent colours, gold as the
            single warm accent, and dashed-thread detailing on chrome. Accents are
            assigned per key, never arrayed into gradients. Stitches live on chrome,
            never inside reading text.
          </p>
          <p className="mt-6 flex items-center gap-2" aria-hidden>
            {ALL_PATCHES.map((n, i) => (
              <Swatch key={n} patch={n} size="1.1em" pop delay={i * 0.06} />
            ))}
          </p>
        </div>
      </section>

      <div className="container max-w-3xl mx-auto px-5 w-full pb-24">
        {/* ═══ Foundations ═══ */}
        <SectionHeading kicker="Foundations" title="Color · type · spacing · thread · motion" />
        <Foundations />

        {/* ═══ Primitives ═══ */}
        <SectionHeading kicker="Primitives" title="The sewn building blocks" />

        {/* (a) The 12 accent tokens + their ray variants */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {ALL_PATCHES.map((n) => (
              <div key={n} className="kk-stitch-border rounded-lg p-3 flex flex-col items-center gap-2">
                <Swatch patch={n} size="1.6em" />
                <span
                  className="block w-full rounded-sm px-1.5 py-2"
                  style={{ background: 'var(--kk-night)' }}
                  aria-hidden
                >
                  <span
                    className="block h-[2px] w-full rounded-full"
                    style={{ background: `var(--kk-ray-${n})` }}
                  />
                </span>
                <span className="kk-label" style={{ letterSpacing: '0.08em' }}>
                  {n} · {PATCH_NAMES[n - 1]}
                </span>
              </div>
            ))}
          </div>
          <DemoLabel
            name="--kk-patch-1..12 + --kk-ray-1..12"
            target="fills use patch; strokes under ~3px on dark grounds use ray"
          />
        </div>

        {/* (b) patchOf() — accents are assigned, never arrayed */}
        <div className="mt-12">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_KEYS.map((key) => (
              <span
                key={key}
                className="kk-stitch-border rounded-full px-3 py-1 text-sm inline-flex items-center gap-2"
              >
                <Swatch patch={patchOf(key)} />
                {key}
                <span className="kk-label" style={{ letterSpacing: '0.08em' }}>
                  p{patchOf(key)}
                </span>
              </span>
            ))}
          </div>
          <DemoLabel
            name="patchOf(key)"
            target="deterministic djb2 → 1..12; the same key wears the same accent forever, everywhere"
          />
        </div>

        {/* (c) StitchFrame — the border draws itself on scroll */}
        <div className="mt-12">
          <StitchFrame className="rounded-xl" inset={6} radius={12}>
            <div className="p-8">
              <p className="kk-label">Featured</p>
              <h3 className="text-xl mt-1">A hand-stitched frame</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground max-w-prose">
                The border draws itself around the card as it scrolls into view, then
                settles into a static running stitch. Hover: the stitch tightens —
                brighter thread, denser dashes. Under reduced motion the finished
                border simply is.
              </p>
            </div>
          </StitchFrame>
          <DemoLabel
            name="<StitchFrame>"
            target="featured cards, callout cartridges, gallery frames"
          />
        </div>

        {/* (e) The stitched link */}
        <div className="mt-12">
          <p className="max-w-prose text-sm leading-relaxed">
            An internal link like{' '}
            <Link href="/dictionary" className="kk-link-stitch">the dictionary</Link> or{' '}
            <Link href="/start-here" className="kk-link-stitch">start here</Link> rests as a
            dashed underline; on hover it is{' '}
            <Link href="/graph" className="kk-link-stitch">drawn solid, left to right</Link>.
          </p>
          <DemoLabel name=".kk-link-stitch" target="internal links in reading text" />
        </div>

        {/* (f) The running thread */}
        <div className="mt-12">
          <div className="kk-thread-run" aria-hidden />
          <DemoLabel
            name=".kk-thread-run"
            target="section dividers, active underlines — a continuously sliding dash pattern"
          />
        </div>

        {/* (g) Tilt + tighten — hand-cut cards */}
        <div className="mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['search', 'tags', 'review'].map((key) => (
              <div
                key={key}
                tabIndex={0}
                className="kk-tighten kk-stitch-border rounded-xl p-5 outline-none"
                style={{ '--kk-tilt': tiltOf(key) } as CSSProperties}
              >
                <Swatch patch={patchOf(key)} />
                <h3 className="text-base mt-2 capitalize">{key}</h3>
                <p className="text-xs text-fd-muted-foreground mt-1">
                  Hand-cut at {tiltOf(key)}; hover pulls it straight.
                </p>
              </div>
            ))}
          </div>
          <DemoLabel
            name=".kk-tighten + --kk-tilt"
            target="cards, tiles, chips — tilts assigned deterministically, never randomized"
          />
        </div>

        {/* (h) The seam wakes on hover */}
        <div className="mt-12">
          <div className="kk-seam-hover">
            <div className="kk-stitch-t kk-stitch-b px-5 py-6">
              <p className="text-sm text-fd-muted-foreground">
                A chrome band with top and bottom seams. Hover anywhere on it — the
                stitches brighten and tighten together.
              </p>
            </div>
          </div>
          <DemoLabel name=".kk-seam-hover" target="nav bands, card headers, footer seams" />
        </div>

        {/* ── Alternate ground: the same primitives on dark ── */}
        <div className="mt-16">
          <section className="kk-night-panel rounded-2xl px-6 py-10">
            <p className="kk-label">Alternate ground · dark</p>
            <p className="mt-3 flex items-center gap-2">
              <SwatchRow keys={SAMPLE_KEYS} size="1.1em" />
            </p>
            <div className="mt-5 grid grid-cols-6 sm:grid-cols-12 gap-2" aria-hidden>
              {ALL_PATCHES.map((n) => (
                <span
                  key={n}
                  className="block h-[2px] rounded-full"
                  style={{ background: `var(--kk-ray-${n})` }}
                />
              ))}
            </div>
            <div className="kk-thread-run mt-6" aria-hidden />
            <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              White thread on black:{' '}
              <Link href="/dictionary" className="kk-link-stitch">a stitched link</Link> reads
              the same here — currentColor carries the ground.
            </p>
            <StitchFrame className="rounded-xl mt-6" inset={6} radius={12}>
              <div className="p-6">
                <p className="kk-label" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Dark-ground frame
                </p>
                <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  The same StitchFrame, drawing itself in white thread on the black ground.
                </p>
              </div>
            </StitchFrame>
          </section>
          <DemoLabel
            name="both grounds"
            target="every primitive is currentColor-based — white thread on dark, ink thread on white"
          />
        </div>

        {/* ═══ Content components (notebook) ═══ */}
        <SectionHeading kicker="Components" title="Content — reading surfaces" />
        <NotebookDemos />

        {/* ═══ Navigation & chrome ═══ */}
        <SectionHeading kicker="Components" title="Navigation & chrome" />
        <ChromeDemos />

        {/* ═══ Data views & interactive ═══ */}
        <SectionHeading kicker="Components" title="Data views & interactive" />
        <DataDemos />

        {/* ═══ Homepage & brand ═══ */}
        <SectionHeading kicker="Components" title="Homepage & brand" />
        <HomeDemos />

        {/* ═══ Home components (live) ═══ */}
        <SectionHeading kicker="Components" title="Home components — live gallery" />
        <HomeComponents />

        {/* ═══ Experiments ═══ */}
        <SectionHeading kicker="Experiments" title="Generative garment" />
        <div>
          <section className="kk-night-panel rounded-2xl px-6 py-10">
            <MuraqqaaGarment className="max-w-sm mx-auto" />
            <p className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Move the pointer to tilt · hover a patch to lift it · click to re-cut.
            </p>
          </section>
          <DemoLabel
            name="<MuraqqaaGarment>"
            target="recursive-split patch field inside a coat silhouette; seeded, deterministic; placement TBD"
          />
        </div>

        <div className="mt-12">
          <section className="kk-night-panel rounded-2xl px-6 py-10">
            <LightBurst className="h-[46vmin]" />
            <p className="mt-2 text-center text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Idle state — rays born white at the core, taking on colour as they travel.
            </p>
          </section>
          <DemoLabel
            name="<LightBurst>"
            target="one shared keyframe, per-ray custom props; deterministic; homepage placement TBD"
          />
        </div>

        <div className="mt-12">
          {/* no night-panel wrapper: its overflow:hidden would break the
              sticky viewport — the component brings its own night ground */}
          <LightBurstScroll title={<>One light —<br />many colours.</>} className="-mx-5" />
          <DemoLabel
            name="<LightBurstScroll>"
            target="220vh sticky section; the heading condenses out of the light as you scroll (opacity + blur + rise)"
          />
        </div>

        <div className="mt-12">
          <section className="kk-night-panel rounded-2xl px-6 py-12">
            <TiledPortrait
              src={shaykh}
              label="Portrait emerging from darkness, tile by tile"
              className="max-w-xs mx-auto"
            />
            <p className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Tiles breathe within their assigned band; hover a tile to bring it fully into light.
            </p>
          </section>
          <DemoLabel
            name="<TiledPortrait>"
            target="proposed replacement for the guide section's static photo; darkness-and-emergence only, no glows on people"
          />
        </div>

        <div className="mt-12">
          <section className="kk-night-panel rounded-2xl h-[70vmin] grid place-items-center">
            <LightBloom />
          </section>
          <DemoLabel
            name="<LightBloom>"
            target="goo-filter liquid light + @property polar motion + ring-staggered bloom; placement TBD"
          />
        </div>

      </div>
    </main>
  );
}
