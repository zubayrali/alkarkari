import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkWikilinks } from "./lib/remark-wikilinks";
import { remarkInlineBase } from "./lib/remark-inline-base";
import { remarkAnnotations } from "./lib/remark-annotations";
import { normalizeProtected } from "./lib/protected-field";
import { normalizeTags } from "./lib/tags";
import { normalizeAliases } from "./lib/aliases";
import { rehypeSidenotes } from "./lib/rehype-sidenotes";
import { rehypeCitations } from "./lib/rehype-citations";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema.extend({
      tags: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(normalizeTags),
      protected: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform(normalizeProtected),
      aliases: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(normalizeAliases),
      base: z.boolean().optional(),
      slides: z.boolean().optional(),
      draft: z.boolean().optional(),
      unlisted: z.boolean().optional(),
      tagPage: z.boolean().optional(),
      tag: z.string().optional(),
      // Keep arbitrary vault frontmatter (arabic, root, category, related, …)
      // so the Properties panel can surface it as a terminology infobox.
    }).passthrough(),
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkInlineBase, remarkWikilinks, remarkAnnotations, remarkMdxMermaid, remarkMath],
    rehypePlugins: (v) => [rehypeKatex, ...v, ...rehypeCitations(), rehypeSidenotes],
  },
});
