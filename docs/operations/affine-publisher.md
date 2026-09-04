# AFFiNE near-real-time publisher

This worker implements the publication path below. It keeps AFFiNE collaboration
private to AFFiNE and continuously materializes a Fumadocs snapshot for readers.

```text
AFFiNE → affine-mcp-server → publisher poller → affine/en snapshot → Next.js
```

The bridge uses document IDs and `updatedAt` metadata to detect a change. On a
change it regenerates the AFFiNE snapshot and stages it into `content/` and
`public/`. It never exposes AFFiNE credentials to the browser.

## One-time local setup

Install the bridge CLI and configure `.env.publisher` from its example. The
service uses the complete signed-in browser Cookie header supplied as
`AFFINE_BLOB_COOKIE` for both private blob downloads and bridge authentication.

```bash
npm install -g affine-mcp-server
cp .env.publisher.example .env.publisher
```

Run the local supervised service:

```bash
pnpm publisher:watch
```

On its first run, it creates an ignored, owner-readable random bridge token at
`.affine-publisher/bridge.token`, starts `affine-mcp` on loopback in read-only
mode, waits for its health endpoint, and then starts the poller. The token never
needs to be pasted into `.env.publisher`.

Before relying on the public site, run the readiness check:

```bash
pnpm publisher:doctor
```

It checks configuration without printing secrets, verifies that the local bridge
can enumerate the workspace, and reports snapshot age plus any blocking or
warning diagnostics. A non-zero exit means the public snapshot should not be
treated as current.

To keep it running across macOS logins and restarts, install the LaunchAgent:

```bash
pnpm publisher:service:install
```

Its logs are stored in `.affine-publisher/logs/`.

The installer supplies common macOS package-manager paths to the LaunchAgent.
If `pnpm` lives elsewhere, set `PUBLISHER_PNPM_BIN` in `.env.publisher` to the
absolute path reported by `command -v pnpm`, then restart the service.

The first check generates a snapshot. Later checks publish only when the
workspace metadata fingerprint changes. The poll interval cannot be below 15
seconds; 45–60 seconds is the recommended range for a small self-hosted setup.

## Native publication metadata

The publisher reads native AFFiNE document properties as its authoritative
publication metadata. Imported legacy YAML remains in each document body only
as a rollback copy; it is not the source used for bridge-mode publishing.

For a new document to appear on the website, set these native properties in
AFFiNE: `Slug`, `Locale` (usually `en`), and `Publish` (checked). Optional
properties include `Description`, `Draft`, `Unlisted`, `Featured`, `Order`,
`Aliases`, `Created`, `Modified`, and `Homepage Section`. Use native
AFFiNE tags for tags.

`Draft` prevents publication even when `Publish` is checked.
The internal import manifest is deliberately not published as a reader-facing
page.

### Authoring flow

1. Create and collaboratively edit the page in AFFiNE.
2. Give it a stable `Slug`, choose `Locale`, and write the reader-facing
   `Description`.
3. Leave `Publish` unchecked while the page is being reviewed; `Draft` is a
   hard safety lock and always wins over `Publish`.
4. When an editor approves it, check `Publish`. The worker will include it on
   its next refresh.

Use AFFiNE's native tags for topical classification. Do not add YAML metadata to
the body of new documents: legacy YAML from the Obsidian import is ignored by
bridge publishing and removed from the public article.

### Curating the homepage

The homepage is generated from the same immutable public snapshot as the reader
pages. Set `Featured` on a published document to place it in the featured
selection. For more explicit control, set `Homepage Section` to:

- `Featured` to include the document in the featured selection.
- `Start Here` to make it the primary introductory route.
- `Hidden` to exclude it from all automatic homepage selections.

`Order` controls the order of featured documents. Recently updated content
uses AFFiNE's document modification time automatically, and key terms are drawn
from published `dictionary/*` routes. Draft and private documents can never
enter homepage data.

## Serving updates

For local development, keep `pnpm dev` running; staged content updates are picked
up by Next.js. For production, run this poller alongside the deployment process
and make its successful refresh trigger your normal build/deploy action. A static
export cannot change until it is rebuilt and redeployed.

### Local production releases

Set `PUBLISHER_RELEASE_ON_CHANGE=1` to run the production gates after each
successful AFFiNE refresh. The same flow can be run manually:

```bash
pnpm publisher:release
```

The command requires a healthy publisher, then runs tests, lint, and the static
production build. Only a successful build becomes an immutable release under
`.affine-publisher/releases/<release-id>`. The `current` symlink switches
atomically after all gates pass, so a static server can safely serve:

```text
/absolute/path/to/alkarkari-affine/.affine-publisher/releases/current
```

Each release contains `health.json` and `release.json` with its snapshot time and
page counts. Three releases are retained by default. To switch `current` back to
the previous build without deleting either release:

```bash
pnpm publisher:rollback
```

An explicit release ID may be supplied as the final argument. This local release
path is intended for Caddy, nginx, or another static server on the self-hosted
machine; GitHub Pages / Cloudflare Pages can also receive the release through
the deploy hook below.

## Deploy hook (GitHub Pages now, Cloudflare later)

After a successful `pnpm publisher:release` (and after rollback), the publisher
runs `scripts/publisher-deploy.ts`.

```dotenv
PUBLISHER_DEPLOY_TARGET=github-pages
PUBLISHER_DEPLOY_GITHUB_REPO=zubayrali/alkarkari
PUBLISHER_DEPLOY_GITHUB_BRANCH=gh-pages
PUBLISHER_DEPLOY_GITHUB_TOKEN=...
```

Repo setting: Pages → Deploy from a branch → `gh-pages` / root.

To move to Cloudflare Pages later, change only:

```dotenv
PUBLISHER_DEPLOY_TARGET=cloudflare-pages
PUBLISHER_DEPLOY_CF_PROJECT=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

See `affine-fumadocs-publisher` docs/vps-publisher.md for the shared contract.

## Security

- Keep `.env.publisher`, `.affine-publisher/`, bridge login state, and the poller
  state file out of Git.
- Bind the bridge to loopback or a private network only; never expose `/mcp`
  without HTTPS and authentication.
- Keep `AFFINE_TOOL_PROFILE=read_only`; the publisher only needs list and export
  operations.
- Rotate an expired AFFiNE session by replacing `AFFINE_BLOB_COOKIE` and
  restarting the publisher unit (`systemctl --user restart affine-publisher`
  on Linux, or `launchctl kickstart -k gui/$(id -u)/pro.alkarkari.affine-publisher`
  on macOS).

## Linux VPS (systemd)

On the same machine as AFFiNE:

```bash
pnpm install
cp .env.publisher.example .env.publisher   # fill secrets + deploy token
pnpm publisher:systemd:install             # user unit + linger
pnpm publisher:doctor
```

Full runbook (Docker AFFiNE, Pages branch mode, Cloudflare swap): see the
linked package doc `docs/vps-publisher.md` in `@affine-fumadocs/publisher`.
macOS still uses `pnpm publisher:service:install` (LaunchAgent).
