'use client';

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef } from 'react';

function NameRing({
  count,
  radius,
  rotation,
  counterRotation,
  opacity,
}: {
  count: number;
  radius: number;
  rotation: number | MotionValue<number>;
  counterRotation: number | MotionValue<number>;
  opacity: number | MotionValue<number>;
}) {
  return (
    <motion.div className="absolute inset-0" style={{ rotate: rotation, opacity }}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        const left = (50 + Math.cos(angle) * radius).toFixed(4);
        const top = (50 + Math.sin(angle) * radius).toFixed(4);

        return (
          <span
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <motion.span
              dir="rtl"
              lang="ar"
              className="kk-arabic block text-[clamp(0.8rem,2vw,1.2rem)] text-fd-muted-foreground"
              style={{ rotate: counterRotation }}
            >
              الله
            </motion.span>
          </span>
        );
      })}
    </motion.div>
  );
}

/** Two gatherings turn around a still guide, with the written Names upright. */
export function HadraGathering() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const outerRotation = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [-18, 0, 54, 58]);
  const innerRotation = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [16, 0, -68, -72]);
  const outerCounter = useTransform(outerRotation, (value) => -value);
  const innerCounter = useTransform(innerRotation, (value) => -value);
  const gatherScale = useTransform(scrollYProgress, [0, 0.22, 0.82, 1], [0.84, 1, 1, 0.98]);
  const gatherOpacity = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [0.28, 1, 1, 0.82]);

  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[38rem]" aria-hidden>
      <span className="absolute inset-[5%] rounded-full border border-fd-border" />
      <span className="absolute inset-[25%] rounded-full border border-fd-border/70" />

      <span
        dir="rtl"
        lang="ar"
        className="kk-arabic absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(8rem,25vw,15rem)] leading-none text-fd-muted/60"
      >
        ه
      </span>

      <motion.div className="absolute inset-0 z-[1]" style={{ scale: reduced ? 1 : gatherScale }}>
        <NameRing
          count={12}
          radius={44}
          rotation={reduced ? 0 : outerRotation}
          counterRotation={reduced ? 0 : outerCounter}
          opacity={reduced ? 1 : gatherOpacity}
        />
        <NameRing
          count={8}
          radius={29}
          rotation={reduced ? 0 : innerRotation}
          counterRotation={reduced ? 0 : innerCounter}
          opacity={reduced ? 0.86 : gatherOpacity}
        />
      </motion.div>

      <span className="absolute left-1/2 top-[42%] z-[2] h-[16%] w-px -translate-x-1/2 bg-[color:var(--kk-gold)] opacity-70" />
      <span className="absolute left-1/2 top-1/2 z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--kk-gold)] shadow-[0_0_20px_color-mix(in_srgb,var(--kk-gold)_45%,transparent)]" />
    </div>
  );
}
