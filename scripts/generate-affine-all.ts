import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { metadataFromAffineProperties } from "@affine-fumadocs/publisher";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import {
  parseGenerateLocales,
  planLocaleGeneration,
  revisionsFromDocuments,
  type LocaleSourceRevisions,
  type PreviousManifestPage,
  type SourceRevisionState,
} from "../lib/affine/incremental-generate.ts";
import {
  buildTranslationIndex,
  type AffineLocalesConfig,
} from "../lib/affine/multilingual.ts";
import type { AffineSnapshotManifest } from "../lib/affine/types.ts";
import {
  fingerprintLocales,
  localesChanged,
  publisherStateDir,
  readJsonFile,
  writeChangedLocalesReport,
  type LocaleFingerprints,
  releasedFingerprintsPath,
} from "../lib/affine/incremental-build.ts";

const root = process.cwd();
const configPath = path.resolve(
  root,
  process.env.AFFINE_LOCALES_CONFIG?.trim() || "affine/locales.config.json",
);

const UNKNOWN_PROBE_CONCURRENCY = 8;

async function bridgeToken(): Promise<string | undefined> {
  const configured = process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
  if (configured) return configured.replace(/^Bearer\s+/i, "");
  const tokenPath = path.resolve(
    root,
    process.env.AFFINE_BRIDGE_MCP_TOKEN_PATH?.trim() ||
      path.join(".affine-publisher", "bridge.token"),
  );
  try {
    const token = (await fs.readFile(tokenPath, "utf8")).trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

function runGenerator(locale: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const environment = { ...process.env, AFFINE_LOCALE: locale };
    delete environment.AFFINE_OUTPUT_ROOT;
    const child = spawn(process.execPath, ["scripts/generate-affine.ts"], {
      cwd: root,
      env: environment,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`AFFiNE ${locale} generation failed (${code ?? signal ?? "unknown"}).`)));
  });
}

