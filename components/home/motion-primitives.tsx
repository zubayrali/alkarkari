'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useMemo, useRef, type ReactNode } from 'react';

// Light primitives — dust drifting in the lamp's light, and a small parallax
// wrapper for imagery. Both honour prefers-reduced-motion. All positions are
// deterministic (no Math.random → no hydration mismatch on the static export).

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
function hash(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Motes of dust caught in the light, drifting over a night panel. */
export function FloatingParticles({ count = 18, className }: { count?: number; className?: string }) {
  const reduced = useReducedMotion() ?? false;
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(hash(i + 1) * 96 + 2).toFixed(2)}%`,
        top: `${(hash(i + 101) * 90 + 5).toFixed(2)}%`,
        // Rounded: full-precision floats serialize differently on the server
        // ("1.22878px") vs the client (raw number) → hydration mismatch.
        size: +(1 + hash(i + 201) * 2).toFixed(2),
        duration: +(7 + hash(i + 301) * 9).toFixed(2),
        delay: +(hash(i + 401) * -12).toFixed(2),
        drift: +(8 + hash(i + 501) * 18).toFixed(2),
      })),
    [count],
  );

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            borderRadius: '50%',
            background: 'var(--kk-halo-c)',
            opacity: reduced ? 0.15 : undefined,
          }}
          animate={reduced ? undefined : { y: [0, -m.drift, 0], opacity: [0.08, 0.35, 0.08] }}
          transition={
            reduced ? undefined : { duration: m.duration, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      ))}
    </div>
  );
}

/** Small scroll parallax for imagery — the world drifting past the light. */
export function Parallax({ children, range = 24, className }: { children: ReactNode; range?: number; className?: string }) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);

  return (
    <motion.div ref={ref} className={className} style={{ y: reduced ? 0 : y }}>
      {children}
    </motion.div>
  );
}
