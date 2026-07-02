// Server components — compose the client animation primitives (Reveal,
// RevealItem, Muraqqaa) with serializable data passed from app/(home)/page.tsx.
// The symbolism of the cloak and the light is shown, never captioned.

import Link from 'next/link';
import Image from 'next/image';
import { Reveal, RevealItem } from './reveal';
import { RelativeTime } from './relative-time';
import type { HomeStrings } from '@/lib/locale';
import cloak from './images/cloak.png';
import hadra from './images/hadra.png';
import zawiya from './images/zawiya.png';

export interface LinkItem {
  title: string;
  href: string;
}
export interface RecentItem extends LinkItem {
  /** ISO date-time, formatted client-side. */
  modified: string;
}

/* ── Intention / bismillah band ─────────────────────────────────────────── */
export function IntentionBand({ home }: { home: HomeStrings }) {
  return (
    <Reveal className="text-center py-24">
      <RevealItem>
        <p dir="rtl" lang="ar" className="kk-arabic text-3xl sm:text-4xl mb-3" style={{ color: 'var(--kk-gold)' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </RevealItem>
      <RevealItem>
        <p className="kk-label mb-11">{home.bismillahGloss}</p>
      </RevealItem>
      <RevealItem>
        <p className="text-2xl sm:text-3xl font-light leading-relaxed max-w-2xl mx-auto mb-6 text-balance">
          {home.intentionLead}
        </p>
      </RevealItem>
      <RevealItem>
        <p className="text-base leading-relaxed max-w-xl mx-auto text-fd-muted-foreground">
          {home.intentionSub}
        </p>
      </RevealItem>
    </Reveal>
  );
}

/* ── Context gallery — the cloak, the ḥaḍra, the zāwiya ──────────────────── */
const PHOTOS = [
  { src: cloak, alt: 'The patched cloak', label: 'Al-Muraqqaʿa', aspect: 'aspect-[3/4]' },
  { src: hadra, alt: 'The ḥaḍra gathering', label: 'Al-Ḥaḍra', aspect: 'aspect-[3/4]' },
  { src: zawiya, alt: 'The zāwiya in Morocco', label: 'Al-Zāwiya', aspect: 'aspect-[3/4]' },
] as const;

export function ContextGallery({ home }: { home: HomeStrings }) {
  return (
    <Reveal className="pt-14">
      <RevealItem>
        <div className="flex items-baseline gap-3 mb-7">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.galleryLabel}</p>
        </div>
      </RevealItem>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {PHOTOS.map((p) => (
          <RevealItem key={p.label}>
            <figure className="m-0">
              <div className={`relative ${p.aspect} overflow-hidden rounded-xl border border-fd-border`}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  placeholder="blur"
                  className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                  sizes="(max-width: 640px) 33vw, 220px"
                />
              </div>
              <figcaption className="kk-arabic text-center text-sm mt-2" style={{ color: 'var(--kk-gold)' }}>
                {p.label}
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </div>
    </Reveal>
  );
}

/* ── "Start here" featured card ─────────────────────────────────────────── */
export function FeaturedCard({ home, title, href, description }: { home: HomeStrings; title: string; href: string; description: string }) {
  return (
    <Reveal className="pt-14">
      <RevealItem>
        <Link
          href={href}
          className="flex items-center gap-6 no-underline rounded-2xl px-7 py-6 transition-transform hover:-translate-y-0.5"
          style={{ border: '1px solid var(--kk-gold)', background: 'var(--kk-soft)' }}
        >
          <span className="kk-arabic text-5xl leading-none shrink-0" style={{ color: 'var(--kk-gold)' }} aria-hidden>
            ۞
          </span>
          <span className="flex-1">
            <span className="block kk-label mb-2" style={{ color: 'var(--kk-gold)' }}>
              {home.startHereLabel}
            </span>
            <span className="block text-xl font-medium text-fd-foreground mb-1">{title}</span>
            <span className="block text-sm leading-relaxed text-fd-muted-foreground">{description}</span>
          </span>
          <span className="text-2xl shrink-0" style={{ color: 'var(--kk-gold)' }}>
            →
          </span>
        </Link>
      </RevealItem>
    </Reveal>
  );
}

/* ── Pathways grid ──────────────────────────────────────────────────────── */
// Structure only — titles, tags, and descriptions come from lib/locale.ts.
const PATHWAYS = [
  { key: 'dictionary', arabic: 'القاموس', hue: 3, href: '/dictionary' },
  { key: 'foundations', arabic: 'الأركان', hue: 6, href: '/foundations' },
  { key: 'articles', arabic: 'الدروس', hue: 9, href: '/articles' },
  { key: 'books', arabic: 'الكتب', hue: 12, href: '/books' },
  { key: 'podcasts', arabic: 'التسجيلات', hue: 5, href: '/podcasts' },
  { key: 'history', arabic: 'السلسلة', hue: 2, href: '/history' },
] as const;

export function PathwaysGrid({ home }: { home: HomeStrings }) {
  const pathways = PATHWAYS.map((p) => ({ ...p, ...home.pathways[p.key] }));
  return (
    <Reveal className="pt-14">
      <RevealItem>
        <div className="flex items-baseline gap-3 mb-7">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.waysInLabel}</p>
          <span className="text-sm italic text-fd-muted-foreground">{home.waysInHint}</span>
        </div>
      </RevealItem>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pathways.map((p) => (
          <RevealItem key={p.href}>
            <Link
              href={p.href}
              className="relative block no-underline overflow-hidden rounded-xl p-5 transition-transform hover:-translate-y-0.5 bg-fd-card border border-fd-border hover:border-[color:var(--kk-gold)] h-full"
            >
              <span className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `var(--kk-patch-${p.hue})` }} />
              <span className="kk-label block mb-3">{p.tag}</span>
              <span className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-lg font-medium text-fd-foreground">{p.title}</span>
                <span className="kk-arabic text-base" style={{ color: 'var(--kk-gold)' }}>
                  {p.arabic}
                </span>
              </span>
              <span className="block text-sm leading-relaxed text-fd-muted-foreground">{p.description}</span>
            </Link>
          </RevealItem>
        ))}
      </div>
    </Reveal>
  );
}

/* ── Recently inscribed ─────────────────────────────────────────────────── */
export function RecentNotes({ home, items, locale }: { home: HomeStrings; items: RecentItem[]; locale: string }) {
  if (items.length === 0) return null;
  return (
    <Reveal className="pt-14">
      <RevealItem>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.recentLabel}</p>
        </div>
      </RevealItem>
      <RevealItem>
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
      </RevealItem>
    </Reveal>
  );
}

/* ── Key terms (dictionary pills) ───────────────────────────────────────── */
export function KeyTerms({ home, items }: { home: HomeStrings; items: LinkItem[] }) {
  if (items.length === 0) return null;
  return (
    <Reveal className="pt-14">
      <RevealItem>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="kk-arabic text-lg leading-none" style={{ color: 'var(--kk-gold)' }}>۞</span>
          <p className="kk-label !text-xs">{home.keyTermsLabel}</p>
        </div>
      </RevealItem>
      <RevealItem>
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
      </RevealItem>
    </Reveal>
  );
}
