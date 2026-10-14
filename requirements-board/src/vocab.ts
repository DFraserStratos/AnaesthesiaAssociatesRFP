import { QUESTION_STATUSES, type ArtifactKind, type ArtifactStatus, type ItemStatus, type ItemType, type QuestionKind, type QuestionStatus } from '../shared/types.ts'
import { plainText } from '../shared/links.ts'

/** The baseline status: most items sit here, so a card only carries a pill when its status differs. */
export const BASELINE_STATUS: ItemStatus = 'Proposed'

/** CSS class suffix per status; colours live in styles.css tokens. */
export const statusClass = (s: string) => `st-${s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}`

/** CSS class that sets the type colour tokens (--ty, --ty-ink, --ty-tint). */
export const typeClass = (t: ItemType) => `ty-${t}`

/** Outstanding items are grouped by status in the vocabulary's own order, so a new status can never drop out of the view. */
export const QUESTION_GROUP_ORDER: readonly QuestionStatus[] = QUESTION_STATUSES
export const QUESTION_GROUP_LABEL: Record<QuestionStatus, string> = {
  Open: 'Open',
  Confirm: 'Awaiting confirmation',
  Proposed: 'Recommendation proposed',
  Answered: 'Answered',
}

export const KIND_LABEL: Record<QuestionKind, string> = { question: 'Question', 'missing-source': 'Missing source' }

export function excerpt(text: string, max = 160): string {
  const plain = plainText(text).replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain
}

/** Artifact kinds: one word on a filter, a plural over a group. */
export const ARTIFACT_KIND_LABEL: Record<ArtifactKind, string> = {
  diagram: 'Diagram',
  mockup: 'Mockup',
  screenshot: 'Screenshot',
  photo: 'Photo',
  transcript: 'Transcript',
  note: 'Note',
  document: 'Document',
}
export const ARTIFACT_KIND_PLURAL: Record<ArtifactKind, string> = {
  diagram: 'Diagrams',
  mockup: 'Mockups',
  screenshot: 'Screenshots',
  photo: 'Photos',
  transcript: 'Transcripts',
  note: 'Notes',
  document: 'Documents',
}

/** Current is the baseline: an artifact carries a pill only when it is a draft or has been replaced. */
export const BASELINE_ARTIFACT_STATUS: ArtifactStatus = 'Current'
export const ARTIFACT_STATUS_HELP: Record<ArtifactStatus, string> = {
  Draft: 'Still being worked on',
  Current: 'The version to go by',
  Superseded: 'Replaced by a newer artifact, kept for traceability',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** An artifact's date as it reads: "1 Oct 2026", "July 2026" or "2021", from as much as is known. */
export function artifactDate(date: string | null): string {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(date ?? '')
  if (!m) return date ?? ''
  const month = m[2] ? MONTHS[Number(m[2]) - 1] : undefined
  if (!month) return m[1]!
  return m[3] ? `${Number(m[3])} ${month.slice(0, 3)} ${m[1]}` : `${month} ${m[1]}`
}
