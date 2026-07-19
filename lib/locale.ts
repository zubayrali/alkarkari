import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import enJson from '@/content-site/en.json';
import frJson from '@/content-site/fr.json';
import cnJson from '@/content-site/cn.json';
import type { SiteStrings } from '@/lib/site-strings';

export type {
  FumadocsStrings,
  HomeStrings,
  MishkatCitation,
  MishkatCitations,
  SiteStrings,
} from '@/lib/site-strings';

const en = enJson satisfies SiteStrings;
const fr = frJson satisfies SiteStrings;
const cn = cnJson satisfies SiteStrings;

function translations(strings: SiteStrings) {
  return defineTranslations()
    .extend(uiTranslations())
    .add('ui', strings.fumadocs);
}

export const siteLanguages = {
  en: {
    label: 'English',
    htmlLang: 'en',
    searchLanguage: 'english',
    ...en,
    translations: translations(en),
  },
  fr: {
    label: 'Français',
    htmlLang: 'fr',
    searchLanguage: 'french',
    ...fr,
    translations: translations(fr),
  },
  cn: {
    label: '简体中文',
    htmlLang: 'zh-CN',
    searchLanguage: 'chinese',
    ...cn,
    translations: translations(cn),
  },
} as const;

export type SiteLanguage = keyof typeof siteLanguages;

function resolveSiteLanguage(): SiteLanguage {
  const language = process.env.SITE_LANGUAGE;
  if (language && language in siteLanguages) {
    return language as SiteLanguage;
  }

  return 'en';
}

export function getSiteLanguage(): (typeof siteLanguages)[SiteLanguage] {
  return siteLanguages[resolveSiteLanguage()];
}
