// Generation-side locale resolution. Each locale generates into its own
// committed tree under locales/<locale>/ — the live content/ and public/ dirs
// are gitignored staging copies produced by `pnpm stage` (scripts/stage.ts).

export const DEFAULT_LOCALE = "en";

/** Locale for this generation run: `--locale=xx` (or `--locale xx`) → env → default. */
export function resolveGenerateLocale(argv: string[] = process.argv): string {
  // Catch near-miss flags (--local=fr, --lang=fr…) instead of silently
  // generating the default locale over the wrong tree.
  const typo = argv.find(
    (a) => /^--(local|locales|lang|language)(=|$)/.test(a) && !a.startsWith("--locale"),
  );
  if (typo) {
    console.error(`Unknown flag "${typo}" — did you mean --locale=<code>?`);
    process.exit(1);
  }
  const eq = argv.find((a) => a.startsWith("--locale="));
  if (eq) return eq.slice("--locale=".length);
  const flag = argv.indexOf("--locale");
  if (flag !== -1 && argv[flag + 1]) return argv[flag + 1];
  return process.env.SITE_LANGUAGE || DEFAULT_LOCALE;
}

export const generateLocale = resolveGenerateLocale();

export const localeRoot = `locales/${generateLocale}`;
export const contentDir = `${localeRoot}/content`;
export const publicDir = `${localeRoot}/public`;

/**
 * Suffixed env var for a locale (OBSIDIAN_VAULT_PATH_FR, GENERATE_INCLUDE_FR…).
 * The unsuffixed var is accepted as a fallback for the default locale only, so
 * existing single-vault setups keep working.
 */
export function localeEnv(name: string, locale = generateLocale): string | undefined {
  const suffixed = process.env[`${name}_${locale.toUpperCase()}`];
  if (suffixed) return suffixed;
  if (locale === DEFAULT_LOCALE) return process.env[name];
  return undefined;
}

export function localeEnvName(name: string, locale = generateLocale): string {
  return `${name}_${locale.toUpperCase()}`;
}
