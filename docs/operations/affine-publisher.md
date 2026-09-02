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

To keep it running across macOS logins and restarts, install the LaunchAgent:

```bash
pnpm publisher:service:install
```

Its logs are stored in `.affine-publisher/logs/`.

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
`Aliases`, `Created`, and `Modified`. Use native AFFiNE tags for tags.

`Draft` prevents publication even when `Publish` is checked.
The internal import manifest is deliberately not published as a reader-facing
page.

## Serving updates

For local development, keep `pnpm dev` running; staged content updates are picked
up by Next.js. For production, run this poller alongside the deployment process
and make its successful refresh trigger your normal build/deploy action. A static
export cannot change until it is rebuilt and redeployed.

## Security

- Keep `.env.publisher`, `.affine-publisher/`, bridge login state, and the poller
  state file out of Git.
- Bind the bridge to loopback or a private network only; never expose `/mcp`
  without HTTPS and authentication.
- Keep `AFFINE_TOOL_PROFILE=read_only`; the publisher only needs list and export
  operations.
- Rotate an expired AFFiNE session by replacing `AFFINE_BLOB_COOKIE` and running
  `launchctl kickstart -k gui/$(id -u)/pro.alkarkari.affine-publisher`.
