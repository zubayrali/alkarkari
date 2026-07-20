'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

// Per-letter flip link — adapted from TomIsLoading's "Reveal links"
// (21st.dev), re-set in the site's editorial voice: Spectral serif, light
// weight, sentence case; on hover each letter rolls over and lands in
// gold-ink. Under reduced motion it is a plain colour-shift link.

const DURATION = 0.25;
const STAGGER = 0.02;

export function FlipLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const letters = Array.from(children);

  if (reduced) {
    return (
      <Link
        href={href}
        className={`block no-underline transition-colors hover:text-[color:var(--kk-gold-ink)] ${className ?? ''}`}
        style={{ fontFamily: 'var(--font-spectral), serif' }}
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.span initial="initial" whileHover="hovered" className="block">
      <Link
        href={href}
        aria-label={children}
        className={`relative block overflow-hidden whitespace-nowrap no-underline ${className ?? ''}`}
        style={{ fontFamily: 'var(--font-spectral), serif', lineHeight: 1.1 }}
      >
        {/* both letter layers are decorative — the aria-label carries the name */}
        <span className="block" aria-hidden>
          {letters.map((l, i) => (
            <motion.span
              key={i}
              variants={{ initial: { y: 0 }, hovered: { y: '-100%' } }}
              transition={{ duration: DURATION, ease: 'easeInOut', delay: STAGGER * i }}
              className="inline-block whitespace-pre"
            >
              {l}
            </motion.span>
          ))}
        </span>
        <span className="absolute inset-0 block" aria-hidden style={{ color: 'var(--kk-gold-ink)' }}>
          {letters.map((l, i) => (
            <motion.span
              key={i}
              variants={{ initial: { y: '100%' }, hovered: { y: 0 } }}
              transition={{ duration: DURATION, ease: 'easeInOut', delay: STAGGER * i }}
              className="inline-block whitespace-pre"
            >
              {l}
            </motion.span>
          ))}
        </span>
      </Link>
    </motion.span>
  );
}
