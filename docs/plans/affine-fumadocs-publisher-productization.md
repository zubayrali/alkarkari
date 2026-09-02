# Productization plan: AFFiNE Fumadocs Publisher

## Phase 0 — freeze the boundary (this change)

- Record the two-repository architecture and v0.1 supported-content contract.
- Update stale Karkari documentation that still presents YAML/official MCP as
  the active publisher path.
- Bootstrap a separate local `affine-fumadocs-publisher` repository without
  moving or deleting Alkarkari content.

Exit: both repositories have distinct responsibilities and no public-facing
document instructs users to copy Alkarkari workspace configuration.

## Phase 1 — extract the publisher module

- Move the normalized page types, markdown/link normalization, bridge MCP client,
  blob materializer, atomic snapshot writer, poller, and service supervisor into
  the public package.
- Replace environment-only hardcoding with a typed config file and documented
  hook interface for site-specific transforms.
- Make `alkarkari-affine` consume a pinned local/package version of the module.

Exit: Alkarkari generation uses the package through its public interface, with
no copy of publisher implementation remaining in the private repository.

Progress: native metadata/configuration, the streamable bridge MCP client, and
atomic/content-addressed blob snapshot primitives are now extracted and consumed
by Alkarkari. Polling and read-only service supervision are also extracted;
Fumadocs-neutral snapshot serialization remains to be moved.

## Phase 2 — release hardening

- Add fixture workspace exports and tests for properties, tags, links, blobs,
  blocked diagnostics, and atomic failure preservation.
- Add CI, semantic versioning, changelog, LICENSE, SECURITY, CONTRIBUTING, and
  dependency/license audit.
- Add Docker and systemd examples plus a deployment hook contract.

Exit: a clean checkout publishes fixture content without a personal AFFiNE
workspace, browser cookie, or macOS-only tooling.

## Phase 3 — publish v0.1

- Create the public Git remote and issue templates.
- Publish the package or provide a release tarball/template.
- Document the supported AFFiNE version and bridge version range.
- Run the release checklist against a separate non-Alkarkari test workspace.

## Explicitly deferred

Native Edgeless rendering, Bases/database rendering, a hosted multi-tenant
service, real-time reader updates, official AFFiNE OAuth integration, and
automatic body-YAML cleanup are separate proposals after v0.1.
