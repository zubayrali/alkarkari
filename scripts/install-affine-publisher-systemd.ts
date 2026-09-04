#!/usr/bin/env node
/**
 * Thin wrapper: install the Linux systemd unit shipped by
 * @affine-fumadocs/publisher. Prefer this on a VPS; macOS still uses
 * `pnpm publisher:service:install` (LaunchAgent).
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(root, "..");

function resolveInstaller() {
  try {
    const pkgRoot = path.dirname(require.resolve("@affine-fumadocs/publisher/package.json"));
    return path.join(pkgRoot, "deploy", "install-systemd.sh");
  } catch {
    const sibling = path.resolve(appRoot, "..", "affine-fumadocs-publisher", "deploy", "install-systemd.sh");
    return sibling;
  }
}

const installer = resolveInstaller();
const result = spawnSync("bash", [installer, "--root", appRoot, ...process.argv.slice(2)], {
  cwd: appRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
