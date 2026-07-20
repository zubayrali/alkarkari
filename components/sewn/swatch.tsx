/**
 * Swatch / SwatchRow — the muraqqaʿa patch atom, componentized.
 *
 * Server-compatible (no 'use client'): pure markup over the `.kk-swatch`
 * utility (karkari-theme.css) and the `.kk-swatch-pop` ignition
 * (app/sewn.css — reduced-motion safe there).
 *
 * Colours are ASSIGNED, never arrayed: `Swatch` takes a patch number you got
 * from `patchOf(key)` (lib/patch.ts), and `SwatchRow` maps content keys
 * through `patchOf` for you. Only spec-sheet surfaces (e.g. /design's token
 * table) may enumerate 1..12 directly.
 */

import type { CSSProperties } from 'react';
import { patchOf } from '@/lib/patch';

export function Swatch({
  patch,
  size = '0.9em',
  pop = false,
  delay = 0,
  className,
}: {
  /** Patch index 1..12 — always from patchOf(key), never hand-picked in content. */
  patch: number;
  /** CSS size (width = height); the utility's default is 0.9em. */
  size?: string;
  /** Ignite with the kk-swatch-pop spring scale-in. */
  pop?: boolean;
  /** animation-delay in seconds (stagger), only meaningful with pop. */
  delay?: number;
  className?: string;
}) {
  const style: CSSProperties & Record<'--kk-swatch-color', string> = {
    '--kk-swatch-color': `var(--kk-patch-${patch})`,
    width: size,
    height: size,
  };
  if (pop && delay) style.animationDelay = `${delay}s`;
  const classes = ['kk-swatch', pop && 'kk-swatch-pop', className].filter(Boolean).join(' ');
  return <span className={classes} style={style} aria-hidden />;
}

/**
 * A row of swatches wearing their ASSIGNED colours: each key runs through
 * patchOf, so the same key is the same colour forever, everywhere.
 */
export function SwatchRow({
  keys,
  size,
  pop = false,
  stagger = 0.06,
  className,
}: {
  /** Content keys (slugs, terms); each is coloured via patchOf(key). */
  keys: string[];
  size?: string;
  /** Ignite each swatch with kk-swatch-pop, staggered. */
  pop?: boolean;
  /** Seconds between successive pops. */
  stagger?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45em' }}
    >
      {keys.map((key, i) => (
        <Swatch key={`${key}-${i}`} patch={patchOf(key)} size={size} pop={pop} delay={i * stagger} />
      ))}
    </span>
  );
}
