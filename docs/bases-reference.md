# Obsidian Bases Reference

`.base` files in the Obsidian vault define data views over your notes. They are compiled at build time (`pnpm generate`) into JSON bytecode + precomputed results, then rendered by the site as interactive tables, galleries, or lists.

## File location

Place a `.base` file in any vault folder. A file at `dictionary/dictionary.base` (or `dictionary/index.base`) becomes the folder's landing page at `/dictionary`.

## Basic structure

```yaml
filters: file.inFolder("dictionary")
views:
  - type: table
    name: Table
```

The top-level `filters` applies to all views. Each view can also have its own `filters` block that further narrows results.

## Top-level options

| Key | Type | Default | Description |
|---|---|---|---|
| `filters` | string | — | Filter expression applied to all views (e.g. `file.inFolder("books")`) |
| `defaultView` | string | first view | Name of the view to show on initial load |
| `hideToolbar` | boolean | `false` | Hide the entire view selector toolbar (tabs, search, results count) |
| `properties` | object | — | Display name overrides for columns (see [Properties](#properties)) |

### Example

```yaml
defaultView: Gallery
hideToolbar: true
filters: file.inFolder("books")
properties:
  title:
    displayName: Book
  description:
    displayName: Summary
  tags:
    displayName: Topics
```

## Properties

The `properties` block maps column keys to display configuration. Currently supports `displayName` to override the column header text.

```yaml
properties:
  title:
    displayName: Entry
  description:
    displayName: About
  file.name:
    displayName: Term
  author:
    displayName: Written By
```

Properties apply globally to all views in the `.base` file.

## Views

Each entry in the `views` array defines a tab in the view selector.

### Shared view options

| Key | Type | Default | Description |
|---|---|---|---|
| `type` | string | **required** | `table`, `cards` (or `card`, `board`, `gallery`), or `list` |
| `name` | string | **required** | Tab label shown in the view selector |
| `filters` | object | — | Additional per-view filter (`and`/`or` arrays of expressions) |
| `order` | string[] | auto-detected | Columns/properties to show, in order |
| `sort` | array | — | Sort rules: `[{ property, direction }]` where direction is `ASC` or `DESC` |
| `groupBy` | object | — | Group rows: `{ property, direction }` |
| `limit` | number | — | Maximum number of entries to show (applied at build time) |

### Column identifiers

Columns in `order` can be:

| Identifier | Resolves to |
|---|---|
| `title` or `file.name` | Note title (rendered as a clickable link) |
| `folder` or `file.folder` | Containing folder name |
| `path` or `file.path` | Full file path |
| `tags` or `file.tags` | Comma-separated tags |
| Any other key | Looked up in the note's frontmatter |

### Table view

```yaml
views:
  - type: table
    name: Table
    order:
      - title
      - description
      - tags
```

**Table-specific options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `hideHeader` | boolean | `false` | Hide the `<thead>` row (column headers) |

Features: sticky header, cell text truncation, group headers with count, summary footer (auto-sums numeric columns), pagination (100 rows per page), view transition "magic move" on title links.

### Cards/Gallery view

Obsidian uses `type: cards`. The aliases `card`, `board`, and `gallery` are also accepted.

```yaml
views:
  - type: cards
    name: Gallery
    order:
      - author
      - category
    image: cover
    cardSize: 220
    cardAspect: 1.5
```

**Cards-specific options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `image` | string | — | Frontmatter key containing the cover image URL |
| `cardSize` | number | `200` | Card width in pixels |
| `cardAspect` | number | `1` | Image aspect ratio (height = width * aspect) |

Features: responsive grid, hover lift + image zoom, group sections, pagination (60 cards per page).

### List view

```yaml
views:
  - type: list
    name: List
    order:
      - title
      - author
      - date
    nestedProperties: true
    separator: " | "
```

**List-specific options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `nestedProperties` | boolean | `false` | Show properties as indented sub-items instead of inline |
| `separator` | string | `" · "` | Separator between inline property values |

Features: group headers, pagination (200 items per page).

## Filter expressions

Filters use the Obsidian Bases expression language, compiled to bytecode and evaluated by a stack VM.

### Common patterns

```yaml
# Notes in a specific folder
filters: file.inFolder("dictionary")

# Per-view filter block
filters:
  and:
    - file.folder == "history"

# Tag filter (hierarchy-aware: "a" matches "a/b")
filters:
  and:
    - file.hasTag("ethics")

# Multiple conditions
filters:
  and:
    - file.folder == "books"
    - file.hasTag("classics")
```

### Available file properties

| Property | Description |
|---|---|
| `file.name` | Note title |
| `file.folder` | Parent folder path |
| `file.path` | Full file path |
| `file.tags` | Array of tags |
| `file.inFolder("x")` | True if note is in folder "x" |
| `file.hasTag("x")` | True if note has tag "x" (hierarchy-aware) |

Any frontmatter key can also be used in filters: `rating > 3`, `author == "Ibn Arabi"`.

## Sort rules

```yaml
sort:
  - property: date
    direction: DESC
  - property: title
    direction: ASC
```

Multiple sort rules are applied in order (first rule is primary).

## Grouping

```yaml
groupBy:
  property: category
  direction: ASC
```

Groups notes by the specified property value. Each group gets a header with the group name and count.

## Complete example

```yaml
defaultView: Gallery
hideToolbar: true
filters: file.inFolder("books")
properties:
  title:
    displayName: Book
  author:
    displayName: Written By
  category:
    displayName: Genre
  rating:
    displayName: Rating
  cover:
    displayName: Cover Image
views:
  - type: table
    name: All Books
    order:
      - title
      - author
      - category
      - rating
    sort:
      - property: rating
        direction: DESC

  - type: cards
    name: Gallery
    order:
      - author
      - category
    image: cover
    cardSize: 220
    cardAspect: 1.5
    sort:
      - property: title
        direction: ASC

  - type: table
    name: By Genre
    groupBy:
      property: category
      direction: ASC
    order:
      - title
      - author
      - rating

  - type: list
    name: Quick List
    order:
      - title
      - author
      - rating
    nestedProperties: true
    sort:
      - property: author
        direction: ASC

  - type: table
    name: Top 5
    order:
      - title
      - author
      - rating
    sort:
      - property: rating
        direction: DESC
    limit: 5
```

## Build pipeline

```
vault/*.base
  → lib/base-parser.ts (YAML → BaseConfig)
  → scripts/generate-base-pages.ts (compile filters, precompute results)
  → public/bases/**/*.json (CompiledBase with bytecode + NoteRecord[])
  → content/**/*.mdx (MDX wrapper importing BasesPageContent)
  → components/bases-page.tsx (RSC: reads JSON, renders initial view)
  → components/bases-inline-view.tsx (client: view switching, search, re-evaluation)
```

Run `pnpm generate` after changing any `.base` file. The site reads the compiled JSON at build/runtime — it never touches the vault.
