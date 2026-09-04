import { ViewTransition } from 'react';
import { getSiteLanguage } from '@/lib/locale';
import { buildHomePrinciples } from '@/lib/home-principles';
import { ThresholdHero } from '@/components/home/threshold-hero';
import { PrinciplesJourney } from '@/components/home/principles-journey';
import { QuietFooter } from '@/components/home/quiet-footer';
import { HomeKnowledgeIndex } from '@/components/home/knowledge-index';
import {
  readAffineSiteSnapshot,
  readPublicPublishingSnapshot,
} from '@/lib/affine/publishing-snapshot';

// The home page is a hand-maintained shell page (ADR-0003). It assembles one
// calm introduction; detailed notes remain generated from the vault.
export default async function HomePage() {
  const lang = getSiteLanguage();
  const [publishing, affineSite] = await Promise.all([
    readPublicPublishingSnapshot(),
    readAffineSiteSnapshot(),
  ]);
  const siteContent = affineSite?.locale === lang.locale ? affineSite : undefined;
  const home = siteContent?.home ?? lang.home;
  const principles = buildHomePrinciples(home.story.foundations);

  return (
    <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
      <main className="kk-home flex flex-col overflow-hidden bg-fd-background text-fd-foreground">
        <ThresholdHero home={home} tagline={siteContent?.heroTagline ?? lang.heroTagline} />
        <HomeKnowledgeIndex home={home} homepage={publishing?.homepage} locale={publishing?.locale ?? 'en'} />
        <PrinciplesJourney home={home} principles={principles} />
        <QuietFooter home={home} />
      </main>
    </ViewTransition>
  );
}
