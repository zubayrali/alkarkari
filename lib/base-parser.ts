import yaml from 'js-yaml'
import GithubSlugger from 'github-slugger'
import type { Expr, LogicalExpr, UnaryExpr } from './base-compiler/ast.ts'
import { spanFrom } from './base-compiler/ast.ts'
import { compileExpression, parseExpressionSource } from './base-compiler/index.ts'
import type { ProgramIR } from './base-compiler/ir.ts'
import type { BaseConfig, BaseView, FilterNode, PropertyConfig } from './base-types.ts'

export type ParsedBase = {
  config: BaseConfig
  topLevelFilter: ProgramIR | null
  viewFilters: Array<ProgramIR | null>
}

const slugger = new GithubSlugger()

export function vaultPathToSlug(vaultPath: string): string {
  const withoutExt = vaultPath.replace(/\.[^/.]+$/, '')
  return withoutExt
    .split('/')
    .map(segment => { slugger.reset(); return slugger.slug(segment) })
    .join('/')
}

function parseExpr(source: string): Expr | null {
  const result = parseExpressionSource(source)
  return result.program.body ?? null
}

function buildLogical(op: '&&' | '||', exprs: Expr[]): Expr | null {
  if (exprs.length === 0) return null
  let current: Expr = exprs[0]
  for (let i = 1; i < exprs.length; i++) {
    const next = exprs[i]
    current = {
      type: 'LogicalExpr',
      operator: op,
      left: current,
      right: next,
      span: spanFrom(current.span, next.span),
    } satisfies LogicalExpr
  }
  return current
}

function buildFilterExpr(node: FilterNode): Expr | null {
  if (typeof node === 'string') return parseExpr(node)
  if ('and' in node) {
    const parts = node.and.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    return buildLogical('&&', parts)
  }
  if ('or' in node) {
    const parts = node.or.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    return buildLogical('||', parts)
  }
  if ('not' in node) {
    const parts = node.not.map(buildFilterExpr).filter((e): e is Expr => e !== null)
    const negated: UnaryExpr[] = parts.map(expr => ({
      type: 'UnaryExpr' as const,
      operator: '!' as const,
      argument: expr,
      span: spanFrom(expr.span, expr.span),
    }))
    return buildLogical('&&', negated)
  }
  return null
}

function compileFilterNode(node: FilterNode | undefined): ProgramIR | null {
  if (!node) return null
  const expr = buildFilterExpr(node)
  return expr ? compileExpression(expr) : null
}

function combinedFilter(
  top: FilterNode | undefined,
  view: FilterNode | undefined,
): ProgramIR | null {
  if (!top && !view) return null
  if (!top) return compileFilterNode(view)
  if (!view) return compileFilterNode(top)
  const topExpr = buildFilterExpr(top)
  const viewExpr = buildFilterExpr(view)
  if (!topExpr) return compileFilterNode(view)
  if (!viewExpr) return compileFilterNode(top)
  const combined: LogicalExpr = {
    type: 'LogicalExpr',
    operator: '&&',
    left: topExpr,
    right: viewExpr,
    span: spanFrom(topExpr.span, viewExpr.span),
  }
  return compileExpression(combined)
}

function parsePropertyConfig(raw: unknown): Record<string, PropertyConfig> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const result: Record<string, PropertyConfig> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    result[key] = typeof v.displayName === 'string' ? { displayName: v.displayName } : {}
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function parseViews(raw: unknown): BaseView[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map(v => {
      const type: BaseView['type'] =
        v.type === 'gallery' ? 'gallery' : v.type === 'list' ? 'list' : 'table'
      const name = typeof v.name === 'string' ? v.name : type[0].toUpperCase() + type.slice(1)
      const view: BaseView = { type, name }
      if (v.filters) view.filters = v.filters as FilterNode
      if (typeof v.groupBy === 'string') {
        view.groupBy = { property: v.groupBy, direction: 'ASC' }
      } else if (typeof v.groupBy === 'object' && v.groupBy !== null) {
        const gb = v.groupBy as Record<string, unknown>
        view.groupBy = {
          property: typeof gb.property === 'string' ? gb.property : '',
          direction: gb.direction === 'DESC' ? 'DESC' : 'ASC',
        }
      }
      if (Array.isArray(v.sort)) {
        view.sort = v.sort
          .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
          .map(s => ({
            property: typeof s.property === 'string' ? s.property : '',
            direction: s.direction === 'DESC' ? 'DESC' as const : 'ASC' as const,
          }))
      }
      if (Array.isArray(v.order)) {
        view.order = v.order.filter((o): o is string => typeof o === 'string')
      }
      if (typeof v.cardSize === 'number') view.cardSize = v.cardSize
      if (typeof v.image === 'string') view.image = v.image
      if (typeof v.hideHeader === 'boolean') view.hideHeader = v.hideHeader
      return view
    })
}

export function parseBaseConfig(content: string): ParsedBase {
  const raw = yaml.load(content) as Record<string, unknown> | null
  const parsed: Record<string, unknown> = raw && typeof raw === 'object' ? raw : {}

  let views = parseViews(parsed.views)
  if (views.length === 0) views = [{ type: 'table', name: 'Table' }]

  const config: BaseConfig = {
    filters: parsed.filters as FilterNode | undefined,
    properties: parsePropertyConfig(parsed.properties),
    views,
  }

  const topLevelFilter = compileFilterNode(config.filters)
  const viewFilters = views.map(view => combinedFilter(config.filters, view.filters))

  return { config, topLevelFilter, viewFilters }
}
