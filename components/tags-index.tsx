import Link from "fumadocs-core/link";
import { source } from "@/lib/source";
import { buildTagIndex } from "@/lib/tag-index";
import { tagUrl } from "@/lib/tags";

/** Listing of every tag in use, rendered on the generated /tags page. */
export function TagsIndexContent() {
  const pages = source.getPages();
  const contentPages = pages.filter((page) => !page.data.tagPage);
  const index = buildTagIndex(contentPages, (page) => page.data.tags);

  const tagPages = new Map(
    pages
      .filter((page) => page.data.tagPage && typeof page.data.tag === "string")
      .map((page) => [page.data.tag as string, page]),
  );

  if (index.size === 0) {
    return <p className="text-sm text-fd-muted-foreground">No tags yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0">
      {[...index.entries()].map(([tag, tagged]) => {
        const tagPage = tagPages.get(tag);
        const depth = tag.split("/").length - 1;

        return (
          <li key={tag} style={{ marginInlineStart: `${depth * 1.25}rem` }}>
            <Link
              href={tagPage?.url ?? tagUrl(tag)}
              className="inline-flex items-baseline gap-2 no-underline"
            >
              <span className="font-medium text-fd-primary">#{tag}</span>
              <span className="text-xs text-fd-muted-foreground">
                {tagged.length} {tagged.length === 1 ? "note" : "notes"}
              </span>
            </Link>
            {tagPage?.data.description && (
              <p className="m-0 text-sm text-fd-muted-foreground">
                {tagPage.data.description}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
