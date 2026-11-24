/**
 * A snapshot reader's responses: answers to outstanding items, comments on cards and artifacts, and
 * suggested edits to a card's text. They are kept in the reader's browser and leave it only as the
 * file they download and send back (`responsesFile`), which `update-requirements` reads as evidence.
 * Nothing here ever edits the catalogue. Pure, so the shape check and the file are tested alone.
 */
import { compareIds } from '../../shared/ids.ts'
import type { SnapshotInfo } from '../../shared/snapshot.ts'
import { isRecord, isString, oneOf, type Coerce } from '../storage.ts'

export const RESPONSE_KINDS = ['answer', 'comment', 'edit'] as const
export type ResponseKind = (typeof RESPONSE_KINDS)[number]

export const TARGET_TYPES = ['question', 'item', 'artifact'] as const
export type TargetType = (typeof TARGET_TYPES)[number]

/** The text fields of a card a reader may suggest an edit to, in the order a card shows them. */
export const EDIT_FIELDS = ['title', 'description', 'acceptance'] as const
export type EditField = (typeof EDIT_FIELDS)[number]
export const EDIT_FIELD_LABELS: Record<EditField, string> = { title: 'Title', description: 'Description', acceptance: 'Acceptance criteria' }

/** What a response is about: a record, and for an artifact optionally a spot in it. Titles are as the reader saw them. */
export interface ResponseTarget {
  type: TargetType
  id: string
  title: string
  /** An artifact's region ID, when the comment is about one spot. */
  spot?: string
  spotName?: string
}

/** One field of a suggested edit: the text as the snapshot had it and as the reader would have it. */
export interface FieldEdit {
  field: EditField
  before: string
  after: string
}

export interface ReaderResponse {
  id: string
  kind: ResponseKind
  target: ResponseTarget
  /** The answer or comment; for a suggested edit, an optional reason. */
  text: string
  /** A suggested edit's changed fields only; empty for answers and comments. */
  edits: FieldEdit[]
  /** The commit of the snapshot the reader was reading, so a response on a record changed since can be spotted. */
  snapshotCommit: string | null
  /** When it was last written (ISO 8601). */
  at: string
}

export interface Reader {
  name: string
  organisation: string
}

export interface ResponsesData {
  reader: Reader
  responses: ReaderResponse[]
}

export const EMPTY_RESPONSES: ResponsesData = { reader: { name: '', organisation: '' }, responses: [] }

/** The browser storage key: per project, not per snapshot, so a newer snapshot keeps responses not yet sent. */
export const responsesKey = (project: string) => `requirements-board:responses:${project || 'board'}`

const isKind = oneOf(...RESPONSE_KINDS)
const isTargetType = oneOf(...TARGET_TYPES)
const isEditField = oneOf(...EDIT_FIELDS)

function coerceTarget(raw: unknown): ResponseTarget | null {
  if (!isRecord(raw) || !isTargetType(raw.type) || !isString(raw.id) || !raw.id) return null
  const t: ResponseTarget = { type: raw.type, id: raw.id, title: isString(raw.title) ? raw.title : '' }
  if (isString(raw.spot) && raw.spot) t.spot = raw.spot
  if (isString(raw.spotName) && raw.spotName) t.spotName = raw.spotName
  return t
}

function coerceResponse(raw: unknown, bad: () => void): ReaderResponse | null {
  if (!isRecord(raw) || !isString(raw.id) || !isKind(raw.kind) || !isString(raw.at)) return null
  const target = coerceTarget(raw.target)
  if (!target) return null
  const edits: FieldEdit[] = []
  if (Array.isArray(raw.edits)) {
    for (const e of raw.edits) {
      if (isRecord(e) && isEditField(e.field) && isString(e.before) && isString(e.after)) edits.push({ field: e.field, before: e.before, after: e.after })
      else bad()
    }
  }
  return {
    id: raw.id,
    kind: raw.kind,
    target,
    text: isString(raw.text) ? raw.text : '',
    edits,
    snapshotCommit: isString(raw.snapshotCommit) ? raw.snapshotCommit : null,
    at: raw.at,
  }
}

