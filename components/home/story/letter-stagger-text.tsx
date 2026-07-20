'use client';

import { motion, useReducedMotion } from 'motion/react';

// "I forgave you" — written in letters of light. Letters kindle one by one
// when the line scrolls into view, each with a soft lamp-gold halo.
export function LetterStaggerText({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion() ?? false;
  const letters = Array.from(text);

  return (
    <motion.p
      aria-label={text}
      className={className}
      style={{
        color: 'var(--kk-ember)',
        textShadow: '0 0 18px color-mix(in srgb, var(--kk-lamp) 65%, transparent)',
      }}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'lit'}
      viewport={{ once: true, amount: 0.9 }}
      transition={{ staggerChildren: 0.09, delayChildren: 0.4 }}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          variants={{
            hidden: { opacity: 0, filter: 'blur(6px)' },
            lit: {
              opacity: 1,
              filter: 'blur(0px)',
              transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.p>
  );
}
