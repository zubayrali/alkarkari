import { Settings2, Calendar, ExternalLink } from "lucide-react";
import { resolveNoteTarget } from "@/lib/note-embed";

// Fields owned by the schema, layout, or fumadocs internals — never shown as
// "properties". Everything else in frontmatter (passthrough) is a real
// note property and renders in the panel: the terminology infobox surface.
const HIDDEN_KEYS = new Set([
  "title",
  "description",
  "tags",
  "protected",
  "aliases",
  "base",
  "tagPage",
  "tag",
  "full",
  "icon",
  "draft",
  "unlisted",
  "slides",
  "featured",
  // pipeline-emitted file dates (pnpm generate) — recency metadata, not
  // note properties
  "created",
  "modified",
  // fumadocs / source-loader internals that ride along on page.data
  "body",
  "toc",
  "structuredData",
  "lastModified",
  "content",
  "getText",
  "extractedReferences",
  "info",
  "path",
  "fullPath",
]);

const WIKILINK = /^\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]$/;

interface PropertiesPanelProps {
  data: Record<string, unknown>;
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "function") return true;
  return false;
}

function isScalar(value: unknown): boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  );
}

// Only show frontmatter a reader cares about: scalars and arrays of scalars.
// Structured internals (objects, arrays of objects like extractedReferences)
// are never displayable, so new loader fields can't leak in as "[object Object]".
function isDisplayable(value: unknown): boolean {
  if (isScalar(value)) return true;
  if (Array.isArray(value)) return value.every(isScalar);
  return false;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** A frontmatter string `[[Target]]`/`[[Target|Label]]` → resolved link or text. */
function Wikilink({ value }: { value: string }) {
  const match = value.match(WIKILINK);
  if (!match) return <span className="prop-text">{value}</span>;

  const target = match[1].trim();
  const page = resolveNoteTarget(target);
  // Prefer an explicit [[target|label]], else the target page's real title,
  // else the raw wikilink target (e.g. an unresolved stem).
  const display = match[2]?.trim() ?? page?.data.title ?? target;

  return page ? (
    <a className="prop-wikilink" href={page.url}>
      {display}
    </a>
  ) : (
    <span className="prop-wikilink prop-wikilink-dead">{display}</span>
  );
}

function PropertyValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <span className="prop-tags">
        {value.map((item, i) => (
          <span key={i} className="prop-chip">
            {typeof item === "string" && WIKILINK.test(item) ? (
              <Wikilink value={item} />
            ) : (
              String(item)
            )}
          </span>
        ))}
      </span>
    );
  }

  if (typeof value === "boolean") {
    return <span className="prop-bool">{value ? "Yes" : "No"}</span>;
  }

  if (typeof value === "number") {
    return <code className="prop-number">{value}</code>;
  }

  if (value instanceof Date) {
    return (
      <span className="prop-date">
        <Calendar className="prop-date-icon" aria-hidden />
        <time dateTime={value.toISOString()}>{formatDate(value.toISOString())}</time>
      </span>
    );
  }

  if (typeof value === "string") {
    if (WIKILINK.test(value)) return <Wikilink value={value} />;
    if (/^https?:\/\//.test(value)) {
      return (
        <a className="prop-url" href={value} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="prop-url-icon" aria-hidden />
          {value.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return (
        <span className="prop-date">
          <Calendar className="prop-date-icon" aria-hidden />
          <time dateTime={value}>{formatDate(value)}</time>
        </span>
      );
    }
    return <span className="prop-text">{value}</span>;
  }

  return <code className="prop-object">{JSON.stringify(value)}</code>;
}

/**
 * Obsidian-style "Properties" panel: renders custom frontmatter as a compact,
 * type-aware, collapsible infobox above the article body. Self-hides when a
 * note carries no displayable properties, so ordinary notes are unaffected.
 */
export function PropertiesPanel({ data }: PropertiesPanelProps) {
  // Aliases are hidden from the generic loop (they're a schema field) but worth
  // surfacing as a friendly "Also known as" row — the alternate names a reader
  // might search for or recognise.
  const aliases = (Array.isArray(data.aliases) ? data.aliases : []).filter(
    (a): a is string => typeof a === "string" && a.trim() !== "",
  );

  const entries = Object.entries(data).filter(
    ([key, value]) =>
      !key.startsWith("_") &&
      !HIDDEN_KEYS.has(key) &&
      !isEmpty(value) &&
      isDisplayable(value),
  );

  const count = entries.length + (aliases.length > 0 ? 1 : 0);
  if (count === 0) return null;

  return (
    <details className="properties-panel" open>
      <summary className="properties-header">
        <Settings2 className="properties-icon" aria-hidden />
        <span className="properties-title">Properties</span>
        <span className="properties-count">{count}</span>
      </summary>
      <dl className="properties-list">
        {aliases.length > 0 && (
          <div className="property-row">
            <dt className="property-key">Also known as</dt>
            <dd className="property-value">
              <span className="prop-tags">
                {aliases.map((alias) => (
                  <span key={alias} className="prop-chip prop-alias">
                    {alias}
                  </span>
                ))}
              </span>
            </dd>
          </div>
        )}
        {entries.map(([key, value]) => (
          <div key={key} className="property-row">
            <dt className="property-key">{formatLabel(key)}</dt>
            <dd className="property-value">
              <PropertyValue value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
