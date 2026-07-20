// Server components — compose the client animation primitives (ScrollReveal,
// ScrollRevealItem, Parallax) with serializable data passed from app/(home)/page.tsx.
// The symbolism of the cloak and the light is shown, never captioned.
//
// The page is a journey min aẓ-ẓulumāt ilā n-nūr: IntroBand, FeaturedCard,
// ImageGallery, and FeatureSplit sit in the dark zone (.kk-journey-dark);
// NavCardGrid, RecentNotes, and KeyTerms arrive in the light.

import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, ScrollRevealItem } from './reveal';
import { RelativeTime } from './relative-time';
import { Parallax } from './motion-primitives';
import { FlipLink } from './flip-link';
import type { HomeStrings } from '@/lib/locale';
import cloak from './images/cloak.png';
import hadra from './images/hadra.png';
import zawiya from './images/zawiya.png';
import zawiyaWall from './images/zawiya-wall.png';
import shaykh from './images/shaykh.png';

export interface LinkItem {
  title: string;
  href: string;
}
export interface RecentItem extends LinkItem {
  /** ISO date-time, formatted client-side. */
  modified: string;
}

/* ── Intention / bismillah band (night) ─────────────────────────────────── */
export function IntroBand({ home }: { home: HomeStrings }) {
  return (
    <ScrollReveal className="text-center py-24">
      <ScrollRevealItem>
        <p dir="rtl" lang="ar" className="kk-arabic text-3xl sm:text-4xl mb-3" style={{ color: 'var(--kk-ember)' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <p className="kk-label mb-11">{home.bismillahGloss}</p>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <p className="text-2xl sm:text-3xl font-light leading-relaxed max-w-2xl mx-auto mb-6 text-balance">
          {home.intentionLead}
        </p>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <p className="text-base leading-relaxed max-w-xl mx-auto text-fd-muted-foreground">
          {home.intentionSub}
        </p>
      </ScrollRevealItem>
      {/* The alif — a thread of light leading out of the darkness */}
      <ScrollRevealItem>
        <div className="kk-thread mt-14 mb-8" aria-hidden />
      </ScrollRevealItem>
      <ScrollRevealItem>
        <p className="text-xl sm:text-2xl font-light mb-2" style={{ color: 'var(--kk-moon)' }}>
          {home.journeyLine}
        </p>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <p className="kk-label italic !normal-case !tracking-[0.12em]">{home.journeyGloss}</p>
      </ScrollRevealItem>
    </ScrollReveal>
  );
}

/* ── Context gallery — the cloak, the ḥaḍra, the zāwiya, the wall ────────── */
export function ImageGallery({ home }: { home: HomeStrings }) {
  const photos = [
    { src: cloak, alt: home.cloakAlt, label: 'Al-Muraqqaʿa' },
    { src: hadra, alt: home.hadraAlt, label: 'Al-Ḥaḍra' },
    { src: zawiya, alt: home.zawiyaAlt, label: 'Al-Zāwiya' },
  ] as const;
  return (
    <ScrollReveal className="pt-14">
      <ScrollRevealItem>
        <div className="flex items-baseline gap-3 mb-7">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.galleryLabel}</p>
        </div>
      </ScrollRevealItem>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {photos.map((p) => (
          <ScrollRevealItem key={p.label}>
            <figure className="m-0">
              <div className="kk-veil-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-fd-border">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  placeholder="blur"
                  className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                  sizes="(max-width: 640px) 33vw, 220px"
                />
                <span className="kk-veil" aria-hidden />
              </div>
              <figcaption className="kk-arabic text-center text-sm mt-2" style={{ color: 'var(--kk-gold-ink)' }}>
                {p.label}
              </figcaption>
            </figure>
          </ScrollRevealItem>
        ))}
        {/* The refraction realized in the world — the painted zāwiya wall */}
        <ScrollRevealItem className="col-span-3">
          <figure className="m-0">
            <Parallax range={16}>
              <div className="kk-veil-lift relative aspect-[16/7] overflow-hidden rounded-xl border border-fd-border">
                <Image
                  src={zawiyaWall}
                  alt={home.wallAlt}
                  fill
                  placeholder="blur"
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 704px"
                />
                <span className="kk-veil" aria-hidden />
              </div>
            </Parallax>
            <figcaption className="kk-arabic text-center text-sm mt-2" style={{ color: 'var(--kk-gold-ink)' }}>
              {home.wallLabel}
            </figcaption>
          </figure>
        </ScrollRevealItem>
      </div>
    </ScrollReveal>
  );
}

/* ── The living guide (mist — the threshold of the light) ───────────────── */
// Environmental light only: the room is lit, the person is not haloed.
export function FeatureSplit({ home }: { home: HomeStrings }) {
  return (
    <ScrollReveal className="pt-20">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_3fr] gap-8 items-center">
        <ScrollRevealItem>
          <div className="kk-niche relative aspect-[3/4] max-w-[300px] mx-auto">
            <Image
              src={shaykh}
              alt={home.shaykhAlt}
              fill
              placeholder="blur"
              className="object-cover"
              sizes="(max-width: 640px) 80vw, 300px"
            />
            {/* light falling into the room from above, not from the figure */}
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.16), transparent 55%)' }}
            />
          </div>
        </ScrollRevealItem>
        <div className="text-center sm:text-start">
          <ScrollRevealItem>
            <p className="kk-label mb-3" style={{ color: 'var(--kk-gold-ink)' }}>
              {home.guideLabel}
            </p>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <p className="text-2xl sm:text-3xl font-light mb-4 text-balance">{home.guideName}</p>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <p className="text-base leading-relaxed text-fd-muted-foreground max-w-md mx-auto sm:mx-0">
              {home.guideLine}
            </p>
          </ScrollRevealItem>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── "Start here" featured card ─────────────────────────────────────────── */
