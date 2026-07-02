'use client';

// Language switcher for the isolated-builds i18n architecture (see
// docs/superpowers/specs/2026-07-02-i18n-design.md). Styled like fumadocs'
// sidebar-tabs dropdown, but it cannot BE that component: each language is a
// separate static build deployed under /<basePath>/<locale>/, so switching is
// a dumb absolute link to a sibling build — never a router navigation. Plain
// <a> elements are required: next/link would prepend this build's basePath
// and trap the reader inside the current locale.
//
// Client component so it can read the current path (usePathname is basePath-
// less) and keep the reader on the SAME page across languages:
//   /en/dictionary/wird → /fr/dictionary/wird
// Vaults are independent, so the target page may not exist — GitHub Pages
// then serves the root 404.html, which offers that locale's home.
//
// In local dev (`pnpm dev`) sibling builds don't exist, so other locales
// render disabled with a hint — preview real switching with
// `pnpm build:all && npx serve site`.

import { usePathname } from 'next/navigation';
import { Check, ChevronsUpDown, Languages } from 'lucide-react';
import { LOCALES, currentLocale, getLocaleEntry } from '@/lib/locales-manifest';

const itemBase = 'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm';

export function LocaleSwitcher({ variant = 'nav' }: { variant?: 'nav' | 'sidebar' }) {
  const pathname = usePathname() || '/';
  const locale = currentLocale();
  const entry = getLocaleEntry(locale);
  if (LOCALES.length < 2) return null;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Deployed builds live at <parent>/<locale>; siblings are <parent>/<other>.
  const deployed = basePath.endsWith(`/${locale}`);
  const parent = deployed ? basePath.slice(0, -(locale.length + 1)) : '';

  return (
    <details
      className={`group relative ${variant === 'sidebar' ? 'w-full' : ''}`}
      dir="ltr"
    >
      <summary
        className={`flex cursor-pointer list-none items-center gap-2.5 rounded-xl border border-fd-border bg-fd-card px-3 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent [&::-webkit-details-marker]:hidden ${
          variant === 'sidebar' ? 'w-full' : ''
        }`}
      >
        <Languages className="size-4 text-fd-muted-foreground" aria-hidden />
        <span className="flex-1 text-start">{entry.label}</span>
        <ChevronsUpDown className="size-3.5 text-fd-muted-foreground" aria-hidden />
      </summary>

      <div className="absolute inset-x-0 z-50 mt-1.5 min-w-44 rounded-xl border border-fd-border bg-fd-popover p-1 shadow-lg">
        {LOCALES.map((l) => {
          if (l.code === locale) {
            return (
              <div key={l.code} className={`${itemBase} text-fd-foreground`}>
                <span className="flex-1">
                  {l.label}
                  <span className="ms-2 text-xs uppercase tracking-wider text-fd-muted-foreground">
                    {l.code}
                  </span>
                </span>
                <Check className="size-4 text-fd-primary" aria-hidden />
              </div>
            );
          }
          if (!deployed) {
            return (
              <div key={l.code} className={`${itemBase} text-fd-muted-foreground opacity-60`}>
                <span className="flex-1">
                  {l.label}
                  <span className="ms-2 text-xs uppercase tracking-wider">{l.code}</span>
                </span>
              </div>
            );
          }
          return (
            <a
              key={l.code}
              // Same page, other language. If that vault lacks the page, the
              // root 404.html catches it and offers the locale's home.
              href={`${parent}/${l.code}${pathname}`}
              hrefLang={l.code}
              className={`${itemBase} text-fd-foreground no-underline transition-colors hover:bg-fd-accent`}
            >
              <span className="flex-1">
                {l.label}
                <span className="ms-2 text-xs uppercase tracking-wider text-fd-muted-foreground">
                  {l.code}
                </span>
              </span>
            </a>
          );
        })}
        {!deployed && (
          <p className="px-2.5 py-2 text-xs leading-relaxed text-fd-muted-foreground">
            Each language is its own build — switching works on the deployed
            site. Preview locally: <code>pnpm build:all</code> then{' '}
            <code>npx serve site</code>.
          </p>
        )}
      </div>
    </details>
  );
}
