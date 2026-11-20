import { describe, expect, it } from 'vitest'
import { maskRawRow, maskValue, RAW_ROW_MASKING } from './mask'
import { findNhiTokens } from './nhiDetect'
import { rawRowFor } from '../intake/rawRow'
import { HOSPITAL_DOWNLOAD_SAMPLES } from '../intake/hospitalDownloads'
import { PDF_LIST_SAMPLES, pdfRowIncoming } from '../intake/pdfLists'
import type { IncomingBookingFields } from '../types'

const DOB = /\b\d{4}-\d{2}-\d{2}\b/

function fixtures(): { row: IncomingBookingFields; channel: 'download' | 'pdfList' }[] {
  const downloads = HOSPITAL_DOWNLOAD_SAMPLES.flatMap((s) => s.rows.map((row) => ({ row, channel: 'download' as const })))
  const pdfs = PDF_LIST_SAMPLES.flatMap((s) => s.rows.map(({ id: _id, ...asRead }) => ({ row: pdfRowIncoming(s, { asRead, corrections: [] }, { name: s.surgeonName }), channel: 'pdfList' as const })))
  return [...downloads, ...pdfs]
}

describe('masking the raw hospital row (catch-up Phase 43)', () => {
  it('covers a row waiting for its NHI and a rooms PDF row among the fixtures', () => {
    const all = fixtures()
    expect(all.some((f) => f.row.patient.nhi === undefined)).toBe(true)
    expect(all.some((f) => f.channel === 'pdfList')).toBe(true)
  })

  it('every masked fixture holds no NHI and no full date of birth', () => {
    for (const { row, channel } of fixtures()) {
      const raw = rawRowFor(row, channel)
      const masked = maskRawRow(raw, RAW_ROW_MASKING)
      const byName = new Map(masked.columns.map((c) => [c.name, c.value]))
      expect(findNhiTokens(JSON.stringify(masked))).toEqual([])
      expect(DOB.test(byName.get('Date of birth') ?? '')).toBe(false)
      if (row.patient.dobISO !== undefined) expect(byName.get('Date of birth')).toBe(`${row.patient.dobISO.slice(0, 4)}-••-••`)
      if (row.patient.nhi !== undefined) expect(byName.get('NHI')).toBe(`${row.patient.nhi.toUpperCase().slice(0, 3)}••••`)
      expect(byName.get('Email')?.startsWith('•••@')).toBe(true)
      expect(byName.get('Phone')).toMatch(/^•+\d{3}$/)
      // Columns the policy does not name show as sent (the procedure, the surgeon).
      expect(byName.get('Procedure')).toBe(row.procedure?.text ?? '')
    }
  })

  it('masks an NHI-shaped value in a column the policy does not name', () => {
    const nhi = fixtures().find((f) => f.row.patient.nhi !== undefined)!.row.patient.nhi!
    const masked = maskRawRow({ columns: [{ name: 'Free text', value: `seen ${nhi} today` }] })
    expect(findNhiTokens(masked.columns[0]!.value)).toEqual([])
    // Mixed case too (review fix).
    const mixed = `${nhi.charAt(0)}${nhi.slice(1, 3).toLowerCase()}${nhi.slice(3)}`
    const maskedMixed = maskRawRow({ columns: [{ name: 'Note', value: `call re ${mixed}` }] })
    expect(findNhiTokens(maskedMixed.columns[0]!.value)).toEqual([])
  })

  it('keeps the suburb of an address and the initials of next of kin', () => {
    expect(maskValue('12 Clyde Road, Fendalton, Christchurch 8041', 'suburbOnly')).toBe('•••, Fendalton')
    expect(maskValue('Aroha Ngata', 'initials')).toBe('A. N.')
  })
})