export function FeaturedCard({ home, title, href, description }: { home: HomeStrings; title: string; href: string; description: string }) {
  return (
    <ScrollReveal className="pt-14">
      <ScrollRevealItem>
        <Link
          href={href}
          className="kk-stitch-b kk-halo-hover flex items-center gap-6 no-underline rounded-2xl px-7 py-6 transition-transform hover:-translate-y-0.5"
          style={{ border: '1px solid var(--kk-gold)', background: 'var(--kk-soft)' }}
        >
          <span className="kk-arabic text-5xl leading-none shrink-0" style={{ color: 'var(--kk-gold)' }} aria-hidden>
            ۞
          </span>
          <span className="flex-1">
            <span className="block kk-label mb-2" style={{ color: 'var(--kk-gold-ink)' }}>
              {home.startHereLabel}
            </span>
            <span className="block text-xl font-medium text-fd-foreground mb-1">{title}</span>
            <span className="block text-sm leading-relaxed text-fd-muted-foreground">{description}</span>
          </span>
          <span className="text-2xl shrink-0" style={{ color: 'var(--kk-gold)' }}>
            →
          </span>
        </Link>
      </ScrollRevealItem>
    </ScrollReveal>
  );
}

/* ── Ways in — an index of doors, not a grid of cards ───────────────────── */
// Structure only — titles, tags, and descriptions come from lib/locale.ts.
// Each destination is one large serif line that rolls to gold on hover
// (FlipLink); the Arabic name and one-line gloss ride the same rule. Reads
// like a book's table of contents — which is what a knowledge base's "ways
// in" actually is.
const PATHWAYS = [
  { key: 'dictionary', arabic: 'القاموس', hue: 3, href: '/dictionary' },
  { key: 'foundations', arabic: 'الأركان', hue: 6, href: '/foundations' },
  { key: 'articles', arabic: 'الدروس', hue: 9, href: '/articles' },
  { key: 'books', arabic: 'الكتب', hue: 12, href: '/books' },
  { key: 'podcasts', arabic: 'التسجيلات', hue: 5, href: '/podcasts' },
  { key: 'history', arabic: 'السلسلة', hue: 2, href: '/history' },
] as const;

