import Link from 'next/link';
import type { CSSProperties } from 'react';
import { StitchFrame } from '@/components/sewn/stitch-frame';
import { Swatch, SwatchRow } from '@/components/sewn/swatch';

/**
 * Foundations — the token-level spec sheet for the patchwork system, rendered
 * on /design under the "Foundations" heading. Color, typography, spacing &
 * radius, the thread (stitch) spec, and motion. Server component; every demo
 * is deterministic (no randomness, no clock reads) and pure-CSS where a live
 * specimen is shown.
 *
 * Source of truth for every value on this sheet: app/karkari-theme.css
 * (tokens + motif utilities) and app/sewn.css (motion vocabulary).
 */

/** Serif heading face (h1–h6 get this globally; specimens are <p>s, so inline it). */
const headingFace: CSSProperties = {
  fontFamily: 'var(--font-spectral), Georgia, "Times New Roman", serif',
  letterSpacing: '-0.01em',
};

const chipRing = 'inset 0 0 0 1px color-mix(in srgb, currentColor 18%, transparent)';

function Caption({ name, target }: { name: string; target: string }) {
  return (
    <p className="kk-label mt-3">
      {name} <span className="opacity-60">· {target}</span>
    </p>
  );
}

function SubHeading({ title, first = false }: { title: string; first?: boolean }) {
  return <h3 className={first ? 'text-xl' : 'text-xl mt-12'}>{title}</h3>;
}

/** One token tile: colour chip + token name + literal value. */
function TokenTile({
  token,
  hex,
  note,
  onDark = false,
}: {
  token: string;
  hex: string;
  note?: string;
  /** Tile sits inside the dark-ground panel — swap muted text for a light gray. */
  onDark?: boolean;
}) {
  return (
    <div className="kk-stitch-border rounded-lg p-3">
      <span
        className="block h-9 rounded-md"
        style={{ background: hex, boxShadow: chipRing }}
        aria-hidden
      />
      <p
        className="kk-label mt-2"
        style={{
          letterSpacing: '0.08em',
          color: onDark ? 'rgba(255,255,255,0.72)' : undefined,
        }}
      >
        {token}
      </p>
      <p
        className={onDark ? 'text-xs font-mono mt-0.5' : 'text-xs font-mono mt-0.5 text-fd-muted-foreground'}
        style={onDark ? { color: 'rgba(255,255,255,0.6)' } : undefined}
      >
        {hex}
        {note ? ` · ${note}` : ''}
      </p>
    </div>
  );
}

/** Inline value cell for the semantic-token grid: mini chip + literal hex. */
function ValueCell({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-mono">
      <span
        className="inline-block size-4 rounded-sm shrink-0"
        style={{ background: hex, boxShadow: chipRing }}
        aria-hidden
      />
      {hex}
    </span>
  );
}

const LIGHT_NEUTRALS = [
  { token: '--kk-pearl', hex: '#ffffff', note: 'page ground' },
  { token: '--kk-glass', hex: '#f5f5f5', note: 'muted surface' },
  { token: '--kk-moon', hex: '#ededed', note: 'accent surface' },
  { token: '--kk-mist', hex: '#d4d4d4', note: 'strong line' },
  { token: 'muted-fg', hex: '#595959', note: '7.0:1 on white' },
];

const DARK_NEUTRALS = [
  { token: '--kk-night', hex: '#000000', note: 'panels' },
  { token: '--kk-night-2', hex: '#0a0a0a', note: 'page ground' },
  { token: '--kk-veil-c', hex: '#161616', note: 'muted surface' },
  { token: '--kk-smoke', hex: '#262626', note: 'strong line' },
  { token: 'foreground', hex: '#ededed', note: '16.9:1 on ink' },
];

const GOLDS = [
  { token: '--kk-lamp', hex: '#d7a83f', note: 'core accent' },
  { token: '--kk-oil', hex: '#c7a24a', note: 'mid tone' },
  { token: '--kk-ember', hex: '#e8c766', note: 'bright tone' },
  { token: '--kk-brass', hex: '#9d7b35', note: 'deep tone' },
  { token: '--kk-halo-c', hex: '#f3e6b0', note: 'glow tint' },
];

