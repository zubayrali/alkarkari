import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents from "fumadocs-ui/mdx";
import * as ObsidianComponents from "fumadocs-obsidian/ui";
import { Mermaid } from "@/components/mermaid";
import { ReviewBlock } from "@/components/review-block";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

function FigureImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { alt, ...rest } = props;
  return (
    // Use <span> instead of <figure> to avoid invalid <p><figure> nesting
    // when MDX wraps inline images in paragraphs. CSS handles the display.
    <span className="figure-image" role="figure">
      <ImageZoom {...(rest as any)} alt={alt} />
      {alt && <span className="figcaption">{alt}</span>}
    </span>
  );
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
    img: (props) => <FigureImage {...props} />,
    Mermaid,
    ReviewBlock,
    ...ObsidianComponents,
    ObsidianCallout: KarkariCallout,
    ObsidianCalloutTitle: KarkariCalloutTitle,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
