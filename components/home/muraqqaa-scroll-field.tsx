'use client';

import { useRef } from 'react';
import { useScroll } from 'motion/react';
import { MuraqqaaHeroBackdrop } from '@/components/ui/muraqqaa-field';

/** Adapts section scroll progress to the shared garment renderer. */
export function MuraqqaaScrollField() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });

  return (
    <div ref={ref} className="relative min-h-[26rem] overflow-hidden bg-black" aria-hidden>
      <MuraqqaaHeroBackdrop
        className="absolute inset-0 h-full w-full"
        progress={scrollYProgress}
        config={{ seed: 17, patchSize: 1.35, swayAmp: 0, swaySpeed: 0, fallbackProgress: 1 }}
      />
    </div>
  );
}
