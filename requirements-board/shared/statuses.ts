/**
 * Item and question statuses as the project defines them (`statuses` and `questionStatuses` in
 * `board.config.json`). A file stores a status's `code`, a whole number that says nothing by itself
 * (`status: 4`), so neither a person nor an agent reads meaning into it without the config. Its
 * label, help, colour (`tone`) and order live there, so a status can be renamed without touching
 * a file, and each project numbers its own. What the board does with a status hangs off its
 * `role` (and `settle`), never its number or name: new items start at the `default` one, `retired`
 * ones are hidden and struck through, an `answered` question is closed.
 *
 * `status-recodes.json` records each time stored codes were rewritten (old value to new code), so
 * a diff across a recode (git history, the build plan's change check) can tell a relabel from a
 * real move: `normaliseStatus` follows the chain to today's code.
 */
import type { BoardConfig } from './config.ts'
import type { Item, Question } from './types.ts'

export type StatusKind = 'item' | 'question'

/** The colours a status can take: fixed swatches in styles.css (`.tone-*`), none of them a type hue. */
export const TONES = ['neutral', 'amber', 'olive', 'green', 'forest', 'sand', 'hatched'] as const
export type Tone = (typeof TONES)[number]

export const ITEM_ROLES = ['default', 'waiting', 'retired'] as const
export const QUESTION_ROLES = ['default', 'answered'] as const
export type StatusRole = (typeof ITEM_ROLES)[number] | (typeof QUESTION_ROLES)[number]

/** What each role does, for the Settings page. */
export const ROLE_HELP: Record<StatusRole, string> = {
  default: 'New cards start here; on the board it shows no pill',
  waiting: 'Waiting on a question: answering it moves the card on',
  retired: 'Hidden unless Retired is shown, struck through, skipped by the check',
  answered: 'Closed: the question has its answer',
}

export interface StatusDef {
  /** Stored in files: a whole number from 1, unique in its list, never changed once in use. */
  code: string
  label: string
  /** A line on what it means, beside the status menu and on hover. */
  help: string
  /** Questions only: the Questions view's group heading. Unset: the label. */
  heading?: string
  tone: Tone
  role?: StatusRole
  /** Items only: offered when a question the item depends on is answered. */
  settle?: boolean
}

export const DEFAULT_ITEM_STATUSES: StatusDef[] = [
  { code: '1', label: 'Proposed', help: 'Needs agreement', tone: 'neutral', role: 'default' },
  { code: '2', label: 'Open', help: 'Waiting on an open question', tone: 'amber', role: 'waiting' },
  { code: '3', label: 'Verify', help: 'Question answered, the whole item still to check', tone: 'olive', settle: true },
  { code: '4', label: 'Confirmed', help: 'Agreed', tone: 'green', settle: true },
  { code: '5', label: 'Retired', help: 'No longer wanted, kept for traceability', tone: 'hatched', role: 'retired' },
]

export const DEFAULT_QUESTION_STATUSES: StatusDef[] = [
  { code: '1', label: 'Open', help: 'Waiting for an answer', heading: 'Open', tone: 'amber', role: 'default' },
  { code: '2', label: 'Confirm', help: 'An answer is written, waiting for the owner to confirm it', heading: 'Awaiting confirmation', tone: 'amber' },
  { code: '3', label: 'Proposed', help: 'A recommendation is written, waiting for a decision', heading: 'Recommendation proposed', tone: 'neutral' },
  { code: '4', label: 'Answered', help: 'Settled: the answer stands', heading: 'Answered', tone: 'green', role: 'answered' },
]

/** A status code: a whole number from 1. */
export const STATUS_CODE = /^[1-9]\d*$/

/** The next free code in a list: one past the highest. */
export const nextStatusCode = (list: readonly Pick<StatusDef, 'code'>[]) => String(Math.max(0, ...list.map((d) => Number(d.code)).filter(Number.isFinite)) + 1)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

/** The rules a status list must meet, as messages (empty: it is fine). Shared by the config parser and the Settings save. */
export function statusListProblems(list: StatusDef[], kind: StatusKind, field: string): string[] {
  const out: string[] = []
  const roles: readonly string[] = kind === 'item' ? ITEM_ROLES : QUESTION_ROLES
  const seen = new Set<string>()
  for (const d of list) {
    if (seen.has(d.code)) out.push(`${field}: "${d.code}" is listed twice`)
    seen.add(d.code)
    if (d.role && !roles.includes(d.role)) out.push(`${field}: "${d.code}" role must be one of ${roles.join(', ')}`)
    if (d.settle && kind === 'question') out.push(`${field}: "${d.code}" settle applies to item statuses only`)
    if (d.settle && d.role === 'retired') out.push(`${field}: "${d.code}" can't be both retired and offered when a question is answered`)
  }
  for (const role of roles) {
    const n = list.filter((d) => d.role === role).length
    const required = role !== 'waiting'
    if (n > 1) out.push(`${field}: only one status may have the ${role} role`)
    else if (required && n === 0) out.push(`${field}: one status needs the ${role} role`)
  }
  if (kind === 'item' && !list.some((d) => d.settle)) out.push(`${field}: at least one status needs settle (offered when a question is answered)`)
  return out
}

