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
      others: [{ email: 'info@a.example', name: 'Rooms', source: 'officeContact' }],
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
})
