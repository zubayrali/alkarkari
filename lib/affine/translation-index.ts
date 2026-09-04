import fs from "node:fs";
import path from "node:path";
import type { AffineTranslationIndex } from "./multilingual";

let cached: AffineTranslationIndex | undefined;

export function readAffineTranslationIndex(): AffineTranslationIndex | undefined {
  if (cached) return cached;
  try {
    cached = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "affine", "translations.json"), "utf8"),
    ) as AffineTranslationIndex;
    return cached;
  } catch {
    return undefined;
  }
}
