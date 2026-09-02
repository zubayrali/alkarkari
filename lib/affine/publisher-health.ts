import type { AffineDiagnostic, AffineSnapshotManifest } from "./types";

export type PublisherHealthLevel = "error" | "warning" | "ok";

export interface PublisherHealthCheck {
  level: PublisherHealthLevel;
  code: string;
  message: string;
}

export interface PublisherHealthReport {
  ready: boolean;
  checks: PublisherHealthCheck[];
}

export interface PublisherHealthInput {
  config: {
    workspaceId?: string;
    bridgeUrl?: string;
    blobCookie?: string;
  };
  snapshot?: Pick<AffineSnapshotManifest, "generatedAt" | "pages">;
  diagnostics?: readonly Pick<AffineDiagnostic, "level" | "code" | "message">[];
  bridge?: {
    tokenAvailable: boolean;
    reachable: boolean;
    documentCount?: number;
    error?: string;
  };
  now?: Date;
  maxSnapshotAgeSeconds?: number;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function validBridgeUrl(value: string | undefined): boolean {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value!);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function assessPublisherHealth(input: PublisherHealthInput): PublisherHealthReport {
  const checks: PublisherHealthCheck[] = [];
  const add = (level: PublisherHealthLevel, code: string, message: string) => checks.push({ level, code, message });

  if (!hasText(input.config.workspaceId)) {
    add("error", "AFFINE_WORKSPACE_ID_MISSING", "Set AFFINE_WORKSPACE_ID in .env.publisher.");
  }
  if (!validBridgeUrl(input.config.bridgeUrl)) {
    add("error", "AFFINE_BRIDGE_URL_INVALID", "Set AFFINE_BRIDGE_MCP_URL to a valid HTTP(S) endpoint.");
  }
  if (!hasText(input.config.blobCookie)) {
    add("error", "AFFINE_BLOB_COOKIE_MISSING", "Set a complete signed-in AFFINE Cookie header so the bridge and attachments can be read.");
  }

  if (!input.snapshot) {
    add("error", "AFFINE_SNAPSHOT_MISSING", "No AFFINE snapshot exists yet. Start pnpm publisher:watch and wait for its first refresh.");
  } else {
    if (input.snapshot.pages.length === 0) {
      add("error", "AFFINE_SNAPSHOT_EMPTY", "The AFFINE snapshot contains no publishable documents.");
    }
    const generatedAt = new Date(input.snapshot.generatedAt);
    if (Number.isNaN(generatedAt.valueOf())) {
      add("error", "AFFINE_SNAPSHOT_TIMESTAMP_INVALID", "The snapshot manifest has an invalid generatedAt timestamp.");
    } else {
      const maxAge = input.maxSnapshotAgeSeconds ?? 15 * 60;
      const ageSeconds = Math.max(0, (input.now ?? new Date()).valueOf() - generatedAt.valueOf()) / 1_000;
      if (ageSeconds > maxAge) {
        add("warning", "AFFINE_SNAPSHOT_STALE", `The snapshot is ${Math.floor(ageSeconds / 60)} minutes old; check the publisher service.`);
      }
    }
  }

  const diagnostics = input.diagnostics ?? [];
  const blocking = diagnostics.filter((item) => item.level === "error");
  if (blocking.length > 0) {
    add("error", "AFFINE_SNAPSHOT_DIAGNOSTICS", `${blocking.length} blocking publisher diagnostic${blocking.length === 1 ? "" : "s"} found.`);
  }
  const warnings = diagnostics.filter((item) => item.level === "warning");
  if (warnings.length > 0) {
    add("warning", "AFFINE_SNAPSHOT_WARNINGS", `${warnings.length} publisher warning${warnings.length === 1 ? "" : "s"} found; inspect affine/<locale>/diagnostics.json.`);
  }

  if (input.bridge) {
    if (!input.bridge.tokenAvailable) {
      add("error", "AFFINE_BRIDGE_TOKEN_MISSING", "The local bridge token is missing. Start pnpm publisher:watch to create and supervise the bridge.");
    } else if (!input.bridge.reachable) {
      add("error", "AFFINE_BRIDGE_UNREACHABLE", input.bridge.error ?? "The local AFFINE bridge did not respond.");
    } else if (input.bridge.documentCount === 0) {
      add("warning", "AFFINE_WORKSPACE_EMPTY", "The bridge is healthy but returned no active AFFINE documents.");
    }
  }

  if (checks.length === 0) add("ok", "AFFINE_PUBLISHER_READY", "AFFINE publishing is configured, the bridge is reachable, and the snapshot is healthy.");
  return { ready: !checks.some((item) => item.level === "error"), checks };
}
