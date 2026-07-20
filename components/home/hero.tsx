'use client';

// The threshold — min aẓ-ẓulumāt ilā n-nūr. On enter, the muraqqaʿa's dyes wake
// from the dark; then الله (the Name at the heart of the cloth) blooms in from
// blur, and the wordmark block follows. One shared reveal progress drives the
// WebGL cloth and this DOM, staggered exactly as the hi-fi mockup:
//   name  : smooth(0.42, 0.78)   copy : smooth(0.66, 0.94)
// prefers-reduced-motion lands straight on the lit final state. The cloth's
// look is tuned in MURAQQAA_CONFIG (components/ui/muraqqaa-field.tsx).

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { MuraqqaaHeroBackdrop } from '@/components/ui/muraqqaa-field';
import type { HomeStrings } from '@/lib/locale';

export interface HeroProps {
  home: HomeStrings;
  tagline: string;
}

// How long the dark→light entrance takes (ms). One knob for the reveal pace.
const HERO_REVEAL_MS = 1800;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function Hero({ home, tagline }: HeroProps) {
  const progressRef = useRef(0); // read by the cloth shader each frame
  const sectionRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLAnchorElement>(null);

  // Depth planes on scroll-off (scrubbed, reversible): the cloth is the far
  // ground and lags the most, الله hangs in the middle of it, the wordmark
  // rides nearest, the scroll cue stays glued to the page. The differential
  // is the 3D. Parallax wrappers are separate elements so the entrance's
  // imperative style writes (opacity/blur/scale on the inner nodes) and
  // motion's transform never fight over one style.transform.
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const clothY = useTransform(scrollYProgress, [0, 1], ['0%', '26%']); // of its own 142% height ≈ 37% of the hero
  const nameY = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 110]);

  useEffect(() => {
    const apply = (p: number) => {
      progressRef.current = p;
      // الله — the Name, blooms first (opacity + blur + a whisper of scale)
      const nA = smooth(0.42, 0.78, p);
      if (nameRef.current) {
        nameRef.current.style.opacity = String(nA);
        nameRef.current.style.filter = nA >= 1 ? 'none' : `blur(${(1 - nA) * 10}px)`;
        nameRef.current.style.transform = `scale(${0.96 + nA * 0.04})`;
      }
      // the wordmark block — follows (opacity + blur + rise)
      const cA = smooth(0.66, 0.94, p);
      if (copyRef.current) {
        copyRef.current.style.opacity = String(cA);
        copyRef.current.style.filter = cA >= 1 ? 'none' : `blur(${(1 - cA) * 8}px)`;
        copyRef.current.style.transform = `translateY(${(1 - cA) * 22}px)`;
      }
      if (cueRef.current) cueRef.current.style.opacity = String(smooth(0.8, 1, p));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(1);
      return;
    }

    let raf = 0;
    let startT = 0;
    const tick = (now: number) => {
      if (!startT) startT = now;
      const t = Math.min(1, (now - startT) / HERO_REVEAL_MS);
      apply(1 - Math.pow(1 - t, 3)); // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="kk-night-panel relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-7 pb-28 pt-20 text-center"
    >
      {/* The muraqqaʿa: a generative patched cloak woven live behind the words.
          The night-panel radial ground stays underneath as the no-WebGL /
          no-JS fallback. Its dyes wake with progressRef during the entrance.
          The bottom edge melts into the night (mirror of the footer cloth's
          top mask) so scrolling off blends into the dark journey below. The
          mask lives on this static outer div; the cloth inside is oversized
          upward and slides down on scroll-off (the far parallax plane), so
          the melt stays glued to the section edge while the cloth moves. */}
      <div
        className="absolute inset-0 overflow-hidden"
        aria-hidden
        style={{
          maskImage: 'linear-gradient(to bottom, black 72%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent)',
        }}
      >
        <motion.div
          className="absolute inset-x-0"
          style={{ top: '-42%', height: '142%', y: reduced ? 0 : clothY }}
        >
          <MuraqqaaHeroBackdrop className="h-full w-full" progressRef={progressRef} />
        </motion.div>
      </div>
      {/* no-JS: show the words (the blur-in below starts them hidden) */}
      <noscript>
        <style>{`.kk-hero-reveal{opacity:1!important;filter:none!important;transform:none!important}`}</style>
      </noscript>

      {/* الله — the Name at the heart of the cloth (its own light, no box) */}
      <motion.div className="relative z-[2]" style={{ y: reduced ? 0 : nameY }}>
        <div
          ref={nameRef}
          lang="ar"
          dir="rtl"
          className="kk-hero-reveal kk-arabic leading-none"
          style={{
            opacity: 0,
            fontSize: 'clamp(72px, 14vw, 170px)',
            color: '#fffdf6',
            textShadow:
              '0 0 16px rgba(253,244,214,0.6), 0 0 55px rgba(215,168,63,0.55), 0 0 130px rgba(215,168,63,0.4)',
            willChange: 'opacity, filter, transform',
          }}
        >
          الله
        </div>
      </motion.div>

      {/* the wordmark block — a breath of shade behind the words on the bright cloth */}
      <motion.div className="relative z-[2] w-full" style={{ y: reduced ? 0 : copyY }}>
      <div
        ref={copyRef}
        className="kk-hero-reveal mt-9 flex w-full flex-col items-center"
        style={{ opacity: 0, willChange: 'opacity, filter, transform', textShadow: '0 1px 22px rgba(0,0,0,0.55)' }}
      >
        <p className="kk-label mb-5" style={{ color: 'var(--kk-night-muted)' }}>
          {home.instituteLabel} · <span className="kk-arabic">المغرب</span> · {home.country}
        </p>
        <h1
          dir="rtl"
          lang="ar"
          className="kk-arabic mb-4 leading-tight"
          style={{ color: 'var(--kk-ember)', fontSize: 'clamp(40px, 7.5vw, 92px)' }}
        >
          الطريقة الكركرية
        </h1>
        <p className="kk-label mb-6" style={{ color: 'var(--kk-night-muted)' }}>
          {home.translit}
        </p>
        <p
          className="max-w-[540px] text-balance font-light"
          style={{ color: 'var(--kk-night-fg)', fontSize: 'clamp(18px,2.3vw,25px)', lineHeight: 1.5 }}
        >
          {tagline}
        </p>
        <p className="kk-label mt-9" style={{ color: 'var(--kk-night-muted)', opacity: 0.9 }}>
          {home.journeyLine} · <span className="italic">{home.journeyGloss}</span>
        </p>
      </div>
      </motion.div>

      <Link
        ref={cueRef}
        href="#way"
        className="absolute bottom-7 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2 no-underline"
        style={{ color: 'var(--kk-night-muted)', textShadow: '0 1px 12px rgba(0,0,0,0.7)', opacity: 0 }}
      >
        <span className="kk-label !text-[10px]">{home.enter}</span>
        <span className="kk-scroll-cue text-base" aria-hidden>↓</span>
      </Link>
    </section>
  );
}
