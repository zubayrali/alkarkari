'use client';

import { useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/**
 * LightBurst — rays of colour emerging from one point of white light.
 *
 * Port of a "time travel" particle burst, inverted: instead of lines
 * collapsing into the center, every ray is born at a breathing white core
 * and shoots outward, white at its origin and taking on its colour as it
 * travels, dissolving at the edge. One shared keyframe animates all rays
 * (per-ray rotation/duration/delay via CSS custom properties) — not one
 * generated keyframe per particle — and everything is deterministic
 * (sin-hash, no Math.random), so the SSR markup is stable.
 *
 * LightBurstScroll wraps it in a tall scroll section: the burst holds the
 * viewport (sticky) and the heading condenses out of the light as you
 * scroll — opacity/blur/rise scrubbed by scroll progress.
 */

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Luminous ray variants (the base patches go muddy at 1px on night), plus
// white and halo-gold — the light carries every colour but stays light.
const RAY_COLORS = [
  'var(--kk-ray-1)', 'var(--kk-ray-2)', 'var(--kk-ray-3)', 'var(--kk-ray-4)',
  'var(--kk-ray-5)', 'var(--kk-ray-6)', 'var(--kk-ray-7)', 'var(--kk-ray-8)',
  'var(--kk-ray-9)', 'var(--kk-ray-10)', 'var(--kk-ray-11)', 'var(--kk-ray-12)',
  'var(--kk-halo-c)', '#ffffff',
];

interface Ray {
  rx: number;
  ry: number;
  rz: number;
  c: string;
  stop: number;
  dur: number;
  delay: number;
}

function buildRays(count: number): Ray[] {
  return Array.from({ length: count }, (_, i) => ({
    rx: (hash(i * 7 + 1) - 0.5) * 360,
    ry: (hash(i * 7 + 2) - 0.5) * 360,
    rz: (hash(i * 7 + 3) - 0.5) * 360,
    c: RAY_COLORS[Math.floor(hash(i * 7 + 4) * RAY_COLORS.length)],
    stop: 55 + hash(i * 7 + 5) * 45,
    dur: 1.6 + hash(i * 7 + 6) * 1.6,
    delay: -hash(i * 7 + 7) * 3.2,
  }));
}

export function LightBurst({
  count = 200,
  size = '42vmin',
  className,
}: {
  count?: number;
  size?: string;
  className?: string;
}) {
  const rays = useMemo(() => buildRays(count), [count]);

  return (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      style={{ perspective: '12vmin' }}
      aria-hidden
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* the single point of white light everything emerges from — a
            prism-point dot, NOT a glow cloud (a large blur sits over the
            brightest origin segment of every ray and dulls the whole burst) */}
        <div
          className="kk-breathe"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2.4vmin',
            height: '2.4vmin',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, #ffffff 0%, #ffffff 34%, color-mix(in srgb, var(--kk-halo-c) 85%, transparent) 58%, transparent 78%)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {rays.map((r, i) => (
          <span
            key={i}
            className="kk-ray-line"
            style={{
              '--rx': `${r.rx.toFixed(1)}deg`,
              '--ry': `${r.ry.toFixed(1)}deg`,
              '--rz': `${r.rz.toFixed(1)}deg`,
              background: `linear-gradient(to right, #ffffff, ${r.c} 24%, transparent ${r.stop.toFixed(0)}%)`,
              animationDuration: `${r.dur.toFixed(2)}s`,
              animationDelay: `${r.delay.toFixed(2)}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/** A tall scroll section: the burst holds the screen while the heading
 *  condenses out of the light — fading, sharpening, and rising into place
 *  as the reader continues to scroll. */
export function LightBurstScroll({
  title,
  count,
  className,
}: {
  title: ReactNode;
  count?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const opacity = useTransform(scrollYProgress, [0.32, 0.52], [0, 1]);
  const y = useTransform(scrollYProgress, [0.32, 0.52], [30, 0]);
  const filter = useTransform(opacity, (v) => `blur(${((1 - v) * 10).toFixed(1)}px)`);
  const scale = useTransform(scrollYProgress, [0.1, 0.6], [0.85, 1.08]);

  // The night ground lives ON the sticky screen itself — do NOT wrap this
  // component in .kk-night-panel or any overflow-clipping ancestor: a sticky
  // element inside a non-scrolling overflow container never sticks. The
  // sticky div's own overflow-hidden is fine (it just clips flying rays).
  return (
    <div ref={ref} className={className} style={{ height: '220vh' }}>
      {/* position is inline because .kk-night-panel sets `position: relative`
          in karkari-theme.css, which is imported last and beats Tailwind's
          .sticky at equal specificity — the panel silently never pinned. */}
      <div
        className="kk-night-panel sticky top-0 h-screen flex items-center justify-center"
        style={{ position: 'sticky' }}
      >
        <div className="relative flex items-center justify-center">
          <motion.div style={reduced ? undefined : { scale }}>
            <LightBurst count={count} />
          </motion.div>
          {/* flex-col: the title is three stacked block spans (verse, gloss,
              citation) — a row flex renders them as cramped side-by-side
              columns, which stayed hidden while the pinning was broken. No
              transform utilities here: motion's `y` owns `transform`. */}
          <motion.h2
            className="absolute inset-0 z-10 flex min-w-[20rem] flex-col items-center justify-center px-6 text-center text-2xl leading-snug sm:text-3xl"
            style={reduced ? undefined : { opacity, y, filter }}
          >
            {title}
          </motion.h2>
        </div>
      </div>
    </div>
  );
}
