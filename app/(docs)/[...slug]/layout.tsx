import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { filterPageTree } from '@/lib/page-tree';
import { LinkPopover } from '@/components/link-popover';
import { RoughAnnotations } from '@/components/rough-annotations';
import { SidebarPersist } from '@/components/sidebar-persist';
import { Sidenotes } from '@/components/sidenotes';
import { CitationTooltip } from '@/components/citation-tooltip';
import { SidebarLinks } from '@/components/sidebar-links';
import { NavMobileLinks } from '@/components/nav-mobile-links';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={filterPageTree(source.getPageTree())}
      {...baseOptions()}
      sidebar={{
        banner: (
          <>
            <LocaleSwitcher variant="sidebar" />
            <SidebarLinks key="sidebar-links" />
          </>
        ),
      }}
    >
      {children}
      <SidebarPersist />
      <LinkPopover />
      <Sidenotes />
      <RoughAnnotations />
      <CitationTooltip />
      <NavMobileLinks />
    </DocsLayout>
  );
}
