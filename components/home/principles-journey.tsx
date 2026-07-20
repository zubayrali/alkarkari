import Image from 'next/image';
import Link from 'next/link';
import type { HomeStrings } from '@/lib/locale';
import type { HomePrinciple } from '@/lib/home-principles';
import wanderingShrine from './images/wandering-shrine.jpg';
import muraqqaaDoor from './images/muraqqaa-door.jpg';
import { HadraGathering } from './hadra-gathering';
import { MuraqqaaScrollField } from './muraqqaa-scroll-field';
import { Parallax } from './motion-primitives';
import { PrincipleReveal } from './principle-reveal';
import { SubhaStrand } from './subha-strand';

export interface PrinciplesJourneyProps {
  home: HomeStrings;
  principles: HomePrinciple[];
}

function PrincipleHeading({
  principle,
  index,
  inverse = false,
}: {
  principle: HomePrinciple;
  index: number;
  inverse?: boolean;
}) {
  const muted = inverse ? 'var(--kk-night-muted)' : 'var(--color-fd-muted-foreground)';

  return (
    <PrincipleReveal>
      <header className="relative z-[2] max-w-xl">
        <p className="kk-label" style={{ color: muted }}>
          {String(index + 1).padStart(2, '0')} / 07 · {principle.transliteration}
        </p>
        <p
          dir="rtl"
          lang="ar"
          className="kk-arabic mt-8 leading-none"
          style={{ color: inverse ? 'var(--kk-ember)' : 'var(--kk-gold-ink)', fontSize: 'clamp(3rem,7vw,6.8rem)' }}
        >
          {principle.arabic}
        </p>
        <h3 id={`${principle.sectionId}-title`} className="mt-5 text-balance text-4xl font-normal sm:text-5xl">
          {principle.title}
        </h3>
        <p className="mt-6 max-w-lg text-balance text-xl font-light leading-relaxed" style={{ color: muted }}>
          {principle.line}
        </p>
        {principle.href && (
          <Link href={principle.href} className="kk-link-stitch mt-8 inline-block text-sm no-underline">
            {principle.title} →
          </Link>
        )}
      </header>
    </PrincipleReveal>
  );
}

function SubhaThreshold({ principle, index }: { principle: HomePrinciple; index: number }) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="grid min-h-[90svh] scroll-mt-20 items-center gap-16 border-t border-fd-border px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(20rem,1.22fr)] lg:px-[clamp(3rem,8vw,9rem)]"
    >
      <div>
        <PrincipleHeading principle={principle} index={index} />
      </div>

      <SubhaStrand />
    </section>
  );
}

function SiyahaThreshold({
  home,
  principle,
  index,
}: {
  home: HomeStrings;
  principle: HomePrinciple;
  index: number;
}) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="relative min-h-[100svh] scroll-mt-20 overflow-hidden bg-black text-white"
    >
      <Parallax range={12} className="absolute -inset-y-4 inset-x-0">
        <Image
          src={wanderingShrine}
          alt={home.zawiyaAlt}
          fill
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-center"
        />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" aria-hidden />
      <div className="relative z-[2] flex min-h-[100svh] items-end px-6 py-16 sm:px-10 sm:py-20 lg:px-[clamp(3rem,8vw,9rem)]">
        <div>
          <PrincipleHeading principle={principle} index={index} inverse />
        </div>
      </div>
    </section>
  );
}

function HadraThreshold({ principle, index }: { principle: HomePrinciple; index: number }) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="grid min-h-[95svh] scroll-mt-20 items-center gap-16 border-t border-fd-border px-6 py-24 sm:px-10 lg:grid-cols-2 lg:px-[clamp(3rem,8vw,9rem)]"
    >
      <div>
        <PrincipleHeading principle={principle} index={index} />
      </div>

      <HadraGathering />
    </section>
  );
}

