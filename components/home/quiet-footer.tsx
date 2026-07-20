import Image from 'next/image';
import Link from 'next/link';
import type { HomeStrings } from '@/lib/locale';
import logo from './images/logo.png';
import { FooterCloth } from './footer-cloth';

/** The page closes with the same garment language introduced in Muraqqaʿa. */
export function QuietFooter({ home }: { home: HomeStrings }) {
  const links = [
    { label: home.footerLinks.dictionary, href: '/dictionary' },
    { label: home.pathways.books.title, href: '/books' },
    { label: home.pathways.podcasts.title, href: '/podcasts' },
    { label: home.footerLinks.graph, href: '/graph' },
  ];

  return (
    <footer className="kk-night-panel mt-24 text-center">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-7 py-16 sm:py-20">
        <Image
          src={logo}
          alt={home.translit}
          width={64}
          height={64}
          className="mb-7 rounded-full opacity-90"
          style={{ height: 'auto', filter: 'brightness(1.12)' }}
        />

        <p
          dir="rtl"
          lang="ar"
          className="kk-arabic leading-none"
          style={{ color: 'var(--kk-night-fg)', fontSize: 'clamp(3rem,10vw,8rem)' }}
        >
          الزاوية الكركرية
        </p>
        <p className="kk-label mt-5" style={{ color: 'var(--kk-night-muted)' }}>
          {home.footerLine}
        </p>

        <nav className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-4" aria-label={home.footerLine}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="kk-link-stitch text-sm no-underline"
              style={{ color: 'var(--kk-night-muted)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="kk-label mt-12 !text-[10px]" style={{ color: 'var(--kk-ember)' }}>
          {home.lightUponLight} · <span className="kk-arabic text-xs" dir="rtl" lang="ar">نور على نور</span>
        </p>
      </div>

      <FooterCloth height="clamp(180px, 30vh, 320px)" />
    </footer>
  );
}
