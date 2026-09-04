import { describe, expect, it } from "vitest";
import { buildEntryChrome, usesNightThreshold } from "../lib/entry-chrome";

describe("entry chrome", () => {
  it("normalizes an ordinary entry and promotes real Arabic metadata", () => {
    const chrome = buildEntryChrome({
      slugs: ["dictionary", "zikr"],
      data: {
        title: " Zikr ",
        description: " Remembrance. ",
        arabic: " ذِكْر ",
        aliases: ["Dhikr", " ", 42],
        tags: ["practice", "daily"],
      },
    });

    expect(chrome).toMatchObject({
      kind: "entry",
      sectionLabel: "Dictionary",
      title: "Zikr",
      description: "Remembrance.",
      arabic: "ذِكْر",
      aliases: ["Dhikr"],
      tags: ["practice", "daily"],
    });
    expect([...chrome.promotedPropertyKeys]).toEqual(["arabic", "aliases"]);
    expect(usesNightThreshold(chrome.kind)).toBe(true);
  });

  it("does not invent Arabic when the property is missing or blank", () => {
    for (const arabic of [undefined, null, "   "]) {
      const chrome = buildEntryChrome({
        slugs: ["books", "a-book"],
        data: { title: "A Book", arabic },
      });

      expect(chrome.arabic).toBeUndefined();
      expect([...chrome.promotedPropertyKeys]).toEqual([]);
    }
  });

  it("reads native AFFiNE Arabic metadata", () => {
    const chrome = buildEntryChrome({
      slugs: ["dictionary", "wird"],
      data: {
        title: "Wird",
        affineProperties: { Arabic: " وِرْد " },
      },
    });

    expect(chrome.arabic).toBe("وِرْد");
  });

  it("recovers an imported Arabic label from the article introduction", () => {
    const chrome = buildEntryChrome({
      slugs: ["dictionary", "ism-al-mufrad"],
      data: { title: "Ism al-Mufrad" },
      bodyText: '**Ism al-Mufrad** (Arabic: اسم المُفرَد, "the Singular Name")',
    });

    expect(chrome.arabic).toBe("اسم المُفرَد");
  });

  it("identifies the tags index independently of generated metadata", () => {
    const chrome = buildEntryChrome({
      slugs: ["tags"],
      data: { title: "Tags", base: true, tagPage: true },
    });

    expect(chrome.kind).toBe("tags-index");
    expect(chrome.sectionLabel).toBe("Index of subjects");
    expect(usesNightThreshold(chrome.kind)).toBe(true);
  });

  it("gives Base-backed tag pages the threshold exception", () => {
    const chrome = buildEntryChrome({
      slugs: ["tags", "practice"],
      data: { title: "#practice", base: true, tagPage: true },
    });

    expect(chrome.kind).toBe("tag-page");
    expect(chrome.sectionLabel).toBe("Tag");
    expect(usesNightThreshold(chrome.kind)).toBe(true);
  });

  it.each([
    { slugs: ["bases", "reading"], data: { title: "Reading", base: true } },
    { slugs: ["graph"], data: { title: "Graph", full: true } },
  ])("keeps specialized pages outside the reader shell", (input) => {
    const chrome = buildEntryChrome(input);

    expect(chrome.kind).toBe("specialized");
    expect(usesNightThreshold(chrome.kind)).toBe(false);
  });
});
