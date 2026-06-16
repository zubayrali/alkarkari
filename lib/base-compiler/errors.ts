import type { Span } from './ast.ts'

export type Diagnostic = { kind: 'lex' | 'parse'; message: string; span: Span }