async function readPreviousPages(
  localeCodes: string[],
): Promise<Record<string, PreviousManifestPage[] | undefined>> {
  const previous: Record<string, PreviousManifestPage[] | undefined> = {};
  for (const code of localeCodes) {
    try {
      const manifest = JSON.parse(
        await fs.readFile(path.join(root, "affine", code, "manifest.json"), "utf8"),
      ) as AffineSnapshotManifest;
      previous[code] = manifest.pages.map((page) => ({
        id: page.id,
        modified: page.modified,
      }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      previous[code] = undefined;
    }
  }
  return previous;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
    while (index < items.length) {
      const current = items[index]!;
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function probePublishableUnknownLocales(
  unknownIds: string[],
  workspaceId: string,
): Promise<string[]> {
  if (unknownIds.length === 0) return [];
  const bridgeUrl = process.env.AFFINE_BRIDGE_MCP_URL?.trim();
  if (!bridgeUrl) return [];
  const client = createAffineBridgeMcpClient({
    endpoint: bridgeUrl,
    token: await bridgeToken(),
  });
  const locales = new Set<string>();
  await mapPool(unknownIds, UNKNOWN_PROBE_CONCURRENCY, async (docId) => {
    try {
      const properties = await client.readDocumentProperties(workspaceId, docId);
      const metadata = metadataFromAffineProperties(properties, undefined);
      if (
        metadata.publish === true &&
        metadata.draft !== true &&
        metadata.locale &&
        metadata.slug
      ) {
        locales.add(metadata.locale.trim());
      }
    } catch {
      // Discovery probe is best-effort; a full locale generate will surface read errors.
    }
  });
  return [...locales].sort();
}

function sourceRevisionsPath(): string {
  return path.join(publisherStateDir(root), "source-revisions.json");
}

async function readSourceRevisionState(): Promise<SourceRevisionState | undefined> {
  const raw = await readJsonFile<SourceRevisionState | LocaleSourceRevisions>(sourceRevisionsPath());
  if (!raw) return undefined;
  // Migrate legacy { en: { id: ts } } shape.
  if (!("locales" in raw) && !("seenDocumentIds" in raw)) {
    return {
      locales: raw as LocaleSourceRevisions,
      seenDocumentIds: [],
    };
  }
  return raw as SourceRevisionState;
}

async function planLocalesToGenerate(localeCodes: string[]): Promise<{
  generate: string[];
  skip: string[];
  reasons: Record<string, string>;
  source: string;
  documents: Array<{ id: string; updatedAt?: string | null; inTrash?: boolean }>;
}> {
  const forced = parseGenerateLocales(process.env.AFFINE_GENERATE_LOCALES);
  if (forced === "all") {
    return {
      generate: [...localeCodes],
      skip: [],
      reasons: Object.fromEntries(localeCodes.map((code) => [code, "forced-all"])),
      source: "AFFINE_GENERATE_LOCALES=all",
      documents: [],
    };
  }
  if (Array.isArray(forced)) {
    const known = new Set(localeCodes);
    const generate = forced.filter((code) => known.has(code));
    return {
      generate,
      skip: localeCodes.filter((code) => !generate.includes(code)),
      reasons: Object.fromEntries(generate.map((code) => [code, "forced-list"])),
      source: "AFFINE_GENERATE_LOCALES",
      documents: [],
    };
  }

  const bridgeUrl = process.env.AFFINE_BRIDGE_MCP_URL?.trim();
  const workspaceId = process.env.AFFINE_WORKSPACE_ID?.trim();
  if (!bridgeUrl || !workspaceId) {
    return {
      generate: [...localeCodes],
      skip: [],
      reasons: Object.fromEntries(localeCodes.map((code) => [code, "no-bridge"])),
      source: "full-no-bridge",
      documents: [],
    };
  }

  const client = createAffineBridgeMcpClient({
    endpoint: bridgeUrl,
    token: await bridgeToken(),
  });
  const documents = await client.listDocuments(workspaceId);
  const previousPages = await readPreviousPages(localeCodes);
  const previousState = await readSourceRevisionState();
  const draft = planLocaleGeneration({
    localeCodes,
    documents,
    previousPages,
    previousRevisions: previousState?.locales,
    seenDocumentIds: previousState?.seenDocumentIds,
  });
  const publishableUnknownLocales = await probePublishableUnknownLocales(
    draft.unknownDocumentIds,
    workspaceId,
  );
  const plan = planLocaleGeneration({
    localeCodes,
    documents,
    previousPages,
    previousRevisions: previousState?.locales,
    seenDocumentIds: previousState?.seenDocumentIds,
    publishableUnknownLocales,
  });
  return {
    generate: plan.generate,
    skip: plan.skip,
    reasons: plan.reasons,
    source: "source-revisions",
    documents,
  };
}

async function writeSourceRevisions(
  localeCodes: string[],
  documents: Array<{ id: string; updatedAt?: string | null; inTrash?: boolean }>,
  manifests: AffineSnapshotManifest[],
): Promise<void> {
  if (documents.length === 0) return;
  const previous = await readSourceRevisionState();
  const locales: LocaleSourceRevisions = { ...(previous?.locales ?? {}) };
  for (const code of localeCodes) {
    const manifest = manifests.find((item) => item.locale === code);
    if (!manifest) continue;
    locales[code] = revisionsFromDocuments(
      manifest.pages.map((page) => page.id),
      documents,
    );
  }
  const state: SourceRevisionState = {
    locales,
    seenDocumentIds: documents.filter((doc) => !doc.inTrash).map((doc) => doc.id).sort(),
  };
  await fs.mkdir(publisherStateDir(root), { recursive: true, mode: 0o700 });
  await fs.writeFile(sourceRevisionsPath(), `${JSON.stringify(state, null, 2)}\n`);
}

async function main() {
  const config = JSON.parse(await fs.readFile(configPath, "utf8")) as AffineLocalesConfig;
  const localeCodes = config.locales.map((locale) => locale.code);
  const plan = await planLocalesToGenerate(localeCodes);
  console.log(
    `[generate:all] Plan (${plan.source}): generate [${plan.generate.join(", ") || "—"}]` +
      `; skip [${plan.skip.join(", ") || "—"}]`,
  );
  for (const code of plan.generate) {
    if (plan.reasons[code]) {
      console.log(`[generate:all] ${code}: ${plan.reasons[code]}`);
    }
  }

  for (const code of plan.generate) {
    await runGenerator(code);
  }
  for (const code of plan.skip) {
    console.log(`[generate:all] Reusing existing affine/${code} snapshot.`);
  }

  const manifests: AffineSnapshotManifest[] = [];
  for (const locale of config.locales) {
    manifests.push(JSON.parse(
      await fs.readFile(path.join(root, "affine", locale.code, "manifest.json"), "utf8"),
    ) as AffineSnapshotManifest);
  }

  // When the plan used the bridge, refresh per-page updatedAt baselines so the
  // next run can skip unchanged locales (manifest `modified` may be date-only).
  let documents = plan.documents;
  if (documents.length === 0 && plan.generate.length > 0) {
    const bridgeUrl = process.env.AFFINE_BRIDGE_MCP_URL?.trim();
    const workspaceId = process.env.AFFINE_WORKSPACE_ID?.trim();
    if (bridgeUrl && workspaceId) {
      const client = createAffineBridgeMcpClient({
        endpoint: bridgeUrl,
        token: await bridgeToken(),
      });
      documents = await client.listDocuments(workspaceId);
    }
  }
  await writeSourceRevisions(localeCodes, documents, manifests);

  const index = buildTranslationIndex(config, manifests);
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  await fs.writeFile(path.join(root, "affine", "translations.json"), serialized);
  for (const locale of config.locales) {
    const publicRoot = path.join(root, "affine", locale.code, "public");
    await fs.mkdir(publicRoot, { recursive: true });
    await fs.writeFile(path.join(publicRoot, "affine-translations.json"), serialized);
  }

  const fingerprints = await fingerprintLocales(root, localeCodes);
  const released = await readJsonFile<LocaleFingerprints>(releasedFingerprintsPath(root));
  const changed = localesChanged(released, fingerprints, localeCodes);
  await writeChangedLocalesReport(root, {
    generatedAt: new Date().toISOString(),
    changed,
    fingerprints,
  });
  console.log(
    `Generated ${plan.generate.length}/${manifests.length} locale snapshots` +
      (plan.skip.length ? ` (skipped ${plan.skip.join(", ")})` : "") +
      " and their cross-language route map." +
      (changed.length === localeCodes.length
        ? " All locales changed since last release."
        : changed.length === 0
        ? " No locale content changed since last release."
        : ` Changed locales for next release: ${changed.join(", ")}.`),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
