/**
 * CSV in the old generator's column shape, for Miro or a spreadsheet, with
 * Acceptance criteria and Technical discussion appended at the end so every
 * earlier column keeps its position for existing imports.
 * Quoting matches Python's csv.QUOTE_MINIMAL with "\n" line endings.
 */
import { compareIds, compareSiblings } from './ids.ts'
import type { Item, Question } from './types.ts'

export const REQUIREMENT_COLUMNS = ['ID', 'Type', 'Parent', 'Title', 'Description', 'Notes', 'Component', 'Status', 'Source', 'Acceptance criteria', 'Technical discussion']
export const QUESTION_COLUMNS = ['ID', 'Title', 'Question', 'Affects', 'Owner', 'Status', 'Source']

const TYPE_LABEL = { epic: 'Epic', feature: 'Feature', story: 'Story' } as const
export const LIST_SEPARATOR = '; '

function field(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}
const row = (cells: string[]) => cells.map(field).join(',') + '\n'

/** Depth-first: each epic, then its children in sibling order, recursively. */
export function depthFirst(items: Item[]): Item[] {
  const kids = new Map<string | null, Item[]>()
  for (const it of items) {
    const list = kids.get(it.parent) ?? []
    list.push(it)
    kids.set(it.parent, list)
  }
  const out: Item[] = []
  const walk = (parent: string | null) => {
    for (const it of (kids.get(parent) ?? []).sort(compareSiblings)) {
      out.push(it)
      walk(it.id)
    }
  }
  walk(null)
  // Items whose parent is missing (a check error) still go out, at the end, rather than vanishing.
  const reached = new Set(out.map((i) => i.id))
  const lost = items.filter((i) => !reached.has(i.id)).sort((a, b) => compareIds(a.id, b.id))
  out.push(...lost)
  return out
}

export function requirementsCsv(items: Item[]): string {
  return (
    row(REQUIREMENT_COLUMNS) +
    depthFirst(items)
      .map((it) =>
        row([
          it.id,
          TYPE_LABEL[it.type],
          it.parent ?? '',
          it.title,
          it.description,
          it.notes,
          it.components.join(LIST_SEPARATOR),
          it.status,
          it.sources.join(LIST_SEPARATOR),
          it.acceptance,
          it.technical,
        ]),
      )
      .join('')
  )
}

export function questionsCsv(questions: Question[]): string {
  return (
    row(QUESTION_COLUMNS) +
    [...questions]
      .sort((a, b) => compareIds(a.id, b.id))
      .map((q) =>
        row([
          q.id,
          q.title,
          q.answer ? `${q.question} ANSWER: ${q.answer}` : q.question,
          q.affects.join(LIST_SEPARATOR),
          q.owner,
          q.status,
          q.sources.join(LIST_SEPARATOR),
        ]),
      )
      .join('')
  )
}

/** Minimal RFC 4180 reader (quoted fields, doubled quotes, embedded newlines). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let cur: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      cur.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      cur.push(cell)
      rows.push(cur)
      cur = []
      cell = ''
    } else cell += ch
  }
  if (cell || cur.length) {
    cur.push(cell)
    rows.push(cur)
  }
  const [header, ...body] = rows
  if (!header) return []
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

export const splitList = (v: string) =>
  v
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
