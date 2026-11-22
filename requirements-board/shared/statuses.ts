/**
 * Item and question statuses as the project defines them (`statuses` and `questionStatuses` in
 * `board.config.json`). A file stores a status's `code`, a whole number that says nothing by itself
 * (`status: 4`), so neither a person nor an agent reads meaning into it without the config. Its
 * label, help, colour (`tone`) and order live there, so a status can be renamed without touching
 * a file, and each project numbers its own. What the board does with a status hangs off its
 * `role` (and `settle`), never its number or name: new items start at the `default` one, `retired`
 * ones are hidden and struck through, an `answered` question is closed.
 *
 * A number means what the project's own list says, or nothing: a list with a problem is never
 * swapped for the built-in lists (those apply only when the project defines none). A cosmetic
 * problem (a bad tone) falls back for that field alone and leaves the list *degraded*; a structural
 * one (a bad or doubled code, a role or settle rule broken, a file that does not parse) leaves it
 * *damaged*: the board reads only its readable part, and status saves are refused until the file is
 * fixed. `statusState` carries that per list to the client.
 *
 * A code is never handed out twice. A removed status is kept in `removedStatuses` (code and last
 * label), and a new status takes a code past every code ever used (`highWater`): live, removed,
 * recoded, or held by a record.
 *
 * `status-recodes.json` records each time stored codes were rewritten (old value to new code), so
 * a diff across a recode (git history, the build plan's change check) can tell a relabel from a
 * real move: `normaliseStatus` follows the chain to today's code. That is right for every version,
 * old or new, because no recode may target a code that is a source in it or in an earlier recode
 * (`recodeProblems`).
 */
import { stripBom } from './bom.ts'
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

/** The highest numeric code among these values (0 when none is a code). */
export function highestCode(...groups: Iterable<string>[]): number {
  let max = 0
  for (const g of groups) for (const v of g) if (STATUS_CODE.test(v)) max = Math.max(max, Number(v))
  return max
}

/**
 * The code a new status takes: one past every code given. Callers pass the list, the list's
 * `highWater` (removed and recoded codes) and the codes records hold, so a code is never reissued.
 */
export const nextStatusCode = (...groups: Iterable<string>[]) => String(highestCode(...groups) + 1)

/** A status taken off the list: its code is spent, and old versions storing it still read as its last label. */
export interface RemovedStatus {
  code: string
  label: string
}

export type StatusListHealth = 'healthy' | 'degraded' | 'damaged'

/** How a status list read: the input to Settings' lock-out. */
export interface StatusListState {
  /** degraded: only a cosmetic field fell back; damaged: the list's structure is broken and saves are refused. */
  state: StatusListHealth
  problems: string[]
  /** The highest code the list has ever used, as far as the config and the recodes know. */
  highWater: number
}

export const STATUS_FIELDS = { item: 'statuses', question: 'questionStatuses' } as const
export type StatusField = (typeof STATUS_FIELDS)[StatusKind]

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

/**
 * Read a status list from JSON, as written: every problem reported, nothing filled in but a bad
 * field. `damage` is the structural part of `problems` (anything but a bad tone).
 */
export function readStatusList(raw: unknown, kind: StatusKind, field: string): { list: StatusDef[]; problems: string[]; damage: string[] } {
  const damage: string[] = []
  const cosmetic: string[] = []
  if (!Array.isArray(raw)) {
    const p = [`${field} must be a list of statuses ({ code, label, help, tone, role })`]
    return { list: [], problems: p, damage: p }
  }
  const list: StatusDef[] = []
  for (const s of raw) {
    const code = isObj(s) ? str(typeof s.code === 'number' ? String(s.code) : s.code) : undefined
    if (!isObj(s) || !code || !STATUS_CODE.test(code)) {
      damage.push(`${field}: ${JSON.stringify(s)} needs a code: a whole number from 1`)
      continue
    }
    const tone = (TONES as readonly unknown[]).includes(s.tone) ? (s.tone as Tone) : 'neutral'
    if (s.tone !== undefined && tone !== s.tone) cosmetic.push(`${field}: "${code}" tone must be one of ${TONES.join(', ')}`)
    for (const key of ['label', 'help', 'heading'] as const)
      if (s[key] !== undefined && typeof s[key] !== 'string') cosmetic.push(`${field}: "${code}" ${key} must be text`)
    const d: StatusDef = { code, label: str(s.label) ?? code, help: str(s.help) ?? '', tone }
    const heading = str(s.heading)
    if (heading) d.heading = heading
    if (s.role !== undefined) d.role = s.role as StatusRole
    if (s.settle === true) d.settle = true
    list.push(d)
  }
  damage.push(...statusListProblems(list, kind, field))
  return { list, problems: [...cosmetic, ...damage], damage }
}

