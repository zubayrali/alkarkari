import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { visit } from "unist-util-visit";

// createRequire forces Node.js module resolution at runtime, bypassing
// turbopack's bundler resolution which picks the browser conditional
// export (unable to read local .bib files).
const _require = createRequire(import.meta.url);
const rehypeCitation = _require("rehype-citation").default ?? _require("rehype-citation");

export interface CitationsOptions {
  bibliographyFile: string;
  suppressBibliography: boolean;
  linkCitations: boolean;
  csl: string;
}

const defaultOptions: CitationsOptions = {
  bibliographyFile: "./references.bib",
  suppressBibliography: false,
  linkCitations: true,
  csl: "apa",
};

function collectText(node: any): string {
  if (node.type === "text") return node.value ?? "";
  if (node.children) return node.children.map(collectText).join("");
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rehypeCitations(userOpts?: Partial<CitationsOptions>): any[] {
  const opts = { ...defaultOptions, ...userOpts };
  const bibPath = resolve(opts.bibliographyFile);

  if (!existsSync(bibPath)) return [];

  return [
    [
      rehypeCitation,
      {
        bibliography: opts.bibliographyFile,
        path: process.cwd(),
        suppressBibliography: opts.suppressBibliography,
        linkCitations: opts.linkCitations,
        csl: opts.csl,
      },
    ],
    () => {
      return (tree: Parameters<typeof visit>[0]) => {
        const bibEntries = new Map<string, string>();

        visit(tree, "element", (node: any) => {
          if (
            node.tagName === "div" &&
            node.properties?.className?.includes?.("csl-entry") &&
            node.properties?.id
          ) {
            bibEntries.set(
              `#${node.properties.id}`,
              collectText(node).trim(),
            );
          }
        });

        visit(tree, "element", (node: any) => {
          if (node.tagName !== "a") return;
          const href = node.properties?.href;
          if (typeof href !== "string" || !href.startsWith("#bib")) return;

          node.properties["data-no-popover"] = true;
          node.properties["data-citation"] = "";

          const entry = bibEntries.get(href);
          if (entry) {
            node.properties["data-citation-text"] = entry;
          }
        });
      };
    },
  ];
}
