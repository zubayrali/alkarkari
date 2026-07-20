'use client';

import { useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * MuraqqaaGarment — a generative patched djellaba, modeled on the Karkariya
 * muraqqaʿa: long sleeves, a hood behind the neck, a round neckline with a
 * quarter-zip placket (no open front), and a mostly-regular grid of large
 * square patches in the full 12-accent spread plus white and black — evenly
 * weighted, with no two same-coloured patches touching.
 *
 * Presence without any runtime lib and without shading the cloth (patches
 * stay flat, solid fills): a soft ground shadow, an idle sway, and a
 * pointer-driven perspective tilt. Hovering a patch lifts it off the cloth;
 * clicking re-cuts the whole garment (seeded — deterministic, replayable).
 */

interface Patch {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}

// Deterministic pseudo-random (stable SSR markup, replayable seeds).
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// The full spread, evenly weighted, plus white and black — the robes carry
// nearly every shade, kept deliberate by adjacency (no same-colour neighbours).
const PALETTE = [
  'var(--kk-patch-1)', 'var(--kk-patch-2)', 'var(--kk-patch-3)',
  'var(--kk-patch-4)', 'var(--kk-patch-5)', 'var(--kk-patch-6)',
  'var(--kk-patch-7)', 'var(--kk-patch-8)', 'var(--kk-patch-9)',
  'var(--kk-patch-10)', 'var(--kk-patch-11)', 'var(--kk-patch-12)',
  '#f5f5f5', '#141414',
];

// Djellaba laid flat: neckline → shoulders → long hanging sleeves to the
// wrists → underarms → gentle A-line flare → curved hem.
const ROBE =
  'M445 185 L335 200 L140 680 L235 715 L350 360 L175 1235 Q500 1272 825 1235 ' +
  'L650 360 L765 715 L860 680 L665 200 L555 185 Q500 215 445 185 Z';

// The hood (qob), hanging behind the shoulders — drawn first, body over it.
const HOOD = 'M385 195 Q500 40 615 195 Q500 252 385 195 Z';

const FIELD = { x: 135, y: 180, w: 730, h: 1075 };
const HOOD_FIELD = { x: 385, y: 60, w: 230, h: 192 };

/** Jittered grid of large square-ish patches with occasional 2-wide or
 *  2-tall merges, coloured so no patch shares a colour with its left or top
 *  neighbour — the robes' deliberate placement, not a random scatter. */
function generate(seed: number, field: typeof FIELD, cols: number, rows: number): Patch[] {
  let n = 0;
  const rnd = () => hash(seed * 7919 + ++n);

  const xs = Array.from({ length: cols + 1 }, (_, i) =>
    field.x + (i * field.w) / cols + (i === 0 || i === cols ? 0 : (rnd() - 0.5) * 24),
  );
  const ys = Array.from({ length: rows + 1 }, (_, j) =>
    field.y + (j * field.h) / rows + (j === 0 || j === rows ? 0 : (rnd() - 0.5) * 20),
  );

  const colorAt: number[][] = Array.from({ length: rows }, () => []);
  const taken: boolean[][] = Array.from({ length: rows }, () => []);
  const patches: Patch[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (taken[r][c]) continue;
      let spanW = 1;
      let spanH = 1;
      if (c + 1 < cols && !taken[r][c + 1] && rnd() < 0.16) spanW = 2;
      else if (r + 1 < rows && rnd() < 0.12) spanH = 2;

      // no same colour left or above (5 is coprime with the palette size)
      let ci = Math.floor(rnd() * PALETTE.length);
      const left = c > 0 ? colorAt[r][c - 1] : -1;
      const top = r > 0 ? colorAt[r - 1][c] : -1;
      for (let t = 0; t < 3 && (ci === left || ci === top); t++) ci = (ci + 5) % PALETTE.length;

      for (let dr = 0; dr < spanH; dr++) {
        for (let dc = 0; dc < spanW; dc++) {
          if (r + dr < rows) {
            taken[r + dr][c + dc] = true;
            colorAt[r + dr][c + dc] = ci;
          }
        }
      }
      patches.push({
        x: xs[c],
        y: ys[r],
        w: xs[c + spanW] - xs[c],
        h: ys[Math.min(r + spanH, rows)] - ys[r],
        c: PALETTE[ci],
      });
    }
  }
  return patches;
}

