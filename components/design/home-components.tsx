/**
 * Live gallery of every real homepage component, for the /design showcase.
 *
 * Unlike home-demos.tsx (which re-mocks the "sewn" system on white ground),
 * this renders the ACTUAL components from components/home/** with mock props
 * so they can be identified ahead of a homepage rebuild. Each carries a label
 * with its (post-rename) name and a one-line description of what it is.
 *
 * Hardcoded English/mock copy is intentional (preview page, locale-exempt),
 * except components that take the whole `home` strings object, which get the
 * real locale strings via getSiteLanguage().
 */
import type { ReactNode } from 'react';
import { getSiteLanguage } from '@/lib/locale';
import wanderingOlive from '@/components/home/images/wandering-olive.jpg';
import wanderingShrine from '@/components/home/images/wandering-shrine.jpg';

// Section components
import { Hero } from '@/components/home/hero';
import {
  IntroBand,
  ImageGallery,
  FeatureSplit,
  FeaturedCard,
  NavCardGrid,
  RecentNotes,
  KeyTerms,
} from '@/components/home/sections';
import { Footer } from '@/components/home/footer';

// Animation primitives
import { FloatingParticles, Parallax } from '@/components/home/motion-primitives';
import { PatchworkBand } from '@/components/home/patchwork';
import { FooterCloth } from '@/components/home/footer-cloth';
import { ScrollReveal, ScrollRevealItem } from '@/components/home/reveal';

// Scroll-narrative components
import { MasonryLayout } from '@/components/masonry-layout';
import { ScrollTimeline } from '@/components/home/story/scroll-timeline';
import { LetterStaggerText } from '@/components/home/story/letter-stagger-text';
import { FoundationsPanels } from '@/components/home/story/foundations-panels';
import { StickyScrollStory } from '@/components/home/story/sticky-scroll-story';

function Slot({
  name,
  what,
  dark,
  className,
  children,
}: {
  name: string;
  what: string;
  dark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-14">
      <div
        className={`rounded-2xl overflow-hidden ${dark ? 'kk-journey-dark' : ''} ${className ?? ''}`}
      >
        {children}
      </div>
      <p className="kk-label mt-3">
        {name} <span className="opacity-60">· {what}</span>
      </p>
    </div>
  );
}

