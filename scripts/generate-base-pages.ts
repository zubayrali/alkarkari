import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import yaml from 'js-yaml';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import type { OutputFile, VaultFile } from 'fumadocs-obsidian';
import { parseBaseConfig, vaultPathToSlug } from '../lib/base-parser.ts';
import { applyFilter, applySort } from '../lib/base-query.ts';
import { normalizeRecordTags } from '../lib/tags.ts';
import type {
  CompiledBase,
  CompiledView,
  FilterNode,
  NoteRecord,
  NotesIndex,
  WikilinkRef,
} from '../lib/base-types.ts';
import type { ProgramIR } from '../lib/base-compiler/index.ts';
import type { StepProgress } from './progress.ts';

const publicDir = 'public';
const contentDir = 'content';

function bytecodeToBase64(bytecode: ProgramIR): string {
  return Buffer.from(JSON.stringify(bytecode)).toString('base64');
}

function readFileContent(content: string | Buffer): string {
  return typeof content === 'string' ? content : content.toString('utf8');
}

function buildNoteRecords(outputs: OutputFile[]): NoteRecord[] {
  const records: NoteRecord[] = [];

  for (const file of outputs) {
    if (file.type !== 'content') continue;
    if (!file.path.endsWith('.mdx')) continue;
    if (file.path === 'index.mdx' || file.path === 'graph.mdx') continue;

    const content = readFileContent(file.content);
    const { data } = frontmatter(content);
    const fm = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;

    const isProtected = fm.protected === true || fm.protected === 'true';

    const slug = '/' + file.path.replace(/\.mdx$/, '');
    const vaultPath = file.path.replace(/\.mdx$/, '.md');
    const folder = vaultPath.includes('/')
      ? vaultPath.split('/').slice(0, -1).join('/')
      : '';

    const title =
      typeof fm.title === 'string' && fm.title.trim()
        ? fm.title.trim()
        : (file.path.split('/').pop()?.replace(/\.mdx$/, '') ?? '');

    const safeFrontmatter: Record<string, unknown> = isProtected
      ? { title: fm.title, description: fm.description, tags: fm.tags }
      : { ...fm };

    records.push({
      slug,
      title,
      path: vaultPath,
      folder,
      tags: normalizeRecordTags(fm.tags),
      protected: isProtected,
      frontmatter: safeFrontmatter,
    });
  }

  return records;
}

const SINGLE_WIKILINK_RE = /^\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]$/;

type LinkIndex = Map<string, NoteRecord[]>;

/** name (stem / title / alias, lowercased) → candidate notes sharing that name. */
function buildLinkIndex(records: NoteRecord[]): LinkIndex {
  const index: LinkIndex = new Map();
  const add = (key: string, record: NoteRecord) => {
    const k = key.trim().toLowerCase();
    if (!k) return;
    const list = index.get(k) ?? [];
    if (!list.includes(record)) list.push(record);
    index.set(k, list);
  };
  for (const r of records) {
    add(r.slug.split('/').pop() ?? '', r);
    add(r.title, r);
    const aliases = r.frontmatter.aliases;
    for (const a of Array.isArray(aliases) ? aliases : []) {
      if (typeof a === 'string') add(a, r);
    }
  }
  return index;
}

/** Mirror Obsidian's disambiguation: same folder first, then exact title, then first. */
function pickCandidate(
  candidates: NoteRecord[],
  sourceFolder: string,
  target: string,
): NoteRecord | undefined {
  if (candidates.length <= 1) return candidates[0];
  const tl = target.toLowerCase();
  return (
    candidates.find((c) => c.folder === sourceFolder) ??
    candidates.find((c) => c.title.toLowerCase() === tl) ??
    candidates[0]
  );
}

/** Resolve a frontmatter value's `[[wikilinks]]` to render tokens, or null if none. */
function resolveWikilinkValue(
  value: unknown,
  index: LinkIndex,
  sourceFolder: string,
): WikilinkRef[] | null {
  const items = Array.isArray(value) ? value : [value];
  if (!items.some((it) => typeof it === 'string' && it.includes('[['))) return null;

  return items.map((item): WikilinkRef => {
    if (typeof item !== 'string') return { text: String(item) };
    const m = item.trim().match(SINGLE_WIKILINK_RE);
    if (!m) return { text: item };
    const target = m[1].trim();
    const hit = pickCandidate(index.get(target.toLowerCase()) ?? [], sourceFolder, target);
    return { text: m[2]?.trim() ?? hit?.title ?? target, href: hit?.slug };
  });
}

