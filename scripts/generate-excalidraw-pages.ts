import fs from "node:fs/promises";
import path from "node:path";
import { readVaultFiles } from "fumadocs-obsidian";
import { parseExcalidraw } from "../lib/excalidraw-parser.ts";
import type { StepProgress } from "./progress.ts";

const contentDir = "content";
const publicDir = "public";
const excalidrawPublicDir = path.join(publicDir, "excalidraw");

function humanizeTitle(name: string): string {
  return name
    .replace(/\.excalidraw(\.md)?$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toContentPath(vaultRelativePath: string): string {
  const withoutExt = vaultRelativePath.replace(/\.excalidraw(\.md)?$/, "");
  return path.join(contentDir, `${withoutExt}.mdx`);
}

function toJsonPublicPath(vaultRelativePath: string): string {
  const withoutExt = vaultRelativePath.replace(/\.excalidraw(\.md)?$/, "");
  return path.join(excalidrawPublicDir, `${withoutExt}.json`);
}

function toPublicSrc(vaultRelativePath: string): string {
  const withoutExt = vaultRelativePath.replace(/\.excalidraw(\.md)?$/, "");
  return `/excalidraw/${withoutExt}.json`;
}

function buildExcalidrawMdx(title: string, src: string): string {
  return `---
title: ${JSON.stringify(title)}
description: Excalidraw Drawing
full: true
---
import { ExcalidrawPageContent } from "@/components/excalidraw-view";

<ExcalidrawPageContent src=${JSON.stringify(src)} />
`;
}

export async function syncExcalidrawFromVault(
  vaultDir: string,
  include: string[],
  step?: StepProgress,
) {
  const vaultFiles = await readVaultFiles({ dir: vaultDir, include });
  const excalidrawFiles = vaultFiles.filter(
    (f) =>
      f.path.endsWith(".excalidraw.md") || f.path.endsWith(".excalidraw"),
  );

  if (excalidrawFiles.length === 0) {
    step?.skip("No excalidraw files found");
    return 0;
  }

  step?.start(excalidrawFiles.length);
  let written = 0;

  for (const file of excalidrawFiles) {
    const content = typeof file.content === "string"
      ? file.content
      : file.content.toString("utf8");

    const data = parseExcalidraw(content, file.path);
    if (!data) {
      step?.advance(`${file.path} (skipped: parse failed)`);
      continue;
    }

    const jsonPath = toJsonPublicPath(file.path);
    const mdxPath = toContentPath(file.path);
    const title = humanizeTitle(path.basename(file.path));
    const src = toPublicSrc(file.path);

    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(data));

    await fs.mkdir(path.dirname(mdxPath), { recursive: true });
    await fs.writeFile(mdxPath, buildExcalidrawMdx(title, src));

    written++;
    step?.advance(file.path);
  }

  step?.complete(
    `Generated ${written} excalidraw page${written === 1 ? "" : "s"}`,
  );

  return written;
}
