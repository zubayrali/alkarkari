import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { selectRollbackTarget } from "../lib/affine/releases.ts";

const root = process.cwd();
const releasesRoot = path.resolve(root, process.env.PUBLISHER_RELEASE_ROOT?.trim() || path.join(".affine-publisher", "releases"));

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`${command} ${args.join(" ")} failed (${code ?? signal ?? "unknown"}).`)));
  });
}

async function main() {
  const currentLink = path.join(releasesRoot, "current");
  const current = await fs.readlink(currentLink).then(path.basename).catch(() => undefined);
  const entries = await fs.readdir(releasesRoot, { withFileTypes: true });
  const releases = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name);
  const requested = process.argv[2]?.trim();
  const target = selectRollbackTarget(releases, current, requested);
  if (!target) {
    throw new Error(requested
      ? `Release ${requested} does not exist.`
      : "No previous release is available for rollback.");
  }
  const next = path.join(releasesRoot, `.current-${process.pid}`);
  await fs.rm(next, { force: true });
  await fs.symlink(target, next, "dir");
  await fs.rename(next, currentLink);
  console.log(`[rollback] current now points to ${target}. Previous release ${current ?? "unknown"} was retained.`);
  await run(process.execPath, ["--env-file=.env.publisher", "scripts/publisher-deploy.ts"]);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