export function NavCardGrid({ home }: { home: HomeStrings }) {
  const pathways = PATHWAYS.map((p) => ({ ...p, ...home.pathways[p.key] }));
  return (
    <ScrollReveal className="pt-14">
      <ScrollRevealItem>
        <div className="flex items-baseline gap-3 mb-7">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.waysInLabel}</p>
          <span className="text-sm italic text-fd-muted-foreground">{home.waysInHint}</span>
        </div>
      </ScrollRevealItem>
      <div className="border-y border-fd-border">
        {pathways.map((p) => (
          <ScrollRevealItem key={p.href}>
            <div className="group flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-fd-border py-5 last:border-b-0 sm:flex-nowrap">
              <span
                aria-hidden
                className="hidden h-2.5 w-2.5 shrink-0 self-center rounded-[3px] sm:block"
                style={{ background: `var(--kk-patch-${p.hue})` }}
              />
              <FlipLink
                href={p.href}
                className="text-3xl font-light text-fd-foreground sm:text-4xl lg:text-5xl"
              >
                {p.title}
              </FlipLink>
              <span dir="rtl" lang="ar" className="kk-arabic text-lg" style={{ color: 'var(--kk-gold-ink)' }}>
                {p.arabic}
              </span>
              <span className="ms-auto hidden max-w-[22rem] shrink-0 text-right text-sm leading-relaxed text-fd-muted-foreground md:block">
                <span className="kk-label !text-[10px] block opacity-70">{p.tag}</span>
                {p.description}
              </span>
            </div>
          </ScrollRevealItem>
        ))}
      </div>
    </ScrollReveal>
  );
}

/* ── Recently inscribed ─────────────────────────────────────────────────── */
export function RecentNotes({ home, items, locale }: { home: HomeStrings; items: RecentItem[]; locale: string }) {
  if (items.length === 0) return null;
  return (
    <ScrollReveal className="pt-14">
      <ScrollRevealItem>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.recentLabel}</p>
        </div>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <div className="flex flex-col">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-baseline justify-between gap-4 py-3.5 px-1 border-b border-fd-border no-underline group transition-[padding] hover:pl-2"
            >
              <span className="text-[15px] text-fd-foreground group-hover:text-fd-primary transition-colors truncate">
                {n.title}
              </span>
              <span className="kk-label !tracking-normal !text-[11px] whitespace-nowrap shrink-0">
                <RelativeTime iso={n.modified} locale={locale} />
              </span>
            </Link>
          ))}
        </div>
      </ScrollRevealItem>
    </ScrollReveal>
  );
}

/* ── Key terms (dictionary pills) ───────────────────────────────────────── */
export function KeyTerms({ home, items }: { home: HomeStrings; items: LinkItem[] }) {
  if (items.length === 0) return null;
  return (
    <ScrollReveal className="pt-14">
      <ScrollRevealItem>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.keyTermsLabel}</p>
        </div>
      </ScrollRevealItem>
      <ScrollRevealItem>
        <div className="flex flex-wrap gap-2">
          {items.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 no-underline text-[13px] text-fd-foreground border border-fd-border transition-colors hover:border-[color:var(--kk-gold)] hover:bg-[color:var(--kk-soft)]"
            >
              {t.title}
            </Link>
          ))}
          <Link
            href="/dictionary"
            className="inline-flex items-center px-2 py-1.5 no-underline text-[13px] text-fd-muted-foreground/70 hover:text-fd-muted-foreground transition-colors"
          >
            {home.moreLabel}
          </Link>
        </div>
      </ScrollRevealItem>
    </ScrollReveal>
  );
}
