import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Shared translation map — updated every generate:all, not a per-locale content signal. */
export const TRANSLATIONS_BASENAME = "affine-translations.json";

export type LocaleFingerprints = Record<string, string>;

export interface ChangedLocalesReport {
  generatedAt: string;
  changed: string[];
  fingerprints: LocaleFingerprints;
}

export function publisherStateDir(root: string): string {
  return path.join(root, ".affine-publisher");
}

export function fingerprintsPath(root: string): string {
  return path.join(publisherStateDir(root), "locale-fingerprints.json");
}

export function releasedFingerprintsPath(root: string): string {
  return path.join(publisherStateDir(root), "released-fingerprints.json");
}

export function changedLocalesPath(root: string): string {
  return path.join(publisherStateDir(root), "changed-locales.json");
}

export function buildCacheDir(root: string): string {
  return path.join(publisherStateDir(root), "build-cache");
}

/**
 * Parse PUBLISHER_BUILD_LOCALES.
 * - unset / empty → undefined (auto from changed-locales.json)
 * - "all" / "*" → rebuild every locale
 * - "en,fr" → those locales only
 */
export function parseBuildLocales(value: string | undefined): "all" | string[] | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "all" || trimmed === "*") return "all";
  const locales = [...new Set(
    trimmed.split(",").map((part) => part.trim()).filter(Boolean),
  )];
  if (locales.length === 0) return undefined;
  return locales;
}

/** Locales whose snapshot fingerprint differs from the last successful release. */
export function localesChanged(
  previous: LocaleFingerprints | undefined,
  current: LocaleFingerprints,
  localeCodes: string[],
): string[] {
  if (!previous) return [...localeCodes];
  return localeCodes.filter((code) => current[code] !== previous[code]);
}

/**
 * Decide which locales need a Next build vs reuse of a previous out-* tree.
 * Missing artifacts force a rebuild even when the fingerprint is unchanged.
 */
export function planLocaleBuilds(options: {
  localeCodes: string[];
  changed: string[] | "all";
  availableArtifacts: string[];
}): { build: string[]; reuse: string[] } {
  const available = new Set(options.availableArtifacts);
  if (options.changed === "all") {
    return { build: [...options.localeCodes], reuse: [] };
  }
  const changed = new Set(options.changed);
  const build: string[] = [];
  const reuse: string[] = [];
  for (const code of options.localeCodes) {
    if (changed.has(code) || !available.has(code)) build.push(code);
    else reuse.push(code);
  }
  return { build, reuse };
}

async function walkFiles(directory: string): Promise<string[]> {
  const found: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return found;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walkFiles(target));
    else if (entry.isFile()) found.push(target);
  }
  return found;
}

function shouldFingerprint(relativePosix: string): boolean {
  const base = path.posix.basename(relativePosix);
  if (base === TRANSLATIONS_BASENAME) return false;
  // Manifest timestamps change every generate even when pages are identical.
  if (base === "manifest.json") return false;
  // Studio/portal/homepage JSON always rewrite `generatedAt` — not a content signal.
  if (relativePosix.startsWith("public/") && base.endsWith(".json")) return false;
  // Diagnostics are advisory and rewrite every run.
  if (base === "diagnostics.json") return false;
  return true;
}

/** Content-addressed fingerprint of a locale snapshot (content + public, minus noise). */
export async function fingerprintLocaleSnapshot(localeRoot: string): Promise<string> {
  const hash = createHash("sha256");
  const roots = ["content", "public"];
  const files: string[] = [];
  for (const part of roots) {
    files.push(...await walkFiles(path.join(localeRoot, part)));
  }
  files.sort((a, b) => a.localeCompare(b));
  for (const absolute of files) {
    const relative = path.relative(localeRoot, absolute).split(path.sep).join("/");
    if (!shouldFingerprint(relative)) continue;
    hash.update(relative);
    hash.update("\0");
    hash.update(await fs.readFile(absolute));
    hash.update("\0");
  }
  // Include page identity from the manifest so empty trees still distinguish locales.
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(localeRoot, "manifest.json"), "utf8")) as {
      pages?: Array<{ id: string; slug: string; title: string; modified?: string }>;
    };
    const pages = (manifest.pages ?? [])
      .map((page) => `${page.id}\t${page.slug}\t${page.title}\t${page.modified ?? ""}`)
      .sort();
    hash.update(pages.join("\n"));
  } catch {
    hash.update("no-manifest");
  }
  return hash.digest("hex");
}

export async function fingerprintLocales(
  root: string,
  localeCodes: string[],
): Promise<LocaleFingerprints> {
  const fingerprints: LocaleFingerprints = {};
  for (const code of localeCodes) {
    fingerprints[code] = await fingerprintLocaleSnapshot(path.join(root, "affine", code));
  }
  return fingerprints;
}

export async function readJsonFile<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export async function writeChangedLocalesReport(
  root: string,
  report: ChangedLocalesReport,
): Promise<void> {
  await fs.mkdir(publisherStateDir(root), { recursive: true, mode: 0o700 });
  await fs.writeFile(changedLocalesPath(root), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(fingerprintsPath(root), `${JSON.stringify(report.fingerprints, null, 2)}\n`);
}

export async function markFingerprintsReleased(root: string): Promise<void> {
  const pending = await readJsonFile<LocaleFingerprints>(fingerprintsPath(root));
  if (!pending) return;
  await fs.mkdir(publisherStateDir(root), { recursive: true, mode: 0o700 });
  await fs.writeFile(releasedFingerprintsPath(root), `${JSON.stringify(pending, null, 2)}\n`);
  // Clear the build plan so the next build:all reuses cached outs until content moves again.
  await writeChangedLocalesReport(root, {
    generatedAt: new Date().toISOString(),
    changed: [],
    fingerprints: pending,
  });
}

export async function resolveChangedLocales(
  root: string,
  localeCodes: string[],
  envValue?: string,
): Promise<{ changed: string[] | "all"; source: string }> {
  const parsed = parseBuildLocales(envValue);
  if (parsed === "all") return { changed: "all", source: "PUBLISHER_BUILD_LOCALES=all" };
  if (Array.isArray(parsed)) return { changed: parsed, source: "PUBLISHER_BUILD_LOCALES" };

  // Prefer live fingerprint diff so a stale changed-locales.json cannot force full rebuilds.
  const current = await readJsonFile<LocaleFingerprints>(fingerprintsPath(root));
  const released = await readJsonFile<LocaleFingerprints>(releasedFingerprintsPath(root));
  if (current) {
    const changed = localesChanged(released, current, localeCodes);
    return {
      changed,
      source: released ? "fingerprint-diff" : "default-full",
    };
  }

  const report = await readJsonFile<ChangedLocalesReport>(changedLocalesPath(root));
  if (report?.changed) {
    const known = new Set(localeCodes);
    const changed = report.changed.filter((code) => known.has(code));
    return { changed, source: "changed-locales.json" };
  }

  return { changed: "all", source: "default-full" };
}
