import Image from 'next/image';
import Link from 'next/link';
import type { HomeStrings } from '@/lib/locale';
import wanderingOlive from './images/wandering-olive.jpg';

export interface ThresholdHeroProps {
  home: HomeStrings;
  tagline: string;
}

/** The quiet threshold: one image, one identity, one way into the story. */
export function ThresholdHero({ home, tagline }: ThresholdHeroProps) {
  return (
    <section className="grid min-h-[calc(100svh-4rem)] bg-black text-white lg:grid-cols-[minmax(22rem,0.82fr)_minmax(0,1.18fr)]">
      <div className="order-2 flex flex-col justify-center px-7 py-16 sm:px-12 lg:order-1 lg:px-[clamp(3rem,7vw,8rem)] lg:py-24">
        <p className="kk-label mb-8" style={{ color: 'var(--kk-night-muted)' }}>
          {home.instituteLabel} · <span className="kk-arabic">المغرب</span> · {home.country}
        </p>

        <h1
          dir="rtl"
          lang="ar"
          className="kk-arabic text-balance leading-[1.2]"
          style={{ color: 'var(--kk-night-fg)', fontSize: 'clamp(3.4rem,8vw,8.2rem)' }}
        >
          الطريقة الكركرية
        </h1>

        <p className="kk-label mt-5" style={{ color: 'var(--kk-ember)' }}>
          {home.translit}
        </p>
        <p className="mt-10 max-w-xl text-balance text-2xl font-light leading-snug sm:text-3xl">
          {tagline}
        </p>
        <p className="mt-5 max-w-lg text-base leading-relaxed" style={{ color: 'var(--kk-night-muted)' }}>
          {home.intentionLead}
        </p>

        <Link
          href="#the-way"
          className="kk-link-stitch mt-12 w-fit text-sm no-underline"
          style={{ color: 'var(--kk-ember)' }}
        >
          {home.enter} ↓
        </Link>
      </div>

      <figure className="relative order-1 min-h-[54svh] overflow-hidden lg:order-2 lg:min-h-full">
        <Image
          src={wanderingOlive}
          alt={home.story.wanderTitle}
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black/20 lg:via-transparent lg:to-transparent"
          aria-hidden
        />
        <figcaption
          className="kk-label absolute bottom-6 right-6"
          style={{ color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}
        >
          {home.story.foundations.siyaha.title}
        </figcaption>
      </figure>
    </section>
  );
}
