import {
  convertVaultFiles,
  readVaultFiles,
  type OutputFile,
  type ParsedContentFile,
  type VaultFile,
} from "fumadocs-obsidian";
import { generateCanvasPages, syncCanvasFromVault } from "./generate-canvas-pages.ts";
import { syncExcalidrawFromVault } from "./generate-excalidraw-pages.ts";
import { generateBasePages } from "./generate-base-pages.ts";
import { generateTagPages } from "./generate-tag-pages.ts";
import {
  promptIncludeSelection,
  type VaultEntry,
} from "./generate-select-ui.ts";
import {
  createStepProgress,
  GenerateProgress,
  runWithGenerateUi,
} from "./progress.ts";
import { frontmatter as parseFrontmatter } from "fumadocs-core/content/md/frontmatter";
import fs from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import {
  contentDir,
  publicDir,
  generateLocale,
  localeEnv,
  localeEnvName,
} from "./locales.ts";
// Hand-maintained pages that survive the clean step. If a vault note shares
// a stem (e.g. start-here.md), generation overwrites the hand file — the
// vault wins.
const preservedFiles = new Set(["index.mdx", "graph.mdx", "start-here.mdx"]);
const hiddenEntries = new Set([".obsidian", "templates"]);
const defaultExcludePatterns = ["!.obsidian/**", "!templates/**"];

function isDraft(file: VaultFile): boolean {
  if (typeof file.content !== "string") return false;
  if (!file.path.endsWith(".md") && !file.path.endsWith(".mdx")) return false;
  const { data } = parseFrontmatter(file.content);
  return data.draft === true || data.private === true;
}

