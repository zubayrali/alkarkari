// Custom sidenote syntax: {{sidenotes[label]: content}}
// Converts to a GFM footnote BEFORE markdown parsing so the existing
// rehype-citation → rehypeSidenotes pipeline handles everything.
//
// This is a remark plugin that uses textTransform (operates on raw text
// before the markdown parser sees `{{` which MDX treats as a JSX expression).
//
// Input:  objects genuinely {{sidenotes[possess.]: mackie's challenge... [@mackie1977ethics]}}
// Output: objects genuinely possess.[^_sn_1]
//         ...
//         [^_sn_1]: mackie's challenge... [@mackie1977ethics]

const SIDENOTE_RE = /\{\{sidenotes\[([^\]]+)\]:\s*([\s\S]*?)\}\}/g;

let globalCounter = 0;

export function remarkSidenoteSyntax() {
  return (_tree: unknown, file: { value?: string }) => {
    if (typeof file.value !== "string") return;

    SIDENOTE_RE.lastIndex = 0;
    if (!SIDENOTE_RE.test(file.value)) return;

    const definitions: string[] = [];
    SIDENOTE_RE.lastIndex = 0;

    file.value = file.value.replace(SIDENOTE_RE, (_match, label: string, content: string) => {
      const id = ++globalCounter;
      const identifier = `_sn_${id}`;
      definitions.push(`[^${identifier}]: ${content.trim()}`);
      return `${label}[^${identifier}]`;
    });

    if (definitions.length > 0) {
      file.value = file.value.trimEnd() + "\n\n" + definitions.join("\n\n") + "\n";
    }
  };
}
