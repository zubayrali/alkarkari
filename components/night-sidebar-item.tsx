"use client";

import type { Item } from "fumadocs-core/page-tree";
import { SidebarItem } from "fumadocs-ui/components/sidebar/base";
import { usePathname } from "next/navigation";

function normalizePathname(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0];
  if (withoutQuery.length > 1) return withoutQuery.replace(/\/$/, "");
  return withoutQuery;
}

export function NightSidebarItem({ item }: { item: Item }) {
  const pathname = usePathname();
  const active = normalizePathname(pathname) === normalizePathname(item.url);

  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      active={active}
      icon={item.icon}
      className="night-sidebar-item"
      data-active={active}
      aria-current={active ? "page" : undefined}
    >
      {item.name}
    </SidebarItem>
  );
}
