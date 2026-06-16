import Link from 'next/link';
import { ViewTransition } from 'react';
import { source } from '@/lib/source';
import { getSiteLanguage } from '@/lib/locale';

const sections = [
  {
    icon: '📖',
    title: 'Dictionary',
    description: 'Core terms and concepts of the Tariqa Karkariya.',
    href: '/dictionary',
  },
  {
    icon: '📚',
    title: 'Books',
    description: 'Published works by Shaykh Mohamed Faouzi al-Karkari.',
    href: '/books',
  },
  {
    icon: '🎙',
    title: 'Podcasts & Transcripts',
    description: 'Episodes with full searchable transcripts.',
    href: '/podcasts',
  },
  {
    icon: '🕯',
    title: 'Foundations',
    description: "The seven pillars: Wird, Hadra, Muraqqa', Ism al-Mufrad, Siyaha, Khalwa, and Sirr.",
    href: '/foundations',
  },
  {
    icon: '📜',
    title: 'Articles & Teachings',
    description: 'Q&A excerpts, durus, and essay-style writings.',
    href: '/articles',
  },
  {
    icon: '🌿',
    title: 'History',
    description: 'Tariqa origins and initiatic chain from the Prophet to al-Karkari.',
    href: '/history',
  },
] as const;

export default function HomePage() {
  const lang = getSiteLanguage();

  const dictionaryPages = source
    .getPages()
    .filter((p) => p.slugs[0] === 'dictionary' && p.slugs.length > 1)
    .slice(0, 12);

  return (
    <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
      <main className="container max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center pb-10 border-b border-fd-border mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-fd-foreground mb-3">
            Karkari Wiki
          </h1>
          <p className="text-fd-muted-foreground max-w-md mx-auto mb-6 text-sm leading-relaxed">
            {lang.heroTagline}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/dictionary"
              className="bg-fd-foreground text-fd-background px-5 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {lang.heroPrimaryCta}
            </Link>
            <Link
              href="/graph"
              className="border border-fd-border text-fd-muted-foreground px-5 py-2 rounded-md text-sm hover:border-fd-foreground/50 transition-colors"
            >
              {lang.heroSecondaryCta}
            </Link>
          </div>
        </section>

        {/* Dictionary strip */}
        <section className="pb-10 border-b border-fd-border mb-8">
          <p className="text-xs uppercase tracking-widest text-fd-muted-foreground mb-3">
            {lang.dictionaryLabel}
          </p>
          {dictionaryPages.length > 0 ? (
            <div className="flex flex-wrap gap-2 items-center">
              {dictionaryPages.map((page) => (
                <Link
                  key={page.url}
                  href={page.url}
                  className="border border-fd-border text-fd-muted-foreground text-xs px-3 py-1 rounded-full hover:border-fd-foreground/50 transition-colors"
                >
                  {page.data.title}
                </Link>
              ))}
              <Link
                href="/dictionary"
                className="text-xs text-fd-muted-foreground/60 px-2 py-1 hover:text-fd-muted-foreground transition-colors"
              >
                + more →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-fd-muted-foreground/50 italic">
              Add notes to{' '}
              <code className="font-mono text-fd-muted-foreground/70">
                content/dictionary/
              </code>{' '}
              to populate this.
            </p>
          )}
        </section>

        {/* Section cards */}
        <section>
          <p className="text-xs uppercase tracking-widest text-fd-muted-foreground mb-4">
            {lang.exploreLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="border border-fd-border rounded-lg p-4 hover:border-fd-foreground/30 transition-colors group"
              >
                <span className="text-xl mb-2 block">{s.icon}</span>
                <h2 className="text-sm font-semibold text-fd-foreground mb-1 group-hover:text-fd-primary transition-colors">
                  {s.title}
                </h2>
                <p className="text-xs text-fd-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </ViewTransition>
  );
}
