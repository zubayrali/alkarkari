import Link from "next/link";
import type { CSSProperties } from "react";
import type { AffineHomepageSnapshot } from "@/lib/affine/types";
import type { HomeStrings } from "@/lib/site-strings";
import { RelativeTime } from "./relative-time";

const PATHS = [
  { key: "dictionary", arabic: "القاموس", href: "/dictionary", patch: 3 },
  { key: "foundations", arabic: "الأركان", href: "/foundations", patch: 6 },
  { key: "articles", arabic: "الدروس", href: "/articles", patch: 9 },
  { key: "books", arabic: "الكتب", href: "/books", patch: 12 },
  { key: "podcasts", arabic: "التسجيلات", href: "/podcasts", patch: 5 },
  { key: "history", arabic: "السلسلة", href: "/history", patch: 2 },
] as const;

export function HomeKnowledgeIndex({
  home,
  homepage,
  locale,
}: {
  home: HomeStrings;
  homepage?: AffineHomepageSnapshot;
  locale: string;
}) {
  const featured = homepage?.featured[0] ?? homepage?.startHere;
  const recent = homepage?.recent ?? [];
  const keyTerms = homepage?.keyTerms ?? [];

  return (
    <section id="explore" className="kk-home-index" aria-labelledby="home-index-title">
      <div className="kk-home-index-register" aria-hidden>
        {PATHS.map((path) => <span key={path.key} style={{ background: `var(--kk-patch-${path.patch})` }} />)}
      </div>

      <div className="kk-home-index-shell">
        <header className="kk-home-index-header">
          <div>
            <p className="kk-label">{home.waysInHint}</p>
            <h2 id="home-index-title">{home.waysInLabel}</h2>
          </div>
          <p>{home.intentionSub}</p>
        </header>

        <div className="kk-home-index-main">
          <article className="kk-home-feature">
            <p className="kk-label">{home.startHereLabel}</p>
            <span className="kk-home-feature-mark kk-arabic" lang="ar" dir="rtl" aria-hidden>اقرأ</span>
            <h3>{featured?.title ?? home.featuredFallbackTitle}</h3>
            <p>{featured?.description ?? home.featuredFallbackDescription}</p>
            <Link href={featured?.href ?? "/start-here"}>
              {home.moreLabel} <span aria-hidden>↗</span>
            </Link>
          </article>

          <nav className="kk-home-paths" aria-label={home.waysInLabel}>
            {PATHS.map((path) => {
              const copy = home.pathways[path.key];
              return (
                <Link key={path.key} href={path.href} style={{ "--kk-path-color": `var(--kk-patch-${path.patch})` } as CSSProperties}>
                  <span className="kk-home-path-rule" aria-hidden />
                  <span><strong>{copy.title}</strong><small>{copy.tag}</small></span>
                  <span className="kk-arabic" lang="ar" dir="rtl">{path.arabic}</span>
                  <span aria-hidden>→</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {(recent.length > 0 || keyTerms.length > 0) && (
          <div className="kk-home-index-lower">
            {recent.length > 0 && (
              <section aria-labelledby="home-recent-title">
                <div className="kk-home-index-subhead">
                  <h3 id="home-recent-title">{home.recentLabel}</h3>
                  <Link href="/articles">{home.moreLabel} →</Link>
                </div>
                <ol className="kk-home-recent">
                  {recent.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href}><span>{item.title}</span><RelativeTime iso={item.modified!} locale={locale} /></Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {keyTerms.length > 0 && (
              <section aria-labelledby="home-terms-title">
                <div className="kk-home-index-subhead">
                  <h3 id="home-terms-title">{home.keyTermsLabel}</h3>
                  <Link href="/dictionary">{home.moreLabel} →</Link>
                </div>
                <div className="kk-home-terms">
                  {keyTerms.map((term, index) => (
                    <Link key={term.id} href={term.href}>
                      <span>{String(index + 1).padStart(2, "0")}</span>{term.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
