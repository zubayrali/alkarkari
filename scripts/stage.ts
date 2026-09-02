// Stage one locale's committed tree into the live (gitignored) content/ and
// public/ dirs that Next.js + fumadocs-mdx read. Runs before dev/build/
// types:check (see package.json). Locale: CLI arg → SITE_LANGUAGE → 'en'.
// AFFiNE is the cutover default. CONTENT_SOURCE=obsidian is retained only as an
// explicit comparison mode against the frozen locales/<locale> snapshot.
//
//   pnpm stage            # stages en (or $SITE_LANGUAGE)
//   pnpm stage cn         # stages cn
//
// A .staged-locale marker records what's live so accidental cross-locale
// mixes are impossible (the previous stage is fully removed first).

import fs from "node:fs";
import path from "node:path";

const DEFAULT_LOCALE = "en";

const arg = process.argv[2];
const locale = arg && !arg.startsWith("-") ? arg : process.env.SITE_LANGUAGE || DEFAULT_LOCALE;
const contentSource = process.env.CONTENT_SOURCE === "obsidian" ? "obsidian" : "affine";

const root = process.cwd();
const sourceRoot = path.join(root, contentSource === "affine" ? "affine" : "locales", locale);
const sourceContent = path.join(sourceRoot, "content");
const sourcePublic = path.join(sourceRoot, "public");
const liveContent = path.join(root, "content");
const livePublic = path.join(root, "public");
const marker = path.join(root, ".staged-locale");

function displaySegment(segment: string): string {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ensureFolderIndexes(folder: string, relative = ""): void {
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  const childFolders = entries.filter((entry) => entry.isDirectory());
  for (const child of childFolders) {
    ensureFolderIndexes(path.join(folder, child.name), path.posix.join(relative, child.name));
  }

  if (!relative || entries.some((entry) => entry.isFile() && entry.name === "index.mdx")) {
    return;
  }
  const pageNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name.slice(0, -".mdx".length));
  const items = [...pageNames, ...childFolders.map((entry) => entry.name)];
  if (items.length === 0) return;

  const title = displaySegment(relative.split("/").at(-1)!);
  const links = items
    .sort((a, b) => a.localeCompare(b))
    .map((item) => `- [${displaySegment(item)}](/${relative}/${item})`)
    .join("\n");
  fs.writeFileSync(
    path.join(folder, "index.mdx"),
    `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(`Published AFFiNE pages in ${title}.`)}\ncontentSource: affine\ngeneratedIndex: true\n---\n\n# ${title}\n\n${links}\n`,
  );
}

if (!fs.existsSync(sourceContent)) {
  console.error(
    `No ${contentSource} tree for locale "${locale}" (expected ${path.relative(root, sourceContent)}).\n` +
      (contentSource === "affine"
        ? `Run: AFFINE_LOCALE=${locale} pnpm generate:affine`
        : `Run: pnpm generate --locale=${locale}  — or check lib/locales-manifest.ts.`),
  );
  process.exit(1);
}

// If content/ exists but was never staged, it's a pre-migration working tree —
// refuse rather than delete someone's un-migrated files.
if (fs.existsSync(liveContent) && !fs.existsSync(marker)) {
  console.error(
    "content/ exists but no .staged-locale marker found.\n" +
      "If you haven't migrated to the locales/ layout yet, run: pnpm locales:migrate",
  );
  process.exit(1);
}

fs.rmSync(liveContent, { recursive: true, force: true });
fs.rmSync(livePublic, { recursive: true, force: true });
fs.cpSync(sourceContent, liveContent, { recursive: true });
if (fs.existsSync(sourcePublic)) {
  fs.cpSync(sourcePublic, livePublic, { recursive: true });
} else {
  fs.mkdirSync(livePublic, { recursive: true });
}
if (contentSource === "affine") {
  ensureFolderIndexes(liveContent);
}
fs.writeFileSync(marker, `${contentSource}:${locale}\n`);

console.log(`Staged ${contentSource} locale "${locale}" → content/ + public/`);
