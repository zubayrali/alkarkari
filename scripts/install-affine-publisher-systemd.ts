#!/usr/bin/env node
/**
 * Thin wrapper: install the Linux systemd unit shipped by
 * @affine-fumadocs/publisher. Prefer this on a VPS; macOS still uses
 * `pnpm publisher:service:install` (LaunchAgent).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(root, "..");

function resolveInstaller() {
  const candidates: string[] = [];
  try {
    const pkgRoot = path.dirname(require.resolve("@affine-fumadocs/publisher/package.json"));
    candidates.push(path.join(pkgRoot, "deploy", "install-systemd.sh"));
  } catch {
    try {
      const entry = require.resolve("@affine-fumadocs/publisher");
      candidates.push(
        path.resolve(path.dirname(entry), "../../deploy/install-systemd.sh"),
        path.resolve(path.dirname(entry), "../../../deploy/install-systemd.sh"),
        path.resolve(path.dirname(entry), "../deploy/install-systemd.sh"),
      );
    } catch {
      // sibling checkout below
    }
  }
  candidates.push(
    path.resolve(appRoot, "node_modules/@affine-fumadocs/publisher/deploy/install-systemd.sh"),
    path.resolve(appRoot, "..", "affine-fumadocs-publisher", "deploy", "install-systemd.sh"),
  );
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[candidates.length - 1]!;
}

const installer = resolveInstaller();
const result = spawnSync("bash", [installer, "--root", appRoot, ...process.argv.slice(2)], {
  cwd: appRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
