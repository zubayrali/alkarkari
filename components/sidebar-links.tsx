'use client';

import Link from "fumadocs-core/link";
import { Tags, Waypoints } from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarLinks() {
  const pathname = usePathname();

  return (
    <div className="sidebar-links">
      <Link
        href="/tags"
        className="sidebar-link"
        data-active={pathname === "/tags" || pathname.startsWith("/tags/")}
      >
        <Tags className="size-4" />
        <span>Tags</span>
      </Link>
      <Link
        href="/graph"
        className="sidebar-link"
        data-active={pathname === "/graph"}
      >
        <Waypoints className="size-4" />
        <span>Graph View</span>
      </Link>
    </div>
  );
}
