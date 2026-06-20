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
} from "fumadocs-ui/layouts/docs/page";
import { Backlinks } from "@/components/backlinks";
import { LocalGraph } from "@/components/local-graph";
import { ReadingTime } from "@/components/reading-time";
import { PageTags } from "@/components/page-tags";
import { buildGraph } from "@/lib/build-graph";
import { ProtectedGate } from "@/components/protected-gate";
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
import { getObsidianUrl } from "@/lib/obsidian";
import {
  hasProtectedAccess,
  isPageProtected,
  isProtectionEnabled,
  pageRequiresAuth,
} from "@/lib/protected";
import { gitConfig } from "@/lib/shared";
import { Presentation } from "lucide-react";
import { SlideViewer } from "@/components/slide-viewer";
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
  const needsAuth = pageRequiresAuth(page);
  const hasAccess = needsAuth ? await hasProtectedAccess() : true;
  const notConfigured = isPageProtected(page) && !isProtectionEnabled();
  const locked = needsAuth && !hasAccess;
  const MDX = page.data.body;

  // Base pages (incl. tag pages) and full-width pages (the graph) carry no
  // page chrome: no TOC, no actions bar, no prev/next footer.
  const chromeless = Boolean(page.data.base || page.data.full);
  const showToc = !locked && !notConfigured && !chromeless;
  const structuredData = showToc ? page.data.structuredData : null;
  const tocExtra = showToc ? (
    <>
      {structuredData && (
        <ReadingTime
          structuredData={structuredData}
          label={siteLanguage.readingTimeUnit}
        />
      )}
      <LocalGraph
        graph={buildGraph(hasAccess)}
        currentUrl={page.url}
        label={siteLanguage.localGraphLabel}
        globalGraphLabel={siteLanguage.openGlobalGraphLabel}
      />
    </>
  ) : null;

  return (
    <DocsPage
      toc={showToc ? page.data.toc : undefined}
      // Base/tag pages (data tables) use the full content width, like the graph.
      full={chromeless}
      tableOfContent={
        showToc
          ? {
              style: "clerk",
              // Connections sits above the table of contents on desktop.
              header: tocExtra,
            }
          : { enabled: false }
      }
      tableOfContentPopover={
        // Mobile: keep it below the TOC list; the popover content scrolls
        // (see app/global.css) so the graph is never cropped.
        showToc ? { footer: tocExtra } : { enabled: false }
      }
      footer={chromeless ? { enabled: false } : undefined}
    >
      <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-row items-start justify-between gap-4">
            <DocsTitle>
              {page.data.title}
            </DocsTitle>
            {!locked && !notConfigured && !chromeless && (
              <div className="page-actions flex flex-row gap-2 items-center shrink-0 mt-1">
                {page.data.slides && (
                  <Link
                    href={`${page.url}/slides`}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-fd-background px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
                  >
                    <Presentation className="size-3.5" />
                    Slides
                  </Link>
                )}
                <ReaderToggle label={siteLanguage.readerModeLabel} exitLabel={siteLanguage.readerExitLabel} />
                <MarkdownCopyButton markdownUrl={getPageMarkdownUrl(page).url} />
                <ViewOptionsPopover
                  markdownUrl={getPageMarkdownUrl(page).url}
                  obsidianUrl={getObsidianUrl(page.path)}
                  obsidianLabel={siteLanguage.openInObsidian}
                  githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`}
                />
              </div>
            )}
          </div>

          {page.data.aliases && page.data.aliases.length > 0 && (
            <p className="title-aliases">{page.data.aliases.join(" · ")}</p>
          )}

          <DocsDescription className="mb-0">
            {page.data.description}
          </DocsDescription>

          {page.data.tags && <PageTags tags={page.data.tags} className="" />}

          {!locked && !notConfigured && !chromeless && (
            <PropertiesPanel data={page.data as Record<string, unknown>} />
          )}

          <DocsBody>
            {notConfigured ? (
              <p className="text-sm text-fd-muted-foreground">
                {siteLanguage.protectedNotConfigured}
              </p>
            ) : locked ? (
              <ProtectedGate
                description={siteLanguage.protectedDescription}
                passwordLabel={siteLanguage.protectedPassword}
                submitLabel={siteLanguage.protectedSubmit}
                errorMessage={siteLanguage.protectedError}
              />
            ) : (
              <MDX
                components={getMDXComponents({
                  a: createRelativeLink(source, page),
                  NoteEmbed,
                })}
              />
            )}
          </DocsBody>

          {!locked && !notConfigured && !chromeless && (
            <Backlinks
              links={getBacklinks(page, hasAccess)}
              label={siteLanguage.backlinksLabel}
            />
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
    return !isPageProtected(page) && !page.data.unlisted;
  });

  const slides = source
    .getPages()
    .filter((p) => p.data.slides && !isPageProtected(p) && !p.data.unlisted)
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

  const needsAuth = pageRequiresAuth(page);
  const hasAccess = needsAuth ? await hasProtectedAccess() : true;

  if (needsAuth && !hasAccess) {
    return {
      title: page.data.title,
      description: page.data.description,
      robots: { index: false, follow: false },
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
