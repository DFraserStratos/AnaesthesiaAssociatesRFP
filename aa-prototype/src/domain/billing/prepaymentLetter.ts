/**
 * The prepayment letter (catch-up Phase 41; US-06.3.6, DM-20). Pure
 * (convention 9): the one place a letter template's rules and rendering live.
 *
 * A prepayment invoice is sent with a letter filled in from one standard
 * template that admins maintain, instead of a letter written by hand. The
 * template states the prepaid amount as the price payable before the
 * procedure, never an estimate: `validateLetterTemplate` refuses estimate
 * wording, so nothing is appended to the admins' words. A reminder and the
 * optional moved-Booking email are templates of their own kinds, in the same
 * master, so all the wording is AA's.
 *
 * Templates are plain text with `{{field}}` placeholders. A missing value
 * renders "[not set]". The caller stamps the time and keeps the result as a
 * snapshot (`RenderedLetter`): editing a template never changes a letter that
 * was sent.
 *
 * OQ-120 (open, D68): whether a prepayment invoice and its letter name the
 * anaesthetist. Built as the default, read through 27's one constant
 * `PREPAYMENT_NAMES_ANAESTHETIST`: while it is off, `{{anaesthetist}}` is
 * refused in a request or reminder template.
 */

import type { LetterMergeField, PrepaymentLetterKind, PrepaymentLetterTemplate } from '../types'
import { PREPAYMENT_NAMES_ANAESTHETIST } from './prepayment'
import { formatMoney } from './money'
import { longDay } from '../dateText'

/** Every merge field, in the order the editor offers them, with its label. */
export const LETTER_MERGE_FIELDS: readonly { field: LetterMergeField; label: string }[] = [
  { field: 'patientName', label: 'Patient name' },
  { field: 'procedure', label: 'Procedure' },
  { field: 'procedureDate', label: 'Procedure date' },
  { field: 'prepaidAmount', label: 'Prepaid amount' },
  { field: 'anaesthetist', label: 'Anaesthetist' },
  { field: 'invoiceNumber', label: 'Invoice number' },
  { field: 'amountOutstanding', label: 'Amount outstanding' },
]

/** The kinds, in display order, with their labels. */
export const LETTER_KIND_LABEL: Record<PrepaymentLetterKind, string> = {
  request: 'Prepayment letter',
  reminder: 'Reminder',
  anaesthetistChanged: 'Anaesthetist changed email',
}
export const LETTER_KINDS: readonly PrepaymentLetterKind[] = ['request', 'reminder', 'anaesthetistChanged']

/** What a missing value renders as. */
export const LETTER_NOT_SET = '[not set]'

export const LETTER_NAME_MAX = 60
export const LETTER_BODY_MAX = 2000

/** The values a letter is filled in with, already formatted for reading. */
export type LetterMergeData = Partial<Record<LetterMergeField, string>>

/** A fictional Booking the template editor previews against: never a real patient. */
export const LETTER_PREVIEW_SAMPLE: LetterMergeData = {
  patientName: 'Jordan Sample',
  procedure: 'Rhinoplasty',
  procedureDate: 'Friday 27 November 2026',
  prepaidAmount: '$1,380.00',
  anaesthetist: 'Dr Melanie Souter',
  invoiceNumber: 'AA-2026-0099',
  amountOutstanding: '$690.00',
}

export const LETTER_MESSAGES = {
  emptyName: 'Give the template a name.',
  nameTooLong: `Keep the name to ${LETTER_NAME_MAX} characters.`,
  emptyBody: 'Write the letter.',
  bodyTooLong: `Keep the letter to ${LETTER_BODY_MAX.toLocaleString('en-NZ')} characters.`,
  unknownMergeField: (field: string) => `Unknown merge field {{${field}}}. Use one of the fields offered.`,
  missingPrepaidAmount: 'A prepayment letter states the prepaid amount: add {{prepaidAmount}}.',
  missingAmountOutstanding: 'A reminder states the amount still to pay: add {{amountOutstanding}}.',
  missingAnaesthetist: 'This email says who the anaesthetist is now: add {{anaesthetist}}.',
  anaesthetistNotNamed: 'Prepayment invoices do not name the anaesthetist, so the letter cannot either: remove {{anaesthetist}}.',
  estimateWording: 'State the prepaid amount as the price payable, not an estimate.',
} as const

export type LetterTemplateRefusal = keyof typeof LETTER_MESSAGES

/** The words that would make the prepaid amount read as an estimate (US-06.3.6, US-06.4.1). */
const ESTIMATE_WORDING = /\b(estimate|estimated|deposit)\b|may be higher or lower/i

const PLACEHOLDER = /\{\{\s*([A-Za-z]+)\s*\}\}/g

/** The placeholders a body uses, in order, each once. */
export function mergeFieldsIn(body: string): string[] {
  const out: string[] = []
  for (const m of body.matchAll(PLACEHOLDER)) if (!out.includes(m[1]!)) out.push(m[1]!)
  return out
}

function isMergeField(field: string): field is LetterMergeField {
  return LETTER_MERGE_FIELDS.some((f) => f.field === field)
}

