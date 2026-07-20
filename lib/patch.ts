/**
 * Deterministic patch assignment for the muraqqaʿa spectrum: the same key maps
 * to the same patch colour (1..12) forever, everywhere — colours are assigned,
 * never arrayed. Consumers use it as `var(--kk-patch-${patchOf(key)})`.
 * djb2 → mod 12 (same hash family as lib/remark-review-prompts.ts).
 */
export function patchOf(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return ((h >>> 0) % 12) + 1;
}
