/** Phase 52: making an anaesthetist inactive and active again survives a reload (the persisted delta). */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { flushPersist } from './persistStorage'
import { makeAnaesthetistActive, makeAnaesthetistInactive } from './anaesthetistStatusActions'
import { advanceClockToDate } from './clockActions'
import { OFFICE_ACTOR } from './demoActors'
import { ANAE } from '../domain/seed'

describe('a last day and active again, reloaded', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('keeps lastDayISO and activeAgainISO', () => {
    const api = createAppStore({ persisted: true })
    const last = '2027-03-24'
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, ANAE.beaumont, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(api, '2027-03-25')
    expect(makeAnaesthetistActive(api, OFFICE_ACTOR, ANAE.beaumont).ok).toBe(true)
    flushPersist()
    const again = createAppStore({ persisted: true }).getState().masters.anaesthetists[ANAE.beaumont]!
    expect([again.lastDayISO, again.activeAgainISO]).toEqual([last, '2027-03-25'])
  })
})