/**
 * What a damaged list can still say: its entries with valid codes (the first, for a doubled code),
 * and each role only where exactly one such entry holds it, so nothing is hidden, struck through or
 * started on the strength of a role the list does not settle.
 */
function readablePart(list: StatusDef[], kind: StatusKind): StatusDef[] {
  const roles: readonly string[] = kind === 'item' ? ITEM_ROLES : QUESTION_ROLES
  const count = new Map<string, number>()
  for (const d of list) count.set(d.code, (count.get(d.code) ?? 0) + 1)
  const seen = new Set<string>()
  const out = list.filter((d) => !seen.has(d.code) && !!seen.add(d.code)).map((d) => ({ ...d }))
  for (const d of out) {
    const role = d.role
    if (role && (!roles.includes(role) || list.filter((x) => x.role === role).length !== 1 || count.get(d.code)! > 1)) delete d.role
    if (d.settle && (kind === 'question' || d.role === 'retired')) delete d.settle
  }
  return out
}

/**
 * Read a status list from config JSON. Absent: the built-in list. Otherwise always the project's
 * own: a bad tone falls back for that entry (degraded), and a structural problem leaves only the
 * readable part (damaged). Problems are added to `problems` too.
 */
export function parseStatusList(raw: unknown, kind: StatusKind, field: string, problems: string[]): { list: StatusDef[]; state: StatusListHealth; problems: string[] } {
  if (raw === undefined) return { list: kind === 'item' ? DEFAULT_ITEM_STATUSES : DEFAULT_QUESTION_STATUSES, state: 'healthy', problems: [] }
  const read = readStatusList(raw, kind, field)
  if (!read.problems.length) return { list: read.list, state: 'healthy', problems: [] }
  if (!read.damage.length) {
    problems.push(...read.problems)
    return { list: read.list, state: 'degraded', problems: read.problems }
  }
  const own = [...read.problems, `${field}: the board reads only the readable part of this list until it is fixed in board.config.json (status saves are refused meanwhile)`]
  problems.push(...own)
  return { list: readablePart(read.list, kind), state: 'damaged', problems: own }
}

/** `removedStatuses[field]` from config JSON: the spent codes and their last labels. */
export function parseRemoved(raw: unknown, field: string, problems: string[]): RemovedStatus[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    problems.push(`removedStatuses.${field} must be a list of { code, label }`)
    return []
  }
  const out: RemovedStatus[] = []
  for (const r of raw) {
    const code = isObj(r) ? str(typeof r.code === 'number' ? String(r.code) : r.code) : undefined
    if (!isObj(r) || !code || !STATUS_CODE.test(code)) problems.push(`removedStatuses.${field}: ${JSON.stringify(r)} needs a code: a whole number from 1`)
    else if (!out.some((x) => x.code === code)) out.push({ code, label: str(r.label) ?? code })
  }
  return out
}

/** The numeric codes recodes have used for a kind, as sources or targets. */
export const recodedCodes = (recodes: readonly Recode[], kind: StatusKind): string[] =>
  recodes.flatMap((r) => {
    const map = kind === 'item' ? r.items : r.questions
    return [...Object.keys(map), ...Object.values(map)].filter((v) => STATUS_CODE.test(v))
  })

/* ----------------------------------------------------------------- lookups */

export const statusesOf = (c: BoardConfig, kind: StatusKind): StatusDef[] => (kind === 'item' ? c.statuses : c.questionStatuses)
export const statusCodes = (c: BoardConfig, kind: StatusKind) => statusesOf(c, kind).map((d) => d.code)
export const statusDef = (c: BoardConfig, kind: StatusKind, code: string) => statusesOf(c, kind).find((d) => d.code === code)
/** A removed status's record (its code is spent). */
export const removedStatus = (c: BoardConfig, kind: StatusKind, code: string) => c.removedStatuses?.[STATUS_FIELDS[kind]].find((d) => d.code === code)
/** Shown instead of the code: a removed code shows its last label, marked removed; an unknown code shows as stored. */
export const statusLabel = (c: BoardConfig, kind: StatusKind, code: string) => {
  const d = statusDef(c, kind, code)
  if (d) return d.label
  const gone = removedStatus(c, kind, code)
  return gone ? `${gone.label} (removed)` : code
}
export const statusHelp = (c: BoardConfig, kind: StatusKind, code: string) => statusDef(c, kind, code)?.help ?? ''
export const statusHeading = (c: BoardConfig, code: string) => {
  const d = statusDef(c, 'question', code)
  return d?.heading ?? d?.label ?? code
}
export const statusTone = (c: BoardConfig, kind: StatusKind, code: string): Tone => statusDef(c, kind, code)?.tone ?? 'neutral'

