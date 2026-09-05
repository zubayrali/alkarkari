import { describe, expect, it } from "vitest";
import {
  normalizeAffineTimestamp,
  parseGenerateLocales,
  planLocaleGeneration,
  revisionsFromDocuments,
} from "../lib/affine/incremental-generate";

describe("normalizeAffineTimestamp", () => {
  it("normalizes epoch millis and ISO to the same instant", () => {
    const iso = "2026-09-05T01:00:00.000Z";
    const ms = String(Date.parse(iso));
    expect(normalizeAffineTimestamp(iso)).toBe(iso);
    expect(normalizeAffineTimestamp(ms)).toBe(iso);
  });
});

describe("parseGenerateLocales", () => {
  it("parses all and lists", () => {
    expect(parseGenerateLocales(undefined)).toBeUndefined();
    expect(parseGenerateLocales("all")).toBe("all");
    expect(parseGenerateLocales("en, fr")).toEqual(["en", "fr"]);
  });
});

describe("planLocaleGeneration", () => {
  const docs = [
    { id: "en-1", updatedAt: "2026-09-05T01:00:00.000Z" },
    { id: "fr-1", updatedAt: "2026-09-05T01:00:00.000Z" },
    { id: "cn-1", updatedAt: "2026-09-05T01:00:00.000Z" },
  ];
  const previous = {
    en: [{ id: "en-1", modified: "2026-07-02" }],
    fr: [{ id: "fr-1", modified: "2026-07-02" }],
    cn: [{ id: "cn-1", modified: "2026-07-02" }],
  };
  const revisions = {
    en: { "en-1": "2026-09-05T01:00:00.000Z" },
    fr: { "fr-1": "2026-09-05T01:00:00.000Z" },
    cn: { "cn-1": "2026-09-05T01:00:00.000Z" },
  };

  it("skips every locale when source revisions match live updatedAt", () => {
    const plan = planLocaleGeneration({
      localeCodes: ["en", "fr", "cn"],
      documents: docs,
      previousPages: previous,
      previousRevisions: revisions,
    });
    expect(plan.generate).toEqual([]);
    expect(plan.skip).toEqual(["en", "fr", "cn"]);
    expect(plan.unknownDocumentIds).toEqual([]);
  });

  it("ignores date-only manifest modified when revisions match", () => {
    // Without revisions this would look dirty; with revisions it stays skipped.
    const plan = planLocaleGeneration({
      localeCodes: ["fr"],
      documents: [{ id: "fr-1", updatedAt: "2026-09-05T01:00:00.000Z" }],
      previousPages: { fr: previous.fr },
      previousRevisions: { fr: revisions.fr },
    });
    expect(plan.generate).toEqual([]);
  });

  it("regenerates only the locale whose revision moved", () => {
    const plan = planLocaleGeneration({
      localeCodes: ["en", "fr", "cn"],
      documents: [
        { id: "en-1", updatedAt: "2026-09-05T02:00:00.000Z" },
        { id: "fr-1", updatedAt: "2026-09-05T01:00:00.000Z" },
        { id: "cn-1", updatedAt: "2026-09-05T01:00:00.000Z" },
      ],
      previousPages: previous,
      previousRevisions: revisions,
    });
    expect(plan.generate).toEqual(["en"]);
    expect(plan.skip).toEqual(["fr", "cn"]);
  });

  it("lists unknown docs and marks locales from publishable probes", () => {
    const plan = planLocaleGeneration({
      localeCodes: ["en", "fr", "cn"],
      documents: [...docs, { id: "new-fr", updatedAt: "2026-09-05T03:00:00.000Z" }],
      previousPages: previous,
      previousRevisions: revisions,
      publishableUnknownLocales: ["fr"],
    });
    expect(plan.unknownDocumentIds).toEqual(["new-fr"]);
    expect(plan.generate).toEqual(["fr"]);
  });

  it("forces missing manifests/revisions and full overrides", () => {
    expect(planLocaleGeneration({
      localeCodes: ["en", "fr"],
      documents: docs,
      previousPages: { en: previous.en },
      previousRevisions: { en: revisions.en },
    }).generate).toEqual(["fr"]);

    expect(planLocaleGeneration({
      localeCodes: ["en", "fr"],
      documents: docs,
      previousPages: previous,
      // en has pages but no revision baseline yet
      previousRevisions: { fr: revisions.fr },
    }).generate).toEqual(["en"]);

    expect(planLocaleGeneration({
      localeCodes: ["en", "fr", "cn"],
      documents: docs,
      previousPages: previous,
      previousRevisions: revisions,
      force: "all",
    }).generate).toEqual(["en", "fr", "cn"]);
  });

  it("treats trashed/removed published pages as dirty", () => {
    const plan = planLocaleGeneration({
      localeCodes: ["en", "fr"],
      documents: [
        { id: "en-1", updatedAt: "2026-09-05T01:00:00.000Z", inTrash: true },
        { id: "fr-1", updatedAt: "2026-09-05T01:00:00.000Z" },
      ],
      previousPages: { en: previous.en, fr: previous.fr },
      previousRevisions: { en: revisions.en, fr: revisions.fr },
    });
    expect(plan.generate).toEqual(["en"]);
    expect(plan.reasons.en).toMatch(/^removed:/);
  });

  it("builds revisions from live documents", () => {
    expect(revisionsFromDocuments(["en-1", "missing"], docs)).toEqual({
      "en-1": "2026-09-05T01:00:00.000Z",
    });
  });

  it("only probes docs that were never seen before", () => {
    const plan = planLocaleGeneration({
      localeCodes: ["en", "fr"],
      documents: [
        ...docs,
        { id: "site-control", updatedAt: "2026-09-05T03:00:00.000Z" },
      ],
      previousPages: { en: previous.en, fr: previous.fr },
      previousRevisions: { en: revisions.en, fr: revisions.fr },
      seenDocumentIds: ["en-1", "fr-1", "cn-1", "site-control"],
      publishableUnknownLocales: [],
    });
    expect(plan.unknownDocumentIds).toEqual([]);
    expect(plan.generate).toEqual([]);
  });
});
