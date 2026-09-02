export function isSafeReleaseId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

export function selectRollbackTarget(
  releases: readonly string[],
  current: string | undefined,
  requested?: string,
): string | undefined {
  const available = [...new Set(releases.filter(isSafeReleaseId))].sort().reverse();
  if (requested) {
    return isSafeReleaseId(requested) && available.includes(requested) ? requested : undefined;
  }
  return available.find((release) => release !== current);
}

export function releasesToPrune(
  releases: readonly string[],
  current: string,
  keep: number,
): string[] {
  const retained = Math.max(2, Math.floor(keep));
  const available = [...new Set(releases.filter(isSafeReleaseId))].sort().reverse();
  const protectedIds = new Set([current, ...available.slice(0, retained)]);
  return available.filter((release) => !protectedIds.has(release));
}
