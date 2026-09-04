import { describe, expect, it } from "vitest";
import en from "../content-site/en.json";
import {
  compileAffineSiteContent,
  isSiteControlPage,
  serializeHomepageSettings,
} from "../lib/affine/site-content";
import type { SiteStrings } from "../lib/site-strings";
import type { AffinePublicationPage } from "../lib/affine/types";

const fallback = en satisfies SiteStrings;

function settingsPage(markdown: string): AffinePublicationPage {
  return {
    id: "homepage-en",
    title: "Homepage · English",
    slug: "_site/homepage",
    locale: "en",
    markdown,
    linkedDocumentIds: [],
    metadata: {
      publish: true,
      draft: false,
      "Content Type": "Site Homepage",
    },
  };
}

describe("AFFiNE site content", () => {
  it("round-trips every homepage string through the AFFiNE table format", () => {
    const markdown = serializeHomepageSettings(fallback);
    const result = compileAffineSiteContent({
      locale: "en",
      generatedAt: "2026-09-04T00:00:00.000Z",
      fallback,
      page: settingsPage(markdown),
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.snapshot.heroTagline).toBe(fallback.heroTagline);
    expect(result.snapshot.home).toEqual(fallback.home);
  });

  it("overrides known fields and safely falls back for missing fields", () => {
    const result = compileAffineSiteContent({
      locale: "en",
      generatedAt: "2026-09-04T00:00:00.000Z",
      fallback,
      page: settingsPage([
        "| Field | Value |",
        "| --- | --- |",
        "| heroTagline | Edited in AFFiNE |",
        "| home.footerLine | Edited footer |",
        "| made.up | ignored |",
      ].join("\n")),
    });

    expect(result.snapshot.heroTagline).toBe("Edited in AFFiNE");
    expect(result.snapshot.home.footerLine).toBe("Edited footer");
    expect(result.snapshot.home.enter).toBe(fallback.home.enter);
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      "AFFINE_HOMEPAGE_FIELD_UNKNOWN",
      "AFFINE_HOMEPAGE_FIELD_MISSING",
    ]);
  });

  it("recognizes control documents from native or nested AFFiNE properties", () => {
    expect(isSiteControlPage(settingsPage(""))).toBe(true);
    const page = settingsPage("");
    delete page.metadata["Content Type"];
    page.metadata.affineProperties = { "Content Type": "site-homepage" };
    expect(isSiteControlPage(page)).toBe(true);
  });
});
