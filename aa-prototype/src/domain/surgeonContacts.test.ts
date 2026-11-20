import { describe, expect, it } from 'vitest'
import { cleanContact, isBlankContact, officeAddressFor } from './surgeonContacts'
import type { Surgeon } from './types'

const base: Omit<Surgeon, 'id' | 'officeContacts'> = { name: 'Dr T. Test', specialtyIds: ['SPC-ENT'], personalContact: { name: 'Dr T. Test', email: 'me@test.example' } }
const masters = (officeContacts: Surgeon['officeContacts']) => ({ surgeons: { 'S-T': { ...base, id: 'S-T', officeContacts } } })

describe('cleanContact and isBlankContact (catch-up Phase 17b)', () => {
  it('trims each field and drops the blank ones, never holding an empty string', () => {
    expect(cleanContact({ name: ' Bev ', email: '  ', phone: '' })).toEqual({ name: 'Bev' })
    expect(cleanContact(undefined)).toEqual({})
    expect(isBlankContact({ name: ' ', email: '', phone: '  ' })).toBe(true)
    expect(isBlankContact({ phone: '03 555 0100' })).toBe(false)
  })
})

describe('officeAddressFor: the one email helper (catch-up Phase 17b; D74)', () => {
  it('gives the first office contact with an email as the To and offers the others, in order', () => {
    const out = officeAddressFor(masters([{ name: 'Bev', email: 'bev@a.example' }, { name: 'Rooms', email: 'info@a.example', phone: '03 555 1000' }]), 'S-T')
    expect(out).toEqual({
      to: { email: 'bev@a.example', name: 'Bev', source: 'officeContact' },
      // Phase 40: the contact's phone travels with its address, for the waiting row's contact line.
      others: [{ email: 'info@a.example', name: 'Rooms', phone: '03 555 1000', source: 'officeContact' }],
    })
  })

  it('skips a contact with a blank email, and de-duplicates by email ignoring case, never repeating the To', () => {
    const out = officeAddressFor(
      masters([{ name: 'Phone only', phone: '03 555 0100' }, { name: 'Leanne', email: ' leanne@b.example ' }, { name: 'Leanne again', email: 'LEANNE@b.example' }, { email: 'pa@b.example' }]),
      'S-T',
    )
    expect(out.to).toEqual({ email: 'leanne@b.example', name: 'Leanne', source: 'officeContact' })
    expect(out.others).toEqual([{ email: 'pa@b.example', source: 'officeContact' }])
  })

  it('never offers the personal contact; none held or an unknown surgeon gives no To and nothing offered', () => {
    expect(officeAddressFor(masters([]), 'S-T')).toEqual({ to: null, others: [] })
    expect(officeAddressFor(masters([{ name: 'No email' }]), 'S-T')).toEqual({ to: null, others: [] })
    expect(officeAddressFor(masters([]), 'S-NOPE')).toEqual({ to: null, others: [] })
  })

  it('puts the sender of a List from a rooms PDF first and offers every office contact (catch-up Phase 34; US-02.2.4)', () => {
    const contacts = [{ name: 'Bev', email: 'bev@a.example' }, { name: 'Rooms', email: 'info@a.example' }]
    const pdfList = { origin: { kind: 'pdf' as const, senderEmail: 'pa@a.example' } }
    expect(officeAddressFor(masters(contacts), 'S-T', pdfList)).toEqual({
      to: { email: 'pa@a.example', source: 'listSender' },
      others: [
        { email: 'bev@a.example', name: 'Bev', source: 'officeContact' },
        { email: 'info@a.example', name: 'Rooms', source: 'officeContact' },
      ],
    })
    // The sender already an office contact: offered once, as the To.
    const same = officeAddressFor(masters(contacts), 'S-T', { origin: { kind: 'pdf', senderEmail: 'BEV@a.example' } })
    expect(same.to).toEqual({ email: 'BEV@a.example', source: 'listSender' })
    expect(same.others).toEqual([{ email: 'info@a.example', name: 'Rooms', source: 'officeContact' }])
    // A hospital, by-hand or recurring List holds no sender: 17b's rule unchanged.
    for (const origin of [{ kind: 'hospital' as const, hospitalId: 'H-SX' }, { kind: 'manual' as const }, { kind: 'recurring' as const }]) {
      expect(officeAddressFor(masters(contacts), 'S-T', { origin })).toEqual(officeAddressFor(masters(contacts), 'S-T'))
    }
    // A sender, even with no office contact held.
    expect(officeAddressFor(masters([]), 'S-T', pdfList)).toEqual({ to: { email: 'pa@a.example', source: 'listSender' }, others: [] })
  })
})
