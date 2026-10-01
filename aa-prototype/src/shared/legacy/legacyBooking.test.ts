import { describe, expect, it } from 'vitest'
import { legacyBookingId, legacyBookingPath } from './legacyBooking'

describe('legacyBookingId', () => {
  it('maps a Card id to its Booking id in the same numbering', () => {
    expect(legacyBookingId('C0009')).toBe('BK0009')
  })
  it('maps a history Card id to its history Booking id', () => {
    expect(legacyBookingId('HC05')).toBe('HBK05')
  })
  it('passes an already-new id through', () => {
    expect(legacyBookingId('BK0009')).toBe('BK0009')
    expect(legacyBookingId('HBK05')).toBe('HBK05')
  })
  it('passes an unknown string through for RequireEntity to bounce', () => {
    expect(legacyBookingId('nonsense')).toBe('nonsense')
    expect(legacyBookingId('C')).toBe('C')
  })
})

describe('legacyBookingPath', () => {
  it('rewrites the web, admin and mobile Card routes', () => {
    expect(legacyBookingPath('/web/lists/L-34821-2026-07-21-PM/cards/C0009')).toBe('/web/lists/L-34821-2026-07-21-PM/bookings/BK0009')
    expect(legacyBookingPath('/admin/day/2026-07-21/cards/C0009')).toBe('/admin/day/2026-07-21/bookings/BK0009')
    expect(legacyBookingPath('/mobile/lists/L-34821-2026-07-21-PM/cards/HC05/')).toBe('/mobile/lists/L-34821-2026-07-21-PM/bookings/HBK05')
  })
  it('keeps a malformed escape raw instead of throwing', () => {
    expect(legacyBookingPath('/web/lists/L1/cards/%E0')).toBe('/web/lists/L1/bookings/%E0')
  })
  it('returns null for a path that is not a legacy Booking link', () => {
    expect(legacyBookingPath('/web/lists/L1/bookings/BK0009')).toBeNull()
    expect(legacyBookingPath('/mobile/lists')).toBeNull()
  })
})
