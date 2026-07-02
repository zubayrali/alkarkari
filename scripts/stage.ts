// Stage one locale's committed tree into the live (gitignored) content/ and
// public/ dirs that Next.js + fumadocs-mdx read. Runs before dev/build/
// types:check (see package.json). Locale: CLI arg → SITE_LANGUAGE → 'en'.
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

const root = process.cwd();
const sourceContent = path.join(root, "locales", locale, "content");
const sourcePublic = path.join(root, "locales", locale, "public");
const liveContent = path.join(root, "content");
const livePublic = path.join(root, "public");
const marker = path.join(root, ".staged-locale");

if (!fs.existsSync(sourceContent)) {
  console.error(
    `No committed tree for locale "${locale}" (expected locales/${locale}/content).\n` +
      `Run: pnpm generate --locale=${locale}  — or check lib/locales-manifest.ts.`,
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
fs.writeFileSync(marker, `${locale}\n`);

console.log(`Staged locale "${locale}" → content/ + public/`);
