/**
 * The one parse of the catalogue's NZSA RVG 2021 modifier files (artifact AR-34),
 * shared by `generate-rvg-modifiers.mjs` (which writes the checked-in
 * `src/domain/seed/rvgModifiers.generated.ts`) and its Vitest drift guard
 * (`src/domain/seed/rvgModifiers.test.ts`), so the two can never parse differently.
 *
 * Values are kept as printed. Only three things change on the way through:
 * markdown emphasis (`*`, `**`) is stripped, en and em dashes become a plain
 * hyphen (the text reaches app copy, CLAUDE.md's copy rule), and runs of
 * whitespace collapse. Nothing is ever hand-typed: a disagreement with the PDF
 * is fixed in the catalogue file, then this is re-run.
 */

export const MODIFIERS_TABLE_HEADING = '### 2a. The modifying factors table (pages 12 to 13)'

/** Strip emphasis, normalise dashes and whitespace. */
export function cleanText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function cells(line) {
  // An escaped pipe inside a cell is kept as text, never a column break.
  const parts = line.replace(/\\\|/g, '\u0000').split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.replace(/\u0000/g, '|').trim())
}

function wholeNumber(text, where) {
  const n = Number(text)
  if (!Number.isFinite(n) || text === '') throw new Error(`${where}: "${text}" is not a number`)
  return n
}

/** Section 2a's table: Code, Block, Modifying factor, Units, Trigger, Source, Page. */
export function parseModifierTable(markdown) {
  const lines = markdown.split(/\r?\n/)
  const at = lines.findIndex((l) => l.trim() === MODIFIERS_TABLE_HEADING)
  if (at < 0) throw new Error(`Heading not found: ${MODIFIERS_TABLE_HEADING}`)
  const start = lines.findIndex((l, i) => i > at && l.trim().startsWith('|'))
  if (start < 0) throw new Error('No table under the modifying factors heading')
  if (!/^\|[\s|:-]+\|$/.test(lines[start + 1]?.trim() ?? '')) throw new Error('The modifying factors table has no separator row')
  const rows = []
  for (let i = start + 2; i < lines.length && lines[i].trim().startsWith('|'); i++) {
    const c = cells(lines[i])
    if (c.length !== 7) throw new Error(`Row ${i + 1} has ${c.length} cells, expected 7`)
    const [code, block, factor, units, trigger, source, page] = c
    if (cleanText(code) === '') throw new Error(`Row ${i + 1} has no code`)
    rows.push({
      code: cleanText(code),
      block: cleanText(block),
      factor: cleanText(factor),
      unitsAsPrinted: cleanText(units),
      trigger: cleanText(trigger),
      automatic: cleanText(source).startsWith('Automatic'),
      page: wholeNumber(cleanText(page), `Row ${i + 1} page`),
    })
  }
  const ids = new Set(rows.map((r) => r.code.replace(/\s+/g, '')))
  if (ids.size !== rows.length) throw new Error('Two modifier codes collapse to the same id')
  return rows
}

function csvFields(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

/** The included-modifiers CSV: rvg_code, group_name, base_units, included_modifier, included_units, note, page. */
export function parseIncludedModifiers(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '')
  const header = csvFields(lines[0]).map((h) => h.trim())
  const expected = ['rvg_code', 'group_name', 'base_units', 'included_modifier', 'included_units', 'note', 'page']
  if (header.join(',') !== expected.join(',')) throw new Error(`Unexpected CSV header: ${header.join(',')}`)
  return lines.slice(1).map((line) => {
    const [rvgCode, groupName, baseUnits, includedModifier, includedUnits, note, page] = csvFields(line).map(cleanText)
    return {
      rvgCode,
      groupName,
      baseUnits: wholeNumber(baseUnits, `${rvgCode} base_units`),
      includedModifier,
      includedUnits: wholeNumber(includedUnits, `${rvgCode} included_units`),
      note,
      page: wholeNumber(page, `${rvgCode} page`),
    }
  })
}

/** The generated module's text (deterministic, so the drift guard can compare it whole). */
export function renderGenerated(rows, included) {
  return `/**
 * GENERATED, DO NOT EDIT. Written by \`npm run rvg:modifiers\`
 * (scripts/generate-rvg-modifiers.mjs) from the catalogue's artifact AR-34:
 *   requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md
 *     (section "2a. The modifying factors table (pages 12 to 13)")
 *   requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv
 * Values as printed; emphasis stripped, en and em dashes replaced with a hyphen.
 * The drift guard (rvgModifiers.test.ts) fails when a source file changes until
 * this is re-generated.
 */

export interface RvgModifierRow {
  code: string
  block: string
  factor: string
  unitsAsPrinted: string
  trigger: string
  /** The table's Source column says Automatic (age, from the date of birth). */
  automatic: boolean
  page: number
}

export interface RvgIncludedModifierRow {
  rvgCode: string
  groupName: string
  baseUnits: number
  includedModifier: string
  includedUnits: number
  note: string
  page: number
}

export const RVG_MODIFIER_ROWS: readonly RvgModifierRow[] = ${JSON.stringify(rows, null, 2)}

export const RVG_INCLUDED_MODIFIERS: readonly RvgIncludedModifierRow[] = ${JSON.stringify(included, null, 2)}
`
}
