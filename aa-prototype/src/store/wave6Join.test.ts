/**
 * The Wave 6 join (Lane A 40a with Lane B 43a and 43b): an NHI found on 40a's
 * register and booked twice reuses the one patient record (40's upsert), and
 * the joined seed carries both lanes' state (40a's Hub mode absent, 43b's
 * support slice).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { createBooking } from './bookingActions'
import { OFFICE_ACTOR } from './demoActors'
import { nhiRegister } from '../domain/seed/nhiRegister'
import { lookupOnRegister } from '../domain/nhiRegister'

const LIST = 'L-34821-2026-07-27-AM'

function bookFound(api: ReturnType<typeof createAppStore>, nhi: string) {
  const found = lookupOnRegister(nhiRegister(), nhi)
  if (found.kind !== 'found') throw new Error(`${nhi} not on the register`)
  const { name, dobISO } = found.person
  return createBooking(api, OFFICE_ACTOR, LIST, { patient: { nhi: found.person.nhi, name, dobISO }, sourceText: { text: 'Join check', source: 'phone' } })
}

describe('Wave 6 join', () => {
  it('a looked-up NHI booked twice reuses the single patient record', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().masters.patients).length
    const first = bookFound(api, 'ZBR4417')
    const second = bookFound(api, 'ZBR4417')
    expect(first.ok && first.value.patientOutcome).toBe('created')
    expect(second.ok && second.value.patientOutcome).toBe('reused')
    const patients = Object.values(api.getState().masters.patients)
    expect(patients.length).toBe(before + 1)
    expect(patients.filter((p) => p.nhi === 'ZBR4417')).toHaveLength(1)
  })

  it('the joined seed holds both lanes\' state', () => {
    const s = createAppStore().getState()
    expect(s.settings.nhiHubMode ?? 'available').toBe('available')
    expect(Object.keys(s.support.tickets)).toHaveLength(5)
  })
})
