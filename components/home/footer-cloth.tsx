'use client';

// The footer's floor: the muraqqaʿa itself returns at the page's end — the
// same WebGL cloth as the hero, bigger scraps, its top edge melting into the
// night panel. Scroll scrubs the reveal: as the band enters the viewport the
// dyes kindle from the dark, smoothly and reversibly (no one-shot pop). The
// page closes the way it opened — on the cloak.

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { MuraqqaaHeroBackdrop } from '@/components/ui/muraqqaa-field';

export function FooterCloth({ height = 'clamp(240px, 38vh, 420px)' }: { height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const reveal = useTransform(scrollYProgress, [0, 1], ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      style={{
        height,
        pointerEvents: 'none',
        clipPath: reduced ? 'inset(0% 0 0 0)' : reveal,
        maskImage: 'linear-gradient(to bottom, transparent, black 55%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 55%)',
      }}
    >
      <MuraqqaaHeroBackdrop
        className="h-full w-full"
        progress={scrollYProgress}
        config={{ patchSize: 2, seed: 29, swayAmp: 0, swaySpeed: 0, fallbackProgress: 1 }}
      />
    </motion.div>
  );
}
