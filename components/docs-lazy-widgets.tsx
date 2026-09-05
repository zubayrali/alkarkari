"use client";

import dynamic from "next/dynamic";

/** Client-only lazy mounts — `ssr: false` is illegal in Server Components. */
export const LocalGraph = dynamic(
  () => import("@/components/local-graph").then((m) => m.LocalGraph),
  { ssr: false },
);

export const CusdisComments = dynamic(
  () => import("@/components/cusdis-comments").then((m) => m.CusdisComments),
  { ssr: false },
);
