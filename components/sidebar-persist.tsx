'use client';

import { useSidebar } from 'fumadocs-ui/components/sidebar/base';
import { useEffect, useLayoutEffect, useRef } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function SidebarPersist() {
  const { collapsed, setCollapsed } = useSidebar();
  const restored = useRef(false);

  // useLayoutEffect so the restore runs before the first browser paint,
  // preventing a single frame where the sidebar is uncollapsed.
  useLayoutEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (localStorage.getItem(STORAGE_KEY) === 'true') setCollapsed(true);
  }, [setCollapsed]);

  useEffect(() => {
    if (!restored.current) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    // Remove the pre-hydration CSS override now that React owns the state.
    if (collapsed) delete document.documentElement.dataset.sidebarCollapsed;
  }, [collapsed]);

  return null;
}
