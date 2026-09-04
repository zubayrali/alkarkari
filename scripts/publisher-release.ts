import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { releasesToPrune } from "../lib/affine/releases.ts";
import type { AffineSnapshotManifest } from "../lib/affine/types.ts";

const root = process.cwd();
const locale = process.env.AFFINE_LOCALE?.trim() || process.env.SITE_LANGUAGE?.trim() || "en";
const snapshotRoot = path.resolve(root, process.env.AFFINE_OUTPUT_ROOT?.trim() || path.join("affine", locale));
const releasesRoot = path.resolve(root, process.env.PUBLISHER_RELEASE_ROOT?.trim() || path.join(".affine-publisher", "releases"));
const multilingual = process.env.PUBLISHER_MULTILINGUAL !== "0";
const outRoot = path.join(root, multilingual ? "site" : "out");
const releaseId = new Date().toISOString().replace(/[:.]/g, "-");
const temporary = path.join(releasesRoot, `.building-${releaseId}`);
const destination = path.join(releasesRoot, releaseId);
const pnpm = process.env.PUBLISHER_PNPM_BIN?.trim() || "pnpm";

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 2) throw new Error("PUBLISHER_RELEASE_KEEP must be an integer of at least 2.");
  return parsed;
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`${command} ${args.join(" ")} failed (${code ?? signal ?? "unknown"}).`)));
  });
}

async function assertBuildOutput(): Promise<number> {
  await fs.access(path.join(outRoot, "index.html"));
  let htmlFiles = 0;
  async function walk(directory: string): Promise<void> {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.name.endsWith(".html")) htmlFiles += 1;
    }
  }
  await walk(outRoot);
  if (htmlFiles < 2) throw new Error("The static build produced fewer than two HTML pages.");
  return htmlFiles;
}

async function switchCurrentRelease(target: string): Promise<void> {
  const current = path.join(releasesRoot, "current");
  const next = path.join(releasesRoot, `.current-${process.pid}`);
  await fs.rm(next, { force: true });
  await fs.symlink(path.basename(target), next, "dir");
  await fs.rename(next, current);
}

async function main() {
  await run(process.execPath, ["--env-file=.env.publisher", "scripts/publisher-doctor.ts"]);
  await run(pnpm, ["test"]);
  await run(pnpm, ["lint"]);
  await run(pnpm, [multilingual ? "build:all" : "build"]);

  const htmlFiles = await assertBuildOutput();
  const manifest = JSON.parse(await fs.readFile(path.join(snapshotRoot, "manifest.json"), "utf8")) as AffineSnapshotManifest;
  const localeManifests = multilingual
    ? await Promise.all((await fs.readdir(path.join(root, "affine"), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => JSON.parse(
          await fs.readFile(path.join(root, "affine", entry.name, "manifest.json"), "utf8"),
        ) as AffineSnapshotManifest))
    : [manifest];
  await fs.mkdir(releasesRoot, { recursive: true, mode: 0o700 });
  await fs.rm(temporary, { recursive: true, force: true });
  await fs.cp(outRoot, temporary, { recursive: true });

  const release = {
    status: "ok",
    releaseId,
    createdAt: new Date().toISOString(),
    locale: multilingual ? "all" : locale,
    locales: localeManifests.map((item) => item.locale),
    snapshotGeneratedAt: localeManifests.map((item) => item.generatedAt).sort().at(-1),
    workspaceId: manifest.workspaceId,
    pages: localeManifests.reduce((total, item) => total + item.pages.length, 0),
    htmlFiles,
  };
  await fs.writeFile(path.join(temporary, "release.json"), `${JSON.stringify(release, null, 2)}\n`);
  await fs.writeFile(path.join(temporary, "health.json"), `${JSON.stringify(release)}\n`);
  await fs.rename(temporary, destination);
  await switchCurrentRelease(destination);

  const entries = await fs.readdir(releasesRoot, { withFileTypes: true });
  const releaseIds = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name);
  for (const obsolete of releasesToPrune(releaseIds, releaseId, positiveInteger(process.env.PUBLISHER_RELEASE_KEEP, 3))) {
    await fs.rm(path.join(releasesRoot, obsolete), { recursive: true, force: true });
  }
  if (multilingual) {
    await run(process.execPath, ["scripts/stage.ts", locale]);
    await run(pnpm, ["exec", "fumadocs-mdx"]);
  }
  console.log(`[release] ${releaseId} is current (${release.pages} pages across ${release.locales.join(", ")}, ${htmlFiles} HTML files).`);
  await run(process.execPath, ["--env-file=.env.publisher", "scripts/publisher-deploy.ts"]);
}

void main().catch(async (error) => {
  await fs.rm(temporary, { recursive: true, force: true }).catch(() => undefined);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
