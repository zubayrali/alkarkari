import {
  getPageImage,
  getPageMarkdownUrl,
  resolvePage,
  source,
} from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageFooter,
} from "fumadocs-ui/layouts/docs/page";
import { Backlinks } from "@/components/backlinks";
import { CusdisComments } from "@/components/cusdis-comments";
import { LocalGraph } from "@/components/local-graph";
import { ReadingTime } from "@/components/reading-time";
import { PageTags } from "@/components/page-tags";
import { buildGraph } from "@/lib/build-graph";
import { ViewOptionsPopover } from "@/components/view-options-popover";
import { ReaderToggle } from "@/components/reader-toggle";
import { getBacklinks } from "@/lib/backlinks";
import { resolveAliasUrl } from "@/lib/alias-index";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ViewTransition } from "react";
import { getMDXComponents } from "@/components/mdx";
import { NoteEmbed } from "@/components/note-embed";
import { PropertiesPanel } from "@/components/properties-panel";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getSiteLanguage } from "@/lib/locale";
import { currentLocale } from "@/lib/locales-manifest";
import { getAffineDocumentUrl } from "@/lib/affine/url";
import { gitConfig } from "@/lib/shared";
import { Presentation } from "lucide-react";
import { SlideViewer } from "@/components/slide-viewer";
import { EntryThreshold } from "@/components/entry-threshold";
import { NightContents } from "@/components/night-contents";
import { buildEntryChrome, usesNightThreshold } from "@/lib/entry-chrome";
import "@/app/slides.css";

