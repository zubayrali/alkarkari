'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'fumadocs-core/link';
import { Tags, Waypoints } from 'lucide-react';

const btnClass =
  'inline-flex items-center justify-center rounded-md p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5';

export function NavMobileLinks() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    const subnav = document.getElementById('nd-subnav');
    if (!subnav) return;

    const spacer = subnav.querySelector('.flex-1');
    if (!spacer) return;

    const container = document.createElement('div');
    container.className = 'nav-mobile-links';
    spacer.after(container);
    setTarget(container);

    return () => container.remove();
  }, []);

  if (!target) return null;

  return createPortal(
    <>
      <Link href="/tags" className={btnClass} aria-label="Tags" title="Tags">
        <Tags />
      </Link>
      <Link href="/graph" className={btnClass} aria-label="Graph View" title="Graph View">
        <Waypoints />
      </Link>
    </>,
    target,
  );
}
