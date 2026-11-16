/**
 * The insurer or funder and the approval number on the Booking (catch-up
 * Phase 21; US-11.4.3, D28, A42): the one writer, the one insurance warning,
 * and that the funder never reaches who is billed.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { setBookingInsurance } from './insuranceActions'
import { billablePartyForProcedureId, proceduresForBooking } from './selectors'
import { clearWarning, warningsForBooking } from './warnings'
import { approvalNumberMissing } from '../domain/billing/insurance'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { Actor } from './mutate'

const marker = (key: string) => SEED_MARKERS[key]!.entityId
const APPROVAL = marker('approvalMissing')
const HNZ = marker('funderNoWarning')
const AIA = marker('aiaClaimBooking')
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const approval = (api: ReturnType<typeof createAppStore>, id: string) => warningsForBooking(api.getState(), id).filter((w) => w.ruleId === 'approvalNumberMissing')

describe('approvalNumberMissing (the one rule)', () => {
  const parties = createAppStore().getState().masters.parties
  it('is true for an insurer with no number, and only then', () => {
    expect(approvalNumberMissing({ funderPartyId: 'PY-NIB' }, parties)).toBe(true)
    expect(approvalNumberMissing({ funderPartyId: 'PY-SCHS', insuranceApprovalNumber: ' ' }, parties)).toBe(true)
    expect(approvalNumberMissing({ funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'N-1' }, parties)).toBe(false)
    expect(approvalNumberMissing({ funderPartyId: 'PY-ACC' }, parties)).toBe(false)
    expect(approvalNumberMissing({ funderPartyId: 'PY-HNZ' }, parties)).toBe(false)
    expect(approvalNumberMissing({}, parties)).toBe(false)
  })
})

describe('setBookingInsurance: the one writer', () => {
  it('records an insurer and a number, audited; refuses a Party that is not an insurer or funder', () => {
    const api = createAppStore()
    expect(setBookingInsurance(api, OFFICE_ACTOR, HNZ, { funderPartyId: 'PY-STG' })).toMatchObject({ ok: false, message: 'Choose an insurer or funder.' })
    expect(setBookingInsurance(api, OFFICE_ACTOR, HNZ, { funderPartyId: 'PY-SCHS', insuranceApprovalNumber: ' SC-1 ' }).ok).toBe(true)
    expect(api.getState().schedule.bookings[HNZ]).toMatchObject({ funderPartyId: 'PY-SCHS', insuranceApprovalNumber: 'SC-1' })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'booking.insurance', before: { insurerOrFunder: 'Health NZ' }, after: { insurerOrFunder: 'Southern Cross Health Society', insuranceApprovalNumber: 'SC-1' } })
    // A blank funder is fine: the patient pays.
    expect(setBookingInsurance(api, OFFICE_ACTOR, HNZ, {}).ok).toBe(true)
    expect(api.getState().schedule.bookings[HNZ]!.funderPartyId).toBeUndefined()
  })

  it('lets the anaesthetist change it on the day on their own List, never on another’s or once AUTHORISED', () => {
    const api = createAppStore()
    const own = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_LIST_IDS.souterAm21)!
    expect(setBookingInsurance(api, SOUTER, own.id, { funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'NIB-77' }).ok).toBe(true)
    expect(setBookingInsurance(api, SOUTER, APPROVAL, { funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'NIB-78' }).ok).toBe(false)
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(setBookingInsurance(api, OFFICE_ACTOR, APPROVAL, { funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'NIB-79' }).ok).toBe(false)
  })

  it('never changes who is billed', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), HNZ)[0]!
    const before = billablePartyForProcedureId(api.getState(), p.id)
    setBookingInsurance(api, OFFICE_ACTOR, HNZ, { funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'N-1' })
    expect(billablePartyForProcedureId(api.getState(), p.id)).toEqual(before)
  })
})

describe('the approval number warning (US-11.4.3; the only insurance warning)', () => {
  it('raises on the seeded NIB Booking with no number, mild before the procedure; entering the number removes it', () => {
    const api = createAppStore()
    const [w] = approval(api, APPROVAL)
    expect(w).toMatchObject({ kind: 'beforeProcedure', strength: 'mild', key: `${APPROVAL}:approvalNumberMissing` })
    expect(setBookingInsurance(api, OFFICE_ACTOR, APPROVAL, { funderPartyId: 'PY-NIB', insuranceApprovalNumber: 'NIB-2026-1' }).ok).toBe(true)
    expect(approval(api, APPROVAL)).toEqual([])
  })

  it('raises for Southern Cross Health Society too; never for ACC, Health NZ or a blank funder', () => {
    const api = createAppStore()
    expect(approval(api, HNZ)).toEqual([])
    setBookingInsurance(api, OFFICE_ACTOR, HNZ, { funderPartyId: 'PY-ACC' })
    expect(approval(api, HNZ)).toEqual([])
    setBookingInsurance(api, OFFICE_ACTOR, HNZ, { funderPartyId: 'PY-SCHS' })
    expect(approval(api, HNZ)).toHaveLength(1)
    setBookingInsurance(api, OFFICE_ACTOR, HNZ, {})
    expect(approval(api, HNZ)).toEqual([])
  })

  it('an insurer on a Contract that bills the payer (the AIA Booking on No contract · RVG, with a number) raises nothing', () => {
    const api = createAppStore()
    expect(api.getState().schedule.bookings[AIA]).toMatchObject({ funderPartyId: 'PY-AIA' })
    expect(warningsForBooking(api.getState(), AIA)).toEqual([])
  })

  it('Clear holds, and the List authorises with it open', () => {
    const api = createAppStore()
    const [w] = approval(api, APPROVAL)
    expect(clearWarning(api, OFFICE_ACTOR, APPROVAL, w!.key).ok).toBe(true)
    expect(approval(api, APPROVAL)[0]!.clearance).toBeDefined()
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
  })

  it("the pristine seed's only insurance warning is on the approvalMissing Booking", () => {
    const api = createAppStore()
    const all = Object.keys(api.getState().schedule.bookings).flatMap((id) => approval(api, id).map(() => id))
    expect(all).toEqual([APPROVAL])
  })
})
