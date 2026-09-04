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

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LOCALES } from "../lib/locales-manifest.ts";

const root = process.cwd();
const artifacts = path.join(root, "artifacts");
// Optional repo prefix (CI uses /<repo>); empty for local preview.
const base = process.env.BASE_PATH ?? "";

function run(cmd: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (exit ${result.status}).`);
  }
}

const restoreLocale =
  process.env.AFFINE_LOCALE?.trim() ||
  process.env.SITE_LANGUAGE?.trim() ||
  "en";

try {
  fs.rmSync(artifacts, { recursive: true, force: true });
  fs.mkdirSync(artifacts, { recursive: true });

  const built: string[] = [];
  for (const { code } of LOCALES) {
    if (!fs.existsSync(path.join(root, "affine", code, "content"))) {
      console.warn(`\n── Skipping "${code}": no affine/${code}/content snapshot.`);
      continue;
    }
    console.log(`\n── Building locale "${code}" ─────────────────────────────`);
    run("node", ["scripts/stage.ts", code]);
    // Staging replaces the entire content tree. Regenerate Fumadocs' static
    // import manifest before Next reads it, otherwise it imports paths from
    // the previously staged locale.
    run("pnpm", ["exec", "fumadocs-mdx"]);
    run("pnpm", ["exec", "next", "build"], {
      SITE_LANGUAGE: code,
      PAGES_BASE_PATH: `${base}/${code}`,
    });
    fs.cpSync(path.join(root, "out"), path.join(artifacts, `out-${code}`), {
      recursive: true,
    });
    built.push(code);
  }

  if (built.length === 0) {
    throw new Error("No locales built.");
  }

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
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  // build:all shares the repository with the development server. Always leave
  // both the staged files and Fumadocs manifest on the same locale—even when a
  // locale build fails halfway through.
  try {
    run("node", ["scripts/stage.ts", restoreLocale]);
    run("pnpm", ["exec", "fumadocs-mdx"]);
  } catch (error) {
    console.error(`Failed to restore development locale "${restoreLocale}":`, error);
    process.exitCode = 1;
  }
}
