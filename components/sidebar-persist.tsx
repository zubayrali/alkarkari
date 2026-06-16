'use client';

import { useSidebar } from 'fumadocs-ui/components/sidebar/base';
import { useEffect, useRef } from 'react';

// fumadocs' left sidebar collapse state is in-memory only; persist it to
// localStorage so it remembers its state across visits. Renders nothing —
// must be mounted inside DocsLayout (which provides the sidebar context).

const STORAGE_KEY = 'sidebar-collapsed';

export function SidebarPersist() {
  const { collapsed, setCollapsed } = useSidebar();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (localStorage.getItem(STORAGE_KEY) === 'true') setCollapsed(true);
  }, [setCollapsed]);

  useEffect(() => {
    if (!restored.current) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return null;
}