function MuraqqaaThreshold({
  home,
  principle,
  index,
}: {
  home: HomeStrings;
  principle: HomePrinciple;
  index: number;
}) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="grid min-h-[100svh] scroll-mt-20 bg-black text-white lg:grid-cols-[minmax(18rem,0.86fr)_minmax(0,1.14fr)]"
    >
      <figure className="order-2 relative min-h-[68svh] overflow-hidden lg:order-none lg:min-h-full">
        <Parallax range={12} className="absolute -inset-y-4 inset-x-0">
          <Image
            src={muraqqaaDoor}
            alt={home.cloakAlt}
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover object-center"
          />
        </Parallax>
      </figure>

      <div className="order-1 flex min-w-0 flex-col justify-center lg:order-none">
        <div className="px-6 py-20 sm:px-10 lg:px-[clamp(3rem,8vw,9rem)]">
          <PrincipleHeading principle={principle} index={index} inverse />
        </div>
        <MuraqqaaScrollField />
      </div>
    </section>
  );
}

function IsmThreshold({ principle, index }: { principle: HomePrinciple; index: number }) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="relative flex min-h-[100svh] scroll-mt-20 items-center justify-center overflow-hidden bg-black px-6 py-24 text-white sm:px-10"
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[color:var(--kk-gold)] to-transparent opacity-50" aria-hidden />
      <div
        dir="rtl"
        lang="ar"
        className="kk-arabic absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none leading-none text-white/[0.07]"
        style={{ fontSize: 'clamp(17rem,48vw,46rem)' }}
        aria-hidden
      >
        الله
      </div>
      <div className="relative z-[2] mx-auto w-full max-w-5xl">
        <PrincipleHeading principle={principle} index={index} inverse />
      </div>
    </section>
  );
}

function KhalwaThreshold({ principle, index }: { principle: HomePrinciple; index: number }) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="grid min-h-[100svh] scroll-mt-20 items-center gap-16 border-t border-fd-border px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:px-[clamp(3rem,8vw,9rem)]"
    >
      <div className="order-2 grid min-h-[56svh] place-items-center bg-black p-8 text-white lg:order-none" aria-hidden>
        <span dir="rtl" lang="ar" className="kk-arabic text-5xl" style={{ color: 'var(--kk-ember)' }}>
          الخلوة
        </span>
      </div>
      <div className="order-1 lg:order-none">
        <PrincipleHeading principle={principle} index={index} />
      </div>
    </section>
  );
}

function SirrThreshold({ principle, index }: { principle: HomePrinciple; index: number }) {
  return (
    <section
      id={principle.sectionId}
      aria-labelledby={`${principle.sectionId}-title`}
      className="relative flex min-h-[90svh] scroll-mt-20 items-center overflow-hidden border-y border-fd-border px-6 py-24 sm:px-10 lg:px-[clamp(3rem,8vw,9rem)]"
    >
      <p
        dir="rtl"
        lang="ar"
        className="kk-arabic pointer-events-none absolute -right-[0.12em] top-1/2 -translate-y-1/2 select-none leading-none text-fd-muted"
        style={{ fontSize: 'clamp(18rem,45vw,44rem)' }}
        aria-hidden
      >
        سر
      </p>
      <div className="relative z-[2] ml-auto w-full max-w-4xl lg:pr-[30%]">
        <PrincipleHeading principle={principle} index={index} />
      </div>
    </section>
  );
}

function Threshold({
  home,
  principle,
  index,
}: {
  home: HomeStrings;
  principle: HomePrinciple;
  index: number;
}) {
  switch (principle.presentation) {
    case 'counted-remembrance':
      return <SubhaThreshold principle={principle} index={index} />;
    case 'open-road':
      return <SiyahaThreshold home={home} principle={principle} index={index} />;
    case 'gathered-rhythm':
      return <HadraThreshold principle={principle} index={index} />;
    case 'sewn-field':
      return <MuraqqaaThreshold home={home} principle={principle} index={index} />;
    case 'singular-name':
      return <IsmThreshold principle={principle} index={index} />;
    case 'empty-chamber':
      return <KhalwaThreshold principle={principle} index={index} />;
    case 'concealed-close':
      return <SirrThreshold principle={principle} index={index} />;
  }
}

