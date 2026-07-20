'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

const BEAD_COUNT = 33;
const BEADS = Array.from({ length: BEAD_COUNT }, (_, index) => {
  const angle = (index / BEAD_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${(50 + Math.cos(angle) * 44).toFixed(4)}%`,
    top: `${(50 + Math.sin(angle) * 47).toFixed(4)}%`,
  };
});

/** A complete strand whose beads pass through one fixed point of touch. */
export function SubhaStrand() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const circuitProgress = useTransform(scrollYProgress, [0.08, 0.92], [0, 1], { clamp: true });
  const alignedStart = -180 / BEAD_COUNT;
  const rotation = useTransform(circuitProgress, [0, 1], [alignedStart, 360 + alignedStart]);
  const touchScale = useTransform(circuitProgress, (progress) => {
    const passage = progress * BEAD_COUNT;
    const distance = Math.abs(passage - Math.round(passage));
    return 1 + Math.max(0, 1 - distance * 5) * 0.18;
  });
  const touchOpacity = useTransform(circuitProgress, (progress) => {
    const passage = progress * BEAD_COUNT;
    const distance = Math.abs(passage - Math.round(passage));
    return 0.48 + Math.max(0, 1 - distance * 5) * 0.52;
  });
  const afterglowOpacity = useTransform(circuitProgress, (progress) => {
    const passage = progress * BEAD_COUNT;
    const trail = passage - Math.floor(passage);
    return Math.max(0, 1 - trail * 3.2) * 0.28;
  });

  return (
    <div ref={ref} className="relative mx-auto aspect-[4/5] w-full max-w-[34rem]" aria-hidden>
      <span className="absolute inset-[4%_7%] rounded-[50%] border border-fd-border" />

      <motion.div className="absolute inset-[4%_7%]" style={{ rotate: reduced ? 0 : rotation }}>
        {BEADS.map((bead, index) => (
          <span
            key={index}
            className="absolute h-[clamp(0.72rem,1.4vw,1.05rem)] w-[clamp(0.72rem,1.4vw,1.05rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fd-border bg-fd-background shadow-[0_1px_0_rgba(255,255,255,0.22)_inset]"
            style={{ left: bead.left, top: bead.top }}
          />
        ))}
      </motion.div>

      <span className="absolute bottom-[1.5%] left-1/2 h-12 w-px -translate-x-1/2 bg-[color:var(--kk-gold)] opacity-60" />
      <motion.span
        className="absolute bottom-[0.8%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-[color:var(--kk-gold)] blur-xl"
        style={{ opacity: reduced ? 0.12 : afterglowOpacity }}
      />
      <motion.span
        className="absolute bottom-[3.2%] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[color:var(--kk-gold)] bg-[color:var(--kk-soft)] shadow-[0_0_24px_color-mix(in_srgb,var(--kk-gold)_35%,transparent)]"
        style={{
          scale: reduced ? 1 : touchScale,
          opacity: reduced ? 0.8 : touchOpacity,
        }}
      />
    </div>
  );
}
