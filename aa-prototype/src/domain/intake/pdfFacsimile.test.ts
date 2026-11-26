/**
 * The rooms' PDF layouts (`pdfTemplates/`): invariants over every layout, plain, scanned and scanned onto a turned
 * page, short and long. The page drawn and the boxes read come from one layout pass, so every value drawn sits inside
 * its box, every box is on its page, a row's boxes never overlap each other or the next row's, the header is read on
 * page 1, and the same source gives the same pages.
 */
import { describe, expect, it } from 'vitest'
import {
  buildFacsimile,
  buildFacsimilePages,
  buildUnreadableFacsimile,
  defaultTemplateFor,
  facsimileHeaderValues,
  facsimileLetterhead,
  facsimileSize,
  layoutFacsimile,
  PDF_HEADER_ROW,
  pdfValueKey,
  readRoomsPdf,
  type FacsimileSource,
} from './pdfLists'
import { mailboxPdfHeaderValues, OKAFOR_ROOMS_PDF, SCAN_PDF } from './hospitalDownloads'
import { PDF_HEADER_FIELDS, PDF_PAGE, PDF_ROW_READ_FIELDS, readValuesOfRow } from './pdfRead'
import { PDF_TEMPLATE_IDS, PDF_TEMPLATES } from './pdfTemplates'
import { textBox, type TextOp } from './pdfTemplates/engine'
import { pageBox } from './pdfTemplates/render'
import type { PdfBox, PdfScan, PdfTemplateId, PdfTemplateVariant } from '../types'

const NAMES = [
  'Brian Holt', 'Margaret Ellison', 'Hemi Parata', 'Coral Bennett', 'Annette Riley', 'Joan Pickering', 'Peter Lusk', 'Ruth Calder',
  'Wiremu Ngata', 'Ingrid Lindqvist', 'Sione Faleolo', 'Helen Brooks', 'Mavis Thornton', 'Rewi Tamatea', 'Joyce Abernethy', 'Arjun Mehta',
  'Ngaire Hohaia', 'Bruce McAllister', 'Mei Ling Chua', 'Rangi Paewai', 'Aroha Tamihana', 'Graham Whitcombe', 'Sina Leota', 'Peter Kowalczyk',
]
const PROCEDURES = [
  'R inguinal hernia mesh', 'lap chole +/- IOC', 'phaco + IOL L', 'Right total knee joint replacement, cemented, with navigation and a drain',
  "Dupuytren's fasciectomy R", 'blephs', 'gastro/colon', 'ORIF left distal radius, volar plate',
]

function rows(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const minutes = 8 * 60 + i * 30
    return {
      id: `R${i + 1}`,
      name: NAMES[i % NAMES.length]!,
      // Every fifth patient has no NHI (the row waits at intake).
      ...(i % 5 === 4 ? {} : { nhi: `ZQ${String.fromCharCode(65 + (i % 26))}${String(1000 + i * 7).slice(0, 4)}` }),
      dobISO: `19${40 + ((i * 7) % 50)}-0${1 + (i % 9)}-1${i % 9}`,
      scheduledTime: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
      procedureText: PROCEDURES[i % PROCEDURES.length]!,
      ...(i === 1 ? { changed: true } : {}),
    }
  })
}

function source(template: PdfTemplateId, variant: PdfTemplateVariant | undefined, scan: PdfScan | undefined, n: number): FacsimileSource & { fileName: string } {
  return {
    id: `TEST-${template}-${variant ?? ''}-${n}`,
    fileName: 'test.pdf',
    surgeonName: 'Mr C. Okafor',
    hospitalName: "St George's",
    subject: 'Operating list',
    dateISO: '2026-12-09',
    session: 'AM',
    anaesthetistName: 'Dr James Rutherford',
    practice: 'Avonside Surgical Rooms',
    template,
    ...(variant !== undefined ? { variant } : {}),
    ...(scan !== undefined ? { scan } : {}),
    rows: rows(n),
    cancelledRows: [{ id: 'X1', name: 'Kahu Rangihuna', nhi: 'ZQG2001', dobISO: '1975-08-09', scheduledTime: '12:15', procedureText: 'Excision of lipoma' }],
  }
}

