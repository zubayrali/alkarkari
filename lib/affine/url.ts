const DEFAULT_AFFINE_BASE_URL = "http://localhost:3010";

export function getAffineDocumentUrl(
  docId: unknown,
  options: { baseUrl?: string; workspaceId?: string } = {},
): string | undefined {
  if (typeof docId !== "string" || !docId.trim()) return undefined;
  const baseUrl = (
    options.baseUrl || process.env.NEXT_PUBLIC_AFFINE_BASE_URL || process.env.AFFINE_BASE_URL || DEFAULT_AFFINE_BASE_URL
  ).replace(/\/$/, "");
  const workspaceId = options.workspaceId || process.env.NEXT_PUBLIC_AFFINE_WORKSPACE_ID || process.env.AFFINE_WORKSPACE_ID;
  if (!workspaceId) return undefined;
  return `${baseUrl}/workspace/${workspaceId}/${encodeURIComponent(docId.trim())}`;
}
