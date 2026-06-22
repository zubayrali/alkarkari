"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

const HOST = "https://cusdis-snowy.vercel.app";
const APP_ID = "cc926483-bd57-4858-a94f-4401afb9cd7c";
const SCRIPT_SRC = `${HOST}/js/cusdis.umd.js`;

declare global {
  interface Window {
    CUSDIS?: { initial: () => void; setTheme: (theme: string) => void };
  }
}

function siteTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function isCommentsHash() {
  return (
    window.location.hash === "#comments" ||
    window.location.hash === "#cusdis_thread"
  );
}

// Load the cusdis loader (a static asset) exactly once per session, on demand.
let scriptPromise: Promise<void> | null = null;
function loadCusdis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.CUSDIS) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("cusdis failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Comments are deferred: nothing is fetched on page load. They open (and fire
 * the single `/api/open/comments` call) only when the reader clicks "Load
 * comments" OR the URL carries `#comments` — so deep links to the discussion
 * still work, while normal pageviews cost no Vercel function invocation.
 *
 * The cusdis script injects an <iframe> into #cusdis_thread (and reuses a
 * module-level singleton iframe), so React only owns an empty wrapper here and
 * the cusdis-owned DOM is built/torn down imperatively — otherwise React and
 * the script fight over the same nodes on navigation (intermittent crashes).
 */
export function CusdisComments({
  pageId,
  pageUrl,
  pageTitle,
}: {
  pageId: string;
  pageUrl: string;
  pageTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  // Open on a `#comments` deep link, including clicks to that hash while here.
  useEffect(() => {
    const check = () => {
      if (isCommentsHash()) setOpen(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  useEffect(() => {
    if (!open) return;
    const host = hostRef.current;
    if (!host) return;

    const thread = document.createElement("div");
    thread.id = "cusdis_thread";
    thread.dataset.host = HOST;
    thread.dataset.appId = APP_ID;
    thread.dataset.pageId = pageId;
    thread.dataset.pageUrl = pageUrl;
    thread.dataset.pageTitle = pageTitle;
    thread.dataset.theme = siteTheme();
    host.appendChild(thread);

    let cancelled = false;
    loadCusdis()
      .then(() => {
        if (!cancelled) window.CUSDIS?.initial();
      })
      .catch(() => {});

    // Follow the site's light/dark toggle (next-themes sets `.dark` on <html>).
    const applyTheme = () => {
      const theme = siteTheme();
      thread.dataset.theme = theme;
      window.CUSDIS?.setTheme(theme);
    };
    const obs = new MutationObserver(applyTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      obs.disconnect();
      host.innerHTML = "";
    };
  }, [open, pageId, pageUrl, pageTitle]);

  // Stable #comments anchor so deep links resolve in both states.
  return (
    <div id="comments">
      {open ? (
        <div ref={hostRef} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-fd-card/40 px-6 py-8 text-center">
          <MessageCircle className="size-5 text-fd-muted-foreground" />
          <div>
            <p className="font-semibold">Comments</p>
            <p className="text-sm text-fd-muted-foreground">
              Join the conversation — comments load when you open them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              history.replaceState(null, "", "#comments");
            }}
            // Prefetch the static loader on hover so the open feels instant
            // (no API call — that only happens once the iframe mounts).
            onMouseEnter={() => {
              void loadCusdis().catch(() => {});
            }}
            className="inline-flex items-center gap-1.5 rounded-md border bg-fd-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Load comments
          </button>
        </div>
      )}
    </div>
  );
}
