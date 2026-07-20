'use client';

/**
 * StitchFrame — the flagship "living stitch" primitive.
 *
 * Wraps its children with a hand-stitched dashed border (SVG rect overlay)
 * that DRAWS itself when scrolled into view: a solid thread is pulled around
 * the rect (strokeDashoffset 100 → 0 over pathLength=100), then crossfades
 * into the resting running-stitch dash pattern. Two stacked rects keep each
 * phase simple and reliable.
 *
 * Hover: the stitch tightens — stroke brightens and the dashes densify
 * (CSS on `.kk-stitch-frame:hover .kk-frame-stitch` in app/sewn.css).
 *
 * Reduced motion / draw=false: the finished stitched border, statically.
 *
 * Geometry: the svg has no viewBox (it tracks the wrapper's box); rects use
 * attribute x/y plus CSS width/height calc() — SVG2 geometry properties,
 * supported in all modern browsers. `vector-effect: non-scaling-stroke` and
 * `pathLength=100` make stroke weight and dash rhythm size-independent.
 */

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const PATH = 100;
/** Resting running-stitch pattern, in pathLength units (≈ the 6/12px seam rhythm). */
const STITCH_DASH = '2.4 1.6';
const DRAW_DURATION = 1.2;

const drawRect: Variants = {
  hidden: { strokeDashoffset: PATH, opacity: 1 },
  shown: {
    strokeDashoffset: 0,
    opacity: 0,
    transition: {
      strokeDashoffset: { duration: DRAW_DURATION, ease: 'easeInOut' },
      opacity: { delay: DRAW_DURATION - 0.1, duration: 0.35 },
    },
  },
};

const stitchRect: Variants = {
  hidden: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: { delay: DRAW_DURATION - 0.2, duration: 0.4 },
  },
};

export function StitchFrame({
  children,
  className,
  color = 'currentColor',
  inset = 6,
  radius = 12,
  draw = true,
}: {
  children: ReactNode;
  className?: string;
  /** Thread colour; defaults to currentColor so the frame adapts to its ground. */
  color?: string;
  /** Distance (px) between the wrapper's edge and the stitch. */
  inset?: number;
  /** Corner radius (px) of the stitch rect. */
  radius?: number;
  /** false → skip the draw-in, render the finished stitch (hover still works). */
  draw?: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  const animated = draw && !reduced;

  const geometry = {
    x: inset,
    y: inset,
    rx: radius,
    fill: 'none',
    stroke: color,
    strokeWidth: 1.2,
    vectorEffect: 'non-scaling-stroke',
    pathLength: PATH,
    style: {
      width: `calc(100% - ${inset * 2}px)`,
      height: `calc(100% - ${inset * 2}px)`,
    },
  } as const;

  return (
    <div className={className ? `kk-stitch-frame ${className}` : 'kk-stitch-frame'}>
      {children}
      {animated ? (
        <motion.svg
          className="kk-stitch-frame-svg"
          aria-hidden
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.4 }}
        >
          {/* Phase 1: the thread is pulled around the frame, then fades. */}
          <motion.rect {...geometry} strokeDasharray={PATH} variants={drawRect} />
          {/* Phase 2: the settled running stitch fades in underneath. */}
          <motion.rect
            {...geometry}
            className="kk-frame-stitch"
            strokeDasharray={STITCH_DASH}
            variants={stitchRect}
          />
        </motion.svg>
      ) : (
        <svg className="kk-stitch-frame-svg" aria-hidden>
          <rect {...geometry} className="kk-frame-stitch" strokeDasharray={STITCH_DASH} />
        </svg>
      )}
    </div>
  );
}
