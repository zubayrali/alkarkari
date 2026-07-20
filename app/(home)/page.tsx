import { ViewTransition } from 'react';
import { getSiteLanguage } from '@/lib/locale';
import { buildHomePrinciples } from '@/lib/home-principles';
import { ThresholdHero } from '@/components/home/threshold-hero';
import { PrinciplesJourney } from '@/components/home/principles-journey';
import { QuietFooter } from '@/components/home/quiet-footer';

// The home page is a hand-maintained shell page (ADR-0003). It assembles one
// calm introduction; detailed notes remain generated from the vault.
export default function HomePage() {
  const lang = getSiteLanguage();
  const home = lang.home;
  const principles = buildHomePrinciples(home.story.foundations);

  return (
    <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
      <main className="kk-home flex flex-col overflow-hidden bg-fd-background text-fd-foreground">
        <ThresholdHero home={home} tagline={lang.heroTagline} />
        <PrinciplesJourney home={home} principles={principles} />
        <QuietFooter home={home} />
      </main>
    </ViewTransition>
  );
}
