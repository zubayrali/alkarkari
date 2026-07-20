import { describe, expect, it } from 'vitest';
import en from '../content-site/en.json';
import { buildHomePrinciples, HOME_PRINCIPLE_IDS } from '../lib/home-principles';

describe('home principles', () => {
  const principles = buildHomePrinciples(en.home.story.foundations);

  it('keeps the canonical seven-principle order', () => {
    expect(principles.map((principle) => principle.id)).toEqual(HOME_PRINCIPLE_IDS);
  });

  it('gives every threshold a unique fragment identifier', () => {
    const fragmentIds = principles.map((principle) => principle.sectionId);
    expect(new Set(fragmentIds).size).toBe(7);
  });

  it('keeps Muraqqaʿa distinct from Murāqaba', () => {
    const muraqqaa = principles.find((principle) => principle.id === 'muraqqaa');

    expect(muraqqaa).toMatchObject({
      transliteration: 'Muraqqaʿa',
      presentation: 'sewn-field',
      title: 'The Patched Cloak',
      href: null,
    });
    expect(`${muraqqaa?.title} ${muraqqaa?.line}`.toLowerCase()).not.toContain('watchfulness');
  });

  it('does not expose unreviewed foundation destinations', () => {
    expect(principles.every((principle) => principle.href === null)).toBe(true);
  });
});
