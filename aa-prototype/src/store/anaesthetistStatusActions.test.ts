import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import {
  INACTIVE_CONTRACTS_ACTOR,
  NO_LONGER_ACTIVE,
  clearLastDay,
  inactiveSignInCandidate,
  makeAnaesthetistActive,
  makeAnaesthetistInactive,
  offerBackFor,
  ownActiveContracts,
  runInactiveContractsJob,
  signInRefusal,
  wireInactiveContracts,
  type ListsAfterLastDayDetails,
} from './anaesthetistStatusActions'
import { advanceClockToDate } from './clockActions'
import { addAnaesthetist } from './mastersActions'
import { disableContract } from './contractActions'
import { replaceContract } from './contractReplaceActions'
import { replacedContractsToDisable } from './replacedContractSelectors'
import { recordAnaesthetistSignIn } from './authDemoActions'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { dayAfterISO } from '../domain/anaesthetistStatus'
import { ANAE } from '../domain/seed'
import { PRICED_ITEM } from '../domain/seed/pricedItems'

const BEAU = ANAE.beaumont
const NEW = {
  registrationNumber: '99003',
  name: 'Dr Third Person',
  phone: '',
  email: '',
  unitValue: 30,
  hpiId: '99THRP',
  bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099003-00' },
  startDateISO: '2026-11-24',
}
const RHINO = PRICED_ITEM.beaumontRhinoplasty
const TODAY = '2026-11-24'

/** Beaumont's last List date (or today): a last day no List of hers comes after. */
function clearLastDayFor(api: AppStoreApi): string {
  const dates = Object.values(api.getState().schedule.lists)
    .filter((l) => l.anaesthetistId === BEAU)
    .map((l) => l.dateISO)
  return dates.reduce((a, b) => (b > a ? b : a), TODAY)
}

const slotDates = (api: AppStoreApi, id: string = BEAU) => Object.values(api.getState().schedule.slots).filter((s) => s.anaesthetistId === id).map((s) => s.dateISO)

let unwire: (() => void) | null = null
afterEach(() => {
  unwire?.()
  unwire = null
})

describe('makeAnaesthetistInactive (US-12.1.6)', () => {
  it('Refused while holding Lists: lists those after the day, writes nothing', () => {
    const api = createAppStore()
    const auditBefore = api.getState().audit.length
    const r = makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, TODAY, 'leftPractice')
    expect(r.ok ? '' : r.code).toBe('listsAfterLastDay')
    const lists = (r.ok ? { lists: [] } : (r.details as ListsAfterLastDayDetails)).lists
    expect(lists.length).toBeGreaterThan(0)
    expect(lists.every((l) => l.anaesthetistId === BEAU && l.dateISO > TODAY)).toBe(true)
    expect(r.ok ? '' : r.message).toMatch(/^Dr Beaumont has \d+ Lists? after 24 Nov\. Reassign (it|them) first\.$/)
    expect(api.getState().audit.length).toBe(auditBefore)
  })

  it('Last day chosen: keeps Slots to the day, none after, one audited change; office only; not a past day', () => {
    const api = createAppStore()
    expect(addAnaesthetist(api, OFFICE_ACTOR, NEW).ok).toBe(true)
    const id = NEW.registrationNumber
    const last = '2026-12-04'
    expect(makeAnaesthetistInactive(api, SOUTER_ACTOR, id, last, 'leftPractice').ok).toBe(false)
    const past = makeAnaesthetistInactive(api, OFFICE_ACTOR, id, '2026-11-23', 'leftPractice')
    expect(past.ok ? '' : past.code).toBe('lastDayPassed')
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, id, last, 'longLeave').ok).toBe(true)
    const a = api.getState().masters.anaesthetists[id]!
    expect([a.lastDayISO, a.inactiveReason, a.activeAgainISO]).toEqual([last, 'longLeave', null])
    expect(slotDates(api, id).filter((d) => d === last)).toHaveLength(2)
    expect(slotDates(api, id).some((d) => d > last)).toBe(false)
    const tail = api.getState().audit.slice(-2)
    expect(tail.map((e) => e.action)).toEqual(['anaesthetist.makeInactive', 'canvas.trim'])
    expect(tail[0]).toMatchObject({ after: { lastDayISO: last, reason: 'Long leave' } })
    expect(tail[1]).toMatchObject({ after: { fromISO: '2026-12-05' } })
    // A second last day is refused until this one is cleared (no Change action).
    const again = makeAnaesthetistInactive(api, OFFICE_ACTOR, id, last, 'other')
    expect(again.ok ? '' : again.code).toBe('alreadyLeaving')
  })
})

describe('clearLastDay (Cleared in time)', () => {
  it('brings the Slots after the day back, so nothing about her has changed', () => {
    const api = createAppStore()
    const before = slotDates(api).sort()
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    expect(clearLastDay(api, OFFICE_ACTOR, BEAU).ok).toBe(true)
    expect(slotDates(api).sort()).toEqual(before)
    const a = api.getState().masters.anaesthetists[BEAU]!
    expect([a.lastDayISO, a.inactiveReason]).toEqual([null, null])
    expect(api.getState().audit.findLast((e) => e.entityType === 'anaesthetist')?.action).toBe('anaesthetist.clearLastDay')
    const none = clearLastDay(api, OFFICE_ACTOR, BEAU)
    expect(none.ok ? '' : none.code).toBe('noLastDay')
  })
})

