/**
 * Stable `view-transition-name` for the "magic move" from a base-table row to
 * the entry page's title. Both ends must derive the name from the *same* path
 * string (a base row uses `NoteRecord.slug`, the entry page uses `page.url`),
 * so the browser pairs them and morphs the row title into the H1.
 *
 * Pure — safe to import from both server (page.tsx) and client (base views).
 * Returns '' for an empty path so callers can skip the style entirely.
 */
export function entryTransitionName(path: string): string {
  const clean = path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return clean ? `entry-${clean}` : "";
}
