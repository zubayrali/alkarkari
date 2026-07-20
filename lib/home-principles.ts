import type { HomeStrings } from '@/lib/site-strings';

export const HOME_PRINCIPLE_IDS = [
  'subha',
  'siyaha',
  'hadra',
  'muraqqaa',
  'ism',
  'khalwa',
  'sirr',
] as const;

export type HomePrincipleId = (typeof HOME_PRINCIPLE_IDS)[number];

export type HomePrinciplePresentation =
  | 'counted-remembrance'
  | 'open-road'
  | 'gathered-rhythm'
  | 'sewn-field'
  | 'singular-name'
  | 'empty-chamber'
  | 'concealed-close';

type FoundationStrings = HomeStrings['story']['foundations'];

interface PrincipleDefinition {
  id: HomePrincipleId;
  sectionId: `principle-${HomePrincipleId}`;
  transliteration: string;
  presentation: HomePrinciplePresentation;
  href: string | null;
}

const PRINCIPLE_DEFINITIONS = [
  {
    id: 'subha',
    sectionId: 'principle-subha',
    transliteration: 'Subha',
    presentation: 'counted-remembrance',
    href: null,
  },
  {
    id: 'siyaha',
    sectionId: 'principle-siyaha',
    transliteration: 'Siyaha',
    presentation: 'open-road',
    href: null,
  },
  {
    id: 'hadra',
    sectionId: 'principle-hadra',
    transliteration: 'Hadra',
    presentation: 'gathered-rhythm',
    href: null,
  },
  {
    id: 'muraqqaa',
    sectionId: 'principle-muraqqaa',
    transliteration: 'Muraqqaʿa',
    presentation: 'sewn-field',
    href: null,
  },
  {
    id: 'ism',
    sectionId: 'principle-ism',
    transliteration: 'Ism',
    presentation: 'singular-name',
    href: null,
  },
  {
    id: 'khalwa',
    sectionId: 'principle-khalwa',
    transliteration: 'Khalwa',
    presentation: 'empty-chamber',
    href: null,
  },
  {
    id: 'sirr',
    sectionId: 'principle-sirr',
    transliteration: 'Sirr',
    presentation: 'concealed-close',
    href: null,
  },
] as const satisfies readonly PrincipleDefinition[];

export interface HomePrinciple extends PrincipleDefinition {
  arabic: string;
  title: string;
  line: string;
}

/**
 * Join the canonical, non-translatable sequence to the active locale's copy.
 * Destination links stay absent until the corresponding vault notes are
 * reviewed and their routes are safe to expose.
 */
export function buildHomePrinciples(strings: FoundationStrings): HomePrinciple[] {
  return PRINCIPLE_DEFINITIONS.map((definition) => ({
    ...definition,
    ...strings[definition.id],
  }));
}
