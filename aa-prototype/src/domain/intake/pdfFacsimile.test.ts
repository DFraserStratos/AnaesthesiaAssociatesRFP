import { describe, expect, it } from 'vitest'
import {
  buildFacsimile,
  buildUnreadableFacsimile,
  facsimileHeaderValues,
  facsimileSize,
  facsimileTextSpots,
  PDF_HEADER_ROW,
  PDF_LIST_SAMPLES,
  PDF_RESEND_SAMPLES,
  pdfValueKey,
  type FacsimileSource,
} from './pdfLists'
import { FORTE_ROOMS_PDF, mailboxPdfHeaderValues, OKAFOR_ROOMS_PDF, OKAFOR_ROOMS_RESEND, SCAN_PDF, type MailboxPdfSample } from './hospitalDownloads'
import { PDF_PAGE, pdfPageHeight, readValuesOfRow, simulateRead } from './pdfRead'
import type { PdfBox } from '../types'

const MAILBOX: readonly MailboxPdfSample[] = [OKAFOR_ROOMS_PDF, OKAFOR_ROOMS_RESEND, SCAN_PDF, FORTE_ROOMS_PDF]
const SAMPLES: readonly { name: string; sample: FacsimileSource }[] = [
  ...PDF_LIST_SAMPLES.map((s) => ({ name: s.id, sample: s })),
  ...PDF_RESEND_SAMPLES.map((s) => ({ name: s.id, sample: s })),
  ...MAILBOX.map((s) => ({ name: s.id, sample: s })),
]

function svgOf(dataUrl: string): string {
  expect(dataUrl.startsWith('data:image/svg+xml,')).toBe(true)
  return decodeURIComponent(dataUrl.slice('data:image/svg+xml,'.length))
}

function unesc(text: string): string {
  return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

/** Every value `<text>` the generator drew, by its key: its x, baseline and text as printed. */
function drawnValues(svg: string): Map<string, { x: number; baseline: number; text: string }> {
  const out = new Map<string, { x: number; baseline: number; text: string }>()
  for (const m of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*data-key="([^"]+)"[^>]*>([^<]*)<\/text>/g)) {
    out.set(m[3]!, { x: Number(m[1]), baseline: Number(m[2]), text: unesc(m[4]!) })
  }
  return out
}

function encloses(box: PdfBox, x: number, baseline: number): boolean {
  return x >= box.x && x <= box.x + box.width && baseline >= box.y && baseline <= box.y + box.height
}

function readOf(sample: FacsimileSource) {
  return simulateRead({
    header: facsimileHeaderValues(sample),
    rows: sample.rows.map((r) => ({ id: r.id, values: readValuesOfRow(r) })),
    scanned: sample.scanned === true,
  })
}

describe('the facsimile draws each value where the reader boxes it', () => {
  it.each(SAMPLES)('$name: every read value has a drawn text whose origin its box encloses', ({ sample }) => {
    const svg = svgOf(buildFacsimile(sample))
    const drawn = drawnValues(svg)
    const spots = new Map(facsimileTextSpots(sample).map((s) => [s.key, s]))
    const read = readOf(sample)
    const values = [
      ...read.headerRead.map((v) => ({ key: pdfValueKey(PDF_HEADER_ROW, v.field), v })),
      ...read.rows.flatMap((r) => r.read.map((v) => ({ key: pdfValueKey(r.id, v.field), v }))),
    ]
    expect(values.length).toBeGreaterThan(0)
    expect(drawn.size).toBe(values.length)
    for (const { key, v } of values) {
      const spot = spots.get(key)
      const text = drawn.get(key)
      expect(spot, key).toBeDefined()
      expect(text, key).toEqual({ x: spot!.x, baseline: spot!.baseline, text: spot!.text })
      expect(encloses(v.box, spot!.x, spot!.baseline), `${key} at (${spot!.x}, ${spot!.baseline}) in ${JSON.stringify(v.box)}`).toBe(true)
      // Printed as read; a long value is cut to its column, never changed.
      if (spot!.text.endsWith('…')) expect(v.value.startsWith(spot!.text.slice(0, -1))).toBe(true)
      else expect(spot!.text).toBe(v.value)
    }
  })

  it.each(MAILBOX.map((s) => ({ name: s.id, sample: s })))('$name: prints the header values the mailbox ingest reads', ({ sample }) => {
    expect(facsimileHeaderValues(sample)).toEqual(mailboxPdfHeaderValues(sample))
  })

  it('prints the seed PDF list header the seed reads (the suggested anaesthetist named)', () => {
    const okafor = PDF_LIST_SAMPLES[0]!
    expect(facsimileHeaderValues(okafor)).toEqual({
      surgeon: 'Mr C. Okafor',
      hospital: 'Forte Health',
      date: 'Wednesday 9 December 2026',
      session: 'AM',
      anaesthetist: 'Dr James Rutherford',
    })
  })

  it.each(SAMPLES)('$name: the page is the reader page width and its height for the rows', ({ sample }) => {
    expect(facsimileSize(buildFacsimile(sample))).toEqual({ width: PDF_PAGE.width, height: pdfPageHeight(sample.rows.length) })
  })

  it('draws the same page every time, and a scan with a scan look', () => {
    expect(buildFacsimile(SCAN_PDF)).toBe(buildFacsimile(SCAN_PDF))
    const scan = svgOf(buildFacsimile(SCAN_PDF))
    const plain = svgOf(buildFacsimile({ ...SCAN_PDF, scanned: false }))
    expect(scan).toContain('feTurbulence')
    expect(plain).not.toContain('feTurbulence')
    expect(drawnValues(scan)).toEqual(drawnValues(plain))
  })
})

describe('the unreadable page', () => {
  it('has nothing legible: no text at all, the reader page width, the same page for the same seed', () => {
    const url = buildUnreadableFacsimile()
    const svg = svgOf(url)
    expect(svg).not.toMatch(/<text/)
    expect(facsimileSize(url)?.width).toBe(PDF_PAGE.width)
    expect(buildUnreadableFacsimile('a')).toBe(buildUnreadableFacsimile('a'))
    expect(buildUnreadableFacsimile('a')).not.toBe(buildUnreadableFacsimile('b'))
  })

  it('reads no size from a data URL without a viewBox', () => {
    expect(facsimileSize('data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E')).toBeUndefined()
    expect(facsimileSize('')).toBeUndefined()
  })
})
