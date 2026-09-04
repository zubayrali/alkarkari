import { spawn, type ChildProcess } from "node:child_process";
import { readFile, rm, unlink, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_LOCALE, LOCALES } from "../lib/locales-manifest.ts";

const forwardedArgs = process.argv.slice(2);
const localeRequestPath = path.join(process.cwd(), ".dev-locale-request");
const devSessionPath = path.join(process.cwd(), ".affine-dev-session.json");
const supportedLocales = new Set(LOCALES.map(locale => locale.code));

// The current Fumadocs loader still uses Node's deprecated module.register()
// API. Apply this once so Next/Fumadocs workers inherit the targeted policy.
process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS,
  "--disable-warning=DEP0205",
]
  .filter(Boolean)
  .join(" ");

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
    });

    child.once("error", reject);
    child.once("exit", code => resolve(code ?? 1));
  });
}

function canListen(port: number) {
  return new Promise<boolean>(resolve => {
    const server = net.createServer();

    server.unref();
    server.once("error", () => resolve(false));
    // Next binds to the IPv6 wildcard by default (and accepts IPv4 too), so
    // probe the same address to avoid reporting a false-positive free port.
    server.listen({ host: "::", ipv6Only: false, port }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(start = 3000, end = 3999) {
  for (let port = start; port <= end; port += 1) {
    if (await canListen(port)) return port;
  }

  throw new Error(`No available development port found between ${start} and ${end}.`);
}

async function consumeRequestedLocale(fallback: string) {
  try {
    const locale = (await readFile(localeRequestPath, "utf8")).trim();
    await unlink(localeRequestPath);
    return supportedLocales.has(locale) ? locale : fallback;
  } catch {
    return fallback;
  }
}

async function readStagedLocale() {
  try {
    const marker = (await readFile(path.join(process.cwd(), ".staged-locale"), "utf8")).trim();
    const locale = marker.split(":").at(-1) || "";
    return supportedLocales.has(locale) ? locale : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

const fumadocsBin = fileURLToPath(
  new URL("../node_modules/fumadocs-mdx/bin.js", import.meta.url),
);
const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const port = await findAvailablePort();

let locale = supportedLocales.has(process.env.SITE_LANGUAGE || "")
  ? process.env.SITE_LANGUAGE!
  : await consumeRequestedLocale(await readStagedLocale());

for (;;) {
  const localeEnv = {
    ...process.env,
    SITE_LANGUAGE: locale,
    AFFINE_DEV_SUPERVISOR_PID: String(process.pid),
  };

  await writeFile(
    devSessionPath,
    `${JSON.stringify({ pid: process.pid, port, locale })}\n`,
    "utf8",
  );

  const stageExitCode = await run(process.execPath, ["scripts/stage.ts", locale], localeEnv);
  if (stageExitCode !== 0) process.exit(stageExitCode);

  await Promise.all([
    rm(new URL("../.source", import.meta.url), { recursive: true, force: true }),
    rm(new URL("../.next", import.meta.url), { recursive: true, force: true }),
  ]);

  const sourceExitCode = await run(process.execPath, [fumadocsBin], localeEnv);
  if (sourceExitCode !== 0) process.exit(sourceExitCode);

  console.log(`\nStarting AFFiNE collection "${locale}" at http://localhost:${port}\n`);

  let switchingLocale = false;
  let stopping = false;
  let child: ChildProcess;
  const stopChild = () => {
    if (!child.pid) return;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  };
  const requestSwitch = () => {
    switchingLocale = true;
    stopChild();
  };
  const requestStop = () => {
    stopping = true;
    stopChild();
  };

  child = spawn(
    process.execPath,
    [nextBin, "dev", "--port", String(port), ...forwardedArgs],
    { stdio: "inherit", env: localeEnv, detached: true },
  );
  process.once("SIGUSR2", requestSwitch);
  process.once("SIGINT", requestStop);
  process.once("SIGTERM", requestStop);

  const devExitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 0));
  });
  process.off("SIGUSR2", requestSwitch);
  process.off("SIGINT", requestStop);
  process.off("SIGTERM", requestStop);

  if (stopping || !switchingLocale) {
    await unlink(devSessionPath).catch(() => undefined);
    process.exit(devExitCode);
  }
  locale = await consumeRequestedLocale(locale);
  console.log(`\nSwitching to AFFiNE collection "${locale}"…\n`);
}
