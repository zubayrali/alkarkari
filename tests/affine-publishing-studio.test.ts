import { describe, expect, it } from "vitest";
import {
  buildPublishingStudio,
  parsePublishingStudioConfig,
} from "../lib/affine/publishing-studio";
import type { AffinePublicationPage } from "../lib/affine/types";

function page(overrides: Partial<AffinePublicationPage> = {}): AffinePublicationPage {
  return {
    id: "published-1",
    title: "A published book",
    slug: "books/a-published-book",
    locale: "en",
    markdown: "# A published book",
    linkedDocumentIds: [],
    metadata: {
      publish: true,
      draft: false,
      description: "A useful description",
      tags: ["book"],
      "Translation Key": "book-one",
      affineProperties: { "Book Cover": "/covers/book.jpg", Secret: "never" },
    },
    ...overrides,
  };
}

const config = parsePublishingStudioConfig({
  version: 1,
  editorial: { recommendedProperties: ["Description", "Translation Key"] },
  portals: [{
    id: "books",
    route: "/books/",
    label: "Books",
    collection: "Language · English",
    slugPrefix: "books",
    layout: "library",
    properties: ["Book Cover"],
  }],
});

describe("AFFiNE publishing studio", () => {
  it("normalizes config routes and rejects unsafe portal ids", () => {
    expect(config.portals[0]?.route).toBe("books");
    expect(() => parsePublishingStudioConfig({ version: 1, portals: [{ id: "Bad ID", route: "x", label: "x", collection: "x" }] })).toThrow();
  });

  it("maps collection members into a property allow-listed public portal", () => {
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T00:00:00.000Z",
      pages: [page()],
      documents: [{ id: "published-1", properties: { Publish: true, Draft: false } }],
      collections: [{ id: "en", name: "Language · English", allowList: ["published-1"] }],
      localeCollections: [{ code: "en", collection: "Language · English" }],
    });
    const published = result.publicSnapshot.portals[0]?.pages[0];
    expect(published?.href).toBe("/books/a-published-book");
    expect(published?.properties).toEqual({ "Book Cover": "/covers/book.jpg" });
    expect(published?.properties).not.toHaveProperty("Secret");
  });

  it("builds a safe AFFiNE-curated homepage feed", () => {
    const featured = page({
      metadata: {
        ...page().metadata,
        featured: true,
        modified: "2026-09-03T12:00:00.000Z",
        affineProperties: {
          "Homepage Section": "Featured",
          Secret: "never",
        },
      },
    });
    const term = page({
      id: "term-1",
      title: "Dhikr",
      slug: "dictionary/dhikr",
      metadata: {
        publish: true,
        modified: "2026-09-03T13:00:00.000Z",
        description: "Remembrance",
      },
    });
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T14:00:00.000Z",
      pages: [featured, term],
      documents: [],
      collections: [{ id: "en", name: "Language · English", allowList: [featured.id, term.id] }],
      localeCollections: [{ code: "en", collection: "Language · English" }],
    });
    expect(result.publicSnapshot.homepage.featured[0]).toMatchObject({
      title: "A published book",
      href: "/books/a-published-book",
    });
    expect(result.publicSnapshot.homepage.recent.map((item) => item.title)).toEqual(["Dhikr", "A published book"]);
    expect(result.publicSnapshot.homepage.keyTerms[0]).toMatchObject({ title: "Dhikr", href: "/dictionary/dhikr" });
    expect(JSON.stringify(result.publicSnapshot.homepage)).not.toContain("never");
  });

  it("never puts draft-only workspace documents into the public snapshot", () => {
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T00:00:00.000Z",
      pages: [],
      documents: [{ id: "draft-1", title: "Private draft", properties: { Publish: false, Draft: true } }],
      collections: [{ id: "en", name: "Language · English", allowList: ["draft-1"] }],
      localeCollections: [{ code: "en", collection: "Language · English" }],
    });
    expect(result.publicSnapshot.portals[0]?.pages).toEqual([]);
    expect(JSON.stringify(result.publicSnapshot)).not.toContain("Private draft");
    expect(result.studioSnapshot.summary.drafts).toBe(1);
    expect(result.studioSnapshot.documents[0]).toMatchObject({
      id: "draft-1",
      status: "draft",
      publishedHref: undefined,
    });
  });

  it("derives per-document status, links, and metadata completeness", () => {
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T00:00:00.000Z",
      workspaceId: "workspace-1",
      affineBaseUrl: "http://localhost:3010/",
      pages: [page()],
      documents: [{
        id: "published-1",
        title: "AFFiNE title",
        properties: { Publish: true, Draft: false },
      }],
      collections: [{ id: "en", name: "Language · English", allowList: ["published-1"] }],
      localeCollections: [{ code: "en", collection: "Language · English" }],
    });
    expect(result.studioSnapshot.documents[0]).toMatchObject({
      id: "published-1",
      title: "A published book",
      status: "warning",
      collections: [{ id: "en", name: "Language · English" }],
      publishedHref: "/books/a-published-book",
      affineHref: "http://localhost:3010/workspace/workspace-1/published-1",
      metadata: { complete: 1, total: 2, missing: ["Description"] },
    });
  });

  it("marks document errors as blocked and never invents a public link", () => {
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T00:00:00.000Z",
      pages: [],
      documents: [{ id: "private-1", title: "Private", properties: { Publish: false } }],
      collections: [],
      localeCollections: [],
      diagnostics: [{ level: "error", code: "AFFINE_READ_FAILED", docId: "private-1", message: "Could not read document." }],
    });
    expect(result.studioSnapshot.documents[0]).toMatchObject({
      status: "blocked",
      publishedHref: undefined,
      diagnostics: [{ code: "AFFINE_READ_FAILED" }],
    });
  });

  it("blocks mismatched language membership and duplicate translation keys", () => {
    const second = page({ id: "published-2", slug: "books/second" });
    const result = buildPublishingStudio({
      config,
      locale: "en",
      generatedAt: "2026-09-03T00:00:00.000Z",
      pages: [page(), second],
      documents: [],
      collections: [
        { id: "en", name: "Language · English", allowList: ["published-1"] },
        { id: "fr", name: "Language · Français", allowList: ["published-2"] },
      ],
      localeCollections: [
        { code: "en", collection: "Language · English" },
        { code: "fr", collection: "Language · Français" },
      ],
    });
    expect(result.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining([
      "AFFINE_LOCALE_COLLECTION_MISMATCH",
      "AFFINE_DUPLICATE_TRANSLATION_LOCALE",
    ]));
  });
});
