'use client';

import type { StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';

/**
 * TiledPortrait — a photograph as a grid of breathing patches, emerging from
 * the dark ground. Port of an "animated tiles" component, rebuilt for this
 * codebase:
 *
 * - One shared CSS keyframe (kk-tile-breathe in sewn.css) with per-tile
 *   --tmin/--tmax/duration/delay custom props — the original ran one
 *   requestAnimationFrame loop per tile.
 * - The hardcoded opacity matrix becomes a procedural falloff from a focal
 *   point (aimed at the face), so any grid size works.
 * - Deterministic (sin-hash, no Math.random), React-rendered (no innerHTML),
 *   responsive (percentage-based image slicing, not fixed pixels).
 * - The grid gap shows the dark ground between tiles — the same grout the
 *   patchwork components use. Hovering a tile brings it fully into light.
 *
 * Treatment contract for portraits of people: darkness-and-emergence only —
 * opacity against the dark ground. No glows, no halos.
 */

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function TiledPortrait({
  src,
  rows = 12,
  cols = 9,
  focusX = 0.5,
  focusY = 0.3,
  label,
  className,
}: {
  src: StaticImageData | string;
  rows?: number;
  cols?: number;
  /** Focal point of the falloff (0..1 of the image), default upper-center. */
  focusX?: number;
  focusY?: number;
  label?: string;
  className?: string;
}) {
  const url = typeof src === 'string' ? src : src.src;
  const ratio = typeof src === 'string' ? 3 / 4 : src.width / src.height;

  const tiles: Array<{ u: number; v: number; max: number; min: number; dur: number; delay: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = cols === 1 ? 0 : c / (cols - 1);
      const v = rows === 1 ? 0 : r / (rows - 1);
      // radial falloff from the focus, weighted so the bottom fades sooner
      const d = Math.hypot((u - focusX) * 1.2, (v - focusY) * (v > focusY ? 1.15 : 0.9));
      let max = clamp(1.45 - d * 1.9, 0, 1);
      max *= 1 - 0.14 * hash(r * 131 + c * 17 + 5); // hand-cut unevenness
      tiles.push({
        u,
        v,
        max: Number(max.toFixed(2)),
        min: Number(Math.max(0, max - 0.3).toFixed(2)),
        dur: 2.6 + hash(r * 131 + c * 17 + 6) * 1.8, // slow — a breath, not a flicker
        delay: -hash(r * 131 + c * 17 + 7) * 4.4,
      });
    }
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 2,
        aspectRatio: `${ratio}`,
        background: 'var(--kk-night-2, #0a0a0a)',
      }}
    >
      {tiles.map((t, i) =>
        t.max < 0.06 ? (
          <span key={i} aria-hidden />
        ) : (
          <span
            key={i}
            aria-hidden
            className="kk-tile-breathe"
            style={{
              '--tmax': t.max,
              '--tmin': t.min,
              '--tdur': `${t.dur.toFixed(2)}s`,
              animationDelay: `${t.delay.toFixed(2)}s`,
              backgroundImage: `url(${url})`,
              backgroundSize: `${cols * 100}% ${rows * 100}%`,
              backgroundPosition: `${(t.u * 100).toFixed(3)}% ${(t.v * 100).toFixed(3)}%`,
            } as CSSProperties}
          />
        ),
      )}
    </div>
  );
}
