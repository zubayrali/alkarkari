// Browser-safe projection of the canonical publisher configuration. Keeping the
// registry in JSON lets the generator, CI, root chooser, and Next consume the
// same locale list without requiring a React edit for each new language.
import localeConfig from '../affine/locales.config.json' with { type: 'json' };

export interface LocaleEntry {
  /** Locale code — the deploy subpath (/en/), SITE_LANGUAGE value, and affine/<code>/ snapshot. */
  code: string;
  /** Native-language display name, used by the locale switcher and root chooser. */
  label: string;
  /** BCP 47 language tag used by links and SEO metadata. */
  languageTag: string;
  /** Writing direction, applied to <html dir>. */
  dir: 'ltr' | 'rtl';
}

export const DEFAULT_LOCALE = localeConfig.locales[0]?.code ?? 'en';

export const LOCALES: readonly LocaleEntry[] = localeConfig.locales.map((locale) => ({
  code: locale.code,
  label: locale.label,
  languageTag: locale.languageTag || locale.code,
  dir: locale.dir === 'rtl' ? 'rtl' : 'ltr',
}));

export function getLocaleEntry(code: string): LocaleEntry {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** The locale this build is compiled for (SITE_LANGUAGE, inlined client+server). */
export function currentLocale(): string {
  return process.env.NEXT_PUBLIC_SITE_LANGUAGE || process.env.SITE_LANGUAGE || DEFAULT_LOCALE;
}
