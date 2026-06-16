# Base summaries support (v2)

**State**: ready-for-agent

## What

The `.base` YAML format supports a `summaries` key — computed aggregates over the filtered note set. Example from aarnphm's `cinematheque.base`:

```yaml
summaries:
  missing: values.filter(value.isType("null")).length
  watched: values.filter(value == "finished").length
```

These render as a stat bar at the top of the Base page (e.g. "Watched: 42 · Missing: 7").

## Why deferred

Summaries require aggregate-over-collection evaluation: iterating the entire filtered note set and reducing it to a scalar. This is a different evaluation mode from per-row filter expressions (which filtrex handles per note). The full expression VM from aarnphm would be needed, or a second-pass aggregation layer on top of filtrex.

Deferred from v1 to keep the initial implementation scoped to filters + properties + views.

## What needs to happen

1. Define the `summaries` key in `BaseConfig` type (already stubbed as optional)
2. Build an aggregation evaluator: takes `NoteRecord[]` + summary expression string → scalar
3. Embed summary results in the JSON emitted to `public/bases/<slug>.json`
4. Render a summary bar above the view switcher in `BasesPageContent`

## Reference

- aarnphm implementation: `quartz/util/base/query.ts` (summary computation)
- aarnphm example: `content/cinematheque.base` (summaries block)
