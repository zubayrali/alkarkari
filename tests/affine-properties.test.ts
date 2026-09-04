import { describe, expect, it } from "vitest";
import { metadataFromAllAffineProperties } from "../lib/affine/properties";

describe("AFFiNE custom-property mapping", () => {
  it("maps publication controls and preserves every editorial property", () => {
    expect(
      metadataFromAllAffineProperties(
        {
          Title: "The Daily Wird",
          Slug: "dictionary/wird",
          Locale: "en",
          Publish: true,
          Draft: false,
          Arabic: "ورد",
          "Root letters": "و ر د",
          Category: "Practice",
          "Reading level": 2,
          Reviewed: true,
          "Source date": "2026-09-02",
        },
        "Wird",
      ),
    ).toEqual({
      title: "The Daily Wird",
      slug: "dictionary/wird",
      locale: "en",
      publish: true,
      draft: false,
      Arabic: "ورد",
      "Root letters": "و ر د",
      Category: "Practice",
      "Reading level": 2,
      Reviewed: true,
      "Source date": "2026-09-02",
      affineProperties: {
        Title: "The Daily Wird",
        Slug: "dictionary/wird",
        Locale: "en",
        Publish: true,
        Draft: false,
        Arabic: "ورد",
        "Root letters": "و ر د",
        Category: "Practice",
        "Reading level": 2,
        Reviewed: true,
        "Source date": "2026-09-02",
      },
    });
  });

  it("uses the native Title property ahead of the AFFiNE document name", () => {
    const metadata = metadataFromAllAffineProperties(
      { Title: "On Faqr: The Secret of the Path", Slug: "articles/on-faqr" },
      "on-faqr",
    );

    expect(metadata.title).toBe("On Faqr: The Secret of the Path");
    expect(metadata.slug).toBe("articles/on-faqr");
  });

  it("uses legacy-prefixed controls only as fallbacks and never publishes duplicates", () => {
    const metadata = metadataFromAllAffineProperties(
      {
        "Karkari Slug": "old-path",
        Slug: "clean-path",
        "Karkari Publish": true,
        "Karkari Arabic": "ذكر",
      },
      "Dhikr",
    );

    expect(metadata.slug).toBe("clean-path");
    expect(metadata.publish).toBe(true);
    expect(metadata.Arabic).toBe("ذكر");
    expect(metadata.affineProperties).toEqual({
      Slug: "clean-path",
      Publish: true,
      Arabic: "ذكر",
    });
    expect(Object.keys(metadata).some((key) => key.startsWith("Karkari "))).toBe(false);
  });
});