/** Read a status list from JSON, as written: every problem reported, nothing filled in. */
export function readStatusList(raw: unknown, kind: StatusKind, field: string): { list: StatusDef[]; problems: string[] } {
  const problems: string[] = []
  if (!Array.isArray(raw)) return { list: [], problems: [`${field} must be a list of statuses ({ code, label, help, tone, role })`] }
  const list: StatusDef[] = []
  for (const s of raw) {
    const code = isObj(s) ? str(typeof s.code === 'number' ? String(s.code) : s.code) : undefined
    if (!isObj(s) || !code || !STATUS_CODE.test(code)) {
      problems.push(`${field}: ${JSON.stringify(s)} needs a code: a whole number from 1`)
      continue
    }
    const tone = (TONES as readonly unknown[]).includes(s.tone) ? (s.tone as Tone) : 'neutral'
    if (s.tone !== undefined && tone !== s.tone) problems.push(`${field}: "${code}" tone must be one of ${TONES.join(', ')}`)
    const d: StatusDef = { code, label: str(s.label) ?? code, help: str(s.help) ?? '', tone }
    const heading = str(s.heading)
    if (heading) d.heading = heading
    if (s.role !== undefined) d.role = s.role as StatusRole
    if (s.settle === true) d.settle = true
    list.push(d)
  }
  return { list, problems: [...problems, ...statusListProblems(list, kind, field)] }
}

/** Read a status list from config JSON. Problems are reported, and a list with any falls back to the defaults. */
export function parseStatusList(raw: unknown, kind: StatusKind, field: string, problems: string[]): StatusDef[] {
  const fallback = kind === 'item' ? DEFAULT_ITEM_STATUSES : DEFAULT_QUESTION_STATUSES
  if (raw === undefined) return fallback
  const read = readStatusList(raw, kind, field)
  if (!read.problems.length) return read.list
  problems.push(...read.problems, `${field}: using the defaults until that is fixed`)
  return fallback
}

/* ----------------------------------------------------------------- lookups */

export const statusesOf = (c: BoardConfig, kind: StatusKind): StatusDef[] => (kind === 'item' ? c.statuses : c.questionStatuses)
export const statusCodes = (c: BoardConfig, kind: StatusKind) => statusesOf(c, kind).map((d) => d.code)
export const statusDef = (c: BoardConfig, kind: StatusKind, code: string) => statusesOf(c, kind).find((d) => d.code === code)
/** Shown instead of the code; an unknown code shows as stored. */
export const statusLabel = (c: BoardConfig, kind: StatusKind, code: string) => statusDef(c, kind, code)?.label ?? code
export const statusHelp = (c: BoardConfig, kind: StatusKind, code: string) => statusDef(c, kind, code)?.help ?? ''
export const statusHeading = (c: BoardConfig, code: string) => {
  const d = statusDef(c, 'question', code)
  return d?.heading ?? d?.label ?? code
}
export const statusTone = (c: BoardConfig, kind: StatusKind, code: string): Tone => statusDef(c, kind, code)?.tone ?? 'neutral'

/** The code holding a role (the config always has the required ones). */
export const roleCode = (c: BoardConfig, kind: StatusKind, role: StatusRole) => statusesOf(c, kind).find((d) => d.role === role)?.code

/** Where new items and questions start. */
export const defaultStatus = (c: BoardConfig, kind: StatusKind) => roleCode(c, kind, 'default') ?? statusesOf(c, kind)[0]!.code

export const isRetiredStatus = (c: BoardConfig, code: string) => code === roleCode(c, 'item', 'retired')
export const isRetired = (c: BoardConfig, it: Pick<Item, 'status'>) => isRetiredStatus(c, it.status)
/** `isRetired` bound to a config, for code that only sorts or filters items. */
export const retiredTest = (c: BoardConfig) => (it: Pick<Item, 'status'>) => isRetired(c, it)

/** The statuses offered when a question an item depends on is answered, in list order. */
export const settleTargets = (c: BoardConfig) => c.statuses.filter((d) => d.settle).map((d) => d.code)
export const waitingStatus = (c: BoardConfig) => roleCode(c, 'item', 'waiting')

export const isAnswered = (c: BoardConfig, q: Pick<Question, 'status'>) => q.status === roleCode(c, 'question', 'answered')
export const isOpenQuestion = (c: BoardConfig, q: Pick<Question, 'status'>) => !isAnswered(c, q)

/** The classes a status pill or row takes: its tone, plus `is-retired` for the retired role. */
export function statusClasses(c: BoardConfig, kind: StatusKind, code: string): string {
  const tone = `tone-${statusTone(c, kind, code)}`
  return kind === 'item' && isRetiredStatus(c, code) ? `${tone} is-retired` : tone
}

/* ------------------------------------------------------------------ recodes */

export const RECODES_FILE = 'status-recodes.json'

/** One rewrite of stored statuses: old value to new code, for items and for questions. */
export interface Recode {
  date: string
  note?: string
  items: Record<string, string>
  questions: Record<string, string>
}

export function parseRecodes(text: string | null): Recode[] {
  if (!text) return []
  try {
    const raw: unknown = JSON.parse(text)
    if (!Array.isArray(raw)) return []
    return raw.filter(isObj).map((r) => ({
      date: String(r.date ?? ''),
      ...(str(r.note) ? { note: str(r.note) } : {}),
      items: isObj(r.items) ? (r.items as Record<string, string>) : {},
      questions: isObj(r.questions) ? (r.questions as Record<string, string>) : {},
    }))
  } catch {
    return []
  }
}

/** A stored status as today's code, following every recode in turn. Unknown values pass through. */
export function normaliseStatus(recodes: readonly Recode[], kind: StatusKind, value: string): string {
  let v = value
  for (const r of recodes) {
    const map = kind === 'item' ? r.items : r.questions
    if (Object.hasOwn(map, v)) v = map[v]!
  }
  return v
}
