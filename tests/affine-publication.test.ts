import { describe, expect, it } from "vitest";
import {
  findLinkedDocumentIds,
  parseAffinePublicationPage,
  rewriteAffineDocumentLinks,
  rewriteObsidianWikiLinks,
  sanitizeAffineMarkdown,
} from "../lib/affine/publication";
import type { AffineDiagnostic } from "../lib/affine/types";

describe("AFFiNE publication normalization", () => {
  it("parses publication metadata and preserves arbitrary fields", () => {
    const { page } = parseAffinePublicationPage(
      {
        id: "doc-1",
        markdown: `---
title: The Wird
slug: dictionary/wird
publish: true
tags: [practice, daily]
arabic: ورد
---

# Ignored fallback

Body`,
      },
      "en",
    );

    expect(page.title).toBe("The Wird");
    expect(page.slug).toBe("dictionary/wird");
    expect(page.metadata.publish).toBe(true);
    expect(page.metadata.tags).toEqual(["practice", "daily"]);
    expect(page.metadata.arabic).toBe("ورد");
  });

  it("parses frontmatter after AFFiNE rich-text Markdown normalization", () => {
    const { page } = parseAffinePublicationPage(
      {
        id: "doc-rich-text",
        markdown: `
---

## title: AFFiNE Publication
 slug: affine-publication
 locale: en
 publish: true
 order: 1

# AFFiNE Publication

Body`,
      },
      "en",
    );

    expect(page.title).toBe("AFFiNE Publication");
    expect(page.slug).toBe("affine-publication");
    expect(page.metadata.publish).toBe(true);
    expect(page.metadata.order).toBe(1);
    expect(page.markdown).toBe("# AFFiNE Publication\n\nBody");
  });

  it("parses the fenced publication block used by vault migration", () => {
    const { page } = parseAffinePublicationPage(
      {
        id: "imported-doc",
        markdown: `\`\`\`yaml affine-publication
title: Imported Note
slug: dictionary/imported-note
locale: en
publish: true
sourcePath: dictionary/imported-note.md
\`\`\`

# Imported Note

Body`,
      },
      "en",
    );

    expect(page.title).toBe("Imported Note");
    expect(page.slug).toBe("dictionary/imported-note");
    expect(page.metadata.publish).toBe(true);
    expect(page.metadata.sourcePath).toBe("dictionary/imported-note.md");
    expect(page.markdown).toBe("# Imported Note\n\nBody");
  });

  it("accepts AFFiNE's normalized YAML fence and rewrites imported wikilinks", () => {
    const target = parseAffinePublicationPage(
      {
        id: "wird-doc",
        markdown: `\`\`\`yaml
title: Wird
slug: dictionary/wird
locale: en
publish: true
sourcePath: dictionary/wird.md
\`\`\`

# Wird`,
      },
      "en",
    ).page;
    const diagnostics: AffineDiagnostic[] = [];

    expect(
      rewriteObsidianWikiLinks(
        "Read [[dictionary/wird|the Wird]] and [[Wird#Practice]].",
        [target],
        diagnostics,
        "source-doc",
      ),
    ).toBe(
      "Read [the Wird](/dictionary/wird) and [Wird](/dictionary/wird#practice).",
    );
  });

  it("discovers and rewrites AFFiNE document links", () => {
    const source =
      "See [](/workspace/workspace-id/doc-two) and [Again](/workspace/workspace-id/doc-two).";
    expect(findLinkedDocumentIds(source)).toEqual(["doc-two"]);

    const target = parseAffinePublicationPage(
      { id: "doc-two", markdown: "---\ntitle: Target\npublish: true\n---\nBody" },
      "en",
    ).page;
    const diagnostics: AffineDiagnostic[] = [];
    expect(
      rewriteAffineDocumentLinks(
        source,
        new Map([[target.id, target]]),
        diagnostics,
        "doc-one",
      ),
    ).toBe("See [Target](/target) and [Again](/target).");
  });

  it("removes AFFiNE-only spans and reports inaccessible blobs", () => {
    const result = sanitizeAffineMarkdown(
      '<span style="color:red">Text</span><img src="blob://abc" alt="">',
      "doc-1",
    );
    expect(result.markdown).toContain("Text");
    expect(result.markdown).not.toContain("<span");
    expect(result.diagnostics[0]?.code).toBe("AFFINE_BLOB_UNAVAILABLE");
  });
});
