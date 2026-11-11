import type { RvgIncludedModifierRow, RvgModifierRow } from '../src/domain/seed/rvgModifiers.generated'

export const MODIFIERS_TABLE_HEADING: string
export function cleanText(text: string): string
export function parseModifierTable(markdown: string): RvgModifierRow[]
export function parseIncludedModifiers(csv: string): RvgIncludedModifierRow[]
export function renderGenerated(rows: RvgModifierRow[], included: RvgIncludedModifierRow[]): string
