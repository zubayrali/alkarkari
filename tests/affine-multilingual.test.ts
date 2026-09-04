import { describe, expect, it } from "vitest";
import {
  buildTranslationIndex,
  languageAlternatesForRoute,
  translationKeyFor,
  type AffineLocalesConfig,
} from "../lib/affine/multilingual";

const config: AffineLocalesConfig = {
  locales: [
    { code: "en", label: "English", languageTag: "en", tag: "lang:en", collection: "English" },
    { code: "fr", label: "Français", languageTag: "fr", tag: "lang:fr", collection: "Français" },
  ],
  translations: {
    "articles/what-is-the-tariqa": {
      en: "articles/what-is-the-tariqa",
      fr: "articles/quest-ce-que-la-tariqa",
    },
  },
};

describe("AFFiNE multilingual publishing", () => {
  it("maps localized slugs onto one translation key", () => {
    expect(translationKeyFor(config, "fr", "articles/quest-ce-que-la-tariqa"))
      .toBe("articles/what-is-the-tariqa");
    expect(translationKeyFor(config, "fr", "dictionary/wird"))
      .toBe("dictionary/wird");
  });

  it("builds routes that preserve localized slugs", () => {
    const index = buildTranslationIndex(config, [
      {
        generatedAt: "2026-09-03T00:00:00.000Z",
        source: "affine-mcp",
        workspaceId: "workspace",
        locale: "en",
        pages: [{ id: "en-doc", title: "What is the Tariqa?", slug: "articles/what-is-the-tariqa", translationKey: "articles/what-is-the-tariqa" }],
      },
      {
        generatedAt: "2026-09-03T00:00:00.000Z",
        source: "affine-mcp",
        workspaceId: "workspace",
        locale: "fr",
        pages: [{ id: "fr-doc", title: "Qu'est-ce que la Tariqa ?", slug: "articles/quest-ce-que-la-tariqa", translationKey: "articles/what-is-the-tariqa" }],
      },
    ]);

    expect(index.routes.fr["/articles/quest-ce-que-la-tariqa"])
      .toBe("articles/what-is-the-tariqa");
    expect(index.translations["articles/what-is-the-tariqa"]).toEqual({
      en: "/articles/what-is-the-tariqa",
      fr: "/articles/quest-ce-que-la-tariqa",
    });

    expect(languageAlternatesForRoute(
      index,
      "en",
      "/articles/what-is-the-tariqa",
      "/wiki/en",
    )).toEqual({
      en: "/wiki/en/articles/what-is-the-tariqa",
      fr: "/wiki/fr/articles/quest-ce-que-la-tariqa",
      "x-default": "/wiki/en/articles/what-is-the-tariqa",
    });
  });
});
