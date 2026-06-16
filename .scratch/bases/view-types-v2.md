# Base view types: board, calendar, map (v2)

**State**: ready-for-agent

## What

Three view types deferred from v1:

- **board** — kanban columns grouped by a discrete property value (e.g. `status`). Each column is a group, cards are notes.
- **calendar** — date grid. Requires a date-type frontmatter property. Notes appear on their date cell.
- **map** — geographic view. Requires `lat`/`lng` frontmatter properties. Needs a map tile library (e.g. Leaflet or MapLibre).

## Why deferred

These need external libraries and are genuinely different UI surfaces from table/gallery/list. Adding them after the core engine is stable is lower risk.

## What needs to happen

### board
- Add `board` to `BaseView.type` union in `lib/base-types.ts`
- Add `components/bases-view-board.tsx` — column-per-group layout, static (no drag-drop in v1)
- No new dependencies needed

### calendar
- Add `calendar` to `BaseView.type` union
- Add `components/bases-view-calendar.tsx`
- Needs a date-parsing utility (dayjs or date-fns)

### map
- Add `map` to `BaseView.type` union
- Add `components/bases-view-map.tsx`
- Needs a map library — evaluate Leaflet vs MapLibre at implementation time

## Reference

- aarnphm implementation: `quartz/components/` for rendering; `quartz/util/base/types.ts` for view type definitions
