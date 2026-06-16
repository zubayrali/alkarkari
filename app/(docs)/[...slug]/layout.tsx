import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { hideTagPages } from '@/lib/page-tree';
import { LinkPopover } from '@/components/link-popover';
import { RoughAnnotations } from '@/components/rough-annotations';
import { SidebarPersist } from '@/components/sidebar-persist';
import { Sidenotes } from '@/components/sidenotes';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={hideTagPages(source.getPageTree())}
      {...baseOptions()}
      sidebar={{ style: { viewTransitionName: 'site-sidebar' } }}
    >
      {children}
      <SidebarPersist />
      <LinkPopover />
      <Sidenotes />
      <RoughAnnotations />
    </DocsLayout>
  );
}
