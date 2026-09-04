'use client';

import Link from 'fumadocs-core/link';
import { useMemo, useState } from 'react';
import type {
  AffineDatabaseCell,
  AffineDatabaseColumn,
  AffineDatabaseRow,
  AffineDatabaseSnapshot,
  AffineDatabaseView as DatabaseView,
} from '@/lib/affine/database-types';

function textValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return textValue(record.value ?? record.name ?? record.label ?? '');
  }
  return '';
}

function CellValue({ cell }: { cell?: AffineDatabaseCell }) {
  if (!cell) return <span className="affine-db-empty">—</span>;
  const value = textValue(cell.value);
  if (!value) return <span className="affine-db-empty">—</span>;
  if (cell.type === 'checkbox') return <span aria-label={value}>{value === 'Yes' ? '✓' : '○'}</span>;
  if (cell.type === 'select' || cell.type === 'multi-select') {
    return <span className="affine-db-chip">{value}</span>;
  }
  return <span>{value}</span>;
}

function RowTitle({ row }: { row: AffineDatabaseRow }) {
  return row.href ? <Link href={row.href}>{row.title || 'Untitled'}</Link> : <>{row.title || 'Untitled'}</>;
}

function visibleColumns(snapshot: AffineDatabaseSnapshot, view: DatabaseView) {
  const definitions = new Map(snapshot.columns.map((column) => [column.id, column]));
  const configured = view.columns?.filter((column) => !column.hidden) ?? [];
  const ids = configured.length > 0
    ? configured.map((column) => column.id)
    : ['title', ...(view.columnIds ?? snapshot.columns.map((column) => column.id))];
  return ids.flatMap((id) => {
    if (id === 'title') return [{ id: 'title', name: 'Title', type: 'title' } satisfies AffineDatabaseColumn];
    const column = definitions.get(id);
    return column ? [column] : [];
  });
}

function TableView({ snapshot, view }: { snapshot: AffineDatabaseSnapshot; view: DatabaseView }) {
  const columns = visibleColumns(snapshot, view);
  const widths = new Map(view.columns?.map((column) => [column.id, column.width]) ?? []);
  return (
    <div className="affine-db-table-wrap">
      <table className="affine-db-table">
        <thead><tr>{columns.map((column) => (
          <th key={column.id} style={widths.get(column.id) ? { width: widths.get(column.id)! } : undefined}>
            <span className="affine-db-column-kind">{column.type === 'title' ? 'Aa' : column.type.slice(0, 2)}</span>
            {column.name}
          </th>
        ))}</tr></thead>
        <tbody>{snapshot.rows.map((row) => (
          <tr key={row.rowBlockId}>{columns.map((column) => (
            <td key={column.id}>{column.id === 'title' ? <RowTitle row={row} /> : <CellValue cell={row.cells[column.name]} />}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function KanbanView({ snapshot, view }: { snapshot: AffineDatabaseSnapshot; view: DatabaseView }) {
  const groupColumn = snapshot.columns.find((column) => column.id === view.groupBy?.columnId);
  const groups = groupColumn?.options?.map((option) => option.value) ?? [];
  const rowGroup = (row: AffineDatabaseRow) => groupColumn ? textValue(row.cells[groupColumn.name]?.value) : '';
  const names = [...new Set([...groups, ...snapshot.rows.map(rowGroup).filter(Boolean), 'Unassigned'])];
  return (
    <div className="affine-db-kanban">
      {names.map((name) => {
        const rows = snapshot.rows.filter((row) => (rowGroup(row) || 'Unassigned') === name);
        if (rows.length === 0 && name === 'Unassigned') return null;
        return (
          <section className="affine-db-lane" key={name} aria-label={name}>
            <header><span className="affine-db-chip">{name}</span><span>{rows.length}</span></header>
            <div>{rows.map((row) => (
              <article className="affine-db-card" key={row.rowBlockId}><RowTitle row={row} /></article>
            ))}</div>
          </section>
        );
      })}
    </div>
  );
}

export function AffineDatabaseView({ snapshot }: { snapshot: AffineDatabaseSnapshot }) {
  const views = useMemo(() => snapshot.views.length > 0 ? snapshot.views : [{ id: 'table', name: 'Table', mode: 'table' }], [snapshot.views]);
  const [viewId, setViewId] = useState(views[0]!.id);
  const view = views.find((candidate) => candidate.id === viewId) ?? views[0]!;
  return (
    <section
      className="affine-db nodrag nopan nowheel not-prose"
      aria-label={snapshot.title || 'Database'}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="affine-db-heading">
        <div><span className="affine-db-eyebrow">Database</span><h3>{snapshot.title || 'Untitled database'}</h3></div>
        <div className="affine-db-tabs" role="tablist" aria-label="Database views">
          {views.map((candidate) => <button key={candidate.id} type="button" role="tab" aria-selected={candidate.id === view.id} onClick={() => setViewId(candidate.id)}>{candidate.name}</button>)}
        </div>
      </header>
      <div role="tabpanel">
        {view.mode === 'kanban' ? <KanbanView snapshot={snapshot} view={view} /> : <TableView snapshot={snapshot} view={view} />}
      </div>
    </section>
  );
}
