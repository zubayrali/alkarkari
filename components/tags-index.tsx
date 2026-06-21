import { source } from "@/lib/source";
import { buildTagIndex } from "@/lib/tag-index";
import { tagUrl } from "@/lib/tags";
import { TagsFilter } from "./tags-filter";

/** Listing of every tag in use, rendered on the generated /tags page. */
export function TagsIndexContent() {
  const pages = source.getPages();
  const contentPages = pages.filter((page) => !page.data.tagPage && !page.data.unlisted);
  const index = buildTagIndex(contentPages, (page) => page.data.tags);

  const tagPages = new Map(
    pages
      .filter((page) => page.data.tagPage && typeof page.data.tag === "string")
      .map((page) => [page.data.tag as string, page]),
  );

  if (index.size === 0) {
    return <p className="text-sm text-fd-muted-foreground">No tags yet.</p>;
  }

  const tags = [...index.entries()].map(([tag, tagged]) => {
    const tagPage = tagPages.get(tag);
    const depth = tag.split("/").length - 1;
    return {
      tag,
      count: tagged.length,
      depth,
      href: tagPage?.url ?? tagUrl(tag),
      description: tagPage?.data.description as string | undefined,
    };
  });

  return (
    <div className="tags-index">
      <p className="tags-index-summary">
        {tags.length} {tags.length === 1 ? "tag" : "tags"}
      </p>
      <TagsFilter tags={tags} />
    </div>
  );
}
