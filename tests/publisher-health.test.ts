import { describe, expect, it } from "vitest";
import { assessPublisherHealth } from "../lib/affine/publisher-health";

describe("AFFiNE publisher health", () => {
  const config = {
    workspaceId: "workspace",
    bridgeUrl: "http://127.0.0.1:3333/mcp",
    blobCookie: "affine_session=example",
  };
  const snapshot = { generatedAt: "2026-09-02T00:00:00.000Z", pages: [{ id: "doc", title: "Page", slug: "page" }] };

  it("accepts a reachable bridge and fresh, clean snapshot", () => {
    const report = assessPublisherHealth({
      config,
      snapshot,
      diagnostics: [],
      bridge: { tokenAvailable: true, reachable: true, documentCount: 1 },
      now: new Date("2026-09-02T00:05:00.000Z"),
    });
    expect(report.ready).toBe(true);
    expect(report.checks[0]?.code).toBe("AFFINE_PUBLISHER_READY");
  });

  it("blocks release readiness when setup, snapshot, or bridge are unavailable", () => {
    const report = assessPublisherHealth({
      config: {},
      diagnostics: [{ level: "error", code: "AFFINE_DUPLICATE_SLUG", message: "Duplicate slug" }],
      bridge: { tokenAvailable: false, reachable: false },
    });
    expect(report.ready).toBe(false);
    expect(report.checks.map((check) => check.code)).toEqual(expect.arrayContaining([
      "AFFINE_WORKSPACE_ID_MISSING",
      "AFFINE_SNAPSHOT_MISSING",
      "AFFINE_BRIDGE_TOKEN_MISSING",
      "AFFINE_SNAPSHOT_DIAGNOSTICS",
    ]));
  });

  it("warns about a stale snapshot without hiding a healthy configuration", () => {
    const report = assessPublisherHealth({
      config,
      snapshot,
      bridge: { tokenAvailable: true, reachable: true, documentCount: 1 },
      now: new Date("2026-09-02T00:30:00.000Z"),
      maxSnapshotAgeSeconds: 60,
    });
    expect(report.ready).toBe(true);
    expect(report.checks.map((check) => check.code)).toContain("AFFINE_SNAPSHOT_STALE");
  });
});
