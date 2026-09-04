import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  AffinePublicPublishingSnapshot,
  AffinePublishingPortal,
  AffineStudioSnapshot,
} from "./types";
import type { AffineSiteSnapshot } from "./site-content";

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function readPublicPublishingSnapshot(): Promise<AffinePublicPublishingSnapshot | undefined> {
  return readJson(path.join(process.cwd(), "public", "affine-publishing.json"));
}

export async function readAffineSiteSnapshot(): Promise<AffineSiteSnapshot | undefined> {
  return readJson(path.join(process.cwd(), "public", "affine-site.json"));
}

export async function readPublishingPortal(id: string): Promise<AffinePublishingPortal | undefined> {
  return (await readPublicPublishingSnapshot())?.portals.find((portal) => portal.id === id);
}

export async function readAffineStudioSnapshot(locale = process.env.SITE_LANGUAGE || "en"): Promise<AffineStudioSnapshot | undefined> {
  if (!/^[A-Za-z0-9_-]+$/.test(locale)) throw new Error(`Unsafe studio locale: ${locale}`);
  return readJson(path.join(process.cwd(), "affine", locale, "studio.json"));
}
