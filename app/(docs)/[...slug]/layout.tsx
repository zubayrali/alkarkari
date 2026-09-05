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
import { NightSidebarItem } from '@/components/night-sidebar-item';
import { NightSidebarFolder } from '@/components/night-sidebar-folder';
import { SiteIdentity } from '@/components/site-identity';
// Math lives on docs routes only — keep katex off the home shell.
import 'katex/dist/katex.css';

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions();

  return (
    <DocsLayout
      tree={filterPageTree(source.getPageTree())}
      {...options}
      nav={{ ...options.nav, title: <SiteIdentity /> }}
      sidebar={{
        components: { Item: NightSidebarItem, Folder: NightSidebarFolder },
        // The mockup's "side-foot": utility links + locale live in small
        // type at the bottom of the index, not above the tree.
        footer: (
          <div key="sidebar-footer" className="night-sidebar-foot">
            <SidebarLinks />
            <LocaleSwitcher variant="sidebar" />
          </div>
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
