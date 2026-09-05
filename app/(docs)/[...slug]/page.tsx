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
import { ReadingTime } from "@/components/reading-time";
import { PageTags } from "@/components/page-tags";
import { buildGraph } from "@/lib/build-graph";
import { ViewOptionsPopover } from "@/components/view-options-popover";
import { ReaderToggle } from "@/components/reader-toggle";
import { getBacklinks } from "@/lib/backlinks";
import { resolveAliasUrl } from "@/lib/alias-index";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound, permanentRedirect } from "next/navigation";
import { ViewTransition } from "react";
import { getMDXComponents } from "@/components/mdx";
import { NoteEmbed } from "@/components/note-embed";
import { PropertiesPanel } from "@/components/properties-panel";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getSiteLanguage } from "@/lib/locale";
import { currentLocale } from "@/lib/locales-manifest";
import { languageAlternatesForRoute } from "@/lib/affine/multilingual";
import { readAffineTranslationIndex } from "@/lib/affine/translation-index";
import {
  readPublishingPortal,
} from "@/lib/affine/publishing-snapshot";
import { getAffineDocumentUrl } from "@/lib/affine/url";
import { gitConfig } from "@/lib/shared";
import { Presentation } from "lucide-react";
import { SlideViewer } from "@/components/slide-viewer";
import {
  EntryArabicBackdrop,
  EntryThreshold,
} from "@/components/entry-threshold";
import { GraphPageContent } from "@/components/graph-page";
import { buildEntryChrome, usesNightThreshold } from "@/lib/entry-chrome";
import {
  DocumentViewContent,
  DocumentViewProvider,
  DocumentViewToggle,
} from "@/components/document-view";
import { BooksLibrary } from "@/components/books-library";
import { KnowledgeHub } from "@/components/knowledge-hub";
import { MediaLibrary } from "@/components/media-library";
import {
  OpenIslamMobileToc,
  OpenIslamToc,
} from "@/components/openislam-toc";

const LocalGraph = dynamic(
  () => import("@/components/local-graph").then((m) => m.LocalGraph),
  { ssr: false },
);
const CusdisComments = dynamic(
  () => import("@/components/cusdis-comments").then((m) => m.CusdisComments),
  { ssr: false },
);

