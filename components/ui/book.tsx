import type { CSSProperties, ReactNode } from "react";

export interface BookProps {
  title: string;
  cover?: string;
  eager?: boolean;
  variant?: "simple" | "stripe";
  width?: number;
  color?: string;
  textColor?: string;
  illustration?: ReactNode;
  textured?: boolean;
  className?: string;
}

const LampIllustration = (
  <svg className="kk-book-lamp" viewBox="0 0 72 72" aria-hidden="true">
    <path d="M36 7 43 25 62 36 43 47 36 65 29 47 10 36 29 25Z" />
    <circle cx="36" cy="36" r="8" />
  </svg>
);

/**
 * Adapted from shugar's Geist Book on 21st.dev. The geometry is retained while
 * the materials, focus behavior, and texture use the Alkarkari design system.
 */
export function Book({
  title,
  cover,
  eager = false,
  variant = "stripe",
  width = 196,
  color = "var(--kk-lamp)",
  textColor = "var(--kk-night)",
  illustration = LampIllustration,
  textured = true,
  className = "",
}: BookProps) {
  const style = {
    "--book-width": `${width}px`,
    "--book-color": color,
    "--book-text": textColor,
  } as CSSProperties;

  return (
    <div className={`kk-book ${className}`} style={style} aria-hidden="true">
      <div className="kk-book-volume">
        <div className={`kk-book-cover kk-book-cover--${variant} ${cover ? "kk-book-cover--image" : ""}`}>
          {!cover && variant === "stripe" && <div className="kk-book-illustration">{illustration}</div>}
          <div className="kk-book-band" />
          {!cover && (
            <div className="kk-book-title-panel">
              <span className="kk-book-title">{title}</span>
              {variant === "simple" ? illustration : <span className="kk-book-sigil">◆</span>}
            </div>
          )}
          {!cover && textured && <div className="kk-book-texture" />}
          {cover && (
            // Native image sizing is intentional: publisher cover assets have
            // different proportions, and forcing Next/Image dimensions either
            // crops them or recreates the fake side gutters this component avoids.
            // oxlint-disable-next-line next/no-img-element
            <img
              className="kk-book-cover-image"
              src={cover}
              alt=""
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={eager ? "high" : "auto"}
            />
          )}
        </div>
        <div className="kk-book-pages" />
        <div className="kk-book-back" />
      </div>
    </div>
  );
}