export function MuraqqaaGarment({
  className,
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const reduced = useReducedMotion() ?? false;
  const tiltRef = useRef<HTMLDivElement>(null);
  const [seed, setSeed] = useState(1);

  const patches = generate(seed, FIELD, 9, 12);
  const hoodPatches = generate(seed + 977, HOOD_FIELD, 4, 3);

  // Pointer-driven perspective tilt — style writes only, no re-renders.
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || !tiltRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltRef.current.style.transform = `rotateY(${(px * 10).toFixed(2)}deg) rotateX(${(-py * 6).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = '';
  };

  const renderPatches = (list: Patch[], seedTag: number, stitches: boolean) =>
    list.map((s, i) => (
      <g
        key={i}
        className="kk-garment-pop"
        style={{ animationDelay: `${(hash(seedTag * 31 + i) * 0.7).toFixed(2)}s` } as CSSProperties}
      >
        <g className="kk-garment-patch">
          <rect
            x={s.x} y={s.y} width={s.w} height={s.h}
            fill={s.c}
            stroke="var(--kk-night-2, #0a0a0a)" strokeWidth={2.5}
          />
          {stitches && s.w > 44 && s.h > 38 && (
            <rect
              className="kk-garment-stitch"
              x={s.x + 5} y={s.y + 5} width={s.w - 10} height={s.h - 10}
              fill="none"
              stroke="#ffffff" strokeWidth={1.2}
              strokeDasharray="6 5" strokeLinecap="round"
            />
          )}
        </g>
      </g>
    ));

  const svg = (
    <svg viewBox="0 0 1000 1310" className="w-full h-auto" role="img" aria-label="Generative patched robe">
      <defs>
        <clipPath id={`${uid}-robe`}><path d={ROBE} /></clipPath>
        <clipPath id={`${uid}-hood`}><path d={HOOD} /></clipPath>
        {/* ground shadow (floor contact only — the cloth itself stays unshaded) */}
        <radialGradient id={`${uid}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={500} cy={1262} rx={340} ry={30} fill={`url(#${uid}-shadow)`} />

      <g className={reduced ? undefined : 'kk-garment-sway'}>
        {/* ── hood, hanging behind the shoulders ── */}
        <path d={HOOD} fill="var(--kk-night-2, #0a0a0a)" />
        <g clipPath={`url(#${uid}-hood)`}>
          {renderPatches(hoodPatches, seed + 977, false)}
          <rect x={HOOD_FIELD.x} y={HOOD_FIELD.y} width={HOOD_FIELD.w} height={HOOD_FIELD.h} fill="#000" opacity={0.3} />
        </g>
        <path d={HOOD} fill="none" stroke="var(--kk-gold)" strokeWidth={2.5} strokeLinejoin="round" />

        {/* ── the robe ── */}
        <path d={ROBE} fill="var(--kk-night-2, #0a0a0a)" />
        <g clipPath={`url(#${uid}-robe)`}>
          <g key={seed}>{renderPatches(patches, seed, true)}</g>
          {/* quarter-zip placket */}
          <g pointerEvents="none">
            <line x1={500} y1={200} x2={500} y2={470} stroke="#141414" strokeWidth={9} />
            <line x1={500} y1={204} x2={500} y2={452} stroke="var(--kk-mist, #d4d4d4)" strokeWidth={3} strokeDasharray="3 3.5" />
            <rect x={493} y={452} width={14} height={22} rx={4} fill="var(--kk-gold)" />
            <circle cx={500} cy={486} r={7} fill="none" stroke="var(--kk-gold)" strokeWidth={3.5} />
          </g>
        </g>
        {/* neckline trim + outline piping */}
        <path d="M445 185 Q500 215 555 185" fill="none" stroke="#141414" strokeWidth={9} strokeLinecap="round" />
        <path d={ROBE} fill="none" stroke="var(--kk-gold)" strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    </svg>
  );

  if (!interactive) return <div className={className}>{svg}</div>;
  return (
    <button
      type="button"
      onClick={() => setSeed((s) => s + 1)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`block w-full cursor-pointer bg-transparent border-0 p-0 ${className ?? ''}`}
      style={{ perspective: '900px' }}
      aria-label="Re-cut the garment"
      title="Click to re-cut"
    >
      <div ref={tiltRef} style={{ transition: 'transform 0.25s ease-out', transformStyle: 'preserve-3d' }}>
        {svg}
      </div>
    </button>
  );
}
