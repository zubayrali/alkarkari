const DATABASE_MARKER = /<!--\s*unsupported:\s*flavour=affine:database\s+blockId=([^\s]+)\s*-->/g;

function decodeMarkerId(value: string) {
  return value
    .replaceAll('&#45;', '-')
    .replaceAll('&#95;', '_')
    .replaceAll('&amp;', '&');
}

export function findAffineDatabaseBlockIds(markdown: string): string[] {
  return [...markdown.matchAll(DATABASE_MARKER)].map((match) => decodeMarkerId(match[1]!));
}

export function replaceAffineDatabaseMarkers(
  markdown: string,
  sources: ReadonlyMap<string, string>,
): string {
  let replaced = false;
  const body = markdown.replace(DATABASE_MARKER, (marker, encodedId: string) => {
    const source = sources.get(decodeMarkerId(encodedId));
    if (!source) return marker;
    replaced = true;
    return `<AffineDatabase src=${JSON.stringify(source)} />`;
  });
  return replaced
    ? `import { AffineDatabase } from "@/components/affine-database";\n\n${body}`
    : body;
}

