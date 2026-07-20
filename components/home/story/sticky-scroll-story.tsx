'use client';

import { useRef } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { LetterStaggerText } from './letter-stagger-text';

// The wandering (siyāḥa) and the khalwa — the Shaykh's story told as
// full-bleed photograph chapters. Adapted from the "Text Parallax Content"
// scroll pattern (21st.dev): each beat is a photograph that holds the screen
// (sticky) while its words rise through it, then hands off to the next.
// The sequence ends in the khalwa: darkness, one breathing light, and
// "I forgave you" written in letters of light.
//
// SCAFFOLD: beats carry placeholder kickers/quotes from lib/locale.ts
// (story.wanderKicker1..3 / wanderQuote1..3) — swap the strings there when
// the real narrative is ready; add or remove beats freely in page.tsx.
//
// Under prefers-reduced-motion the chapters render as static stacked
// figures — no pinning, no scroll-linked movement.

export interface StoryBeat {
  kicker: string;
  quote: string;
  image: StaticImageData;
  alt: string;
}

function ParallaxBeat({ beat }: { beat: StoryBeat }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // The photograph settles as it takes the screen, dims as it leaves.
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.08, 1]);
  const imgOpacity = useTransform(scrollYProgress, [0.62, 0.92], [1, 0.25]);
  // The words rise through the frame and are legible in its middle third.
  const y = useTransform(scrollYProgress, [0.2, 0.8], [120, -120]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.62, 0.75], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="relative h-[160vh]">
      {/* position:sticky inline — never trust a class to win the cascade
          here (see the .kk-night-panel lesson in light-burst.tsx). */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ position: 'sticky' }}>
        <motion.div className="absolute inset-0" style={{ scale, opacity: imgOpacity }}>
          <Image
            src={beat.image}
            alt={beat.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: 'grayscale(0.9) brightness(0.42)' }}
            placeholder="blur"
          />
          {/* night vignette so the photograph stays a chapter of the dark zone */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 70% at 50% 50%, transparent 30%, var(--kk-night) 100%)',
            }}
          />
        </motion.div>
        <motion.figure
          style={{ y, opacity }}
          className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-7 text-center"
        >
          <figcaption className="kk-label" style={{ color: 'var(--kk-night-muted)' }}>
            {beat.kicker}
          </figcaption>
          <blockquote
            className="max-w-2xl text-balance text-2xl font-light leading-relaxed sm:text-4xl"
            style={{ color: 'var(--kk-night-fg)', fontFamily: 'var(--font-spectral), serif' }}
          >
            “{beat.quote}”
          </blockquote>
        </motion.figure>
      </div>
    </div>
  );
}

function StaticBeat({ beat }: { beat: StoryBeat }) {
  return (
    <figure className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 py-16 sm:flex-row sm:gap-12">
      <div className="relative w-44 shrink-0 overflow-hidden rounded-xl sm:w-60" style={{ aspectRatio: '3 / 4' }}>
        <Image
          src={beat.image}
          alt={beat.alt}
          fill
          sizes="240px"
          className="object-cover"
          style={{ filter: 'grayscale(0.85) brightness(0.8)' }}
          placeholder="blur"
        />
      </div>
      <figcaption className="text-center sm:text-left">
        <p className="kk-label" style={{ color: 'var(--kk-night-muted)' }}>{beat.kicker}</p>
        <p className="mt-3 text-xl font-light leading-relaxed sm:text-2xl" style={{ color: 'var(--kk-night-fg)' }}>
          “{beat.quote}”
        </p>
      </figcaption>
    </figure>
  );
}

export function StickyScrollStory({
  title,
  beats,
  khalwaLead,
  khalwaScript,
  khalwaGloss,
}: {
  title: string;
  beats: StoryBeat[];
  khalwaLead: string;
  khalwaScript: string;
  khalwaGloss: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div>
      <p className="kk-label container mx-auto w-full max-w-3xl px-5 pb-4 pt-24" style={{ color: 'var(--kk-night-muted)' }}>
        {title}
      </p>

      {beats.map((beat) =>
        reduced ? <StaticBeat key={beat.quote} beat={beat} /> : <ParallaxBeat key={beat.quote} beat={beat} />,
      )}

      {/* the khalwa: darkness, one breathing light, the words */}
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-7 py-24 text-center">
        <motion.span
          aria-hidden
          className="block h-24 w-24 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--kk-lamp) 80%, white) 0%, color-mix(in srgb, var(--kk-lamp) 30%, transparent) 45%, transparent 70%)',
          }}
          animate={reduced ? undefined : { scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }}
          transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="max-w-md text-balance text-sm leading-relaxed" style={{ color: 'var(--kk-night-muted)' }}>
          {khalwaLead}
        </p>
        <LetterStaggerText text={khalwaScript} className="text-3xl font-light tracking-wide sm:text-5xl" />
        <p className="kk-label" style={{ color: 'var(--kk-night-muted)', opacity: 0.8 }}>
          {khalwaGloss}
        </p>
      </div>
    </div>
  );
}
