'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/** A readable entrance for one semantic block; never hides its server markup. */
export function PrincipleReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0.72, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px -8% 0px' }}
      transition={{ duration: reduced ? 0 : 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