function resolveTitle(file: ParsedContentFile, fallback: string) {
  const frontmatter = file.frontmatter as Record<string, unknown> | undefined;

  if (typeof frontmatter?.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  const heading = file.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  return fallback;
}

function resolveDescription(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

// File-system dates for a vault note, used when the note's own frontmatter
// doesn't declare created/modified. birthtime is unreliable on some
// filesystems (epoch 0), so fall back to mtime.
function resolveFileDates(rawPath: string): { created?: string; modified?: string } {
  try {
    const stats = statSync(rawPath);
    const modified = stats.mtime;
    const created =
      stats.birthtime.getTime() > 0 && stats.birthtime <= modified
        ? stats.birthtime
        : modified;
    return { created: created.toISOString(), modified: modified.toISOString() };
  } catch {
    return {};
  }
}

async function listCleanTargets(dir: string, preserved = new Set<string>()) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => !preserved.has(entry.name))
      .map((entry) => ({
        path: path.join(dir, entry.name),
        label: path.join(path.basename(dir), entry.name),
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function cleanGeneratedDirs(step: ReturnType<typeof createStepProgress>) {
  const targets = [
    ...(await listCleanTargets(contentDir, preservedFiles)),
    ...(await listCleanTargets(publicDir)),
  ];

  if (targets.length === 0) {
    step.skip("Nothing to clean");
    return;
  }

  step.start(targets.length);
  for (const target of targets) {
    await fs.rm(target.path, { recursive: true, force: true });
    step.advance(target.label);
  }
  step.complete(`Removed ${targets.length} item${targets.length === 1 ? "" : "s"}`);
}

// Convert > [!orbit] callout blocks to ```orbit fences before MDX parsing.
// Mirrors the sidenote transform: raw text → standard syntax the remark plugin handles.
const ORBIT_CALLOUT_RE = /^(> \[!orbit\][-+]?\s*(.*)\n)((?:>[ ]?.*\n?)*)/gm;

function transformOrbitCallouts(content: string): string {
  ORBIT_CALLOUT_RE.lastIndex = 0;
  if (!ORBIT_CALLOUT_RE.test(content)) return content;
  ORBIT_CALLOUT_RE.lastIndex = 0;
  return content.replace(ORBIT_CALLOUT_RE, (_match, _header: string, meta: string, body: string) => {
    const stripped = body.replace(/^>[ ]?/gm, "");
    const metaPart = meta.trim();
    return `\`\`\`orbit${metaPart ? " " + metaPart : ""}\n${stripped}\`\`\`\n`;
  });
}

const SIDENOTE_SYNTAX_RE = /\{\{sidenotes\[([^\]]+)\]:\s*([\s\S]*?)\}\}/g;

function transformSidenoteSyntax(content: string): string {
  SIDENOTE_SYNTAX_RE.lastIndex = 0;
  if (!SIDENOTE_SYNTAX_RE.test(content)) return content;

  let counter = 0;
  const definitions: string[] = [];
  SIDENOTE_SYNTAX_RE.lastIndex = 0;

  const transformed = content.replace(SIDENOTE_SYNTAX_RE, (_match, label: string, body: string) => {
    const id = `_sn_${++counter}`;
    definitions.push(`[^${id}]: ${body.trim()}`);
    return `${label}[^${id}]`;
  });

  if (definitions.length === 0) return content;
  return transformed.trimEnd() + "\n\n" + definitions.join("\n\n") + "\n";
}

async function writeVaultOutputs(
  files: OutputFile[],
  step: ReturnType<typeof createStepProgress>,
) {
  const targetDirs: Record<OutputFile["type"], string> = {
    asset: publicDir,
    content: contentDir,
    data: contentDir,
    custom: "",
  };

  if (files.length === 0) {
    step.skip("No files to write");
    return;
  }

  step.start(files.length);
  for (const file of files) {
    const mappedPath = path.join(targetDirs[file.type], file.path);
    await fs.mkdir(path.dirname(mappedPath), { recursive: true });
    let content = file.content;
    if (file.type === "content" && typeof content === "string") {
      content = transformSidenoteSyntax(content);
    }
    await fs.writeFile(mappedPath, content);
    step.advance(file.path);
  }
  step.complete(`Wrote ${files.length} file${files.length === 1 ? "" : "s"}`);
}

async function listVaultEntries(vaultDir: string): Promise<VaultEntry[]> {
  const entries = await fs.readdir(vaultDir, { withFileTypes: true });

  return entries
    .filter((entry) => !hiddenEntries.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function parseSavedInclude(value: string | undefined) {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildIncludePatterns(selected: string[], entries: VaultEntry[]) {
  const entryMap = new Map(entries.map((entry) => [entry.name, entry]));
  const patterns: string[] = [];

  for (const name of selected) {
    const entry = entryMap.get(name);
    if (!entry) continue;
    patterns.push(entry.isDirectory ? `${name}/**` : name);
  }

  return [...patterns, ...defaultExcludePatterns];
}

async function saveGenerateInclude(names: string[]) {
  const envPath = path.join(process.cwd(), ".env");
  const key = localeEnvName("GENERATE_INCLUDE");
  const line = `${key}=${names.join(",")}`;
  let content = "";

  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = content.trimEnd();
    content = content ? `${content}\n${line}\n` : `${line}\n`;
  }

  await fs.writeFile(envPath, content);
}

async function resolveInclude(vaultDir: string) {
  const forceSelect = process.argv.includes("--select");
  const saved = parseSavedInclude(localeEnv("GENERATE_INCLUDE"));
  const entries = await listVaultEntries(vaultDir);

  if (!forceSelect && saved.length > 0) {
    const patterns = buildIncludePatterns(saved, entries);
    if (patterns.length > defaultExcludePatterns.length) {
      console.log(`Using ${localeEnvName("GENERATE_INCLUDE")}: ${saved.join(", ")}`);
      return patterns;
    }
  }

  if (!forceSelect && !process.stdin.isTTY) {
    console.log("Using default include: all top-level items (draft/private notes excluded)");
    return ["**/*", ...defaultExcludePatterns];
  }

  if (!forceSelect) {
    console.log("Using default include: all top-level items (draft/private notes excluded)");
    return ["**/*", ...defaultExcludePatterns];
  }

  if (entries.length === 0) {
    console.error("No includable files or folders found in the vault.");
    process.exit(1);
  }

  const selected = await promptIncludeSelection(vaultDir, entries, saved);

  await saveGenerateInclude(selected);
  console.log(
    `\nSaved selection to .env as ${localeEnvName("GENERATE_INCLUDE")}=${selected.join(",")}`,
  );

  return buildIncludePatterns(selected, entries);
}

async function main() {
  const vaultDir = localeEnv("OBSIDIAN_VAULT_PATH");

  if (!vaultDir) {
    console.error(
      `${localeEnvName("OBSIDIAN_VAULT_PATH")} is not set. Add it to .env` +
        (generateLocale === "en" ? " (or set OBSIDIAN_VAULT_PATH)." : "."),
    );
    process.exit(1);
  }

  console.log(`Generating locale: ${generateLocale} → locales/${generateLocale}/`);

  try {
    await fs.access(vaultDir);
  } catch {
    console.error(`Obsidian vault not found: ${vaultDir}`);
    process.exit(1);
  }

  const include = await resolveInclude(vaultDir);

  const progress = new GenerateProgress([
    { id: "clean", label: "Cleaning generated files" },
    { id: "convert", label: "Converting vault" },
    { id: "write", label: "Writing files" },
    { id: "canvas-sync", label: "Syncing canvas assets" },
    { id: "canvas-pages", label: "Generating canvas pages" },
    { id: "excalidraw", label: "Generating excalidraw pages" },
    { id: "base-pages", label: "Generating base pages" },
    { id: "tag-pages", label: "Generating tag pages" },
  ]);

  await runWithGenerateUi(progress, async () => {
    const clean = createStepProgress(progress, "clean");
    const convert = createStepProgress(progress, "convert");
    const write = createStepProgress(progress, "write");
    const canvasSync = createStepProgress(progress, "canvas-sync");
    const canvasPages = createStepProgress(progress, "canvas-pages");
    const excalidrawStep = createStepProgress(progress, "excalidraw");
    const basePages = createStepProgress(progress, "base-pages");
    const tagPages = createStepProgress(progress, "tag-pages");

    await cleanGeneratedDirs(clean);

    convert.start(0);
    convert.setDetail("Reading vault files...");
    const allFiles = await readVaultFiles({ dir: vaultDir, include });
    const drafts = allFiles.filter(isDraft);
    const rawFiles = allFiles.filter((f) => !isDraft(f));
    if (drafts.length > 0) {
      console.log(`Skipping ${drafts.length} draft/private file${drafts.length === 1 ? "" : "s"}`);
    }
    convert.setDetail(
      `Found ${rawFiles.length} file${rawFiles.length === 1 ? "" : "s"}. Converting...`,
    );

    // Transform [!orbit] callouts to ```orbit fences BEFORE fumadocs-obsidian
    // converts them to <ObsidianCallout> components.
    // Transform [!orbit] callouts to ```orbit fences BEFORE fumadocs-obsidian
    // converts them to <ObsidianCallout> components. VaultFile.content may be
    // a Buffer for .md files, so coerce to string first.
    for (const f of rawFiles) {
      const raw = typeof f.content === "string" ? f.content : Buffer.isBuffer(f.content) ? f.content.toString("utf8") : null;
      if (raw && raw.includes("[!orbit]")) {
        f.content = transformOrbitCallouts(raw);
      }
    }

    const baseRawFiles = rawFiles.filter((f: VaultFile) => f.path.endsWith('.base'));
    const nonBaseRawFiles = rawFiles.filter((f: VaultFile) => !f.path.endsWith('.base'));

    const outputs = await convertVaultFiles(nonBaseRawFiles, {
      transformFrontmatter(frontmatter, { file }) {
        if (file.format !== "content") return frontmatter;

        const title = resolveTitle(file, String(frontmatter.title ?? ""));
        const description = resolveDescription(frontmatter.description);
        const result: Record<string, unknown> = { ...frontmatter, title };

        if (description) result.description = description;
        else delete result.description;

        // Emit created/modified so the site can sort by recency (home page
        // "recent notes", RSS). Frontmatter declared in the note wins; file
        // stats are the fallback.
        const dates = resolveFileDates(file._raw.path);
        if (!result.created && dates.created) result.created = dates.created;
        if (!result.modified && dates.modified) result.modified = dates.modified;

        return result;
      },
    });

    convert.complete(
      `Converted ${rawFiles.length} file${rawFiles.length === 1 ? "" : "s"}`,
    );

    await writeVaultOutputs(outputs, write);
    await syncCanvasFromVault(vaultDir, include, canvasSync);
    await generateCanvasPages(canvasPages);
    await syncExcalidrawFromVault(vaultDir, include, excalidrawStep);
    const notes = await generateBasePages(baseRawFiles, outputs, include, basePages);
    await generateTagPages(outputs, baseRawFiles, notes, tagPages);
  });
}

main().catch((error) => {
  if (error instanceof Error && error.message === "Selection cancelled") {
    console.error("Generate cancelled.");
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
