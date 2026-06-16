export { lex } from './lexer.ts'
export { parseExpressionSource } from './parser.ts'
export type { ParseResult } from './parser.ts'
export type { Diagnostic } from './errors.ts'
export type { Program, Expr, Span, Position } from './ast.ts'
export { spanFrom } from './ast.ts'
export type { BaseExpressionDiagnostic } from './diagnostics.ts'
export type { BasesExpressions } from './expressions.ts'
export type { Instruction, ProgramIR } from './ir.ts'
export { compileExpression } from './ir.ts'
export { buildPropertyExpressionSource } from './properties.ts'
export type { PropertyConfig, BuiltinSummaryType } from './schema.ts'
export { BUILTIN_SUMMARY_TYPES } from './schema.ts'
export {
  evaluateExpression,
  evaluateFilterExpression,
  valueToUnknown,
} from './interpreter.ts'
export type {
  EvalContext,
  Value,
  NullValue, BooleanValue, NumberValue, StringValue,
  DateValue, DurationValue, ListValue, ObjectValue,
  FileValue, LinkValue, RegexValue, HtmlValue, IconValue, ImageValue,
  ValueKind, ValueOf,
} from './interpreter.ts'
export { isValueKind } from './interpreter.ts'
