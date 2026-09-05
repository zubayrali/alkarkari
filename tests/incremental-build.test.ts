import { describe, expect, it } from "vitest";
import {
  localesChanged,
  parseBuildLocales,
  planLocaleBuilds,
} from "../lib/affine/incremental-build";

describe("parseBuildLocales", () => {
  it("treats empty as auto", () => {
    expect(parseBuildLocales(undefined)).toBeUndefined();
    expect(parseBuildLocales("")).toBeUndefined();
    expect(parseBuildLocales("  ")).toBeUndefined();
  });

  it("accepts all aliases and comma lists", () => {
    expect(parseBuildLocales("all")).toBe("all");
    expect(parseBuildLocales("*")).toBe("all");
    expect(parseBuildLocales("en, fr,en")).toEqual(["en", "fr"]);
  });
});

describe("localesChanged", () => {
  it("rebuilds every locale when nothing was released yet", () => {
    expect(localesChanged(undefined, { en: "a", fr: "b" }, ["en", "fr"])).toEqual(["en", "fr"]);
  });

  it("returns only locales whose fingerprint moved", () => {
    expect(localesChanged(
      { en: "a", fr: "b", cn: "c" },
      { en: "a2", fr: "b", cn: "c" },
      ["en", "fr", "cn"],
    )).toEqual(["en"]);
  });
});

describe("planLocaleBuilds", () => {
  it("rebuilds everything when changed is all", () => {
    expect(planLocaleBuilds({
      localeCodes: ["en", "fr"],
      changed: "all",
      availableArtifacts: ["en", "fr"],
    })).toEqual({ build: ["en", "fr"], reuse: [] });
  });

  it("reuses cached outs for unchanged locales", () => {
    expect(planLocaleBuilds({
      localeCodes: ["en", "fr", "cn"],
      changed: ["en"],
      availableArtifacts: ["en", "fr", "cn"],
    })).toEqual({ build: ["en"], reuse: ["fr", "cn"] });
  });

  it("forces rebuild when a cached out is missing", () => {
    expect(planLocaleBuilds({
      localeCodes: ["en", "fr"],
      changed: [],
      availableArtifacts: ["en"],
    })).toEqual({ build: ["fr"], reuse: ["en"] });
  });
});
