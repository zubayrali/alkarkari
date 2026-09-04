'use client';

// Language switcher for isolated AFFiNE locale builds. Styled like fumadocs'
// sidebar-tabs dropdown, but it cannot BE that component: each language is a
// separate static build deployed under /<basePath>/<locale>/, so switching is
// a dumb absolute link to a sibling build — never a router navigation. Plain
// <a> elements are required: next/link would prepend this build's basePath
// and trap the reader inside the current locale.
//
// Client component so it can read the current path (usePathname is basePath-
// less) and keep the reader on the SAME page across languages:
//   /en/dictionary/wird → /fr/dictionary/wird
// A generated translation index maps stable AFFiNE Translation Keys to each
// language's localized slug. Missing translations fall back to the same path.
//
// In local dev (`pnpm dev`) sibling builds don't exist, so other locales
// render disabled with a hint — preview real switching with
// `pnpm build:all && npx serve site`.

import { usePathname } from 'next/navigation';
import { Check, ChevronsUpDown, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LOCALES, currentLocale, getLocaleEntry } from '@/lib/locales-manifest';

const itemBase =
  'flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-start';

interface TranslationIndex {
  routes: Record<string, Record<string, string>>;
  translations: Record<string, Record<string, string>>;
}

export function LocaleSwitcher({ variant = 'nav' }: { variant?: 'nav' | 'sidebar' }) {
  const pathname = usePathname() || '/';
  const locale = currentLocale();
  const entry = getLocaleEntry(locale);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Deployed builds live at <parent>/<locale>; siblings are <parent>/<other>.
  const deployed = basePath.endsWith(`/${locale}`);
  const parent = deployed ? basePath.slice(0, -(locale.length + 1)) : '';
  const [translationIndex, setTranslationIndex] = useState<TranslationIndex>();
  const [switchingTo, setSwitchingTo] = useState<string>();
  const [switchError, setSwitchError] = useState<string>();
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${basePath}/affine-translations.json`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<TranslationIndex> : undefined)
      .then((index) => { if (index) setTranslationIndex(index); })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn('Could not load AFFiNE translation routes.');
      });
    return () => controller.abort();
  }, [basePath, deployed]);

  const translationKey = translationIndex?.routes[locale]?.[normalizedPath];
  const translatedPath = (targetLocale: string) =>
    (translationKey && translationIndex?.translations[translationKey]?.[targetLocale])
      || normalizedPath;

  async function switchLocalCollection(targetLocale: string) {
    setSwitchError(undefined);
    setSwitchingTo(targetLocale);

    try {
      const response = await fetch('/api/dev-locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: targetLocale }),
      });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error || 'Could not switch language.');
      }

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const status = await fetch('/api/dev-locale', { cache: 'no-store' });
          if (status.ok) {
            const body = await status.json() as { locale?: string };
            if (body.locale === targetLocale) {
              window.location.assign(translatedPath(targetLocale));
              return;
            }
          }
        } catch {
          // The local Next server is expected to be briefly unavailable.
        }
      }
      throw new Error('The collection switch timed out. Restart pnpm dev and try again.');
    } catch (error) {
      setSwitchingTo(undefined);
      setSwitchError(error instanceof Error ? error.message : 'Could not switch language.');
    }
  }

  if (LOCALES.length < 2) return null;

  return (
    <details
      className={`group relative ${variant === 'sidebar' ? 'w-full' : ''}`}
      dir="ltr"
    >
      <summary
        aria-label={`Choose language. Current language: ${entry.label}`}
        className={`flex cursor-pointer list-none items-center gap-2.5 rounded-xl border border-fd-border bg-fd-card px-3 py-2.5 text-sm font-medium text-fd-foreground outline-none transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring [&::-webkit-details-marker]:hidden ${
          variant === 'sidebar' ? 'w-full' : ''
        }`}
      >
        <Languages className="size-4 text-fd-muted-foreground" aria-hidden />
        <span className="flex-1 text-start">{entry.label}</span>
        <ChevronsUpDown className="size-3.5 text-fd-muted-foreground" aria-hidden />
      </summary>

      <div
        className={`absolute z-50 w-56 rounded-xl border border-fd-border bg-fd-popover p-1.5 text-fd-popover-foreground shadow-xl ${
          variant === 'sidebar'
            ? 'inset-x-0 bottom-full mb-1.5'
            : 'end-0 top-full mt-1.5'
        }`}
        aria-label="Languages"
      >
        {LOCALES.map((l) => {
          if (l.code === locale) {
            return (
              <div key={l.code} className={`${itemBase} bg-fd-accent text-fd-foreground`}>
                <span className="min-w-0 flex-1 truncate font-medium">{l.label}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-fd-muted-foreground">
                  {l.code}
                </span>
                <Check className="size-4 text-fd-primary" aria-hidden />
              </div>
            );
          }
          if (!deployed) {
            return (
              <button
                key={l.code}
                type="button"
                disabled={Boolean(switchingTo)}
                onClick={() => void switchLocalCollection(l.code)}
                className={`${itemBase} text-fd-foreground transition-colors hover:bg-fd-accent disabled:cursor-wait disabled:opacity-55`}
              >
                <span className="min-w-0 flex-1 truncate">{l.label}</span>
                <span className="text-[11px] uppercase tracking-[0.14em]">{l.code}</span>
              </button>
            );
          }
          return (
            <a
              key={l.code}
              // Prefer the translated AFFiNE page; otherwise retain the path.
              href={`${parent}/${l.code}${
                translatedPath(l.code)
              }`}
              hrefLang={l.languageTag}
              className={`${itemBase} text-fd-foreground no-underline transition-colors hover:bg-fd-accent`}
            >
                <span className="min-w-0 flex-1 truncate">{l.label}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-fd-muted-foreground">
                  {l.code}
                </span>
              </a>
          );
        })}
        {switchingTo && (
          <p className="border-t border-fd-border px-3 pb-1 pt-2 text-[11px] leading-4 text-fd-muted-foreground">
            Switching language…
          </p>
        )}
        {switchError && (
          <p className="border-t border-fd-border px-3 pb-1 pt-2 text-[11px] leading-4 text-red-500">
            {switchError}
          </p>
        )}
      </div>
    </details>
  );
}
