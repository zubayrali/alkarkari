import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildTranslationIndex,
  type AffineLocalesConfig,
} from "../lib/affine/multilingual.ts";
import type { AffineSnapshotManifest } from "../lib/affine/types.ts";

const root = process.cwd();
const configPath = path.resolve(
  root,
  process.env.AFFINE_LOCALES_CONFIG?.trim() || "affine/locales.config.json",
);

function runGenerator(locale: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const environment = { ...process.env, AFFINE_LOCALE: locale };
    delete environment.AFFINE_OUTPUT_ROOT;
    const child = spawn(process.execPath, ["scripts/generate-affine.ts"], {
      cwd: root,
      env: environment,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`AFFiNE ${locale} generation failed (${code ?? signal ?? "unknown"}).`)));
  });
}

async function main() {
  const config = JSON.parse(await fs.readFile(configPath, "utf8")) as AffineLocalesConfig;
  const manifests: AffineSnapshotManifest[] = [];
  for (const locale of config.locales) {
    await runGenerator(locale.code);
    manifests.push(JSON.parse(
      await fs.readFile(path.join(root, "affine", locale.code, "manifest.json"), "utf8"),
    ) as AffineSnapshotManifest);
  }

  const index = buildTranslationIndex(config, manifests);
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  await fs.writeFile(path.join(root, "affine", "translations.json"), serialized);
  for (const locale of config.locales) {
    const publicRoot = path.join(root, "affine", locale.code, "public");
    await fs.mkdir(publicRoot, { recursive: true });
    await fs.writeFile(path.join(publicRoot, "affine-translations.json"), serialized);
  }
  console.log(`Generated ${manifests.length} locale snapshots and their cross-language route map.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
