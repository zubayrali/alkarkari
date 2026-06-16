import { createRelativeLink } from "fumadocs-ui/mdx";
import { FileText } from "lucide-react";
import { source } from "@/lib/source";
import { resolveNoteTarget, slugifySection } from "@/lib/note-embed";
import { getMDXComponents } from "@/components/mdx";

// Transclusion can nest (an embedded note may itself embed). Beyond this depth
// we render a plain link instead of the body — both to bound work and to defuse
// embed cycles (A embeds B embeds A).
const MAX_DEPTH = 3;

interface NoteEmbedProps {
  target: string;
  section?: string;
  label?: string;
}

/**
 * Build a `<NoteEmbed>` component bound to a transclusion depth. Depth is
 * threaded through the MDX component map (not React context, which RSCs can't
 * read): each embed renders the target body with a NoteEmbed one level deeper.
 */
export function makeNoteEmbed(depth: number) {
  return function NoteEmbed({ target, section, label }: NoteEmbedProps) {
    const page = resolveNoteTarget(target);

    if (!page) {
      return (
        <span className="note-embed-missing" data-target={target}>
          Unresolved embed: {label ?? target}
        </span>
      );
    }

    const title = label ?? page.data.title ?? target;
    const href = section ? `${page.url}#${slugifySection(section)}` : page.url;

    // At max depth, collapse to a link rather than recursing into the body.
    if (depth >= MAX_DEPTH) {
      return (
        <a className="note-embed-link" href={href}>
          {title}
        </a>
      );
    }

    const Body = page.data.body;
    const components = getMDXComponents({
      a: createRelativeLink(source, page),
      NoteEmbed: makeNoteEmbed(depth + 1),
    });

    return (
      <aside className="note-embed" data-depth={depth}>
        <details open className="note-embed-cartridge">
          <summary className="note-embed-header">
            <FileText className="note-embed-icon" aria-hidden />
            <a className="note-embed-title" href={href}>
              {title}
            </a>
          </summary>
          <div className="note-embed-body">
            <Body components={components} />
          </div>
        </details>
      </aside>
    );
  };
}

/** Top-level note embed (depth 0), for the page MDX component map. */
export const NoteEmbed = makeNoteEmbed(0);
