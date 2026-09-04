import { runPublisherDeploy } from "@affine-fumadocs/publisher/deploy";

async function main() {
  const result = await runPublisherDeploy({ cwd: process.cwd() });
  if (result.skipped) {
    console.log("[deploy] skipped (PUBLISHER_DEPLOY_TARGET=none).");
    return;
  }
  console.log(`[deploy] completed via ${result.target}.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
