// Authoring syntax for spaced-repetition prompts inside vault notes.
// A fenced ```orbit block becomes an inline <ReviewBlock> (the review widget):
//
//   ```orbit color=green
//   Q: What does *wird* mean?
//   A: A regular daily devotional litany.
//   QI: wird-diagram.png
//
//   Q: What is the trilateral root of "kitāb"?
//   A: k-t-b.
//   AI: root-table.png
//   ```
//
// Obsidian [!orbit] callout syntax is also supported via transformOrbitCallouts()
// in scripts/generate.ts, which converts callouts to ```orbit fences at generation
// time (before MDX parsing).
//
// Q/A lines may span multiple physical lines (everything up to the next Q: or a
// blank line continues the field). QI:/AI: lines attach an image to the preceding
// Q or A. Mirrors lib/remark-inline-base.ts: the prompt list is serialized to
// base64-JSON and handed to the client component as an attribute.

import { Buffer } from "node:buffer";
import type { Root } from "mdast";
import type { MdxJsxFlowElement, MdxJsxAttribute } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

export interface Prompt {
  id: string;
  question: string;
  answer: string;
  questionAttachment?: string;
  answerAttachment?: string;
}

// djb2 → base36. Deterministic, collision-resistant enough at page scale.
function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function parsePrompts(source: string): Prompt[] {
  const prompts: Prompt[] = [];
  let q: string[] | null = null;
  let a: string[] | null = null;
  let qImg: string | undefined;
  let aImg: string | undefined;
  let field: "q" | "a" | null = null;

  const resolveAttachment = (name: string): string => {
    const basePath = process.env.PAGES_BASE_PATH ?? "";
    return basePath + "/" + encodeURIComponent(name);
  };

  const flush = () => {
    if (q && a) {
      const question = q.join("\n").trim();
      const answer = a.join("\n").trim();
      if (question && answer) {
        const prompt: Prompt = { id: hashId(question + "" + answer), question, answer };
        if (qImg) prompt.questionAttachment = resolveAttachment(qImg);
        if (aImg) prompt.answerAttachment = resolveAttachment(aImg);
        prompts.push(prompt);
      }
    }
    q = a = field = null;
    qImg = aImg = undefined;
  };

  for (const line of source.split("\n")) {
    const qm = line.match(/^\s*Q[:.]\s?(.*)$/);
    const am = line.match(/^\s*A[:.]\s?(.*)$/);
    const qim = line.match(/^\s*QI[:.]\s?(.*)$/);
    const aim = line.match(/^\s*AI[:.]\s?(.*)$/);
    if (qm) {
      flush();
      q = [qm[1]];
      a = null;
      field = "q";
    } else if (am && q) {
      a = [am[1]];
      field = "a";
    } else if (qim && q) {
      qImg = qim[1].trim();
    } else if (aim && a) {
      aImg = aim[1].trim();
    } else if (line.trim() === "") {
      flush();
    } else if (field === "q" && q) {
      q.push(line);
    } else if (field === "a" && a) {
      a.push(line);
    }
  }
  flush();
  return prompts;
}

function parseMeta(meta: string | null | undefined): string | undefined {
  if (!meta) return undefined;
  const m = meta.match(/\bcolor\s*=\s*(\S+)/);
  return m ? m[1] : undefined;
}

function buildJsxNode(prompts: Prompt[], color?: string): MdxJsxFlowElement {
  const configBase64 = Buffer.from(JSON.stringify(prompts)).toString("base64");
  const attributes: MdxJsxAttribute[] = [
    { type: "mdxJsxAttribute", name: "configBase64", value: configBase64 },
  ];
  if (color) {
    attributes.push({ type: "mdxJsxAttribute", name: "color", value: color });
  }
  return {
    type: "mdxJsxFlowElement",
    name: "ReviewBlock",
    attributes,
    children: [],
  };
}

// [!orbit] callout syntax is handled at generation time by transformOrbitCallouts()
// in scripts/generate.ts, which converts callouts to ```orbit fences before MDX
// parsing. Fumadocs' built-in callout plugin transforms blockquotes before remark
// plugins run, so a remark-level blockquote handler cannot intercept them.

export function remarkReviewPrompts() {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "orbit") return;
      if (!parent || index === undefined) return;

      const prompts = parsePrompts(node.value);
      if (prompts.length === 0) return;

      const color = parseMeta(node.meta);
      (parent.children as unknown[]).splice(index, 1, buildJsxNode(prompts, color));
    });
  };
}
