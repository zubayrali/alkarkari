import type { ReactNode } from 'react';
import { Waypoints } from 'lucide-react';
import { Card } from 'fumadocs-ui/components/card';
import type { BacklinkEntry } from '@/lib/backlinks';

export function Backlinks({
  links,
  label,
  graph,
}: {
  links: BacklinkEntry[];
  label: string;
  graph?: ReactNode;
}) {
  if (links.length === 0 && !graph) return null;

  return (
    <section data-backlinks className="mt-12 border-t pt-6">
      <h2 className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fd-muted-foreground">
        <Waypoints className="size-4" />
        {label}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {links.length > 0 && (
          <div className="relative max-h-64 overflow-hidden">
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto overscroll-contain pr-2 backlinks-scroll">
              {links.map((link) => (
                <Card
                  key={link.url}
                  href={link.url}
                  title={link.title}
                  description={link.description}
                />
              ))}
            </div>
            <div className="backlinks-fade pointer-events-none absolute inset-x-0 bottom-0 h-10" style={{ background: 'linear-gradient(to top, var(--color-fd-background), transparent)' }} />
          </div>
        )}
        {graph}
      </div>
    </section>
  );
}
