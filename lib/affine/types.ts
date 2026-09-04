export type AffineFrontmatterValue =
  | boolean
  | number
  | string
  | AffineFrontmatterValue[]
  | { [key: string]: AffineFrontmatterValue }
  | null;

export interface AffinePublicationMetadata {
  title?: string;
  description?: string;
  slug?: string;
  locale?: string;
  publish?: boolean;
  draft?: boolean;
  unlisted?: boolean;
  featured?: boolean;
  order?: number;
  tags?: string[];
  aliases?: string[];
  created?: string;
  modified?: string;
  [key: string]: AffineFrontmatterValue | undefined;
}

export interface AffineDocumentSource {
  id: string;
  markdown: string;
}

export interface AffinePublicationPage {
  id: string;
  title: string;
  slug: string;
  locale: string;
  markdown: string;
  metadata: AffinePublicationMetadata;
  linkedDocumentIds: string[];
}

export type AffineDiagnosticLevel = "error" | "warning";

export interface AffineDiagnostic {
  level: AffineDiagnosticLevel;
  code: string;
  message: string;
  docId?: string;
}

export interface AffineSnapshotManifest {
  generatedAt: string;
  source: "affine-mcp";
  workspaceId: string;
  locale: string;
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    translationKey?: string;
    modified?: string;
    description?: string;
    featured?: boolean;
    order?: number;
    tags?: string[];
  }>;
}

export type AffinePortalLayout = "cards" | "library" | "list" | "media" | "timeline";

export interface AffinePublishingPortalPage {
  id: string;
  title: string;
  slug: string;
  href: string;
  description?: string;
  featured?: boolean;
  order?: number;
  modified?: string;
  tags: string[];
  properties: Record<string, AffineFrontmatterValue>;
}

export interface AffinePublishingPortal {
  id: string;
  route: string;
  label: string;
  description?: string;
  layout: AffinePortalLayout;
  collection: string;
  pages: AffinePublishingPortalPage[];
}

export interface AffinePublicPublishingSnapshot {
  version: 1;
  generatedAt: string;
  source: "affine-mcp";
  locale: string;
  portals: AffinePublishingPortal[];
  homepage: AffineHomepageSnapshot;
}

export interface AffineHomepagePage {
  id: string;
  title: string;
  href: string;
  description?: string;
  modified?: string;
  tags: string[];
}

export interface AffineHomepageSnapshot {
  featured: AffineHomepagePage[];
  recent: AffineHomepagePage[];
  keyTerms: AffineHomepagePage[];
  startHere?: AffineHomepagePage;
}

export interface AffineStudioSnapshot {
  version: 1;
  generatedAt: string;
  locale: string;
  summary: {
    workspaceDocuments: number;
    publishedPages: number;
    drafts: number;
    errors: number;
    warnings: number;
  };
  collections: Array<{ id: string; name: string; documentCount: number }>;
  portals: Array<{
    id: string;
    label: string;
    route: string;
    collection: string;
    publishedCount: number;
    workspaceCount: number;
  }>;
  documents: AffineStudioDocument[];
  diagnostics: AffineDiagnostic[];
}

export type AffineStudioDocumentStatus =
  | "published"
  | "draft"
  | "private"
  | "warning"
  | "blocked";

export interface AffineStudioDocument {
  id: string;
  title: string;
  locale: string;
  status: AffineStudioDocumentStatus;
  /** Every AFFiNE collection that contains this document. */
  collections?: Array<{ id: string; name: string }>;
  slug?: string;
  publishedHref?: string;
  affineHref?: string;
  diagnostics: AffineDiagnostic[];
  metadata: {
    complete: number;
    total: number;
    missing: string[];
  };
}

export type AffinePublisherRuntimeState = "idle" | "syncing" | "failed" | "offline";

export interface AffinePublishingStatus {
  snapshot?: AffineStudioSnapshot;
  runtime: {
    state: AffinePublisherRuntimeState;
    startedAt?: string;
    completedAt?: string;
    failedAt?: string;
    message?: string;
    lastChangeAt?: string;
  };
  release?: {
    releaseId: string;
    createdAt: string;
    pages: number;
    locales: string[];
  };
}
