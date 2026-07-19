import type { ReactNode } from "react";
import {
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { EntryChromeModel } from "@/lib/entry-chrome";
import { PageTags } from "@/components/page-tags";

export function EntryThreshold({
  chrome,
  actions,
  contents,
  aliasesLabel = "Also known as",
  tagsAriaLabel = "Tags",
}: {
  chrome: EntryChromeModel;
  actions?: ReactNode;
  contents?: ReactNode;
  aliasesLabel?: string;
  tagsAriaLabel?: string;
}) {
  return (
    <header className="night-threshold">
      <div className="night-threshold-utility">
        <div className="night-threshold-utility-lead">
          <p className="night-threshold-section kk-label">
            {chrome.sectionLabel}
          </p>
          {contents}
        </div>
        {actions}
      </div>

      <div className="night-threshold-main">
        {chrome.arabic && (
          <p
            className="night-threshold-arabic kk-arabic"
            dir="rtl"
            lang="ar"
            aria-hidden
          >
            {/* Bare letterforms, like the mockup's hero glyph \u2014 harakat add
                noise at backdrop size. The pointed form stays in
                Properties/prose (self-hosted Amiri anchors marks correctly;
                the Google-served subset didn't). */}
            {chrome.arabic.replace(/[\u0640\u064B-\u065F\u0670]/g, "")}
          </p>
        )}

        <DocsTitle className="night-threshold-title">{chrome.title}</DocsTitle>

        {chrome.description && (
          <DocsDescription className="night-threshold-description">
            {chrome.description}
          </DocsDescription>
        )}

        {(chrome.tags.length > 0 || chrome.aliases.length > 0) && (
          <div className="night-threshold-meta">
            <PageTags
              tags={chrome.tags}
              variant="metadata"
              className="night-threshold-tags"
              ariaLabel={tagsAriaLabel}
            />
            {chrome.aliases.length > 0 && (
              <p className="night-threshold-aliases">
                <span className="kk-label">{aliasesLabel}</span>
                <span>{chrome.aliases.join(" · ")}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
