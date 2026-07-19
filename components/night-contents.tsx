"use client";

import { useRef } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

/** "Contents ▾" affordance in the Night Threshold utility strip. Native
 * <details> keeps it keyboard-accessible with no positioning library. */
export function NightContents({
  items,
  label,
}: {
  items: TOCItemType[];
  label: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  if (items.length === 0) return null;

  return (
    <details ref={ref} className="night-contents">
      <summary className="kk-label">{label}</summary>
      <nav className="night-contents-panel">
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            data-depth={item.depth}
            onClick={() => ref.current?.removeAttribute("open")}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </details>
  );
}
