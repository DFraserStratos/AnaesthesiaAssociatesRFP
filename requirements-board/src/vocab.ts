import type { ItemStatus, ItemType, QuestionStatus } from '../shared/types.ts'

export const STATUS_HELP: Record<ItemStatus, string> = {
  Confirmed: 'Stated in the 2026-09 meeting notes, diagrams or Q&A answers',
  RFP: 'Carried from the RFP and not contradicted since',
  Proposed: 'A recommendation to fill a gap, needs sign-off',
  Future: 'RFP scope that does not reflect current reality, deferred',
  Open: 'Depends on an open question',
  Retired: 'No longer wanted, kept for traceability',
}

/** How a status reads on screen. The stored value stays `RFP` (the files and CSV keep it). */
export const STATUS_LABEL: Record<string, string> = { RFP: 'From RFP' }
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s

/** CSS class suffix per status; colours live in styles.css tokens. */
export const statusClass = (s: string) => `st-${s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}`

export const TYPE_LABEL: Record<ItemType, string> = { epic: 'Epic', feature: 'Feature', story: 'Story' }

/** CSS class that sets the type colour tokens (--ty, --ty-ink, --ty-tint). */
export const typeClass = (t: ItemType) => `ty-${t}`

/** Short mono codes for the component glyph on cards. */
export const COMPONENT_CODE: Record<string, string> = {
  'Scheduling Engine': 'SCH',
  'Billing/Invoice Engine': 'BIL',
  'Anaesthetist App (mobile + web)': 'ANA',
  'Admin App': 'ADM',
  'Xero Integration': 'XRO',
  'Health Integration': 'HL7',
  'Master Data': 'MDM',
  'Cross-cutting': 'NFR',
}

export const QUESTION_GROUP_ORDER: QuestionStatus[] = ['Open', 'Open (from RFP)', 'Confirm', 'Proposed', 'Answered']
export const QUESTION_GROUP_LABEL: Record<QuestionStatus, string> = {
  Open: 'Open',
  'Open (from RFP)': 'Open, carried from the RFP',
  Confirm: 'Awaiting confirmation',
  Proposed: 'Recommendation proposed',
  Answered: 'Answered',
}

export function excerpt(text: string, max = 160): string {
  const plain = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain
}
