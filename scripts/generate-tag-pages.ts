import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import type { OutputFile, VaultFile } from 'fumadocs-obsidian';
import { parseBaseConfig } from '../lib/base-parser.ts';
import { applyFilter } from '../lib/base-query.ts';
import { getTagPrefixes } from '../lib/tags.ts';
import type { CompiledBase, CompiledView, NoteRecord } from '../lib/base-types.ts';
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

/** YAML-safe scalar (JSON strings are valid YAML). */
function yamlString(value: string): string {
  return JSON.stringify(value);
}

interface TagNote {
  title?: string;
  description?: string;
  body: string;
}

/** Vault tag notes keyed by tag, read from the converted `tags/<tag>.mdx` outputs. */
function collectTagNotes(outputs: OutputFile[]): Map<string, TagNote> {
  const notes = new Map<string, TagNote>();

  for (const file of outputs) {
    if (file.type !== 'content') continue;
    if (!file.path.startsWith('tags/') || !file.path.endsWith('.mdx')) continue;

    const tag = file.path.slice('tags/'.length).replace(/\.mdx$/, '');
    const { data, content } = frontmatter(readFileContent(file.content));
    const fm = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;

    notes.set(tag, {
      title:
        typeof fm.title === 'string' && fm.title.trim() ? fm.title.trim() : undefined,
      description:
        typeof fm.description === 'string' && fm.description.trim()
          ? fm.description.trim()
          : undefined,
      body: content.trim(),
    });
  }

  return notes;
}

export async function generateTagPages(
  outputs: OutputFile[],
  baseFiles: VaultFile[],
  notes: NoteRecord[],
  step: StepProgress,
): Promise<void> {
  const tagNotes = collectTagNotes(outputs);

  // Tags with an explicit vault `tags/<tag>.base` are already compiled by the
  // base pipeline at the same slug — the explicit Base wins.
  const explicitBaseTags = new Set(
    baseFiles
      .filter((file) => file.path.startsWith('tags/') && file.path.endsWith('.base'))
      .map((file) => file.path.slice('tags/'.length).replace(/\.base$/, '')),
  );

  // Tag set: every prefix of every note tag, plus tags implied by tag notes.
  const tags = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      for (const prefix of getTagPrefixes(tag)) tags.add(prefix);
    }
  }
  for (const tag of tagNotes.keys()) {
    if (tag === 'index') continue; // tags/index.md is meta for the /tags page
    for (const prefix of getTagPrefixes(tag)) tags.add(prefix);
  }

  step.start(tags.size + 1);

  for (const tag of [...tags].sort()) {
    if (explicitBaseTags.has(tag)) {
      step.advance(`${tag} (explicit .base)`);
      continue;
    }

    const { config, viewFilters } = parseBaseConfig(
      `filters: 'file.hasTag("${tag}")'\n`,
    );
    const filter = viewFilters[0] ?? null;
    const views: CompiledView[] = [
      {
        name: 'Table',
        type: 'table',
        compiledFilter: filter ? bytecodeToBase64(filter) : '',
        precomputedNotes: applyFilter(notes, filter),
        sortedBy: [],
      },
    ];
    const compiled: CompiledBase = { version: 1, config, views };

    const segments = tag.split('/');
    const jsonOut = path.join(publicDir, 'bases', 'tags', ...segments) + '.json';
    await fs.mkdir(path.dirname(jsonOut), { recursive: true });
    await fs.writeFile(jsonOut, JSON.stringify(compiled));

    const tagNote = tagNotes.get(tag);
    const title = tagNote?.title ?? `#${tag}`;
    const description = tagNote?.description ?? `Notes tagged #${tag}`;
    const body = tagNote?.body ? `\n${tagNote.body}\n` : '';

    const mdxOut = path.join(contentDir, 'tags', ...segments) + '.mdx';
    await fs.mkdir(path.dirname(mdxOut), { recursive: true });
    await fs.writeFile(
      mdxOut,
      `---
title: ${yamlString(title)}
description: ${yamlString(description)}
base: true
tagPage: true
tag: ${yamlString(tag)}
---

import { BasesPageContent } from "@/components/bases-page";
${body}
<BasesPageContent src="/bases/tags/${tag}.json" />
`,
    );

    step.advance(tag);
  }

  // /tags index page (meta from optional vault tags/index.md)
  const indexNote = tagNotes.get('index');
  const indexBody = indexNote?.body ? `\n${indexNote.body}\n` : '';

  await fs.mkdir(path.join(contentDir, 'tags'), { recursive: true });
  await fs.writeFile(
    path.join(contentDir, 'tags', 'index.mdx'),
    `---
title: ${yamlString(indexNote?.title ?? 'Tags')}
description: ${yamlString(indexNote?.description ?? 'All tags used across the site')}
base: true
tagPage: true
---

import { TagsIndexContent } from "@/components/tags-index";
${indexBody}
<TagsIndexContent />
`,
  );
  step.advance('index');

  step.complete(
    `Generated ${tags.size} tag page${tags.size === 1 ? '' : 's'} + index`,
  );
}
