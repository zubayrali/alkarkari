import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const runtimeDir = path.join(root, '.affine-publisher');
const servicePath = [
  path.join(os.homedir(), '.local', 'bin'),
  path.join(os.homedir(), '.local', 'share', 'pnpm'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  process.env.PATH,
].filter(Boolean).join(':');

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in .env.publisher.`);
  return value;
}

function affineMcpCommand(): string {
  const candidates = [
    process.env.AFFINE_MCP_BIN?.trim(),
    '/opt/homebrew/bin/affine-mcp',
    '/usr/local/bin/affine-mcp',
    'affine-mcp',
  ].filter((candidate): candidate is string => Boolean(candidate));
  return candidates.find(candidate => candidate === 'affine-mcp' || existsSync(candidate)) ?? 'affine-mcp';
}

async function bridgeToken(): Promise<string> {
  const tokenPath = path.join(runtimeDir, 'bridge.token');
  await mkdir(runtimeDir, { recursive: true, mode: 0o700 });
  try {
    const token = (await readFile(tokenPath, 'utf8')).trim();
    if (token) return token;
  } catch {
    // Create the local-only MCP boundary token below.
  }
  const token = randomBytes(32).toString('base64url');
  await writeFile(tokenPath, `${token}\n`, { mode: 0o600 });
  return token;
}

async function canListen(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port }, () => server.close(() => resolve(true)));
  });
}

async function availablePort(): Promise<number> {
  for (let port = 3334; port <= 3399; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error('No free loopback port is available for the AFFiNE authoring bridge.');
}

async function waitForHealth(port: number, bridge: ChildProcess): Promise<void> {
  const url = `http://127.0.0.1:${port}/healthz`;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (bridge.exitCode !== null) throw new Error('The AFFiNE authoring bridge exited before becoming ready.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // Startup race; retry briefly.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`The AFFiNE authoring bridge did not become healthy at ${url}.`);
}

async function run(): Promise<void> {
  const script = process.argv[2];
  if (!script || !script.startsWith('scripts/') || !existsSync(path.join(root, script))) {
    throw new Error('Usage: run-affine-authoring.ts scripts/<command>.ts');
  }

  const cookie = required('AFFINE_BLOB_COOKIE');
  const token = await bridgeToken();
  const port = await availablePort();
  const endpoint = `http://127.0.0.1:${port}/mcp`;
  const environment = {
    ...process.env,
    PATH: servicePath,
    AFFINE_BASE_URL: process.env.AFFINE_BASE_URL?.trim() || 'http://localhost:3010',
    AFFINE_COOKIE: cookie,
    AFFINE_MCP_HTTP_TOKEN: token,
    AFFINE_TOOL_PROFILE: 'authoring',
    AFFINE_LOGIN_AT_START: 'sync',
    MCP_TRANSPORT: 'http',
    PORT: String(port),
  };

  const bridge = spawn(affineMcpCommand(), [], {
    cwd: root,
    env: environment,
    // Keep explicit command receipts readable; bridge failures still surface.
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const stop = () => bridge.kill('SIGTERM');
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    await waitForHealth(port, bridge);
    const command = spawn(process.execPath, [script, ...process.argv.slice(3)], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        AFFINE_BRIDGE_MCP_URL: endpoint,
        AFFINE_BRIDGE_MCP_TOKEN: token,
      },
    });
    const exitCode = await new Promise<number>((resolve, reject) => {
      command.once('error', reject);
      command.once('exit', code => resolve(code ?? 1));
    });
    if (exitCode !== 0) process.exitCode = exitCode;
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    bridge.kill('SIGTERM');
  }
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
