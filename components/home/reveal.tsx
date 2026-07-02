'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

function childVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.2 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
}

/** Section wrapper: fades/rises its children in on scroll, staggered. */
export function Reveal({
  children,
  className,
  as = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'footer';
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </Comp>
  );
}

/** A single staggered child inside <Reveal>. */
export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div className={className} variants={childVariants(reduced)}>
      {children}
    </motion.div>
  );
}
