/**
 * Decide which AFFiNE locales need a full MCP export vs reuse of affine/<locale>/.
 * Compares prior per-page AFFiNE updatedAt revisions (not manifest `modified`,
 * which can be a date-only property) and probes brand-new workspace docs.
 */

export interface WorkspaceDocumentHint {
  id: string;
  updatedAt?: string | null;
  inTrash?: boolean;
}

export interface PreviousManifestPage {
  id: string;
  modified?: string;
}

/** locale → docId → normalized updatedAt from the last successful generate. */
export type LocaleSourceRevisions = Record<string, Record<string, string>>;

export interface LocaleGenerationPlan {
  generate: string[];
  skip: string[];
  /** Workspace docs not present in any previous locale manifest and not previously seen. */
  unknownDocumentIds: string[];
  reasons: Record<string, string>;
}

export interface SourceRevisionState {
  /** locale → docId → normalized updatedAt from the last successful generate. */
  locales: LocaleSourceRevisions;
  /** Every workspace doc id observed on the last successful generate:all plan. */
  seenDocumentIds: string[];
}

/** Parse AFFINE_GENERATE_LOCALES — same shape as PUBLISHER_BUILD_LOCALES. */
export function parseGenerateLocales(value: string | undefined): "all" | string[] | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "all" || trimmed === "*") return "all";
  const locales = [...new Set(
    trimmed.split(",").map((part) => part.trim()).filter(Boolean),
  )];
  return locales.length > 0 ? locales : undefined;
}

export function normalizeAffineTimestamp(value: string | undefined | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const parsed = /^\d+$/.test(trimmed) ? new Date(Number(trimmed)) : new Date(trimmed);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}

export function revisionsFromDocuments(
  pageIds: string[],
  documents: WorkspaceDocumentHint[],
): Record<string, string> {
  const byId = new Map(documents.filter((doc) => !doc.inTrash).map((doc) => [doc.id, doc]));
  const revisions: Record<string, string> = {};
  for (const id of pageIds) {
    const live = byId.get(id);
    const stamp = normalizeAffineTimestamp(live?.updatedAt);
    if (stamp) revisions[id] = stamp;
  }
  return revisions;
}

export function planLocaleGeneration(options: {
  localeCodes: string[];
  documents: WorkspaceDocumentHint[];
  previousPages: Record<string, PreviousManifestPage[] | undefined>;
  /** Last-seen AFFiNE updatedAt per published page, keyed by locale. */
  previousRevisions?: LocaleSourceRevisions;
  /** Doc ids observed on a prior generate:all (including non-manifest docs). */
  seenDocumentIds?: string[];
  /** Locales of newly discovered publishable docs (from property probes). */
  publishableUnknownLocales?: string[];
  force?: "all" | string[];
}): LocaleGenerationPlan {
  const localeCodes = [...options.localeCodes];
  const reasons: Record<string, string> = {};
  const generate = new Set<string>();
  const knownManifestIds = knownIds(options.previousPages);
  const seen = new Set(options.seenDocumentIds ?? [...knownManifestIds]);

  if (options.force === "all") {
    for (const code of localeCodes) {
      generate.add(code);
      reasons[code] = "forced-all";
    }
    return finalize(localeCodes, generate, reasons, unknownIds(options.documents, seen));
  }
  if (Array.isArray(options.force)) {
    for (const code of options.force) {
      if (!localeCodes.includes(code)) continue;
      generate.add(code);
      reasons[code] = "forced-list";
    }
    return finalize(localeCodes, generate, reasons, unknownIds(options.documents, seen));
  }

  const unknownDocumentIds = unknownIds(options.documents, seen);
  const byId = new Map(
    options.documents.filter((doc) => !doc.inTrash).map((doc) => [doc.id, doc]),
  );
  const previousRevisions = options.previousRevisions ?? {};

  for (const code of localeCodes) {
    const pages = options.previousPages[code];
    if (!pages) {
      generate.add(code);
      reasons[code] = "missing-manifest";
      continue;
    }
    const revisions = previousRevisions[code];
    if (!revisions) {
      generate.add(code);
      reasons[code] = "missing-revisions";
      continue;
    }
    if (pages.length === 0) continue;

    for (const page of pages) {
      const live = byId.get(page.id);
      if (!live) {
        generate.add(code);
        reasons[code] = `removed:${page.id}`;
        break;
      }
      const previous = revisions[page.id];
      const current = normalizeAffineTimestamp(live.updatedAt);
      if (!previous || !current || previous !== current) {
        generate.add(code);
        reasons[code] = previous && current ? `updated:${page.id}` : `timestamp:${page.id}`;
        break;
      }
    }
  }

  for (const code of options.publishableUnknownLocales ?? []) {
    if (!localeCodes.includes(code)) continue;
    generate.add(code);
    reasons[code] ??= "new-publishable-doc";
  }

  for (const code of localeCodes) {
    if (generate.has(code)) continue;
    const pages = options.previousPages[code];
    if (pages && pages.length === 0 && unknownDocumentIds.length === 0) {
      generate.add(code);
      reasons[code] = "empty-manifest";
    }
  }

  return finalize(localeCodes, generate, reasons, unknownDocumentIds);
}

function knownIds(previousPages: Record<string, PreviousManifestPage[] | undefined>): Set<string> {
  const ids = new Set<string>();
  for (const pages of Object.values(previousPages)) {
    for (const page of pages ?? []) ids.add(page.id);
  }
  return ids;
}

function unknownIds(
  documents: WorkspaceDocumentHint[],
  known: Set<string>,
): string[] {
  return documents
    .filter((doc) => !doc.inTrash && !known.has(doc.id))
    .map((doc) => doc.id)
    .sort();
}

function finalize(
  localeCodes: string[],
  generate: Set<string>,
  reasons: Record<string, string>,
  unknownDocumentIds: string[],
): LocaleGenerationPlan {
  const orderedGenerate = localeCodes.filter((code) => generate.has(code));
  const skip = localeCodes.filter((code) => !generate.has(code));
  return { generate: orderedGenerate, skip, unknownDocumentIds, reasons };
}
