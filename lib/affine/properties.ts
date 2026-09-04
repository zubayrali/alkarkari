import {
  AFFINE_PUBLICATION_PROPERTIES,
  metadataFromAffineProperties as publicationMetadataFromProperties,
} from "@affine-fumadocs/publisher";

const LEGACY_PREFIX = "Karkari ";
const PUBLICATION_PROPERTY_NAMES = new Set(
  ["Title", ...Object.values(AFFINE_PUBLICATION_PROPERTIES)],
);

function serializablePropertyValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map(serializablePropertyValue).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    // Current AFFiNE custom properties are scalar. Keeping a JSON-safe object
    // here makes the publisher forward-compatible with richer property types.
    try {
      return JSON.parse(JSON.stringify(value)) as unknown;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Convert AFFiNE's native custom properties into page frontmatter.
 *
 * The publisher package owns the canonical publication controls (Slug,
 * Publish, Draft, and friends). Every other property is retained under its
 * AFFiNE display name so Bases queries and the reader-facing Properties panel
 * see the same vocabulary editors use in AFFiNE.
 */
export function metadataFromAllAffineProperties(
  properties: Record<string, unknown> | undefined,
  title: string | undefined,
): Record<string, unknown> {
  const source = { ...(properties ?? {}) };

  // Old migrations used "Karkari Slug", "Karkari Publish", etc. Promote an
  // old value only when its clean native replacement is absent, then suppress
  // the duplicate legacy key from public frontmatter.
  for (const [name, value] of Object.entries(source)) {
    if (!name.startsWith(LEGACY_PREFIX)) continue;
    const cleanName = name.slice(LEGACY_PREFIX.length).trim();
    if (cleanName && source[cleanName] === undefined) source[cleanName] = value;
  }

  const customProperties = Object.fromEntries(
    Object.entries(source).flatMap(([name, value]) => {
      const normalizedName = name.trim();
      if (
        !normalizedName ||
        normalizedName.startsWith(LEGACY_PREFIX) ||
        PUBLICATION_PROPERTY_NAMES.has(normalizedName)
      ) {
        return [];
      }
      const serialized = serializablePropertyValue(value);
      return serialized === undefined ? [] : [[normalizedName, serialized]];
    }),
  );

  const affineProperties = Object.fromEntries(
    Object.entries(source).flatMap(([name, value]) => {
      const normalizedName = name.trim();
      if (!normalizedName || normalizedName.startsWith(LEGACY_PREFIX)) return [];
      const serialized = serializablePropertyValue(value);
      return serialized === undefined ? [] : [[normalizedName, serialized]];
    }),
  );

  const propertyTitle = typeof source.Title === "string" && source.Title.trim()
    ? source.Title.trim()
    : undefined;
  const publicationMetadata = publicationMetadataFromProperties(
    source,
    propertyTitle ?? title,
  );
  return Object.fromEntries(
    Object.entries({
      ...customProperties,
      ...publicationMetadata,
      affineProperties,
    }).filter(([, value]) => value !== undefined),
  );
}
