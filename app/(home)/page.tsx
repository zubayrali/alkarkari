import { ViewTransition } from 'react';
import { getSiteLanguage } from '@/lib/locale';
import { getHomeData } from '@/lib/home-data';
import { Hero } from '@/components/home/hero';
import { ZawiyaFooter } from '@/components/home/zawiya-footer';
import {
  IntentionBand,
  ContextGallery,
  FeaturedCard,
  PathwaysGrid,
  RecentNotes,
  KeyTerms,
} from '@/components/home/sections';

export default function HomePage() {
  const lang = getSiteLanguage();
  const home = lang.home;
  const { dictionaryPages, recentNotes, featured } = getHomeData();

  // "Start here" — a note marked `featured: true`, else the dictionary.
  const startHere = featured ?? {
    title: home.featuredFallbackTitle,
    href: '/dictionary',
    description: home.featuredFallbackDescription,
  };

  // Single direct child of <ViewTransition> (ADR-0007): one <main>, all sections
  // nested inside it. The hero/footer are full-bleed; content is centered.
  return (
    <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
      <main className="kk-home flex flex-col">
        <Hero
          home={home}
          tagline={lang.heroTagline}
          primaryCta={lang.heroPrimaryCta}
          primaryHref="/dictionary"
          secondaryCta={lang.heroSecondaryCta}
          secondaryHref="/start-here"
        />

        <div className="container max-w-3xl mx-auto px-5 w-full">
          <span id="intention" className="block" style={{ scrollMarginTop: '2rem' }} />
          <IntentionBand home={home} />
          <FeaturedCard home={home} title={startHere.title} href={startHere.href} description={startHere.description} />
          <ContextGallery home={home} />
          <PathwaysGrid home={home} />
          <RecentNotes home={home} items={recentNotes} locale={lang.htmlLang} />
          <KeyTerms home={home} items={dictionaryPages} />
        </div>

        <ZawiyaFooter home={home} />
      </main>
    </ViewTransition>
  );
}
