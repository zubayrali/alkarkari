// Custom sidenote / marginalia syntax, converted to GFM footnotes BEFORE
// markdown parsing so the existing rehype-citation → rehypeSidenotes
// pipeline handles everything. Two authoring forms:
//
//   Labeled:  {{sidenotes[label]: content}}   → label[^_sn_1]
//   Bare:     {{content}}                     → [^_sn_2]   (kufrCleaner-style
//             unlabeled marginalia — the footnote marker is the anchor)
//
// Full inline markdown works inside the braces (bold, links, citations,
// images). Code fences and inline code spans are left untouched, so `{{` in
// code examples (or inside ```orbit blocks) never becomes a sidenote.
//
// Input:  objects genuinely {{sidenotes[possess.]: mackie's challenge...}}
//         and the web was static. {{Well, mostly static.}}
// Output: objects genuinely possess.[^_sn_1]
//         and the web was static.[^_sn_2]
//         ...
//         [^_sn_1]: mackie's challenge...
//         [^_sn_2]: Well, mostly static.

const LABELED_RE = /\{\{sidenotes\[([^\]]+)\]:\s*([\s\S]*?)\}\}/g;
// Bare form consumes preceding spaces so the marker glues to the prior word.
const BARE_RE = /[ \t]*\{\{([\s\S]*?)\}\}/g;
// Fenced code blocks — hard boundaries, never transformed.
const FENCE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/;
const INLINE_CODE_RE = /`[^`\n]*`/g;

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

/** Replace `re` matches in `segment`, skipping matches that start inside an
 *  inline code span (so `{{date}}` in code stays literal, while a note that
 *  merely CONTAINS a code span still transforms). */
function replaceOutsideInlineCode(
  segment: string,
  re: RegExp,
  replacer: (groups: string[]) => string,
): string {
  const ranges: Array<[number, number]> = [];
  for (const m of segment.matchAll(INLINE_CODE_RE)) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return segment.replace(re, (match: string, ...args: unknown[]) => {
    const offset = args[args.length - 2] as number;
    const braceStart = offset + match.indexOf("{{");
    if (ranges.some(([a, b]) => braceStart >= a && braceStart < b)) return match;
    return replacer(args.slice(0, -2) as string[]);
  });
}

/** Pure text transform: both sidenote forms → GFM footnotes. */
export function transformSidenoteSyntax(content: string): string {
  if (!content.includes("{{")) return content;

  // Leave YAML frontmatter alone ({{date}}-style template values).
  const frontmatter = content.match(FRONTMATTER_RE)?.[0] ?? "";
  const body = content.slice(frontmatter.length);

  let counter = 0;
  const definitions: string[] = [];
  const define = (note: string): string => {
    const id = `_sn_${++counter}`;
    // Footnote definitions are single-line; fold internal newlines.
    definitions.push(`[^${id}]: ${note.trim().replace(/\s*\n\s*/g, " ")}`);
    return id;
  };

  const transformed = body
    .split(FENCE_RE)
    .map((segment, i) => {
      if (i % 2 === 1) return segment; // fenced code — leave untouched
      const labeled = replaceOutsideInlineCode(
        segment,
        LABELED_RE,
        ([label, note]) => `${label}[^${define(note)}]`,
      );
      return replaceOutsideInlineCode(labeled, BARE_RE, ([note]) => `[^${define(note)}]`);
    })
    .join("");

  if (definitions.length === 0) return content;
  return frontmatter + transformed.trimEnd() + "\n\n" + definitions.join("\n\n") + "\n";
}

export function remarkSidenoteSyntax() {
  return (_tree: unknown, file: { value?: string }) => {
    if (typeof file.value !== "string") return;
    file.value = transformSidenoteSyntax(file.value);
  };
}
