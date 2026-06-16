import { Card, Cards } from 'fumadocs-ui/components/card';
import type { BacklinkEntry } from '@/lib/backlinks';

export function Backlinks({
  links,
  label,
}: {
  links: BacklinkEntry[];
  label: string;
}) {
  if (links.length === 0) return null;

  return (
    <section data-backlinks className="mt-12 border-t pt-6">
      <h2 className="mb-4 text-sm font-medium text-fd-muted-foreground">
        {label}
      </h2>
      <Cards>
        {links.map((link) => (
          <Card
            key={link.url}
            href={link.url}
            title={link.title}
            description={link.description}
          />
        ))}
      </Cards>
    </section>
  );
}
