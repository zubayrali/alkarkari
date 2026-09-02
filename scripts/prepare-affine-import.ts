import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

interface MigrationPage {
  sourcePath: string;
  title: string;
  slug: string;
  publish: boolean;
  draft: boolean;
}

interface MigrationReport {
  generatedAt: string;
  sourceRoot: string;
  outputRoot: string;
  pages: MigrationPage[];
  copiedAssets: string[];
  preservedUnsupported: string[];
  excluded: string[];
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredArgument(name: string): string {
  const value = argument(name)?.trim();
  if (!value) throw new Error(`--${name} is required`);
  return value;
}

function parseFrontmatter(markdown: string): {
  metadata: Record<string, unknown>;
  content: string;
} {
  const match = markdown.match(
    /^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/,
  );
  if (!match) return { metadata: {}, content: markdown };
  const parsed = yaml.load(match[1] ?? "");
  return {
    metadata:
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {},
    content: markdown.slice(match[0].length),
  };
}

function isTrue(value: unknown): boolean {
  return value === true || value === "true";
}

function slugPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

function pathSlug(relativePath: string): string {
  return relativePath
    .replace(/\.md$/i, "")
    .split("/")
    .map(slugPart)
    .join("/");
}

function inferTitle(
  metadata: Record<string, unknown>,
  content: string,
  relativePath: string,
): string {
  if (typeof metadata.title === "string" && metadata.title.trim()) {
    return metadata.title.trim();
  }
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  return path.basename(relativePath, path.extname(relativePath));
}

function publicationBlock(metadata: Record<string, unknown>): string {
  return `\`\`\`yaml affine-publication\n${yaml.dump(metadata, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  })}\`\`\``;
}

async function walk(root: string, relative = ""): Promise<string[]> {
  const directory = path.join(root, relative);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.posix.join(relative, entry.name);
    if (
      relative === "" &&
      (entry.name === ".obsidian" || entry.name === ".git")
    ) {
      continue;
    }
    if (entry.name === ".DS_Store") continue;
    if (entry.isDirectory()) files.push(...(await walk(root, child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

async function main() {
  const sourceRoot = path.resolve(requiredArgument("source"));
  const outputRoot = path.resolve(requiredArgument("output"));
  const locale = argument("locale")?.trim() || "en";
  const files = await walk(sourceRoot);
  const temporary = `${outputRoot}.tmp-${process.pid}-${Date.now()}`;
  const pages: MigrationPage[] = [];
  const copiedAssets: string[] = [];
  const preservedUnsupported: string[] = [];

  await fs.rm(temporary, { recursive: true, force: true });
  await fs.mkdir(temporary, { recursive: true });

  for (const relativePath of files) {
    const source = path.join(sourceRoot, relativePath);
    const destination = path.join(temporary, relativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });

    if (/\.md$/i.test(relativePath)) {
      const markdown = await fs.readFile(source, "utf8");
      const parsed = parseFrontmatter(markdown);
      const draft = isTrue(parsed.metadata.draft);
      const title = inferTitle(parsed.metadata, parsed.content, relativePath);
      const slug =
        typeof parsed.metadata.slug === "string" && parsed.metadata.slug.trim()
          ? parsed.metadata.slug.trim()
          : pathSlug(relativePath);
      const metadata = {
        ...parsed.metadata,
        title,
        slug,
        locale,
        publish: !draft,
        draft,
        sourcePath: relativePath,
        contentSource: "affine-import",
      };
      await fs.writeFile(
        destination,
        `${publicationBlock(metadata)}\n\n${parsed.content.trim()}\n`,
      );
      pages.push({ sourcePath: relativePath, title, slug, publish: !draft, draft });
      continue;
    }

    await fs.copyFile(source, destination);
    copiedAssets.push(relativePath);
    if (/\.(?:base|canvas)$/i.test(relativePath)) {
      preservedUnsupported.push(relativePath);
    }
  }

  const manifestMetadata = {
    title: "Alkarkari AFFiNE Publication Manifest",
    slug: "affine-publication-manifest",
    locale,
    publish: true,
    unlisted: true,
    order: -1000,
    contentSource: "affine-import",
  };
  const manifestLinks = pages
    .map((page) => `- [[${page.sourcePath.replace(/\.md$/i, "")}|${page.title}]]`)
    .join("\n");
  await fs.writeFile(
    path.join(temporary, "00-affine-publication-manifest.md"),
    `${publicationBlock(manifestMetadata)}\n\n# Alkarkari AFFiNE Publication Manifest\n\n${manifestLinks}\n`,
  );

  const report: MigrationReport = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    outputRoot,
    pages,
    copiedAssets,
    preservedUnsupported,
    excluded: [".obsidian/**", ".git/**", ".DS_Store"],
  };
  await fs.writeFile(
    path.join(temporary, "affine-migration-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.rename(temporary, outputRoot);
  console.log(
    `Prepared ${pages.length} notes and ${copiedAssets.length} assets for AFFiNE at ${outputRoot}`,
  );
  if (preservedUnsupported.length > 0) {
    console.warn(
      `Preserved ${preservedUnsupported.length} Canvas/Base source files for migration diagnostics.`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
