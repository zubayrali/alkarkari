import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { generateLocale, localeEnv, localeEnvName } from "./locales.ts";

// Opens the locale's vault: `pnpm obsidian -- --locale=fr` (default: en).
const vaultDir = localeEnv("OBSIDIAN_VAULT_PATH");

if (!vaultDir) {
  console.error(
    `${localeEnvName("OBSIDIAN_VAULT_PATH")} is not set. Add it to .env` +
      (generateLocale === "en" ? " (or set OBSIDIAN_VAULT_PATH)." : "."),
  );
  process.exit(1);
}

try {
  await fs.access(vaultDir);
} catch {
  console.error(`Obsidian vault not found: ${vaultDir}`);
  process.exit(1);
}

const result = spawnSync("open", ["-a", "Obsidian", vaultDir], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