const LOOKS: readonly { name: string; variant?: PdfTemplateVariant; template: PdfTemplateId }[] = [
  ...PDF_TEMPLATE_IDS.map((template) => ({ name: template, template })),
  { name: 'wordGrid logo', template: 'wordGrid', variant: 'logo' },
  { name: 'report letter', template: 'report', variant: 'letter' },
]
const SCANS: readonly { name: string; scan?: PdfScan }[] = [{ name: 'plain' }, { name: 'scanned', scan: { skewDeg: -0.8 } }, { name: 'scanned onto a turned page', scan: { rotated: true, skewDeg: 0.6, clipRight: true } }]
const SIZES = [
  { name: 'short', n: 3 },
  { name: 'long', n: 24 },
]

const within = (inner: PdfBox, outer: PdfBox, tol = 0.25) =>
  inner.page === outer.page && inner.x >= outer.x - tol && inner.y >= outer.y - tol && inner.x + inner.width <= outer.x + outer.width + tol && inner.y + inner.height <= outer.y + outer.height + tol
const overlaps = (a: PdfBox, b: PdfBox) => a.page === b.page && a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01 && a.y < b.y + b.height - 0.01 && b.y < a.y + a.height - 0.01

describe.each(LOOKS)('the $name layout', ({ template, variant }) => {
  describe.each(SCANS)('$name', ({ scan }) => {
    describe.each(SIZES)('$name List', ({ n }) => {
      const src = source(template, variant, scan, n)
      const layout = layoutFacsimile(src)
      const reading = readRoomsPdf(src)
      const pages = reading.file.pages!

      it('reads every value it prints, and no ethnicity', () => {
        const header = facsimileHeaderValues(src)
        expect(reading.headerRead.map((v) => v.field)).toEqual(PDF_HEADER_FIELDS.filter((f) => header[f] !== undefined))
        reading.rows.forEach((row, i) => {
          const values = readValuesOfRow(src.rows[i]!)
          expect(row.read.map((v) => v.field), row.id).toEqual(PDF_ROW_READ_FIELDS.filter((f) => values[f] !== undefined && values[f] !== ''))
          expect(row.read.some((v) => v.field === 'ethnicityCode')).toBe(false)
        })
        expect(pages.join('')).not.toMatch(/thnicity/)
      })

      it('draws every read value inside its box, on the box page', () => {
        layout.pages.forEach((page, i) => {
          const texts = page.ops.filter((o): o is TextOp => o.kind === 'text' && o.key !== undefined)
          for (const t of texts) {
            const spot = layout.spots.get(t.key!)!
            const drawn = pageBox(layout.frame, i + 1, { ...textBox(t.x, t.baseline, t.width, t.style), derived: false })
            expect(within(drawn, spot.box), `${t.key} "${t.text}" on page ${i + 1}`).toBe(true)
          }
        })
        // and every value read was drawn
        const drawnKeys = new Set(layout.pages.flatMap((p) => p.ops.flatMap((o) => (o.kind === 'text' && o.key !== undefined ? [o.key] : []))))
        for (const v of reading.headerRead) expect(drawnKeys.has(pdfValueKey(PDF_HEADER_ROW, v.field))).toBe(true)
        for (const r of reading.rows) for (const v of r.read) expect(drawnKeys.has(pdfValueKey(r.id, v.field))).toBe(true)
      })

      it('keeps every box on its page, the header on page 1', () => {
        const all = [...reading.headerRead, ...reading.rows.flatMap((r) => r.read)]
        for (const v of all) {
          const size = facsimileSize(pages[v.box.page - 1]!)!
          expect(v.box.width).toBeGreaterThan(0)
          expect(v.box.height).toBeGreaterThan(0)
          expect(v.box.x).toBeGreaterThanOrEqual(0)
          expect(v.box.y).toBeGreaterThanOrEqual(0)
          expect(v.box.x + v.box.width).toBeLessThanOrEqual(size.width + 0.01)
          expect(v.box.y + v.box.height).toBeLessThanOrEqual(size.height + 0.01)
        }
        for (const v of reading.headerRead) expect(v.box.page).toBe(1)
      })

      it("never overlaps a row's boxes with each other or the next row's", () => {
        reading.rows.forEach((row, i) => {
          const next = reading.rows[i + 1]?.read ?? []
          row.read.forEach((a, j) => {
            for (const b of row.read.slice(j + 1)) expect(overlaps(a.box, b.box), `${row.id} ${a.field} and ${b.field}`).toBe(false)
            for (const b of next) expect(overlaps(a.box, b.box), `${row.id} ${a.field} and the next row's ${b.field}`).toBe(false)
          })
        })
      })

      it('prints on the pages it needs: the last page holds a patient, each page its own size', () => {
        const last = Math.max(...reading.rows.flatMap((r) => r.read.map((v) => v.box.page)))
        expect(pages).toHaveLength(last)
        if (n > 20) expect(pages.length).toBeGreaterThan(1)
        const { paper, orientation } = PDF_TEMPLATES[template].format(variant)
        expect(reading.paper).toBe(paper)
        expect(reading.orientation).toBe(orientation)
        const size = facsimileSize(pages[0]!)!
        const turned = scan?.rotated === true && orientation === 'landscape'
        expect(size.width > size.height).toBe(orientation === 'landscape' && !turned)
        for (const p of pages) expect(facsimileSize(p)).toEqual(size)
      })

      it('is deterministic', () => {
        expect(buildFacsimilePages(src)).toEqual(pages)
        expect(readRoomsPdf(src)).toEqual(reading)
      })
    })
  })
})

