"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    CUSDIS?: { initial: () => void };
  }
}

export function CusdisComments({
  pageId,
  pageUrl,
  pageTitle,
}: {
  pageId: string;
  pageUrl: string;
  pageTitle: string;
}) {
  // Client-side nav reuses the div, so re-init on every pageId change.
  useEffect(() => {
    window.CUSDIS?.initial();
  }, [pageId]);

  return (
    <>
      <div
        id="cusdis_thread"
        data-host="https://cusdis-snowy.vercel.app"
        data-app-id="cc926483-bd57-4858-a94f-4401afb9cd7c"
        data-page-id={pageId}
        data-page-url={pageUrl}
        data-page-title={pageTitle}
        data-theme="auto"
      />
      <Script
        src="https://cusdis-snowy.vercel.app/js/cusdis.es.js"
        strategy="lazyOnload"
      />
    </>
  );
}
