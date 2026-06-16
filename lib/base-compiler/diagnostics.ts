import type { Span } from './ast.ts'

export type BaseExpressionDiagnostic = {
  kind: 'lex' | 'parse' | 'runtime'
  message: string
  span: Span
  context: string
  source: string
}
