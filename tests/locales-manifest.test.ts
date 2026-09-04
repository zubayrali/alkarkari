import { describe, expect, it } from 'vitest';
import localeConfig from '../affine/locales.config.json';
import { DEFAULT_LOCALE, LOCALES, getLocaleEntry } from '../lib/locales-manifest';

describe('locale registry', () => {
  it('projects the canonical AFFiNE config into the runtime manifest', () => {
    expect(LOCALES.map(locale => locale.code)).toEqual(
      localeConfig.locales.map(locale => locale.code),
    );
    expect(DEFAULT_LOCALE).toBe(localeConfig.locales[0]?.code);
  });

  it('carries reader-facing language metadata from the canonical config', () => {
    for (const configured of localeConfig.locales) {
      expect(getLocaleEntry(configured.code)).toMatchObject({
        code: configured.code,
        label: configured.label,
        languageTag: configured.languageTag,
        dir: configured.dir,
      });
    }
  });
});
