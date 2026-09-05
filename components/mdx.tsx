import defaultMdxComponents from "fumadocs-ui/mdx";
import * as ObsidianComponents from "fumadocs-obsidian/ui";
import { Mermaid } from "@/components/mermaid";
import dynamic from "next/dynamic";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ComponentType } from "react";
import { cn } from "@/lib/cn";
import { basesStringsFrom, type BasesStrings } from "@/lib/bases-strings";
import { getSiteLanguage } from "@/lib/locale";
import { ArticleImage } from "@/components/article-image";

const ReviewBlock = dynamic(
  () => import("@/components/review-block").then((m) => m.ReviewBlock),
) as ComponentType<{ configBase64: string; color?: string }>;

const BasesInlineView = dynamic(
  () => import("@/components/bases-inline-view").then((m) => m.BasesInlineView),
) as ComponentType<
  ComponentProps<typeof import("@/components/bases-inline-view").BasesInlineView>
>;

const basesStrings: BasesStrings = basesStringsFrom(getSiteLanguage());

function LocalizedBasesInlineView(
  props: Omit<ComponentProps<typeof BasesInlineView>, "strings">,
) {
  return <BasesInlineView strings={basesStrings} {...props} />;
}

// Obsidian callouts, painted in the reader-shell idiom: the raw type lands as
// data-callout so app/reader-shell.css can remap --callout-color per type.
function KarkariCallout({
  className,
  ...props
}: ComponentProps<typeof ObsidianComponents.ObsidianCallout>) {
  return (
    <ObsidianComponents.ObsidianCallout
      data-callout={props.type ?? "info"}
      {...props}
      className={cn("kk-callout", className)}
    />
  );
}

function KarkariCalloutTitle({
  className,
  ...props
}: ComponentProps<typeof ObsidianComponents.ObsidianCalloutTitle>) {
  return (
    <ObsidianComponents.ObsidianCalloutTitle
      {...props}
      className={cn("kk-callout-title", className)}
    />
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    img: (props) => <ArticleImage {...props} />,
    Mermaid,
    ReviewBlock,
    ...ObsidianComponents,
    ObsidianCallout: KarkariCallout,
    ObsidianCalloutTitle: KarkariCalloutTitle,
    BasesInlineView: LocalizedBasesInlineView,
    ...components,
  } as MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
