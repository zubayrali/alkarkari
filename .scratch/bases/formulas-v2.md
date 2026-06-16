# Base formulas support (v2)

**State**: ready-for-agent

## What

The `.base` YAML format supports a `formulas` top-level key — computed per-row columns derived from other properties. Example from aarnphm's `antilibrary.base`:

```yaml
formulas:
  status_icon: if(status.containsAny("evergreen"), icon("leaf"), if(status.containsAny("finished"), icon("check-check"), if(status.containsAny("reading", "in progress"), icon("book-open"), icon("circle"))))
  age_years: if(number(year).isTruthy(), (today().year - number(year)), "")
  "2026": note.finished == 2026
```

Computed formula columns can then be referenced in `order` and `sort` as `formula.status_icon`, `formula.age_years`, etc.

## Why deferred

Formulas require a full per-row expression evaluator with: conditionals (`if`), type coercions (`number()`), date functions (`today()`), special value types (`icon()`), and chained method calls. This is essentially the full aarnphm VM.

Deferred from v1 to keep the initial implementation scoped.

## What needs to happen

1. Add `formulas?: Record<string, string>` to `BaseConfig` in `lib/base-types.ts`
2. Build a per-row formula evaluator (extend the filtrex adapter or add the full expression VM)
3. Attach computed formula values to each `NoteRecord` before rendering
4. Allow `formula.X` references in `order`, `sort`, `groupBy`, and `properties`

## Reference

- aarnphm: `quartz/util/base/compile.ts` (formula compilation), `quartz/util/base/interpreter.ts` (evaluation)
- Example: `content/antilibrary.base` (formulas block)
