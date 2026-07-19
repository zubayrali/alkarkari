"use client";

import type { Folder, Node } from "fumadocs-core/page-tree";
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  useFolderDepth,
} from "fumadocs-ui/components/sidebar/base";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function normalizePathname(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0];
  if (withoutQuery.length > 1) return withoutQuery.replace(/\/$/, "");
  return withoutQuery;
}

function subtreeContains(node: Node, pathname: string): boolean {
  if (node.type === "page") return normalizePathname(node.url) === pathname;
  if (node.type === "folder") {
    if (node.index && normalizePathname(node.index.url) === pathname) {
      return true;
    }
    return node.children.some((child) => subtreeContains(child, pathname));
  }
  return false;
}

/** Night index folders: top-level vault folders render as quiet ledger
 * group labels (the mockup's `.group` rows); nested folders stay item-like.
 * Collapsing still works — the chevron only surfaces on hover. */
export function NightSidebarFolder({
  item,
  children,
}: {
  item: Folder;
  children: ReactNode;
}) {
  const pathname = normalizePathname(usePathname());
  // Depth of the *enclosing* folder: 0 means this folder is top-level.
  const group = useFolderDepth() === 0;
  const active = subtreeContains(item, pathname);
  const rowClass = group ? "night-sidebar-group" : "night-sidebar-subfolder";

  return (
    <SidebarFolder
      collapsible={item.collapsible}
      defaultOpen={item.defaultOpen}
      active={active}
    >
      {item.index ? (
        <SidebarFolderLink
          href={item.index.url}
          external={item.index.external}
          active={normalizePathname(item.index.url) === pathname}
          className={rowClass}
        >
          {item.icon}
          {item.name}
        </SidebarFolderLink>
      ) : (
        <SidebarFolderTrigger className={rowClass}>
          {item.icon}
          {item.name}
        </SidebarFolderTrigger>
      )}
      <SidebarFolderContent
        className={group ? undefined : "night-sidebar-nested-content"}
      >
        <div className="night-sidebar-content">{children}</div>
      </SidebarFolderContent>
    </SidebarFolder>
  );
}
