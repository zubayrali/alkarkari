import type { ReactNode } from "react";
import {
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { EntryChromeModel } from "@/lib/entry-chrome";
import { PageTags } from "@/components/page-tags";

function backdropText(value: string) {
  return value.replace(/[\u0640\u064B-\u065F\u0670]/g, "");
}

export function EntryArabicBackdrop({
  arabic,
  className,
}: {
  arabic?: string;
  className: string;
}) {
  if (!arabic) return null;
  return (
    <p className={`${className} kk-arabic`} dir="rtl" lang="ar" aria-hidden>
      {backdropText(arabic)}
    </p>
  );
}

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
        {/* Bare letterforms: harakat add noise at backdrop size. The pointed
            form remains in the prose and native AFFiNE metadata. */}
        <EntryArabicBackdrop
          arabic={chrome.arabic}
          className="night-threshold-arabic"
        />

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
