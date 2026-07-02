// Build every locale in lib/locales-manifest.ts and stitch the complete
// multi-locale site locally — the same thing CI's matrix + stitch jobs do:
//
//   pnpm build:all              # → site/  (chooser at /, builds at /en/, /fr/, …)
//   npx serve site              # preview at http://localhost:3000
//
// Each locale is staged, built with SITE_LANGUAGE=<x> PAGES_BASE_PATH=/<x>,
// and collected into artifacts/out-<x>; scripts/stitch-deploy.ts then
// assembles site/. Locales without a committed locales/<x>/content tree are
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
    console.error(`\n${cmd} ${args.join(" ")} failed (exit ${result.status}).`);
    process.exit(result.status ?? 1);
  }
}

fs.rmSync(artifacts, { recursive: true, force: true });
fs.mkdirSync(artifacts, { recursive: true });

const built: string[] = [];
for (const { code } of LOCALES) {
  if (!fs.existsSync(path.join(root, "locales", code, "content"))) {
    console.warn(`\n── Skipping "${code}": no locales/${code}/content tree.`);
    continue;
  }
  console.log(`\n── Building locale "${code}" ─────────────────────────────`);
  run("node", ["scripts/stage.ts", code]);
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
  console.error("No locales built.");
  process.exit(1);
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
