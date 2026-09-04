import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { AffinePublishingStatus } from "./types";
import { readAffineStudioSnapshot } from "./publishing-snapshot";

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function readAffinePublishingStatus(
  locale = process.env.SITE_LANGUAGE || "en",
): Promise<AffinePublishingStatus> {
  const root = process.cwd();
  // Keep route-handler file tracing statically scoped. Custom worker paths are
  // intentionally a service concern; the local Studio reads conventional paths.
  const runtimePath = path.join(root, ".affine-publisher-runtime.json");
  const statePath = path.join(root, ".affine-publisher-state.json");
  const releasesRoot = path.join(root, ".affine-publisher", "releases");
  const [snapshot, runtime, state, release] = await Promise.all([
    readAffineStudioSnapshot(locale),
    readJson<AffinePublishingStatus["runtime"]>(runtimePath),
    readJson<{ updatedAt?: string }>(statePath),
    readJson<AffinePublishingStatus["release"]>(path.join(releasesRoot, "current", "release.json")),
  ]);
  return {
    snapshot,
    runtime: {
      state: runtime?.state ?? "offline",
      ...runtime,
      lastChangeAt: state?.updatedAt,
    },
    release,
  };
}