const SEMANTIC_TOKENS = [
  { token: '--color-fd-background', light: '#ffffff', dark: '#0a0a0a' },
  { token: '--color-fd-foreground', light: '#0a0a0a', dark: '#ededed' },
  { token: '--color-fd-card', light: '#fafafa', dark: '#121212' },
  { token: '--color-fd-border', light: '#e5e5e5', dark: '#262626' },
  { token: '--color-fd-primary', light: '#8a6a24', dark: '#d7a83f' },
];

const GAPS = [
  { cls: 'gap-2', px: 8 },
  { cls: 'gap-3', px: 12 },
  { cls: 'gap-4', px: 16 },
  { cls: 'gap-5', px: 20 },
];

const RADII = [
  { cls: 'rounded-lg', px: '8px', radius: '0.5rem' },
  { cls: 'rounded-xl', px: '12px', radius: '0.75rem' },
  { cls: 'rounded-2xl', px: '16px', radius: '1rem' },
];

export function Foundations() {
  return (
    <div>
      {/* ── 1 · Color ─────────────────────────────────────────────────── */}
      <SubHeading title="Color" first />

      {/* (a) Neutral ramp */}
      <div className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {LIGHT_NEUTRALS.map((t) => (
            <TokenTile key={t.token} {...t} />
          ))}
        </div>
        <div
          className="mt-3 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3"
          style={{ background: 'var(--kk-night-2)', color: '#ededed' }}
        >
          {DARK_NEUTRALS.map((t) => (
            <TokenTile key={t.token} {...t} onDark />
          ))}
        </div>
        <p className="mt-3 text-sm text-fd-muted-foreground max-w-prose">
          Every gray is R=G=B — no colour cast on the ground. Only the gold family and
          the twelve accents carry colour; the accents are enumerated in the Primitives
          section below.
        </p>
        <Caption
          name="neutral ramp"
          target="light ground + dark ground, pure neutrals only"
        />
      </div>

      {/* (b) Gold family */}
      <div className="mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {GOLDS.map((t) => (
            <TokenTile key={t.token} {...t} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="kk-stitch-border rounded-lg p-3">
            <span
              className="block h-9 rounded-md"
              style={{ background: 'var(--kk-gold)', boxShadow: chipRing }}
              aria-hidden
            />
            <p className="kk-label mt-2" style={{ letterSpacing: '0.08em' }}>
              --kk-gold
            </p>
            <p className="text-xs font-mono mt-0.5 text-fd-muted-foreground">
              light #b08a3e · dark #d7a83f · decorative only
            </p>
          </div>
          <div className="kk-stitch-border rounded-lg p-3">
            <p className="text-2xl leading-9" style={{ ...headingFace, color: 'var(--kk-gold-ink)' }}>
              Aa gold text
            </p>
            <p className="kk-label mt-2" style={{ letterSpacing: '0.08em' }}>
              --kk-gold-ink
            </p>
            <p className="text-xs font-mono mt-0.5 text-fd-muted-foreground">
              light #8a6a24 · dark #e8c766 · text-safe
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-fd-muted-foreground max-w-prose">
          Gold text always goes through <code>--kk-gold-ink</code> (AA in both modes).{' '}
          <code>--kk-gold</code> is decorative-only on light grounds — borders and
          fills, never body text.
        </p>
        <Caption
          name="--kk-lamp / oil / ember / brass / halo-c + --kk-gold / --kk-gold-ink"
          target="the single warm accent family"
        />
      </div>

      {/* (c) Semantic tokens */}
      <div className="mt-8">
        <div className="kk-stitch-border rounded-lg p-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-2 items-center">
            <span className="kk-label" style={{ letterSpacing: '0.08em' }}>
              token
            </span>
            <span className="kk-label" style={{ letterSpacing: '0.08em' }}>
              light
            </span>
            <span className="kk-label" style={{ letterSpacing: '0.08em' }}>
              dark
            </span>
            {SEMANTIC_TOKENS.map((row) => (
              <div key={row.token} className="contents">
                <span className="text-xs font-mono">{row.token}</span>
                <ValueCell hex={row.light} />
                <ValueCell hex={row.dark} />
              </div>
            ))}
          </div>
        </div>
        <Caption
          name="fd token overrides"
          target="components consume these, never raw hexes — the ground remaps them per mode"
        />
      </div>

      {/* ── 2 · Typography ────────────────────────────────────────────── */}
      <SubHeading title="Typography" />
      <div className="mt-4 flex flex-col gap-5">
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            h1 · text-4xl · serif
          </p>
          <p className="text-4xl mt-1" style={headingFace}>
            The patchwork system
          </p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            h2 · text-2xl · serif
          </p>
          <p className="text-2xl mt-1" style={headingFace}>
            Section heading specimen
          </p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            h3 · text-xl · serif
          </p>
          <p className="text-xl mt-1" style={headingFace}>
            Sub-section heading specimen
          </p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            body · text-sm / text-base · leading-relaxed
          </p>
          <p className="text-sm leading-relaxed max-w-prose mt-1">
            Body copy sits at <code>text-sm</code> in chrome and cards, <code>text-base</code>{' '}
            in long-form reading. An internal reference like{' '}
            <Link href="/start-here" className="kk-link-stitch">
              this stitched link
            </Link>{' '}
            rests as a dashed underline and is drawn solid on hover — the only place a
            stitch touches reading text is the underline of a link.
          </p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            small · text-xs · muted
          </p>
          <p className="text-xs text-fd-muted-foreground mt-1">
            Supporting detail, timestamps, tile notes — muted foreground, 7:1 on both grounds.
          </p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            label · .kk-label · mono uppercase, 0.6875rem, tracking 0.22em
          </p>
          <p className="kk-label mt-1">Kicker · caption · token name</p>
        </div>
        <div>
          <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
            mono · --font-mono-plex
          </p>
          <p className="font-mono text-sm mt-1">patchOf(&apos;graph&apos;) → var(--kk-patch-N)</p>
        </div>
      </div>
      <Caption
        name="serif headings · sans body · mono labels"
        target="fumadocs defaults + Tailwind scale; .kk-label for all captions"
      />

      {/* ── 3 · Spacing & radius ──────────────────────────────────────── */}
      <SubHeading title="Spacing & radius" />
      <div className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GAPS.map((g) => (
            <div key={g.cls} className="kk-stitch-border rounded-lg p-3">
              <div className={`flex ${g.cls}`} aria-hidden>
                <span className="block size-6 rounded-sm" style={{ background: 'var(--color-fd-muted)', boxShadow: chipRing }} />
                <span className="block size-6 rounded-sm" style={{ background: 'var(--color-fd-muted)', boxShadow: chipRing }} />
              </div>
              <p className="kk-label mt-2" style={{ letterSpacing: '0.08em' }}>
                {g.cls} · {g.px}px
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RADII.map((r) => (
            <div key={r.cls} className="kk-stitch-border rounded-lg p-3">
              <span
                className="block size-14"
                style={{ background: 'var(--color-fd-muted)', boxShadow: chipRing, borderRadius: r.radius }}
                aria-hidden
              />
              <p className="kk-label mt-2" style={{ letterSpacing: '0.08em' }}>
                {r.cls} · {r.px}
              </p>
            </div>
          ))}
          <div className="kk-stitch-border rounded-lg p-3">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs"
              style={{ background: 'var(--color-fd-muted)', boxShadow: chipRing }}
            >
              chip
            </span>
            <p className="kk-label mt-2" style={{ letterSpacing: '0.08em' }}>
              rounded-full · chips
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-fd-muted-foreground max-w-prose">
          Section rhythm: <code>mt-12</code> (48px) between cards inside a section,{' '}
          <code>mt-20</code> (80px) between sections. Tiles pad at <code>p-3</code>–
          <code>p-5</code>.
        </p>
        <Caption name="gap-2..5 · rounded-lg/xl/2xl/full" target="the working scale — no ad-hoc values" />
      </div>

      {/* ── 4 · Thread spec ───────────────────────────────────────────── */}
      <SubHeading title="Thread" />
      <div className="mt-4">
        <div className="kk-stitch-border rounded-lg p-5">
          <svg className="w-full" height="16" aria-hidden>
            <line
              x1="0"
              y1="8"
              x2="100%"
              y2="8"
              stroke="currentColor"
              strokeOpacity={0.55}
              strokeWidth={1.2}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </svg>
          <p className="kk-label mt-3" style={{ letterSpacing: '0.08em' }}>
            the canonical stitch · ~1.2px stroke · dash 6/5 · rounded caps · currentColor-mixed
          </p>
        </div>
        <ul className="mt-3 text-sm text-fd-muted-foreground max-w-prose list-disc pl-5 space-y-1">
          <li>Dashed at rest; drawn solid on hover (links).</li>
          <li>
            Gaps between dashes read as the ground showing through; in resting and
            finished states the stitch settles — it never stays half-drawn.
          </li>
          <li>
            Never a hard-coded colour: always mixed from <code>currentColor</code>, so
            the same thread reads as ink on the light ground and white on the dark.
          </li>
          <li>Stitches live on chrome only — never inside reading text.</li>
        </ul>
        <Caption
          name=".kk-stitch-border / .kk-stitch-t / .kk-stitch-b"
          target="borders, seams, frames — one dash rhythm everywhere"
        />
      </div>

      {/* ── 5 · Motion ────────────────────────────────────────────────── */}
      <SubHeading title="Motion" />
      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StitchFrame className="rounded-xl" inset={6} radius={12}>
            <div className="p-5">
              <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
                1 · draw-on border
              </p>
              <p className="text-xs text-fd-muted-foreground mt-1">
                The border draws itself on scroll-in, then settles into a static stitch.
              </p>
            </div>
          </StitchFrame>
          <div className="kk-stitch-border rounded-xl p-5">
            <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
              2 · running thread
            </p>
            <div className="kk-thread-run mt-3" aria-hidden />
            <p className="text-xs text-fd-muted-foreground mt-3">
              Dashes slide continuously — dividers and active underlines.
            </p>
          </div>
          <div className="kk-stitch-border rounded-xl p-5">
            <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
              3 · link draw
            </p>
            <p className="text-sm mt-2">
              <Link href="/graph" className="kk-link-stitch">
                Hover: sewn solid, left to right
              </Link>
            </p>
          </div>
          <div
            tabIndex={0}
            className="kk-tighten kk-stitch-border rounded-xl p-5 outline-none"
            style={{ '--kk-tilt': '-0.45deg' } as CSSProperties}
          >
            <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
              4 · tighten
            </p>
            <p className="text-xs text-fd-muted-foreground mt-1">
              Cut at −0.45°; hover pulls it straight and lifts it 1px.
            </p>
          </div>
          <div className="kk-stitch-border rounded-xl p-5 sm:col-span-2">
            <p className="kk-label" style={{ letterSpacing: '0.08em' }}>
              5 · pop-in
            </p>
            <p className="mt-2 flex items-center gap-2">
              <SwatchRow keys={['search', 'tags', 'review', 'graph', 'canvas']} size="1.1em" pop />
              <Swatch patch={7} size="1.1em" pop delay={0.3} />
            </p>
            <p className="text-xs text-fd-muted-foreground mt-2">
              Spring scale-in for small chips appearing, staggered by inline delay.
            </p>
          </div>
        </div>
        <ul className="mt-4 text-sm text-fd-muted-foreground max-w-prose list-disc pl-5 space-y-1">
          <li>
            Every animation has a finished static state under{' '}
            <code>prefers-reduced-motion</code> — nothing is information-bearing in
            motion alone.
          </li>
          <li>
            Easing: spring-overshoot <code>cubic-bezier(0.34, 1.4, 0.5, 1)</code> for
            pops; power curves for draws.
          </li>
          <li>Durations 0.2–0.7s; only compositor/paint-cheap properties animate.</li>
        </ul>
        <Caption
          name="<StitchFrame> · .kk-thread-run · .kk-link-stitch · .kk-tighten · .kk-swatch-pop"
          target="the five techniques — app/sewn.css"
        />
      </div>
    </div>
  );
}
