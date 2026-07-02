// One-shot migration to the isolated-locales layout
// (docs/superpowers/specs/2026-07-02-i18n-design.md):
//
//   content/  → locales/en/content/
//   public/   → locales/en/public/
//
// Handles both orders of operations:
//  - Fresh migration: renames the root dirs into locales/en/.
//  - `pnpm generate --locale=en` already ran (locales/en exists): rescues the
//    hand-maintained preserved files (graph.mdx, index.mdx) from the stale
//    root tree if locales/en lacks them, then deletes the stale roots — they
//    are committed in git history, so nothing is lost.
//
// Run with `pnpm locales:migrate`, then `pnpm stage && pnpm dev`.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const marker = path.join(root, ".staged-locale");
const PRESERVED = ["graph.mdx", "index.mdx"];

const rootContent = path.join(root, "content");
const rootPublic = path.join(root, "public");
const enContent = path.join(root, "locales", "en", "content");
const enPublic = path.join(root, "locales", "en", "public");

if (fs.existsSync(marker)) {
  console.log("Already migrated (found .staged-locale marker). Nothing to do.");
  process.exit(0);
}

if (!fs.existsSync(rootContent) && !fs.existsSync(rootPublic)) {
  console.log("No root content/ or public/ to migrate. Nothing to do.");
  process.exit(0);
}

for (const [from, to] of [
  [rootContent, enContent],
  [rootPublic, enPublic],
] as const) {
  const rel = (p: string) => path.relative(root, p);

  if (!fs.existsSync(from)) {
    fs.mkdirSync(to, { recursive: true });
    console.log(`Skip: ${rel(from)} does not exist (created empty ${rel(to)}).`);
    continue;
  }

  if (!fs.existsSync(to)) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    console.log(`Moved ${rel(from)} → ${rel(to)}`);
    continue;
  }

  // Both exist: locales/en was already generated. Rescue hand-maintained
  // preserved files the generator never writes, then drop the stale root copy.
  if (from === rootContent) {
    for (const name of PRESERVED) {
      const src = path.join(from, name);
      const dest = path.join(to, name);
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`Rescued hand-maintained ${name} → ${rel(dest)}`);
      }
    }
  }
  fs.rmSync(from, { recursive: true, force: true });
  console.log(`Removed stale ${rel(from)} (already generated at ${rel(to)}; git has the history).`);
}

console.log(
  "\nDone. Next steps:\n" +
    "  1. git add locales .gitignore\n" +
    "  2. pnpm stage      # re-creates the live content/ + public/ from locales/en\n" +
    "  3. pnpm dev",
);
