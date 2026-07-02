// Server component — editorial oxblood hero. The Muraqqaʿa star mosaic is the
// hero visual (the patched cloak, lit like stained glass); the wordmark and
// invitation sit beneath it. No captions explain the symbolism — it is veiled.

import Link from 'next/link';
import { MuraqqaaStar } from './muraqqaa';
import type { HomeStrings } from '@/lib/locale';

export interface HeroProps {
  home: HomeStrings;
  tagline: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
}

export function Hero({ home, tagline, primaryCta, primaryHref, secondaryCta, secondaryHref }: HeroProps) {
  return (
    <section className="kk-oxblood-panel kk-gridlines min-h-[92vh] flex flex-col items-center justify-center text-center px-7 py-24">
      {/* faint rotating khatim seal, far behind everything */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="kk-spin absolute pointer-events-none opacity-[0.05]"
        style={{ width: 'min(120vh, 1100px)', height: 'min(120vh, 1100px)', zIndex: 0 }}
      >
        <polygon
          points="50 0 59 33 91 18 73 47 100 50 73 53 91 82 59 67 50 100 41 67 9 82 27 53 0 50 27 47 9 18 41 33"
          fill="none"
          stroke="var(--kk-oxblood-fg)"
          strokeWidth="0.4"
        />
      </svg>

      <div className="relative z-[2] flex flex-col items-center">
        <p className="kk-label mb-9" style={{ color: 'var(--kk-oxblood-muted)' }}>
          {home.instituteLabel} · <span className="kk-arabic">المغرب</span> · {home.country}
        </p>

        <MuraqqaaStar className="w-[clamp(220px,38vw,360px)] mb-10" />

        <h1
          dir="rtl"
          lang="ar"
          className="kk-arabic leading-none mb-4"
          style={{ color: 'var(--kk-gold)', fontSize: 'clamp(40px, 8vw, 96px)' }}
        >
          الطريقة الكركرية
        </h1>
        <p className="kk-label mb-9" style={{ color: 'var(--kk-oxblood-muted)' }}>
          {home.translit}
        </p>

        <p
          className="font-light mb-11 max-w-[560px] text-balance"
          style={{ color: 'var(--kk-oxblood-fg)', fontSize: 'clamp(20px,2.6vw,28px)', lineHeight: 1.5 }}
        >
          {tagline}
        </p>

        <div className="flex gap-3.5 justify-center flex-wrap">
          <Link
            href={primaryHref}
            className="text-[14.5px] font-medium px-6 py-3 rounded-lg no-underline transition-transform hover:-translate-y-px"
            style={{ background: 'var(--kk-gold)', color: 'var(--kk-oxblood-2)' }}
          >
            {primaryCta}
          </Link>
          <Link
            href={secondaryHref}
            className="text-[14.5px] font-medium px-6 py-3 rounded-lg no-underline transition-colors hover:border-white/40"
            style={{ border: '1px solid rgba(241,230,216,0.22)', color: 'var(--kk-oxblood-fg)' }}
          >
            {secondaryCta}
          </Link>
        </div>
      </div>

      <Link
        href="#intention"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2 no-underline"
        style={{ color: 'var(--kk-oxblood-muted)' }}
      >
        <span className="kk-label !text-[10px]">{home.enter}</span>
        <span className="kk-scroll-cue text-base" aria-hidden>↓</span>
      </Link>

      <div className="kk-hero-fade" aria-hidden />
    </section>
  );
}
