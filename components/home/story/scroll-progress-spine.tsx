'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

// The thread of the page — a faint dashed line down the left margin that a
// gold thread "sews" over as the reader scrolls. Scroll progress and sanad
// metaphor in one element. Desktop only; decorative.
export function ScrollProgressSpine() {
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const sewn = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-5 top-0 bottom-0 z-30 hidden w-px xl:block"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, currentColor 0 5px, transparent 5px 11px)',
        color: 'color-mix(in srgb, var(--fd-foreground) 22%, transparent)',
      }}
    >
      <motion.span
        className="absolute inset-x-0 top-0 block origin-top"
        style={{
          height: '100%',
          scaleY: sewn,
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--kk-gold) 0 5px, transparent 5px 11px)',
        }}
      />
    </div>
  );
}
