'use client';

import { useId, type CSSProperties } from 'react';

/**
 * LightBloom — concentric rings of light filaments blooming outward from a
 * white point, fused into liquid light by a goo filter.
 *
 * Borrowed techniques (from an "animated leaves" component), rebuilt:
 * - Goo filter: feGaussianBlur + alpha-threshold feColorMatrix makes the
 *   filaments merge where they overlap — light behaving like liquid.
 * - @property-registered --move <length> animated inside the transform's
 *   calc(): ONE shared keyframe (kk-bloom-move in sewn.css) drives every
 *   filament along its own polar angle.
 * - Ring-staggered delays: each ring ignites after the last, so the bloom
 *   opens outward.
 *
 * Corrections for this codebase: ~220 elements instead of ~1000; pure
 * deterministic render (no useEffect/useState/Math.random — stable SSR);
 * the hue-wheel rainbow is replaced by hash-assigned luminous ray colours
 * over white cores; styled-jsx CSS lives in sewn.css; filter id via useId.
 */

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const RAY_COLORS = [
  'var(--kk-ray-1)',
  'var(--kk-ray-2)',
  'var(--kk-ray-3)',
  'var(--kk-ray-4)',
  'var(--kk-ray-5)',
  'var(--kk-ray-6)',
  'var(--kk-ray-7)',
  'var(--kk-ray-8)',
  'var(--kk-ray-9)',
  'var(--kk-ray-10)',
  'var(--kk-ray-11)',
  'var(--kk-ray-12)',
  'var(--kk-halo-c)',
];

interface Petal {
  angle: number;
  base: number;
  c: string;
  delay: number;
  dur: number;
}

function buildPetals(rings: number): Petal[] {
  const petals: Petal[] = [];
  let g = 0;
  for (let ri = 0; ri < rings; ri++) {
    const count = 8 + ri * 8;
    for (let i = 0; i < count; i++) {
      g++;
      petals.push({
        angle: (360 / count) * i + ri * 7,
        base: 3 + ri * 5,
        c: RAY_COLORS[Math.floor(hash(g * 11 + 1) * RAY_COLORS.length)],
        delay: 0.35 * ri + hash(g * 11 + 2) * 0.8,
        dur: 2 + hash(g * 11 + 3) * 0.8,
      });
    }
  }
  return petals;
}

export function LightBloom({ rings = 7, className }: { rings?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const petals = buildPetals(rings);

  return (
    <div className={`grid place-items-center ${className ?? ''}`} aria-hidden>
      <svg className="absolute invisible pointer-events-none" width="0" height="0">
        <filter id={`${uid}-goo`}>
          <feGaussianBlur stdDeviation="4.5" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
        </filter>
      </svg>

      <div className="relative" style={{ filter: `url(#${uid}-goo) saturate(1.35) brightness(1.08)` }}>
        <div
          className="kk-breathe absolute rounded-full"
          style={{
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
            width: '3vmin',
            height: '3vmin',
            background:
              'radial-gradient(circle, #ffffff 0%, #ffffff 40%, color-mix(in srgb, var(--kk-halo-c) 85%, transparent) 62%, transparent 80%)',
          }}
        />
        {petals.map((p, i) => (
          <div
            key={i}
            className="kk-bloom-petal"
            style={
              {
                '--angle': `${p.angle.toFixed(1)}deg`,
                '--base': `${p.base}vmin`,
                background: `radial-gradient(color-mix(in srgb, #ffffff, transparent 88%), ${p.c})`,
                animationDelay: `${p.delay.toFixed(2)}s`,
                animationDuration: `${p.dur.toFixed(2)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
