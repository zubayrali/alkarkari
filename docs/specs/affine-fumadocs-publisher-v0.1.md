# AFFiNE Fumadocs Publisher v0.1

Status: approved product boundary. This document replaces the Karkari-specific
publication contract for future reusable publisher work.

## Product

`affine-fumadocs-publisher` is an open-source publishing engine that turns a
selected AFFiNE workspace subset into a deterministic local Fumadocs/MDX
snapshot. It is not a headless CMS, an AFFiNE editor, or a hosted service.

```text
AFFiNE authoring workspace
  -> authenticated AFFiNE bridge adapter
  -> publisher snapshot module
  -> content/, public/, manifest.json, diagnostics.json
  -> a consumer-owned Fumadocs application
```

Readers never access AFFiNE or publisher credentials. AFFiNE remains the
collaborative source of truth; the snapshot is a rebuildable deployment
artifact.

## Repository boundary

| Repository | Owns | Does not own |
| --- | --- | --- |
| `affine-fumadocs-publisher` | bridge adapter, native metadata contract, snapshot generation, media download, poller, deployment examples, fixtures, CLI/API docs | a site's design, private notes, branding, access-control policy, hosted service |
| `alkarkari-affine` | Alkarkari Fumadocs UI, routes, styling, protected-content policy, workspace configuration, deployment and content | reusable publisher internals |
| `alkarkari` | immutable Obsidian rollback/reference | active publication workflow |

The publisher module has a small interface: configuration in, stable MDX/media
snapshot plus diagnostics out. Site-specific transforms are opt-in hooks rather
than hard-coded behaviour.

## v0.1 supported content

The release contract covers text documents, headings, Markdown links, native
AFFiNE tags, the native publication properties below, Markdown images, and
`affine://blob` media downloaded into content-addressed public assets. It emits
Fumadocs-compatible MDX, a page manifest, and diagnostics.

v0.1 deliberately does not claim native rendering of Edgeless canvases, Bases,
database views, kanban boards, formulas, or arbitrary embedded applications.
Those documents must produce a diagnostic and a configurable fallback link or
preview. Native canvas rendering is a future major feature, not a silent loss.

## Native AFFiNE publication contract

The generic names are workspace custom properties, not YAML body fields:

- Required: `Slug`, `Locale`, `Publish`
- Optional: `Description`, `Draft`, `Unlisted`, `Featured`, `Order`, `Aliases`,
  `Created`, `Modified`
- Tags: native AFFiNE workspace tags

`Publish` must be true and `Draft` must not be true. A missing or duplicate slug
is a blocking diagnostic. A consumer can extend frontmatter but cannot weaken
these publication safety rules.

## Configuration and security

The CLI accepts an explicit configuration file or environment variables; no
workspace ID, URL, locale, project name, or filesystem path is baked into the
package. Secrets are runtime-only:

- bridge endpoint and a separate bridge bearer token;
- AFFiNE authentication supplied to the local bridge, never to browser code;
- an optional AFFiNE Cookie header solely for private blob materialization.

The maintained local service binds the bridge to loopback, runs it read-only,
creates a per-install bridge token, exposes health checks, and persists only a
non-secret change fingerprint. Container and systemd examples are release
requirements; macOS LaunchAgent is an optional local adapter.

## Compatibility and release rules

- Pin and test the supported `affine-mcp-server` version range behind one bridge
  adapter module.
- The official AFFiNE workspace MCP remains an optional explicit-snapshot
  adapter; it is not the polling default.
- Every release has fixture-based unit and end-to-end tests that require no
  personal workspace or credential.
- The public repository contains no generated Alkarkari content, import maps,
  browser cookies, workspace IDs, or private media.
- The first public release is `0.1.0` under MIT, retaining required upstream
  notices and documenting third-party bridge dependency ownership.

## Definition of done for launch

1. A clean Fumadocs app can initialize a config, run one snapshot command, and
   serve a fixture workspace without Alkarkari code.
2. A poller refreshes only after a fixture change and exposes a successful health
   state; failed refreshes preserve the prior snapshot.
3. Documents, links, properties, tags, and blob fixtures are deterministic and
   covered by CI on supported Node versions.
4. Docker and systemd quickstarts work; the macOS service remains documented as
   an optional local convenience.
5. README, security policy, contribution guide, license, changelog, and release
   checklist are present and free of user-specific configuration.