/**
 * Why a template cannot be saved, or null (US-06.3.6): a name and a body
 * within their limits; only known merge fields; the field each kind must
 * state; no anaesthetist in a request or reminder while prepayment invoices do
 * not name one (D68); and no estimate wording.
 */
export function validateLetterTemplate(
  t: Pick<PrepaymentLetterTemplate, 'name' | 'body' | 'kind'>,
  namesAnaesthetist: boolean = PREPAYMENT_NAMES_ANAESTHETIST,
): { code: LetterTemplateRefusal; message: string; field: 'name' | 'body' } | null {
  const name = t.name.trim()
  if (name === '') return { code: 'emptyName', message: LETTER_MESSAGES.emptyName, field: 'name' }
  if (name.length > LETTER_NAME_MAX) return { code: 'nameTooLong', message: LETTER_MESSAGES.nameTooLong, field: 'name' }
  const body = t.body.trim()
  if (body === '') return { code: 'emptyBody', message: LETTER_MESSAGES.emptyBody, field: 'body' }
  if (body.length > LETTER_BODY_MAX) return { code: 'bodyTooLong', message: LETTER_MESSAGES.bodyTooLong, field: 'body' }
  const fields = mergeFieldsIn(body)
  const unknown = fields.find((f) => !isMergeField(f))
  if (unknown !== undefined) return { code: 'unknownMergeField', message: LETTER_MESSAGES.unknownMergeField(unknown), field: 'body' }
  if (t.kind === 'request' && !fields.includes('prepaidAmount')) return { code: 'missingPrepaidAmount', message: LETTER_MESSAGES.missingPrepaidAmount, field: 'body' }
  if (t.kind === 'reminder' && !fields.includes('amountOutstanding')) return { code: 'missingAmountOutstanding', message: LETTER_MESSAGES.missingAmountOutstanding, field: 'body' }
  if (t.kind === 'anaesthetistChanged' && !fields.includes('anaesthetist')) return { code: 'missingAnaesthetist', message: LETTER_MESSAGES.missingAnaesthetist, field: 'body' }
  if (t.kind !== 'anaesthetistChanged' && !namesAnaesthetist && fields.includes('anaesthetist')) {
    return { code: 'anaesthetistNotNamed', message: LETTER_MESSAGES.anaesthetistNotNamed, field: 'body' }
  }
  if (ESTIMATE_WORDING.test(body)) return { code: 'estimateWording', message: LETTER_MESSAGES.estimateWording, field: 'body' }
  if (ESTIMATE_WORDING.test(name)) return { code: 'estimateWording', message: LETTER_MESSAGES.estimateWording, field: 'name' }
  return null
}

/** The letter's words with every placeholder filled in; a missing value renders "[not set]". Pure: the caller stamps the time. */
export function renderPrepaymentLetter(template: Pick<PrepaymentLetterTemplate, 'body'>, data: LetterMergeData): string {
  return template.body.trim().replace(PLACEHOLDER, (_m, field: string) => {
    const value = isMergeField(field) ? data[field] : undefined
    return value !== undefined && value.trim() !== '' ? value : LETTER_NOT_SET
  })
}

/** The default active template of a kind, else the first active one by id. */
export function defaultTemplateOf(templates: Readonly<Record<string, PrepaymentLetterTemplate>>, kind: PrepaymentLetterKind): PrepaymentLetterTemplate | undefined {
  const active = Object.values(templates)
    .filter((t) => t.kind === kind && t.active)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  return active.find((t) => t.isDefault) ?? active[0]
}

/** The facts a letter is filled in from, before formatting. */
export interface LetterFacts {
  patientName?: string
  /** The prepaid Procedures' names, as the invoice lines describe them. */
  procedureNames: readonly string[]
  procedureDateISO?: string
  prepaidAmount?: number
  anaesthetistName?: string
  invoiceNumber?: string
  amountOutstanding?: number
}

/** Format the facts for reading: names joined with "and", the date in full, money as "$1,380.00". Never an NHI. */
export function letterMergeDataOf(f: LetterFacts): LetterMergeData {
  const names = f.procedureNames.filter((n) => n.trim() !== '')
  const procedure = names.length <= 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return {
    ...(f.patientName !== undefined ? { patientName: f.patientName } : {}),
    ...(procedure !== undefined ? { procedure } : {}),
    ...(f.procedureDateISO !== undefined ? { procedureDate: longDay(f.procedureDateISO) } : {}),
    ...(f.prepaidAmount !== undefined ? { prepaidAmount: formatMoney(f.prepaidAmount) } : {}),
    ...(f.anaesthetistName !== undefined ? { anaesthetist: f.anaesthetistName } : {}),
    ...(f.invoiceNumber !== undefined ? { invoiceNumber: f.invoiceNumber } : {}),
    ...(f.amountOutstanding !== undefined ? { amountOutstanding: formatMoney(f.amountOutstanding) } : {}),
  }
}

/** The number a letter previewed before sending shows: the invoice's number is allocated when it is sent. */
export const NUMBER_ALLOCATED_WHEN_SENT = '(allocated when sent)'
