// Server component — the zāwiya footer. The cloak's hem (patchwork band) tops a
// constant oxblood panel; the real ochre calligraphy logo and an oversized but
// restrained Amiri wordmark sit below it. The wordmark is the diabrowser-style
// oversized footer, kept quiet — no glow, no captions.

import Link from 'next/link';
import Image from 'next/image';
import { Reveal, RevealItem } from './reveal';
import { MuraqqaaHem } from './muraqqaa';
import type { HomeStrings } from '@/lib/locale';
import logo from './images/logo.png';

export function ZawiyaFooter({ home }: { home: HomeStrings }) {
  return (
    <footer className="kk-oxblood-panel kk-gridlines mt-24 px-7 pt-14 pb-16 text-center" style={{ borderRadius: '24px 24px 0 0' }}>
      <Reveal as="div" className="relative z-[2] flex flex-col items-center">
        <RevealItem>
          <div className="w-full max-w-[460px] mb-12">
            <MuraqqaaHem />
          </div>
        </RevealItem>

        <RevealItem>
          <Image
            src={logo}
            alt="Tariqa Karkariya"
            width={72}
            height={72}
            className="mb-6 opacity-90"
            style={{ height: 'auto', filter: 'brightness(1.15)' }}
          />
        </RevealItem>

        <RevealItem>
          <p
            dir="rtl"
            lang="ar"
            className="kk-arabic leading-none mb-3"
            style={{ color: 'var(--kk-oxblood-fg)', fontSize: 'clamp(44px, 13vw, 150px)' }}
          >
            الزاوية الكركرية
          </p>
        </RevealItem>
        <RevealItem>
          <p className="kk-label mb-9" style={{ color: 'var(--kk-oxblood-muted)' }}>
            {home.footerLine}
          </p>
        </RevealItem>

        <RevealItem>
          <p className="kk-arabic text-lg mb-7" dir="rtl" lang="ar" style={{ color: 'var(--kk-oxblood-fg)' }}>
            الحمد لله رب العالمين
          </p>
        </RevealItem>

        <RevealItem>
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
                style={{ color: 'var(--kk-oxblood-muted)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </RevealItem>
      </Reveal>
    </footer>
  );
}
