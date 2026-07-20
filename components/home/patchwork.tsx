'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';

// Muraqqaʿa — the patched cloak. The cloak and the zāwiya wall are both grids
// of solid, vivid colour; here the patchwork appears as the cloak's hem, a
// thin band of patches over the night grout.

const PATCHES = 12;

const tileContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.012, delayChildren: 0.1 } },
};

function tileVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, scale: reduced ? 1 : 0.3 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.2 : 0.5, ease: [0.34, 1.4, 0.5, 1] },
    },
  };
}

/** The cloak's hem: a thin band of vivid patches. `glow` backlights each patch. */
export function PatchworkBand({
  className,
  count = 28,
  variant = 'flat',
}: {
  className?: string;
  count?: number;
  variant?: 'flat' | 'glow';
}) {
  const reduced = useReducedMotion() ?? false;
  const vars = tileVariants(reduced);
  return (
    <motion.div
      aria-hidden
      className={className}
      variants={tileContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      style={{
        display: 'flex',
        width: '100%',
        height: 10,
        borderRadius: 2,
        overflow: variant === 'glow' ? 'visible' : 'hidden',
        background: 'var(--kk-night-2)',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          variants={vars}
          style={{
            flex: 1,
            marginInline: 0.5,
            background: `var(--kk-patch-${(i % PATCHES) + 1})`,
            ...(variant === 'glow'
              ? { boxShadow: `0 6px 18px -4px var(--kk-patch-${(i % PATCHES) + 1})` }
              : undefined),
          }}
        />
      ))}
    </motion.div>
  );
}
