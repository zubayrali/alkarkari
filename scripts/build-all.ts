// Build every locale in lib/locales-manifest.ts and stitch the complete
// multi-locale site locally — the same thing CI's matrix + stitch jobs do:
//
//   pnpm build:all              # → site/  (chooser at /, builds at /en/, /fr/, …)
//   npx serve site              # preview at http://localhost:3000
//
// Each AFFiNE locale snapshot is staged, built with SITE_LANGUAGE=<x> PAGES_BASE_PATH=/<x>,
// and collected into artifacts/out-<x>; scripts/stitch-deploy.ts then
// assembles site/. Locales without a generated affine/<x>/content tree are
// skipped with a warning. Sequential on purpose — next build is resource-
// hungry and the runs share .next/.
//
// Incremental releases (publisher):
//   PUBLISHER_BUILD_LOCALES=en,fr   # force those locales
//   PUBLISHER_BUILD_LOCALES=all     # force every locale
//   (unset)                         # use .affine-publisher/changed-locales.json
// Unchanged locales reuse artifacts/out-<x> (or .affine-publisher/build-cache/).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  TRANSLATIONS_BASENAME,
  buildCacheDir,
  planLocaleBuilds,
  resolveChangedLocales,
} from "../lib/affine/incremental-build.ts";
import { LOCALES } from "../lib/locales-manifest.ts";

const root = process.cwd();
const artifacts = path.join(root, "artifacts");
const cacheRoot = buildCacheDir(root);
// Optional repo prefix (CI uses /<repo>); empty for local preview.
const base = process.env.BASE_PATH ?? "";

function run(cmd: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      // pnpm's deps check tries to purge node_modules without a TTY.
      CI: process.env.CI ?? "true",
      ...env,
    },
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (exit ${result.status}).`);
  }
}

function localBin(name: string): string {
  return path.join(root, "node_modules", ".bin", name);
}

function ensureArtifact(code: string): boolean {
  const dest = path.join(artifacts, `out-${code}`);
  if (fs.existsSync(path.join(dest, "index.html"))) return true;
  const cached = path.join(cacheRoot, `out-${code}`);
  if (!fs.existsSync(path.join(cached, "index.html"))) return false;
  fs.mkdirSync(artifacts, { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(cached, dest, { recursive: true });
  console.log(`── Restored "${code}" from build-cache`);
  return true;
}

function saveBuildCache(code: string): void {
  const src = path.join(artifacts, `out-${code}`);
  if (!fs.existsSync(path.join(src, "index.html"))) return;
  const dest = path.join(cacheRoot, `out-${code}`);
  fs.mkdirSync(cacheRoot, { recursive: true, mode: 0o700 });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

function patchTranslations(codes: string[]): void {
  for (const code of codes) {
    const src = path.join(root, "affine", code, "public", TRANSLATIONS_BASENAME);
    const dest = path.join(artifacts, `out-${code}`, TRANSLATIONS_BASENAME);
    if (!fs.existsSync(src) || !fs.existsSync(path.join(artifacts, `out-${code}`))) continue;
    fs.copyFileSync(src, dest);
  }
}

const restoreLocale =
  process.env.AFFINE_LOCALE?.trim() ||
  process.env.SITE_LANGUAGE?.trim() ||
  "en";

async function main() {
  const candidates = LOCALES
    .map(({ code }) => code)
    .filter((code) => fs.existsSync(path.join(root, "affine", code, "content")));

  if (candidates.length === 0) {
    throw new Error("No locales built.");
  }

  const { changed, source } = await resolveChangedLocales(
    root,
    candidates,
    process.env.PUBLISHER_BUILD_LOCALES,
  );

  fs.mkdirSync(artifacts, { recursive: true });

  const availableArtifacts = candidates.filter((code) => ensureArtifact(code));
  const plan = planLocaleBuilds({
    localeCodes: candidates,
    changed,
    availableArtifacts,
  });

  console.log(
    `\n── Incremental plan (${source}): build [${plan.build.join(", ") || "—"}]` +
      `; reuse [${plan.reuse.join(", ") || "—"}]`,
  );

  for (const code of plan.build) {
    fs.rmSync(path.join(artifacts, `out-${code}`), { recursive: true, force: true });
  }

  const built: string[] = [...plan.reuse];
  for (const code of plan.build) {
    console.log(`\n── Building locale "${code}" ─────────────────────────────`);
    run("node", ["scripts/stage.ts", code]);
    // Staging replaces the entire content tree. Regenerate Fumadocs' static
    // import manifest before Next reads it, otherwise it imports paths from
    // the previously staged locale. Call local bins directly — `pnpm exec`
    // triggers a deps-status install check that breaks under systemd (no TTY).
    run(localBin("fumadocs-mdx"), []);
    run(localBin("next"), ["build"], {
      SITE_LANGUAGE: code,
      PAGES_BASE_PATH: `${base}/${code}`,
    });
    fs.cpSync(path.join(root, "out"), path.join(artifacts, `out-${code}`), {
      recursive: true,
    });
    saveBuildCache(code);
    built.push(code);
  }

  for (const code of plan.reuse) {
    saveBuildCache(code);
  }

  if (built.length === 0) {
    throw new Error("No locales built.");
  }

  // Keep locale switcher maps fresh even when a locale's Next build was skipped.
  patchTranslations(built);

  console.log(`\n── Stitching ${built.join(", ")} → site/ ──────────────────`);
  run("node", ["scripts/stitch-deploy.ts"], {
    BASE_PATH: base,
    SITE_ORIGIN: process.env.SITE_ORIGIN ?? "",
  });

  console.log(
    `\nDone. Preview the full multi-locale site:\n` +
      `  npx serve site\n` +
      `then open http://localhost:3000${base}/ (chooser) or ${base}/${built[0]}/`,
  );
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    // build:all shares the repository with the development server. Always leave
    // both the staged files and Fumadocs manifest on the same locale—even when a
    // locale build fails halfway through.
    try {
      run("node", ["scripts/stage.ts", restoreLocale]);
      run(localBin("fumadocs-mdx"), []);
    } catch (error) {
      console.error(`Failed to restore development locale "${restoreLocale}":`, error);
      process.exitCode = 1;
    }
  });
