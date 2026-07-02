// The single source of truth for which locales exist. Each locale is a fully
// isolated static build (see docs/superpowers/specs/2026-07-02-i18n-design.md):
// one Obsidian vault, one `locales/<locale>/` committed tree, one deploy
// subpath. Adding a locale = one entry here + strings in lib/locale.ts + a
// vault. Keep `deploy.yml`'s matrix in sync with this list.

export interface LocaleEntry {
  /** Locale code — the deploy subpath (/en/), SITE_LANGUAGE value, and locales/<code>/ dir. */
  code: string;
  /** Native-language display name, used by the locale switcher and root chooser. */
  label: string;
  /** Writing direction, applied to <html dir>. */
  dir: 'ltr' | 'rtl';
}

export const DEFAULT_LOCALE = 'en';

export const LOCALES: readonly LocaleEntry[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'cn', label: '简体中文', dir: 'ltr' },
] as const;

export function getLocaleEntry(code: string): LocaleEntry {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** The locale this build is compiled for (SITE_LANGUAGE, inlined client+server). */
export function currentLocale(): string {
  return process.env.NEXT_PUBLIC_SITE_LANGUAGE || process.env.SITE_LANGUAGE || DEFAULT_LOCALE;
}