describe('the Contract rule and Active again (US-04.1.2 Inactive anaesthetist)', () => {
  it('Her Contracts disabled: Rhinoplasty is Disabled by the rule once the clock passes her day; a second day adds nothing', () => {
    const api = createAppStore()
    unwire = wireInactiveContracts(api)
    expect(ownActiveContracts(api.getState(), BEAU).map((c) => c.id)).toContain(RHINO)
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    expect(api.getState().masters.contracts[RHINO]!.status).toBe('active')
    advanceClockToDate(api, dayAfterISO(last))
    expect(api.getState().masters.contracts[RHINO]!.status).toBe('disabled')
    const disables = () => api.getState().audit.filter((e) => e.action === 'contract.disable' && e.entityId === RHINO)
    expect(disables()).toHaveLength(1)
    expect(disables()[0]).toMatchObject({ who: INACTIVE_CONTRACTS_ACTOR.who, source: 'system' })
    advanceClockToDate(api, dayAfterISO(dayAfterISO(last)))
    expect(runInactiveContractsJob(api).disabled).toEqual([])
    expect(disables()).toHaveLength(1)
  })

  it('Active again: Slots from today, Rhinoplasty offered back and enabled once ticked; a hand disable is never offered', () => {
    const api = createAppStore()
    unwire = wireInactiveContracts(api)
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    const back = dayAfterISO(dayAfterISO(last))
    advanceClockToDate(api, back)
    expect(slotDates(api).some((d) => d > last)).toBe(false)
    expect(offerBackFor(api.getState(), BEAU).map((c) => c.id)).toEqual([RHINO])
    const stray = makeAnaesthetistActive(api, OFFICE_ACTOR, BEAU, ['CT-NO-CONTRACT'])
    expect(stray.ok ? '' : stray.code).toBe('notOffered')
    expect(makeAnaesthetistActive(api, OFFICE_ACTOR, BEAU, [RHINO]).ok).toBe(true)
    expect(api.getState().masters.contracts[RHINO]!.status).toBe('active')
    expect(api.getState().masters.anaesthetists[BEAU]!.activeAgainISO).toBe(back)
    expect(slotDates(api).filter((d) => d >= back).length).toBeGreaterThan(0)
    expect(slotDates(api).some((d) => d > last && d < back)).toBe(false)
    // One change set: the make-active, its canvas and the enable.
    const tail = api.getState().audit.slice(-3)
    expect(tail.map((e) => e.action)).toEqual(['anaesthetist.makeActive', 'canvas.generate', 'contract.enable'])
    expect(new Set(tail.map((e) => e.changeSetId)).size).toBe(1)
    expect(offerBackFor(api.getState(), BEAU)).toEqual([])
  })

  it('a Contract the office disabled by hand is not offered back', () => {
    const api = createAppStore()
    expect(disableContract(api, OFFICE_ACTOR, RHINO).ok).toBe(true)
    unwire = wireInactiveContracts(api)
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(api, dayAfterISO(last))
    expect(offerBackFor(api.getState(), BEAU)).toEqual([])
  })

  it('a re-enabled replaced Contract (49) brings its to-do back', () => {
    const api = createAppStore()
    const r = replaceContract(api, OFFICE_ACTOR, RHINO, { patch: { name: 'Rhinoplasty, 2027' }, fromISO: TODAY, moveProcedureIds: [], disableNow: false })
    expect(r.ok).toBe(true)
    const todo = () => replacedContractsToDisable(api.getState()).some((row) => row.contractId === RHINO)
    expect(todo()).toBe(true)
    unwire = wireInactiveContracts(api)
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(api, dayAfterISO(last))
    expect(todo()).toBe(false)
    // Both the old Contract and its replacement are hers, so both were disabled and both are offered back, ticked.
    const offered = offerBackFor(api.getState(), BEAU).map((c) => c.id)
    expect(offered).toContain(RHINO)
    expect(offered).toHaveLength(2)
    expect(makeAnaesthetistActive(api, OFFICE_ACTOR, BEAU, offered).ok).toBe(true)
    expect(todo()).toBe(true)
  })
})

describe('sign-in (US-13.5.3, DM-07)', () => {
  it('Inactive: allowed on the last day, refused after it, back when made active', () => {
    const api = createAppStore()
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(api, last)
    expect(signInRefusal(api.getState(), BEAU)).toBeNull()
    advanceClockToDate(api, dayAfterISO(last))
    expect(signInRefusal(api.getState(), BEAU)).toBe(NO_LONGER_ACTIVE)
    expect(inactiveSignInCandidate(api.getState())?.registrationNumber).toBe(BEAU)
    expect(makeAnaesthetistActive(api, OFFICE_ACTOR, BEAU).ok).toBe(true)
    expect(signInRefusal(api.getState(), BEAU)).toBeNull()
  })

  it('the refusal is its own audited row; Dr Souter\'s rows are as before', () => {
    const api = createAppStore()
    expect(recordAnaesthetistSignIn(api, 'refused', { anaesthetistId: BEAU, reason: NO_LONGER_ACTIVE }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({
      entityType: 'account',
      entityId: BEAU,
      who: 'Dr Sarah Beaumont',
      action: 'auth.signInFailed',
      after: { reason: NO_LONGER_ACTIVE },
    })
    recordAnaesthetistSignIn(api, 'signedIn')
    expect(api.getState().audit.at(-1)).toMatchObject({ entityId: ANAE.souter, who: 'Dr Melanie Souter', action: 'auth.signIn' })
    expect(signInRefusal(api.getState(), ANAE.souter)).toBeNull()
  })
})

describe('the readers follow isActiveOn', () => {
  it('no Slots after the last day on roll-forward', () => {
    const api = createAppStore()
    const last = clearLastDayFor(api)
    expect(makeAnaesthetistInactive(api, OFFICE_ACTOR, BEAU, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(api, dayAfterISO(dayAfterISO(last)))
    expect(slotDates(api).some((d) => d > last)).toBe(false)
  })
})
