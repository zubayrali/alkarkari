"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_START_EVENT } from "@/instrumentation-client";
import { cn } from "@/lib/cn";

/** Don't show the bar at all for navigations faster than this. */
const SHOW_DELAY_MS = 120;
/** Trickle tick rate while waiting on the server. */
const TRICKLE_INTERVAL_MS = 180;
/** Trickle approaches (never reaches) this fraction until the commit lands. */
const TRICKLE_CEILING = 0.85;
/** Fade-out time after hitting 100% — overlaps the view-transition crossfade. */
const FADE_MS = 300;
/** Force-complete navigations that never produce a pathname change. */
const SAFETY_TIMEOUT_MS = 8000;

type Phase = "idle" | "active" | "done";

function samePathname(targetUrl: string, currentPathname: string) {
  try {
    const target = decodeURIComponent(new URL(targetUrl, window.location.origin).pathname);
    return target === decodeURIComponent(currentPathname);
  } catch {
    return false;
  }
}

/**
 * Top-of-viewport navigation progress bar, synchronized with the native view
 * transitions (ADR-0007/0009): starts on `onRouterTransitionStart` (see
 * `instrumentation-client.ts`), trickles during the server round-trip, snaps
 * to 100% on the commit that triggers the crossfade, and fades out while the
 * crossfade plays. Its own `view-transition-name` keeps it live (un-snapshotted)
 * during transitions — suppression rules live in `app/global.css`.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const navigating = useRef(false);
  const timers = useRef<{ delay?: number; trickle?: number; safety?: number; fade?: number }>({});

  // Stable refs so the nav-start listener never needs re-binding.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const clearTimers = () => {
    const { delay, trickle, safety, fade } = timers.current;
    if (delay) window.clearTimeout(delay);
    if (trickle) window.clearInterval(trickle);
    if (safety) window.clearTimeout(safety);
    if (fade) window.clearTimeout(fade);
    timers.current = {};
  };

  const completeRef = useRef(() => {});
  completeRef.current = () => {
    if (!navigating.current) return;
    navigating.current = false;
    clearTimers();
    setPhase((current) => (current === "active" ? "done" : "idle"));
    setProgress(1);
    timers.current.fade = window.setTimeout(() => {
      setPhase("idle");
      setProgress(0);
    }, FADE_MS);
  };

  useEffect(() => {
    const onNavStart = (event: Event) => {
      const url = (event as CustomEvent<{ url: string }>).detail?.url;
      // Hash/TOC and same-page clicks never change the pathname; showing a
      // bar that nothing will complete would leave it hanging.
      if (typeof url === "string" && samePathname(url, pathnameRef.current)) return;

      navigating.current = true;
      clearTimers();
      setPhase("idle");
      setProgress(0);

      timers.current.delay = window.setTimeout(() => {
        setPhase("active");
        setProgress(0.08);
        timers.current.trickle = window.setInterval(() => {
          setProgress((p) => p + (TRICKLE_CEILING - p) * 0.1);
        }, TRICKLE_INTERVAL_MS);
      }, SHOW_DELAY_MS);

      timers.current.safety = window.setTimeout(() => completeRef.current(), SAFETY_TIMEOUT_MS);
    };

    window.addEventListener(NAV_START_EVENT, onNavStart);
    return () => {
      window.removeEventListener(NAV_START_EVENT, onNavStart);
      clearTimers();
    };
  }, []);

  // The pathname updates in the same commit that triggers the view-transition
  // crossfade — completing here is what syncs bar-finish to crossfade-start.
  useEffect(() => {
    completeRef.current();
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ viewTransitionName: "nav-progress" }}
    >
      <div
        className={cn(
          "h-full bg-fd-primary motion-reduce:transition-none",
          phase === "active" && "opacity-100 transition-[width] duration-200 ease-out",
          phase === "done" && "opacity-0 transition-opacity duration-300 ease-out",
          phase === "idle" && "opacity-0 transition-none",
        )}
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
