import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const label = "pro.alkarkari.affine-publisher";
const root = process.cwd();
const launchAgents = path.join(homedir(), "Library", "LaunchAgents");
const plistPath = path.join(launchAgents, `${label}.plist`);
const logs = path.join(root, ".affine-publisher", "logs");
const domain = `gui/${process.getuid()}`;

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function main() {
  await mkdir(launchAgents, { recursive: true });
  await mkdir(logs, { recursive: true, mode: 0o700 });
  const args = [process.execPath, "--env-file=.env.publisher", path.join(root, "scripts", "affine-publisher-service.ts")]
    .map((value) => `<string>${escapeXml(value)}</string>`)
    .join("");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${args}</array>
<key>WorkingDirectory</key><string>${escapeXml(root)}</string>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>${escapeXml(path.join(logs, "publisher.log"))}</string>
<key>StandardErrorPath</key><string>${escapeXml(path.join(logs, "publisher-error.log"))}</string>
</dict></plist>`;
  await writeFile(plistPath, plist, { mode: 0o600 });
  try { execFileSync("launchctl", ["bootout", domain, plistPath], { stdio: "ignore" }); } catch { /* not installed yet */ }
  execFileSync("launchctl", ["bootstrap", domain, plistPath]);
  execFileSync("launchctl", ["kickstart", "-k", `${domain}/${label}`]);
  console.log(`Installed ${label}. Logs: ${logs}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
