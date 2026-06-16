import Link from "fumadocs-core/link";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { tagUrl } from "@/lib/tags";

type PageTagsProps = {
  tags: string[];
  className?: string;
};

export function PageTags({ tags, className }: PageTagsProps) {
  if (tags.length === 0) return null;

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
