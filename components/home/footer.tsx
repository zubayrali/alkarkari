// Server component — the footer: the return to night with the lamp lit.
// The cloak's hem (glowing patchwork band) tops a constant night panel; the
// calligraphy logo carries a small halo (an object of light, never a person),
// and the closing line is "light upon light".

import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal, ScrollRevealItem } from './reveal';
import { PatchworkBand } from './patchwork';
import { FooterCloth } from './footer-cloth';
import type { HomeStrings } from '@/lib/locale';
import logo from './images/logo.png';

export function Footer({ home }: { home: HomeStrings }) {
  return (
    <footer className="kk-night-panel kk-gridlines mt-24 px-7 pt-14 pb-0 text-center" style={{ borderRadius: '24px 24px 0 0' }}>
      <ScrollReveal as="div" className="relative z-[2] flex flex-col items-center">
        <ScrollRevealItem>
          <div className="w-full max-w-[460px] mb-12">
            <PatchworkBand variant="glow" />
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem>
          <Image
            src={logo}
            alt="Tariqa Karkariya"
            width={72}
            height={72}
            className="kk-halo mb-6 opacity-90 rounded-full"
            style={{ height: 'auto', filter: 'brightness(1.2)' }}
          />
        </ScrollRevealItem>

        <ScrollRevealItem>
          <p
            dir="rtl"
            lang="ar"
            className="kk-arabic leading-none mb-3"
            style={{ color: 'var(--kk-night-fg)', fontSize: 'clamp(44px, 13vw, 150px)' }}
          >
            الزاوية الكركرية
          </p>
        </ScrollRevealItem>
        <ScrollRevealItem>
          <p className="kk-label mb-9" style={{ color: 'var(--kk-night-muted)' }}>
            {home.footerLine}
          </p>
        </ScrollRevealItem>

        <ScrollRevealItem>
          <p className="kk-arabic text-lg mb-7" dir="rtl" lang="ar" style={{ color: 'var(--kk-night-fg)' }}>
            الحمد لله رب العالمين
          </p>
        </ScrollRevealItem>

        <ScrollRevealItem>
          <div className="flex gap-6 justify-center flex-wrap mb-5">
            {[
              { label: home.footerLinks.dictionary, href: '/dictionary' },
              { label: home.footerLinks.foundations, href: '/foundations' },
              { label: home.footerLinks.graph, href: '/graph' },
              { label: home.footerLinks.tags, href: '/tags' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="kk-label !tracking-[0.08em] no-underline transition-colors hover:!text-[color:var(--kk-gold)]"
                style={{ color: 'var(--kk-night-muted)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem>
          <p className="kk-label !text-[10px]" style={{ color: 'var(--kk-ember)' }}>
            {home.lightUponLight} · <span className="kk-arabic text-xs" dir="rtl" lang="ar">نور على نور</span>
          </p>
        </ScrollRevealItem>
      </ScrollReveal>

      {/* the return of the cloak — the hero's muraqqaʿa surfaces from the night
          to close the page, dyes kindling as you scroll to the end */}
      <div className="relative z-[1] -mx-7 mt-6" aria-hidden>
        <FooterCloth />
      </div>
    </footer>
  );
}