function attachWikilinks(records: NoteRecord[], index: LinkIndex): void {
  for (const r of records) {
    let out: Record<string, WikilinkRef[]> | undefined;
    for (const [key, value] of Object.entries(r.frontmatter)) {
      const refs = resolveWikilinkValue(value, index, r.folder);
      if (refs) (out ??= {})[key] = refs;
    }
    if (out) r.wikilinks = out;
  }
}

function extractFolderArgs(filter: FilterNode | undefined): string[] {
  if (filter === undefined) return [];
  if (typeof filter === 'string') {
    const matches = [...filter.matchAll(/file\.inFolder\(\s*["']([^"']+)["']\s*\)/g)];
    return matches.map((m) => m[1]);
  }
  if (typeof filter === 'object' && filter !== null) {
    if ('and' in filter) return filter.and.flatMap(extractFolderArgs);
    if ('or' in filter) return filter.or.flatMap(extractFolderArgs);
    if ('not' in filter) return filter.not.flatMap(extractFolderArgs);
  }
  return [];
}

export async function generateBasePages(
  baseFiles: VaultFile[],
  outputs: OutputFile[],
  include: string[],
  step: StepProgress,
): Promise<NoteRecord[]> {
  const notes = buildNoteRecords(outputs);
  // Pre-resolve wikilink frontmatter so client base views render real links.
  attachWikilinks(notes, buildLinkIndex(notes));

  await fs.mkdir(publicDir, { recursive: true });
  const notesIndex: NotesIndex = { version: 1, notes };
  await fs.writeFile(
    path.join(publicDir, 'notes-index.json'),
    JSON.stringify(notesIndex),
  );

  const includedFolders = new Set(
    include
      .filter((p) => !p.startsWith('!'))
      .map((p) => p.split('/')[0].split('*')[0])
      .filter((p) => Boolean(p) && !p.includes('.')),
  );

  if (baseFiles.length === 0 && includedFolders.size === 0) {
    step.skip('No .base files found');
    return notes;
  }

  step.start(baseFiles.length);

  const explicitFolderIndexes = new Set<string>();

  for (const baseFile of baseFiles) {
    const rawContent = readFileContent(baseFile.content);

    const slug = vaultPathToSlug(baseFile.path);

    const pathSegments = baseFile.path.split('/');
    const baseStem = pathSegments[pathSegments.length - 1].replace(/\.base$/, '');
    const parentVaultFolder =
      pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;
    const isFolderIndex =
      baseStem === 'index' ||
      (parentVaultFolder !== null && baseStem === parentVaultFolder);

    if (isFolderIndex && parentVaultFolder) {
      explicitFolderIndexes.add(parentVaultFolder);
    }

    let content = rawContent;
    if (isFolderIndex && parentVaultFolder) {
      try {
        const parsed = (yaml.load(rawContent) ?? {}) as Record<string, unknown>;
        if (!parsed.filters) {
          parsed.filters = `file.inFolder("${parentVaultFolder}")`;
          content = yaml.dump(parsed);
        }
      } catch {
        // malformed YAML — parseBaseConfig will handle gracefully
      }
    }

    const { config, viewFilters } = parseBaseConfig(content);

    const folders = extractFolderArgs(config.filters);
    for (const view of config.views ?? []) {
      if (view.filters) folders.push(...extractFolderArgs(view.filters));
    }
    for (const folder of folders) {
      const topLevel = folder.split('/')[0];
      if (includedFolders.size > 0 && !includedFolders.has(topLevel)) {
        console.warn(
          `⚠ Base "${baseFile.path}": filter references folder "${topLevel}" which is not in GENERATE_INCLUDE. Results will be empty.`,
        );
      }
    }

    const compiledViews: CompiledView[] = (config.views ?? []).map((view, i) => {
      const filter = viewFilters[i] ?? null;
      const filtered = applyFilter(notes, filter);
      const sorted = applySort(filtered, view.sort ?? []);
      const limited = view.limit ? sorted.slice(0, view.limit) : sorted;
      return {
        name: view.name,
        type: view.type,
        compiledFilter: filter ? bytecodeToBase64(filter) : '',
        precomputedNotes: limited,
        sortedBy: view.sort ?? [],
        groupBy: view.groupBy,
        order: view.order,
        hideHeader: view.hideHeader,
        cardSize: view.cardSize,
        cardAspect: view.cardAspect,
        image: view.image,
        limit: view.limit,
        nestedProperties: view.nestedProperties,
        separator: view.separator,
      };
    });

    const compiled: CompiledBase = {
      version: 1,
      config,
      views: compiledViews,
      defaultView: config.defaultView,
      hideToolbar: config.hideToolbar,
    };

    const rawStem =
      baseStem === 'index' && parentVaultFolder ? parentVaultFolder : baseStem;
    const title = rawStem
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const slugSegments = slug.split('/');
    const jsonSlug =
      isFolderIndex && parentVaultFolder
        ? slugSegments.slice(0, -1).join('/') + '/index'
        : slug;

    const mdxRelPath = jsonSlug + '.mdx';
    const mdxPath = path.join(contentDir, mdxRelPath.replace(/\//g, path.sep));

    await fs.mkdir(path.dirname(mdxPath), { recursive: true });
    const mdxContent = `---
title: "${title}"
description: "${isFolderIndex ? `Notes in ${title}` : 'Obsidian Base'}"
base: true
---

import { BasesPageContent } from "@/components/bases-page";

<BasesPageContent src="/bases/${jsonSlug}.json" />
`;
    await fs.writeFile(mdxPath, mdxContent);

    const jsonOut = path.join(
      publicDir,
      'bases',
      jsonSlug.replace(/\//g, path.sep) + '.json',
    );
    await fs.mkdir(path.dirname(jsonOut), { recursive: true });
    await fs.writeFile(jsonOut, JSON.stringify(compiled));

    step.advance(baseFile.path);
  }

  // Auto-generate folder index pages for folders without explicit .base
  for (const folder of includedFolders) {
    if (folder === 'tags') continue; // generate-tag-pages owns content/tags/
    if (explicitFolderIndexes.has(folder)) continue;

    const targetMdx = path.join(contentDir, folder, 'index.mdx');
    try {
      await fs.access(targetMdx);
      continue;
    } catch {
      // doesn't exist — proceed
    }

    const autoFilterSrc = `filters: "file.inFolder(\\"${folder}\\")"\n`;
    const { config: autoConfig, viewFilters: autoFilters } =
      parseBaseConfig(autoFilterSrc);
    const autoFiltered = applyFilter(notes, autoFilters[0] ?? null);
    const autoViews: CompiledView[] = [
      {
        name: 'Table',
        type: 'table',
        compiledFilter: autoFilters[0] ? bytecodeToBase64(autoFilters[0]) : '',
        precomputedNotes: autoFiltered,
        sortedBy: [],
      },
    ];
    const autoCompiled: CompiledBase = {
      version: 1,
      config: autoConfig,
      views: autoViews,
    };

    const autoJsonOut = path.join(publicDir, 'bases', folder, 'index.json');
    await fs.mkdir(path.dirname(autoJsonOut), { recursive: true });
    await fs.writeFile(autoJsonOut, JSON.stringify(autoCompiled));

    const folderTitle = folder
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    await fs.mkdir(path.dirname(targetMdx), { recursive: true });
    await fs.writeFile(
      targetMdx,
      `---
title: "${folderTitle}"
description: "Notes in ${folderTitle}"
base: true
---

import { BasesPageContent } from "@/components/bases-page";

<BasesPageContent src="/bases/${folder}/index.json" />
`,
    );
  }

  const autoCount = [...includedFolders].filter(
    (f) => !explicitFolderIndexes.has(f),
  ).length;
  const total = baseFiles.length + autoCount;
  step.complete(
    `Generated ${total} base page${total === 1 ? '' : 's'} (${baseFiles.length} explicit, ${autoCount} auto)`,
  );

  return notes;
}