export function HomeComponents() {
  const home = getSiteLanguage().home;

  const recentItems = [
    { title: 'On the Wird', href: '#wird-note', modified: '2026-07-03T00:00:00.000Z' },
    { title: 'Faqr — spiritual poverty', href: '#faqr-note', modified: '2026-06-28T00:00:00.000Z' },
    { title: 'The daily litany', href: '#litany-note', modified: '2026-06-10T00:00:00.000Z' },
  ];
  const termItems = [
    { title: 'Faqr', href: '#faqr' },
    { title: 'Dhikr', href: '#dhikr' },
    { title: 'Muraqaba', href: '#muraqaba' },
    { title: 'Silsila', href: '#silsila' },
  ];
  const foundationCards = [
    { key: 'sharia', arabic: 'الشريعة', title: 'Sharīʿa', line: 'The outward law — the road as it is walked.', href: '#sharia' },
    { key: 'tariqa', arabic: 'الطريقة', title: 'Ṭarīqa', line: 'The path — the discipline of the seeker.', href: '#tariqa' },
    { key: 'haqiqa', arabic: 'الحقيقة', title: 'Ḥaqīqa', line: 'The reality — what the path arrives at.', href: '#haqiqa' },
  ];
  const masonryPages = [
    { url: '#wird', title: 'On the Wird', description: 'The daily litany, recited morning and evening.', tags: ['practice'] },
    { url: '#faqr', title: 'Faqr', description: 'Spiritual poverty — total dependence on God.', tags: ['doctrine'] },
    { url: '#silsila', title: 'Silsila', description: 'The unbroken chain of transmission.', tags: ['lineage'] },
    { url: '#dhikr', title: 'Dhikr', description: 'Remembrance — the polishing of the heart.', tags: ['practice'] },
  ];

  return (
    <div>
      {/* ── Hero & sections ─────────────────────────────────────────────── */}
      <Slot name="Hero" what="hero.tsx — full-viewport dark threshold hero: wordmark, tagline, dust, CTA" className="max-h-[85vh]">
        <Hero home={home} tagline="A living library of the Karkariyya" />
      </Slot>

      <Slot name="IntroBand" what="sections.tsx — bismillah + intention opening band (currently unmounted)" dark className="px-6">
        <IntroBand home={home} />
      </Slot>

      <Slot name="ImageGallery" what="sections.tsx (was ContextGallery) — 3-up image gallery with hover veil-lift + zoom">
        <ImageGallery home={home} />
      </Slot>

      <Slot name="FeatureSplit" what="sections.tsx (was GuideSection) — image-in-niche + heading/description/CTA split">
        <FeatureSplit home={home} />
      </Slot>

      <Slot name="FeaturedCard" what="sections.tsx — single 'start here' featured link card">
        <FeaturedCard home={home} title="What is this notebook?" href="#" description="A first orientation — what this is and how to read it." />
      </Slot>

      <Slot name="NavCardGrid" what="sections.tsx (was PathwaysGrid) — responsive grid of navigation link cards">
        <NavCardGrid home={home} />
      </Slot>

      <Slot name="RecentNotes" what="sections.tsx — most-recently-modified notes with relative timestamps">
        <RecentNotes home={home} items={recentItems} locale="en" />
      </Slot>

      <Slot name="KeyTerms" what="sections.tsx — wrapping row of dictionary key-term pills">
        <KeyTerms home={home} items={termItems} />
      </Slot>

      <Slot name="Footer" what="footer.tsx — night-panel site footer with patchwork hem + haloed logo">
        <Footer home={home} />
      </Slot>

      {/* ── Animation primitives ────────────────────────────────────────── */}
      <Slot name="PatchworkBand" what="patchwork.tsx (was MuraqqaaHem) — horizontal glowing patchwork colour band (the muraqqaʿa spectrum)" dark className="p-10">
        <PatchworkBand variant="glow" />
      </Slot>

      <Slot name="FooterCloth" what="footer-cloth.tsx — the muraqqaʿa returning at the page's end: hero cloth, bigger scraps, top edge melting into night, reveal scrubbed by scroll" dark>
        <FooterCloth />
      </Slot>

      <Slot name="FloatingParticles" what="motion-primitives.tsx (was Dust) — drifting dust-mote field for dark panels" dark className="relative min-h-[220px]">
        <FloatingParticles count={24} />
      </Slot>

      <Slot name="Parallax" what="motion-primitives.tsx — scroll-parallax wrapper (drag/scroll to see the shift)" className="grid place-items-center py-10 bg-fd-muted">
        <Parallax>
          <div className="w-40 h-40 rounded-xl bg-fd-card border border-fd-border grid place-items-center text-fd-muted-foreground text-sm">
            parallax child
          </div>
        </Parallax>
      </Slot>

      <Slot name="ScrollReveal / ScrollRevealItem" what="reveal.tsx (was Reveal) — fades/rises children in on scroll, staggered">
        <ScrollReveal className="py-8 text-center">
          <ScrollRevealItem>
            <p className="text-2xl font-light text-fd-foreground">This block reveals on scroll</p>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <p className="text-sm text-fd-muted-foreground mt-2">…with a staggered second line.</p>
          </ScrollRevealItem>
        </ScrollReveal>
      </Slot>

      {/* ── Scroll-narrative components ─────────────────────────────────── */}
      <Slot name="ScrollTimeline" what="story/scroll-timeline.tsx (was SilsilaThread) — gold thread drawn downward through a chain of names on scroll" className="py-6">
        <ScrollTimeline moreLabel="twenty-one more links" gatherLabel="gather the chain" sealLabel="the Seal" linkLabel="See the full chain" linkHref="#" />
      </Slot>

      <Slot name="LetterStaggerText" what="story/letter-stagger-text.tsx (was LightScript) — letters kindle in one-by-one on scroll-in">
        <div className="py-10 text-center">
          <LetterStaggerText text="min aẓ-ẓulumāt ilā n-nūr" className="text-3xl" />
        </div>
      </Slot>

      <Slot name="MasonryLayout" what="components/masonry-layout.tsx — CSS-columns note-card grid; candidate for RecentNotes or /tags" className="p-4">
        <MasonryLayout pages={masonryPages} columns={3} />
      </Slot>

      <Slot name="FoundationsPanels" what="story/foundations-panels.tsx — the seven founding principles as an expanding-panel shelf, one patch colour each (click a spine)" className="py-6">
        <FoundationsPanels cards={foundationCards} readOn="Read on" />
      </Slot>

      <Slot name="StickyScrollStory" what="story/sticky-scroll-story.tsx — full-bleed photograph chapters (sticky, words rise through the frame), then the breathing-light khalwa (scroll to animate)" className="max-h-[90vh] overflow-y-auto">
        <StickyScrollStory
          title="The wandering"
          beats={[
            { kicker: 'The departure', quote: 'He walked until the road itself became the teacher.', image: wanderingOlive, alt: 'olive grove' },
            { kicker: 'The answer', quote: 'In the silence of the retreat, the light answered.', image: wanderingShrine, alt: 'shrine' },
          ]}
          khalwaLead="The retreat"
          khalwaScript="al-khalwa"
          khalwaGloss="seclusion with God"
        />
      </Slot>

      <p className="kk-label mt-10 opacity-70">
        ScrollProgressSpine{' '}
        <span className="opacity-60">
          · story/scroll-progress-spine.tsx (was ThreadSpine) — a fixed dashed line down the left
          margin that a solid line &quot;sews&quot; over in proportion to page scroll. Page-level fixed
          overlay; best seen live on the homepage, not inline here.
        </span>
      </p>
    </div>
  );
}
