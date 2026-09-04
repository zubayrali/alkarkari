import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import enJson from '@/content-site/en.json';
import frJson from '@/content-site/fr.json';
import cnJson from '@/content-site/cn.json';
import localeConfig from '@/affine/locales.config.json' with { type: 'json' };
import { DEFAULT_LOCALE, getLocaleEntry } from '@/lib/locales-manifest';
import type { SiteStrings } from '@/lib/site-strings';

export type {
  FumadocsStrings,
  HomeStrings,
  MishkatCitation,
  MishkatCitations,
  SiteStrings,
} from '@/lib/site-strings';

const bundledStrings: Record<string, SiteStrings> = {
  en: enJson satisfies SiteStrings,
  fr: frJson satisfies SiteStrings,
  cn: cnJson satisfies SiteStrings,
};

function translations(strings: SiteStrings) {
  return defineTranslations()
    .extend(uiTranslations())
    .add('ui', strings.fumadocs);
}

export interface SiteLanguage extends SiteStrings {
  label: string;
  htmlLang: string;
  searchLanguage: string;
  translations: ReturnType<typeof translations>;
}

const english = bundledStrings.en;

export const siteLanguages: Record<string, SiteLanguage> = Object.fromEntries(
  localeConfig.locales.map((locale) => {
    const strings = bundledStrings[locale.code] ?? english;
    return [locale.code, {
      ...strings,
      // A locale may begin publishing from AFFiNE before its application UI
      // bundle is complete. Preserve its identity while untranslated interface
      // copy falls back to English.
      locale: locale.code,
      label: locale.label,
      htmlLang: locale.languageTag || locale.code,
      searchLanguage: locale.searchLanguage || 'english',
      translations: translations(strings),
    }];
  }),
);

function resolveSiteLanguage(): string {
  const language = process.env.SITE_LANGUAGE;
  if (language && language in siteLanguages) {
    return language;
  }
  return DEFAULT_LOCALE;
}

export function getSiteLanguage(): SiteLanguage {
  const locale = resolveSiteLanguage();
  const configured = siteLanguages[locale];
  if (configured) return configured;

  const entry = getLocaleEntry(locale);
  return {
    ...english,
    locale,
    label: entry.label,
    htmlLang: entry.languageTag,
    searchLanguage: 'english',
    translations: translations(english),
  };
}
