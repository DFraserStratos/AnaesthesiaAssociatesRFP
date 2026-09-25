import { QUESTION_STATUSES, type Component, type ItemStatus, type ItemType, type QuestionKind, type QuestionStatus } from '../shared/types.ts'

/** How a status reads on screen. Stored values are shown as-is today; kept as the one place to relabel. */
export const STATUS_LABEL: Record<string, string> = {}
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s

/** The baseline status: most items sit here, so a card only carries a pill when its status differs. */
export const BASELINE_STATUS: ItemStatus = 'Proposed'

/** CSS class suffix per status; colours live in styles.css tokens. */
export const statusClass = (s: string) => `st-${s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}`

/** CSS class that sets the type colour tokens (--ty, --ty-ink, --ty-tint). */
export const typeClass = (t: ItemType) => `ty-${t}`

/** Short mono codes for the component glyph on cards. */
export const COMPONENT_CODE: Record<Component, string> = {
  'Scheduling Engine': 'SCH',
  'Billing/Invoice Engine': 'BIL',
  'Anaesthetist App (mobile + web)': 'ANA',
  'Admin App': 'ADM',
  'Xero Integration': 'XRO',
  'Health Integration': 'HL7',
  'Master Data': 'MDM',
  'Cross-cutting': 'NFR',
}

/** Outstanding items are grouped by status in the vocabulary's own order, so a new status can never drop out of the view. */
export const QUESTION_GROUP_ORDER: readonly QuestionStatus[] = QUESTION_STATUSES
export const QUESTION_GROUP_LABEL: Record<QuestionStatus, string> = {
  Open: 'Open',
  Confirm: 'Awaiting confirmation',
  Proposed: 'Recommendation proposed',
  Answered: 'Answered',
}

export const KIND_LABEL: Record<QuestionKind, string> = { question: 'Question', 'missing-source': 'Missing source' }
export const KIND_HELP: Record<QuestionKind, string> = {
  question: 'A decision or fact that blocks or shapes requirements',
  'missing-source': 'A requirement with no known origin: add its source (RFP page, a note in catalogue/notes, or Q&A) to the item',
}

export function excerpt(text: string, max = 160): string {
  const plain = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain
}
