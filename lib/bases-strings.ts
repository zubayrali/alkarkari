export interface BasesStrings {
  noResults: string
  showMore: string
  remainingUnit: string
  filterPlaceholder: string
  pageSingular: string
  pagePlural: string
  countOf: string
}

export const DEFAULT_BASES_STRINGS: BasesStrings = {
  noResults: 'No results.',
  showMore: 'Show more',
  remainingUnit: 'remaining',
  filterPlaceholder: 'Filter…',
  pageSingular: 'page',
  pagePlural: 'pages',
  countOf: 'of',
}

export function basesStringsFrom(lang: {
  baseNoResults: string
  baseShowMore: string
  baseRemainingUnit: string
  baseFilterPlaceholder: string
  pageSingular: string
  pagePlural: string
  countOfLabel: string
}): BasesStrings {
  return {
    noResults: lang.baseNoResults,
    showMore: lang.baseShowMore,
    remainingUnit: lang.baseRemainingUnit,
    filterPlaceholder: lang.baseFilterPlaceholder,
    pageSingular: lang.pageSingular,
    pagePlural: lang.pagePlural,
    countOf: lang.countOfLabel,
  }
}
