"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AffinePublishingStatus } from "@/lib/affine/types";

export function PublishingLiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const generatedAt = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch("/api/publishing/status", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const status = await response.json() as AffinePublishingStatus;
        const next = status.snapshot?.generatedAt;
        if (next && generatedAt.current && next !== generatedAt.current && pathname !== "/publishing") {
          router.refresh();
        }
        if (next) generatedAt.current = next;
      } catch {
        // The development server or publisher can be briefly unavailable.
      }
    };
    void check();
    const timer = window.setInterval(check, 5_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [pathname, router]);

  return null;
}
