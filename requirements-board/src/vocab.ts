import type { ArtifactKind, ArtifactStatus, ItemType, QuestionKind } from '../shared/types.ts'
import type { Tone } from '../shared/statuses.ts'
import { plainText } from '../shared/links.ts'

/** CSS class that sets the type colour tokens (--ty, --ty-ink, --ty-tint). */
export const typeClass = (t: ItemType) => `ty-${t}`

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
/** Artifact statuses are fixed (not project config); each takes a status tone. Superseded is struck through like a retired card. */
export const ARTIFACT_STATUS_TONE: Record<ArtifactStatus, Tone> = { Draft: 'amber', Current: 'green', Superseded: 'hatched' }
export const artifactStatusClass = (s: ArtifactStatus) => `tone-${ARTIFACT_STATUS_TONE[s] ?? 'neutral'}`
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