function Prelude({ home }: { home: HomeStrings }) {
  const story = home.story;

  return (
    <section id="the-way" aria-labelledby="the-way-title" className="scroll-mt-20 px-6 py-28 sm:px-10 sm:py-36 lg:px-[clamp(3rem,8vw,9rem)]">
      <div className="mx-auto w-full max-w-6xl">
        <p className="kk-label">{story.wayKicker}</p>
        <h2 id="the-way-title" className="mt-5 max-w-4xl text-balance text-5xl font-normal leading-tight sm:text-6xl lg:text-7xl">
          {story.wayTitle}
        </h2>
        <p className="mt-8 max-w-3xl text-balance text-2xl font-light leading-relaxed text-fd-muted-foreground">
          {story.wayReveal}
        </p>

        <div className="mt-20 grid border-y border-fd-border lg:grid-cols-3">
          <div className="py-10 lg:pr-10">
            <p className="kk-label">{story.wayKicker}</p>
            <p className="mt-5 text-xl leading-relaxed">“{story.wayMaxim}”</p>
          </div>
          <div className="border-t border-fd-border py-10 lg:border-l lg:border-t-0 lg:px-10">
            <p className="kk-label">{story.shaykhKicker}</p>
            <p className="mt-5 text-lg leading-relaxed text-fd-muted-foreground">{story.shaykhLine}</p>
          </div>
          <div className="border-t border-fd-border py-10 lg:border-l lg:border-t-0 lg:pl-10">
            <p className="kk-label">{story.nurKicker}</p>
            <p className="mt-5 text-lg leading-relaxed text-fd-muted-foreground">{story.nurLead}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContinueStudying({ home }: { home: HomeStrings }) {
  const routes = [
    { href: '/dictionary', ...home.pathways.dictionary },
    { href: '/books', ...home.pathways.books },
    { href: '/podcasts', ...home.pathways.podcasts },
  ];

  return (
    <section id="continue-studying" aria-labelledby="continue-studying-title" className="px-6 py-28 sm:px-10 sm:py-36 lg:px-[clamp(3rem,8vw,9rem)]">
      <div className="mx-auto w-full max-w-6xl">
        <p className="kk-label">{home.waysInHint}</p>
        <h2 id="continue-studying-title" className="mt-5 text-5xl font-normal sm:text-6xl">
          {home.waysInLabel}
        </h2>

        <nav className="mt-16 border-t border-fd-border" aria-label={home.waysInLabel}>
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group grid gap-4 border-b border-fd-border py-8 no-underline sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="kk-label">{route.tag}</span>
              <span>
                <span className="block text-3xl font-normal text-fd-foreground transition-transform group-hover:translate-x-1 sm:text-4xl">
                  {route.title}
                </span>
                <span className="mt-2 block max-w-2xl text-base leading-relaxed text-fd-muted-foreground">
                  {route.description}
                </span>
              </span>
              <span className="text-2xl text-[color:var(--kk-gold-ink)]" aria-hidden>→</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

/** One deep module for the page's context, seven thresholds, and handoff. */
export function PrinciplesJourney({ home, principles }: PrinciplesJourneyProps) {
  return (
    <div style={{ fontFamily: 'var(--font-spectral), Georgia, serif' }}>
      <Prelude home={home} />

      <section id="principles" aria-labelledby="principles-title" className="scroll-mt-20">
        <header className="px-6 pb-20 pt-8 sm:px-10 lg:px-[clamp(3rem,8vw,9rem)]">
          <div className="mx-auto w-full max-w-6xl">
            <p className="kk-label">{home.story.foundationsKicker}</p>
            <h2 id="principles-title" className="mt-5 text-balance text-5xl font-normal sm:text-6xl lg:text-7xl">
              {home.story.foundationsTitle}
            </h2>
            <p className="mt-7 max-w-2xl text-xl font-light leading-relaxed text-fd-muted-foreground">
              {home.story.foundationsLead}
            </p>
          </div>
        </header>

        <ol className="m-0 list-none p-0">
          {principles.map((principle, index) => (
            <li key={principle.id} className="m-0 p-0">
              <Threshold home={home} principle={principle} index={index} />
            </li>
          ))}
        </ol>
      </section>

      <ContinueStudying home={home} />
    </div>
  );
}
