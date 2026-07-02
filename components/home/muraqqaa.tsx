'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useMemo } from 'react';

// Muraqqaʿa — the patched cloak. The cloak and the zāwiya wall are both grids of
// solid, vivid colour. Here that patchwork is clipped to a khatim (eight-point
// star, the Moroccan seal) and backlit so the colours read like light through
// stained glass — the cloak being stitched, the light passing through it.

const PATCHES = 12;

// Eight-point star clip-path (percentages), generated once so we don't hand-type
// 16 vertices. inner≈0.6 reads as the chunky Moroccan khatim, not a thin star.
function starClip(spikes = 8, inner = 0.6): string {
  const pts: string[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? 0.5 : 0.5 * inner) * 100;
    const a = i * step - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(', ')})`;
}
const STAR = starClip();

// Deterministic colour per tile (no Math.random → no hydration mismatch), tuned
// so neighbours rarely share a hue — like the real cloak's scattered patches.
function patchColor(i: number, cols: number): string {
  const row = Math.floor(i / cols);
  const n = ((i * 5 + row * 3 + (i % 3)) % PATCHES) + 1;
  return `var(--kk-patch-${n})`;
}

const tileContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.012, delayChildren: 0.1 } },
};

function tileVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, scale: reduced ? 1 : 0.3 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.2 : 0.5, ease: [0.34, 1.4, 0.5, 1] },
    },
  };
}

/** The hero star: a stained-glass khatim mosaic that stitches itself together. */
export function MuraqqaaStar({ className, cols = 11 }: { className?: string; cols?: number }) {
  const reduced = useReducedMotion() ?? false;
  const vars = tileVariants(reduced);
  const tiles = useMemo(() => Array.from({ length: cols * cols }, (_, i) => i), [cols]);

  return (
    <div className={className} style={{ position: 'relative', aspectRatio: '1 / 1' }} aria-hidden>
      {/* Nūr — light blooming behind the glass */}
      <div
        className={reduced ? undefined : 'kk-breathe'}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '86%',
          height: '86%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,238,205,0.9) 0%, rgba(212,154,82,0.45) 35%, transparent 68%)',
          filter: 'blur(26px)',
          pointerEvents: 'none',
        }}
      />
      {/* The patchwork, clipped to the star */}
      <motion.div
        variants={tileContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 2,
          clipPath: STAR,
          WebkitClipPath: STAR,
          background: 'var(--kk-oxblood-2)', // grout between patches
        }}
      >
        {tiles.map((i) => (
          <motion.span
            key={i}
            variants={vars}
            className={reduced ? undefined : 'kk-shimmer'}
            style={{
              background: patchColor(i, cols),
              animationDelay: `${(i % 13) * 0.34}s`,
            }}
          />
        ))}
      </motion.div>
      {/* Thin gold seal outline tracing the star */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <polygon
          points={STAR.replace('polygon(', '').replace(')', '').replaceAll('%', '').replaceAll(',', ' ')}
          fill="none"
          stroke="rgba(212,154,82,0.5)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** The cloak's hem: a thin band of vivid patches, used as a section divider. */
export function MuraqqaaHem({ className, count = 28 }: { className?: string; count?: number }) {
  const reduced = useReducedMotion() ?? false;
  const vars = tileVariants(reduced);
  return (
    <motion.div
      aria-hidden
      className={className}
      variants={tileContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      style={{ display: 'flex', width: '100%', height: 10, borderRadius: 2, overflow: 'hidden', background: 'var(--kk-oxblood-2)' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          variants={vars}
          style={{ flex: 1, marginInline: 0.5, background: `var(--kk-patch-${(i % PATCHES) + 1})` }}
        />
      ))}
    </motion.div>
  );
}