/** The code holding a role (a healthy list always has the required ones; a damaged one may not). */
export const roleCode = (c: BoardConfig, kind: StatusKind, role: StatusRole) => statusesOf(c, kind).find((d) => d.role === role)?.code

/** Where new items and questions start; empty while a damaged list leaves the default role unresolved. */
export const defaultStatus = (c: BoardConfig, kind: StatusKind) => roleCode(c, kind, 'default') ?? ''

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
    const raw: unknown = JSON.parse(stripBom(text))
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

const moves = (map: Record<string, string>) => Object.entries(map).filter(([from, to]) => from !== to)

/**
 * What makes a recode unsafe, as messages (empty: it may run). No target may be a source in this map
 * (other than an identity pair, `4=4`) or in an earlier recode, so following every recode in order
 * reads every version right. A numeric source's target is a fresh code past `highWater`, or a live
 * code named as an identity pair (an explicit merge). A name (a value from before statuses were codes)
 * may go to any live code, or a fresh one, never to a spent one. Two live codes never merge into a fresh one,
 * and a live status holding a role is never merged away.
 */
export function recodeProblems(
  map: Record<string, string>,
  kind: StatusKind,
  ctx: { live: readonly StatusDef[]; earlier: readonly Recode[]; highWater: number },
): string[] {
  const out: string[] = []
  const flag = kind === 'item' ? 'items' : 'questions'
  const sources = new Set(moves(map).map(([from]) => from))
  const earlier = new Set(ctx.earlier.flatMap((r) => moves(kind === 'item' ? r.items : r.questions).map(([from]) => from)))
  const live = new Map(ctx.live.map((d) => [d.code, d]))
  const fresh = new Map<string, string[]>()
  for (const [from, to] of moves(map)) {
    if (sources.has(to)) out.push(`${flag}: ${from}=${to} targets "${to}", which this recode also moves: renumber to fresh codes (past ${ctx.highWater}) instead`)
    else if (earlier.has(to)) out.push(`${flag}: ${from}=${to} targets "${to}", which an earlier recode moved away (${RECODES_FILE}): use a fresh code past ${ctx.highWater}`)
    else if (STATUS_CODE.test(from)) {
      if (live.has(to)) {
        if (map[to] !== to) out.push(`${flag}: ${from}=${to} merges into the live status "${to}": name it too (${to}=${to}) to merge on purpose`)
        if (live.get(from)?.role) out.push(`${flag}: ${from}=${to} merges away "${from}", which holds the ${live.get(from)!.role} role: give the role to another status first`)
      } else if (Number(to) <= ctx.highWater) out.push(`${flag}: ${from}=${to} targets "${to}", a code used before: use a fresh code past ${ctx.highWater}`)
      else if (live.has(from)) fresh.set(to, [...(fresh.get(to) ?? []), from])
    } else if (!live.has(to) && Number(to) <= ctx.highWater) out.push(`${flag}: ${from}=${to} targets "${to}", a code used before that is not live: map it to a live code or a fresh one past ${ctx.highWater}`)
  }
  for (const [to, froms] of fresh) if (froms.length > 1) out.push(`${flag}: ${froms.join(' and ')} would both become "${to}": merge into a live status instead (name it as X=X)`)
  return out
}

/** Recorded recodes that overlap (a target that the same or an earlier recode moved away), so following them misreads later versions. */
export function recodeHistoryProblems(recodes: readonly Recode[]): string[] {
  const out: string[] = []
  for (const kind of ['item', 'question'] as const) {
    const moved = new Set<string>()
    for (const r of recodes) {
      const map = kind === 'item' ? r.items : r.questions
      const own = new Set(moves(map).map(([from]) => from))
      for (const [from, to] of moves(map))
        if (moved.has(to) || own.has(to)) out.push(`${RECODES_FILE}: the ${r.date || 'undated'} recode maps ${kind === 'item' ? 'items' : 'questions'} ${from} to "${to}", a code it or an earlier recode moved away, so versions saved after it may read as the wrong status`)
      for (const from of own) moved.add(from)
    }
  }
  return out
}