/** The stored value's shape check: a response that cannot be read is dropped (and reported), the rest kept. */
export const responsesShape: Coerce<ResponsesData> = (raw, bad) => {
  if (!isRecord(raw)) {
    bad()
    return { reader: { ...EMPTY_RESPONSES.reader }, responses: [] }
  }
  const r = isRecord(raw.reader) ? raw.reader : {}
  if (raw.reader !== undefined && !isRecord(raw.reader)) bad()
  const reader: Reader = { name: isString(r.name) ? r.name : '', organisation: isString(r.organisation) ? r.organisation : '' }
  const responses: ReaderResponse[] = []
  if (Array.isArray(raw.responses)) {
    for (const x of raw.responses) {
      const c = coerceResponse(x, bad)
      if (c) responses.push(c)
      else bad()
    }
  } else if (raw.responses !== undefined) bad()
  return { reader, responses }
}

/** A response is worth keeping when it says something: text, or an edit that changes a field. */
export const isEmptyResponse = (r: Pick<ReaderResponse, 'text' | 'edits'>) => !r.text.trim() && r.edits.every((e) => e.before === e.after)

/** The fields of a suggested edit that differ from the card, in the card's order. */
export function changedFields(before: Record<EditField, string>, after: Record<EditField, string>): FieldEdit[] {
  return EDIT_FIELDS.filter((f) => before[f] !== after[f]).map((field) => ({ field, before: before[field], after: after[field] }))
}

const KIND_LABEL: Record<ResponseKind, string> = { answer: 'Answer', comment: 'Comment', edit: 'Suggested edit' }
export const kindLabel = (k: ResponseKind) => KIND_LABEL[k]

/** The reference a response cites: `OQ-12`, `ST-01.2`, `AR-04#price-rules`. */
export const targetRef = (t: ResponseTarget) => (t.spot ? `${t.id}#${t.spot}` : t.id)

/** Responses in reading order: outstanding items, then cards, then artifacts; by ID; oldest first within one. */
export function sortResponses(list: readonly ReaderResponse[]): ReaderResponse[] {
  const rank = (t: TargetType) => TARGET_TYPES.indexOf(t)
  return [...list].sort((a, b) => rank(a.target.type) - rank(b.target.type) || compareIds(a.target.id, b.target.id) || (a.target.spot ?? '').localeCompare(b.target.spot ?? '') || a.at.localeCompare(b.at))
}

const quote = (text: string) => (text.trim() ? text.trim().split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n') : '> (empty)')

/** The downloaded file's name, on the reader's own day (`YYYY-MM-DD`): `responses-jane-smith-2026-11-25.md`. */
export function responsesFileName(reader: Reader, day: string): string {
  const who = reader.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reader'
  return `responses-${who}-${day}.md`
}

/** A date as `YYYY-MM-DD` in the reader's own time zone. */
export const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * The file a reader sends back: Markdown a person can read, each response under a heading naming its kind,
 * the record it cites by ID and its title, then a JSON block with the same data for exact reading.
 */
export function responsesFile(data: ResponsesData, snapshot: SnapshotInfo | undefined, nowIso: string): string {
  const list = sortResponses(data.responses.filter((r) => !isEmptyResponse(r)))
  const project = snapshot?.project ? `the ${snapshot.project}` : 'the'
  const out: string[] = [`# Responses to ${project} requirements board`, '']
  const who = [data.reader.name.trim() || '(no name given)', data.reader.organisation.trim()].filter(Boolean).join(' · ')
  out.push(`- **From:** ${who}`)
  if (snapshot) {
    const commit = snapshot.commit ? `commit ${snapshot.commit.slice(0, 12)}${snapshot.dirty ? ' with uncommitted changes' : ''}` : 'no commit'
    out.push(`- **Snapshot:** taken ${snapshot.takenAt.slice(0, 10)} · ${commit} · board ${snapshot.boardVersion}`)
  }
  out.push(`- **Downloaded:** ${nowIso}`, `- **Responses:** ${list.length}`, '')
  for (const r of list) {
    const spot = r.target.spot ? ` (spot: ${r.target.spotName || r.target.spot})` : ''
    out.push(`## ${kindLabel(r.kind)} · ${targetRef(r.target)} · ${r.target.title}${spot}`, '')
    if (r.text.trim()) out.push(r.text.trim(), '')
    for (const e of r.edits) {
      out.push(`### ${EDIT_FIELD_LABELS[e.field]}`, '', '**Was:**', '', quote(e.before), '', '**Suggested:**', '', quote(e.after), '')
    }
    out.push(`<sub>Written ${r.at}</sub>`, '')
  }
  if (!list.length) out.push('_No responses yet._', '')
  out.push('## Data', '', 'The same responses, for exact reading:', '', '```json', JSON.stringify({ reader: data.reader, snapshot: snapshot ?? null, responses: list }, null, 2), '```', '')
  return out.join('\n')
}
