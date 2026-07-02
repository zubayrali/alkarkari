// Regenerate every locale that has a vault configured in .env:
//
//   pnpm generate:all
//
// Runs `pnpm generate --locale=<x>` for each manifest locale whose
// OBSIDIAN_VAULT_PATH_<X> is set (unsuffixed OBSIDIAN_VAULT_PATH counts for
// en). Locales without a vault (e.g. seed-only trees) are left untouched —
// their committed locales/<x>/ content stays as-is.

import { spawnSync } from "node:child_process";
import { LOCALES } from "../lib/locales-manifest.ts";

const withVault = LOCALES.filter(({ code }) => {
  const suffixed = process.env[`OBSIDIAN_VAULT_PATH_${code.toUpperCase()}`];
  return Boolean(suffixed || (code === "en" && process.env.OBSIDIAN_VAULT_PATH));
});

if (withVault.length === 0) {
  console.error(
    "No vaults configured. Set OBSIDIAN_VAULT_PATH_<LOCALE> in .env (e.g. OBSIDIAN_VAULT_PATH_EN).",
  );
  process.exit(1);
}

const skipped = LOCALES.filter((l) => !withVault.includes(l)).map((l) => l.code);
if (skipped.length > 0) {
  console.log(`No vault configured for: ${skipped.join(", ")} — keeping their committed trees.`);
}

for (const { code } of withVault) {
  console.log(`\n── Generating locale "${code}" ───────────────────────────`);
  const result = spawnSync(
    "node",
    ["--env-file=.env", "scripts/generate.ts", `--locale=${code}`],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
