import defaultMdxComponents from "fumadocs-ui/mdx";
import * as ObsidianComponents from "fumadocs-obsidian/ui";
import { Mermaid } from "@/components/mermaid";
import { ReviewBlock } from "@/components/review-block";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { BasesInlineView } from "@/components/bases-inline-view";
import { basesStringsFrom, type BasesStrings } from "@/lib/bases-strings";
import { getSiteLanguage } from "@/lib/locale";
import { ArticleImage } from "@/components/article-image";

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

export function getMDXComponents(components?: MDXComponents) {
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
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