describe('the rooms PDF', () => {
  it('prints the header values the mailbox reads', () => {
    expect(facsimileHeaderValues(OKAFOR_ROOMS_PDF)).toEqual(mailboxPdfHeaderValues(OKAFOR_ROOMS_PDF))
  })

  it('names the practice: the one given, else from the address it came from', () => {
    expect(facsimileLetterhead(OKAFOR_ROOMS_PDF).practice).toBe('Avonside Surgical Rooms')
    expect(facsimileLetterhead({ ...SCAN_PDF, practice: undefined }).practice).toBe('Merivale Eye Clinic')
    expect(facsimileLetterhead({ ...SCAN_PDF, practice: undefined, senderEmail: 'a@x.example' }).practice).toBe('Whitford Surgical Rooms')
    expect(readRoomsPdf({ ...SCAN_PDF, practice: 'Merivale Eye Rooms' }).practice).toBe('Merivale Eye Rooms')
  })

  it('keeps a practice to one layout when the source names none', () => {
    expect(defaultTemplateFor('Avonside Surgical Rooms')).toEqual(defaultTemplateFor('Avonside Surgical Rooms'))
    const { template: _t, variant: _v, ...rest } = OKAFOR_ROOMS_PDF as FacsimileSource
    expect(readRoomsPdf({ ...rest, fileName: 'x.pdf', rows: OKAFOR_ROOMS_PDF.rows }).template).toBe(defaultTemplateFor('Avonside Surgical Rooms').template)
  })

  it('reads a scan at lower confidences', () => {
    const plain = readRoomsPdf({ ...SCAN_PDF, scanned: false, scan: undefined, rows: SCAN_PDF.rows.map(({ confidence: _c, ...r }) => r) })
    const scan = readRoomsPdf({ ...SCAN_PDF, rows: SCAN_PDF.rows.map(({ confidence: _c, ...r }) => r) })
    expect(plain.scanned).toBe(false)
    expect(scan.scanned).toBe(true)
    expect(plain.rows[0]!.read.find((v) => v.field === 'nhi')!.confidence).toBeGreaterThan(scan.rows[0]!.read.find((v) => v.field === 'nhi')!.confidence)
  })

  it('gives page 1 as the facsimile', () => {
    const r = readRoomsPdf(OKAFOR_ROOMS_PDF)
    expect(r.file.facsimile).toBe(r.file.pages![0])
    expect(buildFacsimile(OKAFOR_ROOMS_PDF)).toBe(r.file.facsimile)
  })
})

describe('an unreadable page', () => {
  it('is a full A4 portrait scan with no text, the same for the same seed', () => {
    const url = buildUnreadableFacsimile()
    const svg = decodeURIComponent(url.slice(url.indexOf(',') + 1))
    expect(svg).not.toMatch(/<text/)
    expect(facsimileSize(url)).toEqual({ width: PDF_PAGE.width, height: PDF_PAGE.height })
    expect(buildUnreadableFacsimile('a')).toBe(buildUnreadableFacsimile('a'))
    expect(buildUnreadableFacsimile('a')).not.toBe(buildUnreadableFacsimile('b'))
  })

  it('reads no size from a facsimile with no viewBox', () => {
    expect(facsimileSize('data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E')).toBeUndefined()
    expect(facsimileSize('')).toBeUndefined()
  })
})
