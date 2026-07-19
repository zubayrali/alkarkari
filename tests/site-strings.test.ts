import { describe, expect, it } from 'vitest';
import en from '../content-site/en.json';
import fr from '../content-site/fr.json';
import cn from '../content-site/cn.json';
import type { SiteStrings } from '../lib/site-strings';

const localeDocuments: SiteStrings[] = [en, fr, cn];

function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return ['array', value.length > 0 ? shapeOf(value[0]) : 'empty'];
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

describe('site strings', () => {
  it('keeps every locale on the canonical schema', () => {
    const canonicalShape = shapeOf(en);
    for (const document of localeDocuments) {
      expect(shapeOf(document)).toEqual(canonicalShape);
    }
  });

  it('keeps locale slugs aligned with their files', () => {
    expect(localeDocuments.map((document) => document.locale)).toEqual(['en', 'fr', 'cn']);
  });

  it('provides all fifteen Mishkat citations in every locale', () => {
    for (const document of localeDocuments) {
      const decks = document.home.story.mishkatCitations;
      expect(decks.quran).toHaveLength(5);
      expect(decks.hadith).toHaveLength(5);
      expect(decks.khabar).toHaveLength(5);
    }
  });
});
