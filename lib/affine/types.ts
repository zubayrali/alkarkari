export type AffineFrontmatterValue =
  | boolean
  | number
  | string
  | string[]
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
    modified?: string;
  }>;
}
