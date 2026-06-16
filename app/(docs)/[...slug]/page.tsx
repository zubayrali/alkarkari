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
import { PageTags } from "@/components/page-tags";
import { buildGraph } from "@/lib/build-graph";
import { ProtectedGate } from "@/components/protected-gate";
import { ViewOptionsPopover } from "@/components/view-options-popover";
import { getBacklinks } from "@/lib/backlinks";
import { resolveAliasUrl } from "@/lib/alias-index";
import { notFound, permanentRedirect } from "next/navigation";
import { ViewTransition } from "react";
import { getMDXComponents } from "@/components/mdx";
import { NoteEmbed } from "@/components/note-embed";
import { PropertiesPanel } from "@/components/properties-panel";
import { entryTransitionName } from "@/lib/transition-name";
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

export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/[...slug]">) {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) {
    const aliasTarget = resolveAliasUrl(params.slug);
    if (aliasTarget) permanentRedirect(aliasTarget);
    notFound();
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
  const connections = showToc ? (
    <LocalGraph
      graph={buildGraph(hasAccess)}
      currentUrl={page.url}
      label={siteLanguage.localGraphLabel}
      globalGraphLabel={siteLanguage.openGlobalGraphLabel}
    />
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
              header: connections,
            }
          : { enabled: false }
      }
      tableOfContentPopover={
        // Mobile: keep it below the TOC list; the popover content scrolls
        // (see app/global.css) so the graph is never cropped.
        showToc ? { footer: connections } : { enabled: false }
      }
      footer={chromeless ? { enabled: false } : undefined}
    >
      <ViewTransition name="docs-content" share="auto" enter="auto" default="none">
        <div className="flex flex-row items-start justify-between gap-4">
          {/* Paired with the base-table row title for the "magic move" morph. */}
          <DocsTitle style={{ viewTransitionName: entryTransitionName(page.url) }}>
            {page.data.title}
          </DocsTitle>
          {!locked && !notConfigured && !chromeless && (
            <div className="flex flex-row gap-2 items-center shrink-0 mt-1">
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
      </ViewTransition>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams().filter((params) => {
    const page = resolvePage(params.slug);
    return !page || !isPageProtected(page);
  });
}

export async function generateMetadata(
  props: PageProps<"/[...slug]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) {
    const aliasTarget = resolveAliasUrl(params.slug);
    if (aliasTarget) permanentRedirect(aliasTarget);
    notFound();
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

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
