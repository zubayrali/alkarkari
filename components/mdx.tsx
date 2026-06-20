import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents from "fumadocs-ui/mdx";
import * as ObsidianComponents from "fumadocs-obsidian/ui";
import { Mermaid } from "@/components/mermaid";
import type { MDXComponents } from "mdx/types";
import type { ImgHTMLAttributes } from "react";

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

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: (props) => <FigureImage {...props} />,
    Mermaid,
    ...ObsidianComponents,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
