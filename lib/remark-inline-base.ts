import { Buffer } from 'node:buffer'
import yaml from 'js-yaml'
import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import { compileExpression, parseExpressionSource } from './base-compiler/index.ts'
import type { FilterNode, BaseView } from './base-types.ts'

type InlineBaseConfig = {
  folder?: string
  tag?: string
  filters?: FilterNode
  views?: BaseView[]
  sort?: string
  limit?: number
  columns?: string
}

function parseShorthandFilter(config: InlineBaseConfig): FilterNode | undefined {
  const parts: FilterNode[] = []
  if (config.folder) parts.push(`file.inFolder("${config.folder}")`)
  if (config.tag) parts.push(`file.hasTag("${config.tag}")`)
  if (config.filters) parts.push(config.filters)
  if (parts.length === 0) return undefined
  if (parts.length === 1) return parts[0]
  return { and: parts }
}

function parseShorthandSort(raw: string): BaseView['sort'] {
  const trimmed = raw.trim()
  const parts = trimmed.split(/\s+/)
  const property = parts[0] ?? 'title'
  const direction = parts[1]?.toUpperCase() === 'DESC' ? ('DESC' as const) : ('ASC' as const)
  return [{ property, direction }]
}

function compileFilterNode(node: FilterNode | undefined): string {
  if (!node) return ''
  if (typeof node === 'string') {
    const result = parseExpressionSource(node)
    const body = result.program.body
    if (!body) return ''
    return Buffer.from(JSON.stringify(compileExpression(body))).toString('base64')
  }
  return ''
}

export function remarkInlineBase() {
  return (tree: Root) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'base') return
      if (!parent || index === undefined) return

      let config: InlineBaseConfig = {}
      try {
        const parsed = yaml.load(node.value)
        if (typeof parsed === 'object' && parsed !== null) {
          config = parsed as InlineBaseConfig
        }
      } catch {
        return
      }

      const filter = parseShorthandFilter(config)
      const compiledFilter = compileFilterNode(filter)

      const views: BaseView[] = config.views ?? [
        {
          type: 'table',
          name: 'Table',
          filters: filter,
          sort:
            typeof config.sort === 'string' ? parseShorthandSort(config.sort) : undefined,
          order:
            typeof config.columns === 'string'
              ? config.columns
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean)
              : undefined,
        },
      ]

      const payload = {
        compiledFilter,
        views: views.map((v) => ({ name: v.name, type: v.type, order: v.order })),
        limit: config.limit,
      }

      const configBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')

      const attr: MdxJsxAttribute = {
        type: 'mdxJsxAttribute',
        name: 'configBase64',
        value: configBase64,
      }

      const jsxNode: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'BasesInlineView',
        attributes: [attr],
        children: [],
      }

      // Replace the code node with the JSX node in-place
      ;(parent.children as unknown[]).splice(index, 1, jsxNode)
    })
  }
}
