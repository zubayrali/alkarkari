// Slug-parity report across the committed locale trees:
//
//   pnpm locales:report
//
// v2 i18n dropped slug-parity ENFORCEMENT (isolated builds, no cross-locale
// coupling — see docs/superpowers/specs/2026-07-02-i18n-design.md). But the
// path-preserving locale switcher (components/locale-switcher.tsx) reads best
// when the same slug exists in every locale: switching /en/dictionary/wird → fr
// lands on real content only if fr has that slug, otherwise the 404 handler
// bounces the reader to that locale's /start-here.
//
// This report is WARN-ONLY — it never fails a build. It just lists slugs that
// exist in some locales but not others, so translators can see what's left to
// converge. Reads the committed locales/<x>/content trees directly (no build).

import fs from "node:fs";
import path from "node:path";
import { LOCALES } from "../lib/locales-manifest.ts";

const root = process.cwd();

/** content-relative .mdx path → URL slug (folder index → folder; root index → ""). */
function toSlug(rel: string): string {
  const noExt = rel.replace(/\.mdx$/, "");
  if (noExt === "index") return "";
  return noExt.replace(/\/index$/, "");
}

/** All content slugs for a locale, or null if it has no committed tree. */
function localeSlugs(code: string): Set<string> | null {
  const dir = path.join(root, "locales", code, "content");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".mdx"));
  return new Set(files.map((f) => toSlug(f.split(path.sep).join("/"))));
}

const present = new Map<string, Set<string>>(); // locale code → slugs
for (const { code } of LOCALES) {
  const slugs = localeSlugs(code);
  if (slugs) present.set(code, slugs);
}

const codes = [...present.keys()];
if (codes.length < 2) {
  console.log(
    `Only ${codes.length} committed locale tree(s) found — nothing to compare.`,
  );
  process.exit(0);
}

// slug → set of locales that have it
const bySlug = new Map<string, Set<string>>();
for (const [code, slugs] of present) {
  for (const slug of slugs) {
    (bySlug.get(slug) ?? bySlug.set(slug, new Set()).get(slug)!).add(code);
  }
}

const total = codes.length;
const gaps = [...bySlug.entries()]
  .filter(([, has]) => has.size < total)
  .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));

console.log(`Locale slug-parity report — ${codes.join(", ")}`);
for (const code of codes) {
  console.log(`  ${code}: ${present.get(code)!.size} slugs`);
}
console.log(`  shared by all ${total}: ${bySlug.size - gaps.length} slugs\n`);

if (gaps.length === 0) {
  console.log("✓ Every slug exists in every locale — full parity.");
  process.exit(0);
}

console.log(`${gaps.length} slug(s) not present in all locales:\n`);
for (const [slug, has] of gaps) {
  const missing = codes.filter((c) => !has.has(c));
  const label = slug === "" ? "(home /)" : `/${slug}`;
  console.log(`  ${label}`);
  console.log(`      has: ${[...has].join(", ")}   missing: ${missing.join(", ")}`);
}
console.log(
  `\nWarn-only: switching to a locale missing a slug redirects to /start-here.`,
);
