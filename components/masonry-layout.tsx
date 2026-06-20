import Link from 'next/link';

interface MasonryPage {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
}

export function MasonryLayout({
  pages,
  columns = 2,
}: {
  pages: MasonryPage[];
  columns?: 2 | 3;
}) {
  const colClass =
    columns === 3
      ? 'columns-1 sm:columns-2 lg:columns-3'
      : 'columns-1 sm:columns-2';

  return (
    <div className={`${colClass} gap-4`}>
      {pages.map((page) => (
        <Link
          key={page.url}
          href={page.url}
          className="mb-4 block break-inside-avoid rounded-lg border border-fd-border p-4 transition-all hover:-translate-y-0.5 hover:border-fd-foreground/30 group"
        >
          <h3 className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary transition-colors">
            {page.title}
          </h3>
          {page.description && (
            <p className="mt-1 text-xs text-fd-muted-foreground leading-relaxed line-clamp-3">
              {page.description}
            </p>
          )}
          {page.tags && page.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {page.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-fd-muted px-2 py-0.5 text-[0.65rem] text-fd-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
