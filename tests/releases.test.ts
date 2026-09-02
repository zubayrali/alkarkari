import { describe, expect, it } from "vitest";
import { isSafeReleaseId, releasesToPrune, selectRollbackTarget } from "../lib/affine/releases";

describe("publisher releases", () => {
  it("selects the newest release other than current for rollback", () => {
    expect(selectRollbackTarget(["2026-09-01", "2026-09-02", "2026-09-03"], "2026-09-03")).toBe("2026-09-02");
    expect(selectRollbackTarget(["2026-09-01", "2026-09-02"], "2026-09-02", "2026-09-01")).toBe("2026-09-01");
  });

  it("rejects path traversal and nonexistent requested releases", () => {
    expect(isSafeReleaseId("../outside")).toBe(false);
    expect(selectRollbackTarget(["2026-09-01"], "2026-09-01", "missing")).toBeUndefined();
  });

  it("retains current and the configured newest releases", () => {
    expect(releasesToPrune(["01", "02", "03", "04"], "02", 2)).toEqual(["01"]);
  });
});
