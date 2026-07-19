import type { ReactNode } from 'react';
import { Waypoints } from 'lucide-react';
import Link from 'fumadocs-core/link';
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
    <section data-backlinks className="backlinks-section">
      <h2 className="backlinks-heading">
        <Waypoints className="size-4" />
        {label}
      </h2>
      <div className="backlinks-layout">
        {links.length > 0 && (
          <div className="backlink-rail-viewport">
            <ul className="backlink-rail backlinks-scroll">
              {links.map((link) => (
                <li key={link.url} className="backlink-rail-item">
                  <Link href={link.url} className="backlink-rail-link">
                    <span className="backlink-rail-title">{link.title}</span>
                    {link.description && (
                      <span className="backlink-rail-description">
                        {link.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {graph}
      </div>
    </section>
  );
}
