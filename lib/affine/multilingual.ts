import type { AffineSnapshotManifest } from "./types";

export interface AffineLocaleConfig {
  code: string;
  label: string;
  languageTag?: string;
  dir?: "ltr" | "rtl";
  searchLanguage?: string;
  tag: string;
  collection: string;
  sourceEnv?: string;
  import?: boolean;
}

export interface AffineLocalesConfig {
  locales: AffineLocaleConfig[];
  translations?: Record<string, Record<string, string>>;
}

export interface AffineTranslationIndex {
  generatedAt: string;
  locales: Array<{ code: string; label: string; languageTag?: string }>;
  routes: Record<string, Record<string, string>>;
  translations: Record<string, Record<string, string>>;
}

export function languageAlternatesForRoute(
  index: AffineTranslationIndex,
  locale: string,
  route: string,
  buildBasePath: string,
): Record<string, string> | undefined {
  const normalizedRoute = route === "/" ? "/" : `/${normalizePublicationSlug(route)}`;
  const key = index.routes[locale]?.[normalizedRoute];
  if (!key) return undefined;
  const localized = index.translations[key];
  if (!localized) return undefined;

  const localeSuffix = `/${locale}`;
  const parentBasePath = buildBasePath.endsWith(localeSuffix)
    ? buildBasePath.slice(0, -localeSuffix.length)
    : buildBasePath;
  const alternates = Object.fromEntries(
    Object.entries(localized).map(([code, localizedRoute]) => [
      index.locales.find((entry) => entry.code === code)?.languageTag ?? code,
      `${parentBasePath}/${code}${localizedRoute}`,
    ]),
  );
  const defaultLocale = index.locales[0]?.code;
  const defaultLanguageTag = index.locales[0]?.languageTag ?? defaultLocale;
  if (defaultLanguageTag && alternates[defaultLanguageTag]) {
    alternates["x-default"] = alternates[defaultLanguageTag];
  }
  return Object.keys(alternates).length > 1 ? alternates : undefined;
}

export function normalizePublicationSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, "").replace(/\/index$/, "");
}

export function translationKeyFor(
  config: AffineLocalesConfig,
  locale: string,
  slug: string,
): string {
  const normalized = normalizePublicationSlug(slug);
  for (const [key, localized] of Object.entries(config.translations ?? {})) {
    if (normalizePublicationSlug(localized[locale] ?? "") === normalized) return key;
  }
  return normalized;
}

export function buildTranslationIndex(
  config: AffineLocalesConfig,
  manifests: AffineSnapshotManifest[],
): AffineTranslationIndex {
  const routes: Record<string, Record<string, string>> = {};
  const translations: Record<string, Record<string, string>> = {};
  for (const manifest of manifests) {
    const localeRoutes = routes[manifest.locale] ?? {};
    routes[manifest.locale] = localeRoutes;
    for (const page of manifest.pages) {
      const route = `/${normalizePublicationSlug(page.slug)}`;
      const key = page.translationKey?.trim() || translationKeyFor(config, manifest.locale, page.slug);
      localeRoutes[route] = key;
      (translations[key] ??= {})[manifest.locale] = route;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    locales: config.locales.map(({ code, label, languageTag }) => ({ code, label, languageTag })),
    routes,
    translations,
  };
}
