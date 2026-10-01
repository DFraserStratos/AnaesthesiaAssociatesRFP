/**
 * The bundled samples behind the simulated file picker (US-03.1.3; catch-up
 * Phase 15). There is no real file input: every attachment is one of these
 * small inline SVG data URLs (a few KB each), because data URLs persist to
 * localStorage against its 5 MB budget. The photo reuses the scanned paper
 * booking cards; the PDFs are facsimile first pages in the style of
 * `samplePaperCards.ts` and the surgeon-PDF facsimile.
 */

import type { Attachment } from '../domain/types'
import { PAPER_CARD_A, PAPER_CARD_B } from './samplePaperCards'

export interface SampleAttachment {
  /** Stable sample key (not the stored attachment id, which the store allocates). */
  key: string
  name: string
  kind: Attachment['kind']
  dataUrl: string
  /** One line under the sample in the picker. */
  detail: string
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;')
}

/** A facsimile document page: letterhead, a title, then grey text bars. */
function documentPage(letterhead: string, title: string, lines: readonly string[]): string {
  const body = lines
    .map((line, i) => `<text x="40" y="${176 + i * 30}" font-family="Georgia,serif" font-size="15" fill="#3B4744">${escapeXml(line)}</text>`)
    .join('')
  const bars = [0, 1, 2, 3, 4]
    .map((i) => `<rect x="40" y="${200 + lines.length * 30 + i * 22}" width="${360 - (i % 3) * 60}" height="8" rx="4" fill="#E4E1D8"/>`)
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="560" viewBox="0 0 440 560">` +
    `<rect width="440" height="560" fill="#FFFFFF"/>` +
    `<rect x="0" y="0" width="440" height="8" fill="#C9CFCB"/>` +
    `<text x="40" y="58" font-family="Georgia,serif" font-size="13" fill="#8A9490">${escapeXml(letterhead)}</text>` +
    `<text x="40" y="104" font-family="Georgia,serif" font-size="24" fill="#172320">${escapeXml(title)}</text>` +
    `<line x1="40" y1="128" x2="400" y2="128" stroke="#D9D6CC" stroke-width="1.5"/>` +
    body +
    bars +
    `<text x="40" y="530" font-family="monospace" font-size="11" fill="#8A9490">Page 1 of 1 · sample document</text>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const SAMPLE_THEATRE_LIST: string = documentPage("St George's Hospital · Theatre 3", 'Theatre list', [
  'Tue 28 Jul 2026 · AM session',
  'Surgeon: Mr Hale',
  'Anaesthetist: Dr Souter',
  '08:00 · 09:30 · 11:00',
])

export const SAMPLE_PHOTOS: readonly SampleAttachment[] = [
  { key: 'photo-a', name: 'Booking card photo A', kind: 'photo', dataUrl: PAPER_CARD_A, detail: 'Photo of the paper booking card' },
  { key: 'photo-b', name: 'Booking card photo B', kind: 'photo', dataUrl: PAPER_CARD_B, detail: 'A second paper booking card' },
]

export const SAMPLE_FILES: readonly SampleAttachment[] = [
  {
    key: 'surgeon-letter',
    name: "Surgeon's letter",
    kind: 'pdf',
    dataUrl: documentPage('Christchurch Surgical Rooms', 'Referral letter', ['Dear Dr Souter,', 'Please see the patient below', 'for the planned procedure.']),
    detail: 'PDF · 1 page',
  },
  {
    key: 'consent-form',
    name: 'Consent form',
    kind: 'pdf',
    dataUrl: documentPage('Patient consent', 'Consent to anaesthesia', ['I consent to the anaesthetic', 'described to me today.', 'Signed and dated by the patient.']),
    detail: 'PDF · 1 page',
  },
  { key: 'theatre-list', name: 'Theatre list', kind: 'pdf', dataUrl: SAMPLE_THEATRE_LIST, detail: 'PDF · 1 page' },
]
