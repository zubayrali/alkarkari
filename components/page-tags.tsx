import Link from "fumadocs-core/link";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { tagUrl } from "@/lib/tags";

type PageTagsProps = {
  tags: string[];
  className?: string;
  variant?: "chips" | "metadata";
  ariaLabel?: string;
};

export function PageTags({
  tags,
  className,
  variant = "chips",
  ariaLabel = "Tags",
}: PageTagsProps) {
  if (tags.length === 0) return null;

  if (variant === "metadata") {
    return (
      <ul className={cn("page-tags-metadata", className)} aria-label={ariaLabel}>
        {tags.map((tag) => (
          <li key={tag}>
            <Link href={tagUrl(tag)}>#{tag}</Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-2 list-none p-0 m-0", className)}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={tagUrl(tag)}
            className={cn(
              buttonVariants({ color: "outline", size: "sm" }),
              "no-underline",
            )}
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
