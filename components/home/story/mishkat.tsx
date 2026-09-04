'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { MishkatCitations } from '@/lib/locale';

// The Mishkāt — "a niche wherein is a lamp" (an-Nūr 35). The Light chapter's
// evidence, held in the lamp-glass and turned one proof at a time: Qurʾān,
// ḥadīth, and the sayings of the knowers. The reader flips through; it turns
// on its own until touched, then waits. Copy lives with the current locale's
// site strings so each language owns all three curated evidence decks.

const AUTO_MS = 6500;

export function Mishkat({
  quranLabel,
  hadithLabel,
  khabarLabel,
  hint,
  facetsLabel,
  previousLabel,
  nextLabel,
  citations,
}: {
  quranLabel: string;
  hadithLabel: string;
  khabarLabel: string;
  hint: string;
  facetsLabel: string;
  previousLabel: string;
  nextLabel: string;
  citations: MishkatCitations;
}) {
  const reduced = useReducedMotion() ?? false;
  const facets = [
    { label: quranLabel, deck: citations.quran },
    { label: hadithLabel, deck: citations.hadith },
    { label: khabarLabel, deck: citations.khabar },
  ];
  const [facet, setFacet] = useState(0);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const paused = useRef(false);
  const deck = facets[facet].deck;

  const go = (next: number, d: number) => {
    setDir(d);
    setI((next + deck.length) % deck.length);
  };
  const pickFacet = (f: number) => {
    setFacet(f);
    setI(0);
    setDir(1);
  };

  // Turns on its own; waits while hovered/focused or on reduced motion.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (!paused.current) setI((p) => (p + 1) % deck.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [deck.length, reduced]);

  const cite = deck[i];

  return (
    <div
      role="group"
      aria-label={facets[facet].label}
      tabIndex={0}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1, 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, -1); }
      }}
      className="relative mx-auto max-w-2xl outline-none"
      style={{
        padding: 'clamp(2.5rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3.5rem) 2.25rem',
        // the niche: a shouldered arch (mihrāb) over the night grout
        borderTopLeftRadius: 'clamp(80px, 22vw, 150px)',
        borderTopRightRadius: 'clamp(80px, 22vw, 150px)',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        border: '1px solid var(--kk-night-line)',
        background:
          'radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--kk-lamp) 16%, transparent) 0%, transparent 55%), linear-gradient(to bottom, var(--kk-night-2), var(--kk-night))',
      }}
    >
      {/* the lamp hanging in the niche — the source of the light */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ top: 'clamp(0.9rem, 3vw, 1.6rem)' }}
      >
        <div
          className="kk-breathe"
          style={{
            width: 14,
            height: 18,
            margin: '0 auto',
            borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
            background: 'radial-gradient(circle at 50% 38%, #fffdf6, var(--kk-lamp) 60%, transparent 78%)',
            boxShadow: '0 0 26px 6px color-mix(in srgb, var(--kk-lamp) 55%, transparent)',
          }}
        />
      </div>

      {/* facet tabs */}
      <div className="mb-8 flex justify-center gap-2" role="tablist" aria-label={facetsLabel}>
        {facets.map((f, fi) => {
          const on = fi === facet;
          return (
            <button
              key={f.label}
              role="tab"
              aria-selected={on}
              onClick={() => pickFacet(fi)}
              className="kk-label rounded-full px-4 py-1.5 transition-colors"
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                color: on ? 'var(--kk-night)' : 'var(--kk-night-muted)',
                background: on ? 'var(--kk-lamp)' : 'transparent',
                border: `1px solid ${on ? 'transparent' : 'var(--kk-night-line)'}`,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* the lamp-glass: one proof at a time */}
      <div className="relative min-h-[10.5rem] sm:min-h-[9.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={`${facet}-${i}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: dir * 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: dir * -14, filter: 'blur(6px)' }}
            transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <p
              className="text-balance font-light"
              style={{ color: 'var(--kk-night-fg)', fontSize: 'clamp(20px, 3vw, 28px)', lineHeight: 1.5 }}
            >
              “{cite.text}”
            </p>
            <footer className="kk-label mt-5" style={{ color: 'var(--kk-gold-ink)' }}>
              {cite.source}
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      {/* turn controls: ‹  · · ·  › */}
      <div className="mt-7 flex items-center justify-center gap-5">
        <button
          onClick={() => go(i - 1, -1)}
          aria-label={previousLabel}
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[color:var(--kk-night-line)]"
          style={{ color: 'var(--kk-night-muted)' }}
        >
          ‹
        </button>
        <div className="flex gap-2" aria-hidden>
          {deck.map((_, di) => (
            <button
              key={di}
              onClick={() => go(di, di > i ? 1 : -1)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: di === i ? 20 : 6,
                background: di === i ? 'var(--kk-lamp)' : 'var(--kk-night-muted)',
                opacity: di === i ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <button
          onClick={() => go(i + 1, 1)}
          aria-label={nextLabel}
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[color:var(--kk-night-line)]"
          style={{ color: 'var(--kk-night-muted)' }}
        >
          ›
        </button>
      </div>
      <p className="kk-label mt-3 text-center" style={{ color: 'var(--kk-night-muted)', fontSize: 10, opacity: 0.7 }}>
        {hint} · ‹ ›
      </p>
    </div>
  );
}