export default async function Page(props: PageProps<"/[...slug]">) {
  const params = await props.params;
  const isSlides =
    params.slug.length > 1 && params.slug[params.slug.length - 1] === "slides";
  const resolvedSlug = isSlides ? params.slug.slice(0, -1) : params.slug;

  const page = resolvePage(resolvedSlug);
  if (!page || page.data.draft) {
    if (!isSlides) {
      const aliasTarget = resolveAliasUrl(params.slug);
      if (aliasTarget) permanentRedirect(aliasTarget);
    }
    notFound();
  }

  if (isSlides) {
    if (!page.data.slides) notFound();
    const MDX = page.data.body;
    return (
      <SlideViewer parentUrl={page.url} parentTitle={page.data.title}>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            NoteEmbed,
          })}
        />
      </SlideViewer>
    );
  }

  const siteLanguage = getSiteLanguage();
  const MDX = page.data.body;
  const chrome = buildEntryChrome(
    {
      slugs: page.slugs,
      data: page.data as Record<string, unknown>,
    },
    {
      sectionFallback: siteLanguage.sectionFallback,
      sectionTagsIndex: siteLanguage.sectionTagsIndex,
      sectionTag: siteLanguage.sectionTag,
      untitled: siteLanguage.untitledLabel,
    },
  );
  const nightThreshold = usesNightThreshold(chrome.kind);

  // Base pages (incl. tag pages) and full-width pages (the graph) carry no
  // page chrome: no TOC, no actions bar, no prev/next footer.
  const chromeless = Boolean(page.data.base || page.data.full);
  const showToc = !chromeless;
  const structuredData = showToc ? page.data.structuredData : null;
  const pageActions = !chromeless ? (
    <div className="page-actions flex flex-row gap-2 items-center shrink-0">
      {page.data.slides && (
        <Link
          href={`${page.url}/slides`}
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border bg-fd-background px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          <Presentation className="size-3.5" />
          Slides
        </Link>
      )}
      <ReaderToggle label={siteLanguage.readerModeLabel} exitLabel={siteLanguage.readerExitLabel} />
      <span className="hidden md:contents">
        <MarkdownCopyButton markdownUrl={getPageMarkdownUrl(page).url} />
        <ViewOptionsPopover
          markdownUrl={getPageMarkdownUrl(page).url}
          affineUrl={getAffineDocumentUrl(page.data.affineDocId)}
          affineLabel="Open in AFFiNE"
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`}
        />
      </span>
    </div>
  ) : null;
  const readingField = (
    <>
      {!chromeless && (
        <PropertiesPanel
          data={page.data as Record<string, unknown>}
          excludeKeys={chrome.promotedPropertyKeys}
        />
      )}

      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            NoteEmbed,
          })}
        />
      </DocsBody>

      {!chromeless && (
        <Backlinks
          links={getBacklinks(page)}
          label={siteLanguage.backlinksLabel}
          graph={
            <LocalGraph
              graph={buildGraph()}
              currentUrl={page.url}
              label={siteLanguage.localGraphLabel}
              globalGraphLabel={siteLanguage.openGlobalGraphLabel}
            />
          }
        />
      )}

      {!chromeless && (
        <div data-page-footer>
          <PageFooter className="night-page-footer" />
        </div>
      )}

      {!chromeless && (
        <CusdisComments
          // Locale-prefixed: all locale builds share one Cusdis app, so the
          // prefix keeps each language's comment threads separate.
          pageId={`${currentLocale()}:${page.slugs.join("/") || "index"}`}
          pageUrl={page.url}
          pageTitle={page.data.title}
        />
      )}
    </>
  );

  return (
    <DocsPage
      className={nightThreshold ? "night-threshold-page" : undefined}
      breadcrumb={{ enabled: !nightThreshold }}
      toc={showToc ? page.data.toc : undefined}
      // Base/tag pages (data tables) use the full content width, like the graph.
      full={chromeless}
      // No fumadocs TOC surface anywhere: night pages carry their own
      // Contents dropdown in the utility strip, specialized pages are
      // chromeless. Without #nd-toc the sidenote engine uses margin notes.
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
      // Footer is rendered manually below so comments can sit beneath the
      // prev/next cards (and stay decoupled if recommended reading is dropped).
      footer={{ enabled: false }}
    >
      <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
        <div className="reader-shell-stack flex flex-col gap-4 flex-1">
          {nightThreshold ? (
            <EntryThreshold
              chrome={chrome}
              actions={pageActions}
              aliasesLabel={siteLanguage.aliasesLabel}
              tagsAriaLabel={siteLanguage.tagsAriaLabel}
              contents={
                showToc ? (
                  <>
                    <NightContents
                      items={page.data.toc}
                      label={siteLanguage.contentsLabel}
                    />
                    {structuredData && (
                      <ReadingTime
                        structuredData={structuredData}
                        label={siteLanguage.readingTimeUnit}
                        wordsLabel={siteLanguage.wordsUnit}
                        className="night-reading-time"
                      />
                    )}
                  </>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="flex flex-row items-start justify-between gap-4">
                <DocsTitle>{page.data.title}</DocsTitle>
                {pageActions}
              </div>

              {page.data.aliases && page.data.aliases.length > 0 && (
                <p className="title-aliases">{page.data.aliases.join(" · ")}</p>
              )}

              <DocsDescription className="mb-0">
                {page.data.description}
              </DocsDescription>

              {page.data.tags && <PageTags tags={page.data.tags} className="" />}
            </>
          )}

          {nightThreshold ? (
            <div className="night-reading-field" data-entry-kind={chrome.kind}>
              {readingField}
            </div>
          ) : (
            readingField
          )}
        </div>
      </ViewTransition>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const base = source.generateParams().filter((params) => {
    const page = resolvePage(params.slug);
    if (!page) return true;
    return !page.data.unlisted;
  });

  const slides = source
    .getPages()
    .filter((p) => p.data.slides && !p.data.unlisted)
    .map((p) => ({ slug: [...p.slugs, "slides"] }));

  return [...base, ...slides];
}

export async function generateMetadata(
  props: PageProps<"/[...slug]">,
): Promise<Metadata> {
  const params = await props.params;
  const isSlides =
    params.slug.length > 1 && params.slug[params.slug.length - 1] === "slides";
  const resolvedSlug = isSlides ? params.slug.slice(0, -1) : params.slug;

  const page = resolvePage(resolvedSlug);
  if (!page) {
    if (!isSlides) {
      const aliasTarget = resolveAliasUrl(params.slug);
      if (aliasTarget) permanentRedirect(aliasTarget);
    }
    notFound();
  }

  if (isSlides) {
    return {
      title: `${page.data.title} — Slides`,
      description: page.data.description,
    };
  }

  if (page.data.unlisted) {
    return {
      title: page.data.title,
      description: page.data.description,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
