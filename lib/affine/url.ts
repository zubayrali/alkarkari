const DEFAULT_AFFINE_BASE_URL = "http://localhost:3010";

export function getAffineDocumentUrl(docId: unknown): string | undefined {
  if (typeof docId !== "string" || !docId.trim()) return undefined;
  const baseUrl = (
    process.env.NEXT_PUBLIC_AFFINE_BASE_URL || DEFAULT_AFFINE_BASE_URL
  ).replace(/\/$/, "");
  const workspaceId = process.env.NEXT_PUBLIC_AFFINE_WORKSPACE_ID;
  if (!workspaceId) return undefined;
  return `${baseUrl}/workspace/${workspaceId}/${encodeURIComponent(docId.trim())}`;
}