function pageProperty(data: Record<string, unknown>, name: string): string | undefined {
  const direct = data[name];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const properties = data.affineProperties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return undefined;
  const value = (properties as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export default async function Page(props: PageProps<"/[...slug]">) {
  const params = await props.params;
  const isGraph = params.slug.length === 1 && params.slug[0] === "graph";
  if (isGraph) {
    return (
      <DocsPage
        full
        breadcrumb={{ enabled: false }}
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
        footer={{ enabled: false }}
      >
        <div className="flex flex-col gap-4">
          <DocsTitle>Knowledge graph</DocsTitle>
          <GraphPageContent />
        </div>
      </DocsPage>
    );
  }
  const isStartHere = params.slug.length === 1 && params.slug[0] === "start-here";
  const isMedia = params.slug.length === 1 && params.slug[0] === "media";
  if ((isStartHere || isMedia) && currentLocale() === "en") {
    return (
      <DocsPage
        full
        breadcrumb={{ enabled: false }}
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
        footer={{ enabled: false }}
      >
        {isStartHere ? <KnowledgeHub /> : <MediaLibrary />}
      </DocsPage>
    );
  }
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
      bodyText: await page.data.getText("processed"),
    },
    {
      sectionFallback: siteLanguage.sectionFallback,
      sectionTagsIndex: siteLanguage.sectionTagsIndex,
      sectionTag: siteLanguage.sectionTag,
      untitled: siteLanguage.untitledLabel,
    },
  );
  const nightThreshold = usesNightThreshold(chrome.kind);
  const canvasSrc = typeof page.data.canvasSrc === "string" &&
    /^\/affine-canvas\/[A-Za-z0-9_-]+\.json$/.test(page.data.canvasSrc)
      ? page.data.canvasSrc
      : undefined;
  const canvasContent = canvasSrc
    ? await (async () => {
        const { CanvasPageContent } = await import("@/components/canvas-page");
        return <CanvasPageContent src={canvasSrc} title={page.data.title} />;
      })()
    : undefined;

  // Base pages (incl. tag pages) and full-width pages (the graph) carry no
  // page chrome: no TOC, no actions bar, no prev/next footer.
  // A canvas-capable document keeps its title/actions even if an older
  // snapshot marked it `full`; readers need a visible way into Edgeless mode.
  const isBooksIndex = page.slugs.length === 1 && page.slugs[0] === "books";
  const chromeless = Boolean((page.data.base || page.data.full) && !canvasSrc);
  // The books index is a visual catalog, not a prose document. Reserving the
  // right-hand outline rail produces a blank column and an unexplained rule.
  const showToc = !chromeless && !isBooksIndex;
  const structuredData = showToc ? page.data.structuredData : null;
  const booksPortal = isBooksIndex ? await readPublishingPortal("books") : undefined;
  const libraryBooks = booksPortal
    ? booksPortal.pages.map((item) => ({
        url: item.href,
        title: item.title,
        description: item.description,
        cover: typeof item.properties["Book Cover"] === "string"
          ? item.properties["Book Cover"]
          : undefined,
      }))
    : isBooksIndex
    ? source.getPages()
        .filter((item) => item.slugs[0] === "books" && item.slugs.length > 1 && !item.data.draft && !item.data.unlisted)
        .map((item) => {
          const data = item.data as Record<string, unknown>;
          return {
            url: item.url,
            title: item.data.title,
            description: item.data.description,
            cover: pageProperty(data, "Book Cover"),
          };
        })
    : [];
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
      {canvasSrc && <DocumentViewToggle />}
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

      {isBooksIndex ? (
        <BooksLibrary books={libraryBooks} />
      ) : (
        <DocsBody>
          {nightThreshold && (
            <EntryArabicBackdrop
              arabic={chrome.arabic}
              className="night-reading-arabic"
            />
          )}
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
              NoteEmbed,
            })}
          />
        </DocsBody>
      )}

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
    <DocumentViewProvider hasCanvas={Boolean(canvasSrc)}>
      <DocsPage
      className={nightThreshold ? "night-threshold-page" : undefined}
      breadcrumb={{ enabled: !nightThreshold }}
      toc={showToc ? page.data.toc : undefined}
      // Base/tag pages and the books catalog use the full content width.
      full={chromeless || isBooksIndex}
      // OpenIslam's animated minimap + revealable outline, adapted into the
      // right-hand Fumadocs slot. The Fumadocs provider still supplies heading
      // state, while both renderers and interactions are ours.
      tableOfContent={{
        enabled: showToc,
        single: true,
        component: showToc ? <OpenIslamToc /> : undefined,
      }}
      tableOfContentPopover={{
        enabled: showToc,
        component: showToc ? <OpenIslamMobileToc /> : undefined,
      }}
      // Footer is rendered manually below so comments can sit beneath the
      // prev/next cards (and stay decoupled if recommended reading is dropped).
      footer={{ enabled: false }}
    >
      <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
        <div className="reader-shell-stack flex flex-col gap-4 flex-1">
          <div className="document-page-header">
            {nightThreshold ? (
              <EntryThreshold
              chrome={chrome}
              actions={pageActions}
              aliasesLabel={siteLanguage.aliasesLabel}
              tagsAriaLabel={siteLanguage.tagsAriaLabel}
              contents={structuredData ? (
                <ReadingTime
                  structuredData={structuredData}
                  label={siteLanguage.readingTimeUnit}
                  wordsLabel={siteLanguage.wordsUnit}
                  className="night-reading-time"
                />
              ) : undefined}
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
          </div>

          <DocumentViewContent
            page={nightThreshold ? (
              <div className="night-reading-field" data-entry-kind={chrome.kind}>
                {readingField}
              </div>
            ) : readingField}
            canvas={canvasContent}
          />
        </div>
      </ViewTransition>
      </DocsPage>
    </DocumentViewProvider>
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

  const shells = currentLocale() === "en"
    ? [{ slug: ["graph"] }, { slug: ["start-here"] }, { slug: ["media"] }]
    : [{ slug: ["graph"] }];
  if (process.env.NODE_ENV !== "production") shells.push({ slug: ["publishing"] });
  return [...base, ...slides, ...shells];
}

export async function generateMetadata(
  props: PageProps<"/[...slug]">,
): Promise<Metadata> {
  const params = await props.params;
  if (process.env.NODE_ENV !== "production" && params.slug.length === 1 && params.slug[0] === "publishing") {
    return { title: "AFFiNE Publishing Studio", description: "Local release readiness and collection diagnostics." };
  }
  if (params.slug.length === 1 && params.slug[0] === "graph") {
    return {
      title: "Knowledge graph",
      description: "Explore the pages, tags, and connections in the Karkari Wiki.",
    };
  }
  if (currentLocale() === "en" && params.slug.length === 1 && params.slug[0] === "start-here") {
    return { title: "Start here", description: "A guided introduction to the Karkariya path, foundations, lineage, and teachings." };
  }
  if (currentLocale() === "en" && params.slug.length === 1 && params.slug[0] === "media") {
    return { title: "Media library", description: "Official Karkariya teachings, practice recordings, questions, and testimonies." };
  }
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

  const translationIndex = readAffineTranslationIndex();
  const languages = translationIndex
    ? languageAlternatesForRoute(
        translationIndex,
        currentLocale(),
        `/${resolvedSlug.join("/")}`,
        process.env.PAGES_BASE_PATH || "",
      )
    : undefined;

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
    ...(languages ? { alternates: { languages } } : {}),
  };
}
