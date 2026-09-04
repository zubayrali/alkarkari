'use client';

import Link from "fumadocs-core/link";
import { CirclePlay, Gauge, Route, Tags, Waypoints } from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarLinks() {
  const pathname = usePathname();

  return (
    <div className="sidebar-links">
      <Link href="/start-here" className="sidebar-link" data-active={pathname === "/start-here"}>
        <Route className="size-4" /><span>Start here</span>
      </Link>
      <Link href="/media" className="sidebar-link" data-active={pathname === "/media"}>
        <CirclePlay className="size-4" /><span>Media library</span>
      </Link>
      <Link
        href="/tags"
        className="sidebar-link"
        data-active={pathname === "/tags" || pathname.startsWith("/tags/")}
      >
        <Tags className="size-4" />
        <span>Tags</span>
      </Link>
      {process.env.NODE_ENV !== "production" && (
        <Link href="/publishing" className="sidebar-link" data-active={pathname === "/publishing"}>
          <Gauge className="size-4" /><span>Publishing studio</span>
        </Link>
      )}
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
