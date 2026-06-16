import { source } from './source';

type Page = (typeof source)['$inferPage'];

let noteMap: Map<string, Page> | undefined;

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function key(value: string): string {
  return decode(value).trim().toLowerCase();
}

/**
 * Name → page index for note transclusion. Obsidian wikilinks target notes by
 * name (title, filename stem, or alias), never by path, so we key on all three.
 * Real titles/stems win over aliases; first writer wins collisions.
 */
function getNoteMap(): Map<string, Page> {
  if (noteMap) return noteMap;

  const map = new Map<string, Page>();
  const add = (k: string, page: Page) => {
    const normalized = key(k);
    if (normalized && !map.has(normalized)) map.set(normalized, page);
  };

  // Two passes so aliases never shadow a real title/stem.
  const pages = source.getPages();
  for (const page of pages) {
    const stem = page.slugs[page.slugs.length - 1];
    if (stem) add(stem, page);
    if (page.data.title) add(page.data.title, page);
  }
  for (const page of pages) {
    for (const alias of page.data.aliases ?? []) add(alias, page);
  }

  noteMap = map;
  return map;
}

/** Resolve a raw wikilink target to a page for transclusion, or undefined. */
export function resolveNoteTarget(target: string): Page | undefined {
  return getNoteMap().get(key(target));
}

/** GitHub-style heading slug, matching fumadocs' anchor ids for `#Section` links. */
export function slugifySection(section: string): string {
  return decode(section)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}
