// Assembles the final GitHub Pages site from N isolated locale builds
// (docs/superpowers/specs/2026-07-02-i18n-design.md):
//
//   artifacts/out-en, artifacts/out-fr, …  (downloaded build artifacts)
//     → site/en/, site/fr/, …
//   deploy/root/*                           → site/   ({{BASE_PATH}} substituted)
//   legacy redirect stubs                   → site/<old-path>/index.html → /en/<old-path>/
//   sitemap index + robots.txt              → site/
//
// Env: BASE_PATH (e.g. /alkarkari), SITE_ORIGIN (e.g. https://user.github.io),
//      ARTIFACTS_DIR (default artifacts), OUT_DIR (default site).

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const basePath = process.env.BASE_PATH ?? "";
const origin = process.env.SITE_ORIGIN ?? "";
const artifactsDir = path.join(root, process.env.ARTIFACTS_DIR ?? "artifacts");
const outDir = path.join(root, process.env.OUT_DIR ?? "site");
const rootAssetsDir = path.join(root, "deploy", "root");
const DEFAULT_LOCALE = "en";

// ── 1. Discover locale builds ────────────────────────────────────────────────
const locales = fs
  .readdirSync(artifactsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.startsWith("out-"))
  .map((e) => e.name.slice("out-".length))
  .sort();

if (locales.length === 0) {
  console.error(`No out-<locale> directories found in ${artifactsDir}`);
  process.exit(1);
}
console.log(`Stitching locales: ${locales.join(", ")}`);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// ── 2. Place each locale build under its subpath ────────────────────────────
for (const locale of locales) {
  fs.cpSync(path.join(artifactsDir, `out-${locale}`), path.join(outDir, locale), {
    recursive: true,
  });
}

// ── 3. Root assets (locale chooser, 404, favicon…) with placeholder substitution
if (fs.existsSync(rootAssetsDir)) {
  for (const entry of fs.readdirSync(rootAssetsDir, { withFileTypes: true })) {
    const src = path.join(rootAssetsDir, entry.name);
    const dest = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else if (/\.(html|txt|xml|css|js)$/.test(entry.name)) {
      const text = fs.readFileSync(src, "utf8").replaceAll("{{BASE_PATH}}", basePath);
      fs.writeFileSync(dest, text);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// ── 4. Legacy redirect stubs: pre-i18n URLs → default locale ────────────────
// The site used to live at the repo root; every old page path gets a
// meta-refresh stub pointing into /<default-locale>/. Handles both export
// layouts: flat (`foo.html`, the current trailingSlash:false output) and
// directory (`foo/index.html`). Removable after a deprecation window.
function collectPageRoutes(dir: string, rel = ""): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (rel === "" && (entry.name === "_next" || entry.name === "404.html")) continue;
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const child = path.join(dir, entry.name);
      if (fs.existsSync(path.join(child, "index.html"))) routes.push(childRel);
      routes.push(...collectPageRoutes(child, childRel));
    } else if (entry.name.endsWith(".html") && entry.name !== "index.html") {
      routes.push(childRel.slice(0, -".html".length));
    }
  }
  return routes;
}

function redirectStub(target: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${target}"><title>Redirecting…</title></head><body><a href="${target}">Continue to ${target}</a></body></html>\n`;
}

const defaultOut = path.join(outDir, DEFAULT_LOCALE);
let stubs = 0;
if (fs.existsSync(defaultOut)) {
  for (const rel of new Set(collectPageRoutes(defaultOut))) {
    if (locales.includes(rel.split("/")[0])) continue; // never shadow a locale dir
    // Flat stub file: GitHub Pages serves site/<rel>.html at /<rel>, exactly
    // like the pre-i18n deployment did.
    const stubFile = path.join(outDir, `${rel}.html`);
    if (fs.existsSync(stubFile) || fs.existsSync(path.join(outDir, rel, "index.html"))) continue;
    fs.mkdirSync(path.dirname(stubFile), { recursive: true });
    fs.writeFileSync(stubFile, redirectStub(`${basePath}/${DEFAULT_LOCALE}/${rel}`));
    stubs++;
  }
}
console.log(`Wrote ${stubs} legacy redirect stubs → /${DEFAULT_LOCALE}/…`);

// ── 5. Sitemap index + robots.txt ────────────────────────────────────────────
const sitemaps = locales
  .filter((l) => fs.existsSync(path.join(outDir, l, "sitemap.xml")))
  .map((l) => `  <sitemap><loc>${origin}${basePath}/${l}/sitemap.xml</loc></sitemap>`)
  .join("\n");
fs.writeFileSync(
  path.join(outDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`,
);
if (!fs.existsSync(path.join(outDir, "robots.txt"))) {
  fs.writeFileSync(
    path.join(outDir, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}${basePath}/sitemap.xml\n`,
  );
}

console.log(`Site assembled at ${path.relative(root, outDir)}/`);
