/**
 * Catch-up Phase 21a session 2 in the store: the review flags on the seed, the
 * office's approval of a Contract change (`approveContractSelection`, approve
 * at authorise, a later change re-opening it), the empty
 * `authoriseBlockersFor` seam, and a moved Booking keeping its Contracts on
 * every move path (US-04.3.11, A41: one table-driven test).
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseBlockersFor, authoriseList, completeBooking, reassignBooking } from './lifecycle'
import {
  approveContractChangeAsSimulatedOffice,
  approveContractChangesOnList,
  approveContractRefusal,
  approveContractSelection,
  contractChangeFor,
} from './contractApprovalActions'
import { reviewFlagsFor, reviewFlagsOnList, reviewInputFor } from './reviewSelectors'
import { setProcedureContract } from './contractSelectionActions'
import { setProcedurePrice } from './pricingActions'
import { moveBookingToAnaesthetist, pushListToSlot } from './listMoveActions'
import { moveListToSlot, reassignList } from './slotActions'
import { assignDraftList } from './draftListActions'
import { proceduresForBooking } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR, anaesthetistActor } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, BOOKING_MOVE_DEMO, LIST_MOVE_DEMO, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { REVIEW_FLAGS_LIST_ID } from '../domain/seed/reviewFlagBookings'
import { SEED_DRAFT_LIST_IDS } from '../domain/seed/draftLists'
import { CONTRACT_CHANGED_FROM } from '../domain/seed/reviewFlagBookings'
import { slotIdFor } from '../domain/slots'
import { seedFallbackId } from '../domain/billing/fallbacks'
import { ACTION_LABELS } from '../shared/audit/actionLabels'
import type { Procedure } from '../domain/types'

const OFFICE = OFFICE_ACTOR
const marker = (key: string) => SEED_MARKERS[key]!.entityId
const CHANGE = marker('contractChangeBooking')
const TYPED = marker('typedPriceBooking')
const NEEDS = marker('reviewNeedsPrice')
const OTHER = marker('otherSurgeonContract')
const MOVABLE = marker('movableFixedBooking')
const REVIEW = SEED_LIST_IDS.reviewFlags
const procOf = (api: BoundAppStore, bookingId: string) => proceduresForBooking(api.getState(), bookingId)[0]!
const rulesOf = (api: BoundAppStore, bookingId: string) => reviewFlagsFor(api.getState(), bookingId).map((f) => f.rule)
const chen = (api: BoundAppStore): Actor => anaesthetistActor(api.getState(), ANAE.chen)!

describe('the review flags on the pristine seed (catch-up Phase 21a)', () => {
  it('each marker raises exactly its flag', () => {
    const api = createAppStore()
    expect(rulesOf(api, CHANGE)).toEqual(['contractChanged'])
    expect(reviewFlagsFor(api.getState(), CHANGE)[0]!.text).toBe('Changed by Dr Chen: was Cataract IOL (LA by Anaesthetist)')
    expect(rulesOf(api, TYPED)).toEqual(['typedPrice'])
    expect(reviewFlagsFor(api.getState(), TYPED)[0]!.text).toMatch(/^Price typed: \$1,200\.00 \(computed \$[\d,]+\.\d\d\)$/)
    expect(rulesOf(api, NEEDS)).toEqual(['needsPrice', 'notCompleted'])
    expect(rulesOf(api, OTHER)).toEqual(['contractNoLongerFits'])
    expect(rulesOf(api, MOVABLE)).toEqual(['notCompleted'])
  })

  it("Phase 07's seeded manual T override on the design-day PM List still reads as a note", () => {
    const api = createAppStore()
    const flags = reviewFlagsOnList(api.getState(), SEED_MARKERS.designDayPmList!.entityId)
    expect(flags.some((f) => f.rule === 'btmOverride' && /^T (adjusted|set)/.test(f.text))).toBe(true)
  })

  it("S2 Beat 4's List raises none; the only seeded SUBMITTED List blocked is Dr Chen's review List, by its \"Needs a price\" Booking (catch-up Phase 25)", () => {
    const api = createAppStore()
    expect(reviewFlagsOnList(api.getState(), SEED_LIST_IDS.morrisonMon20)).toEqual([])
    const submitted = Object.values(api.getState().schedule.lists).filter((l) => l.state === 'SUBMITTED')
    expect(submitted.length).toBeGreaterThan(5)
    const needsPrice = SEED_MARKERS['reviewNeedsPrice']?.entityId
    for (const l of submitted) {
      const blockers = authoriseBlockersFor(api.getState(), l.id)
      if (l.id === REVIEW_FLAGS_LIST_ID) expect(blockers.map((b) => [b.code, b.bookingId])).toEqual([['needsPrice', needsPrice]])
      else expect(blockers, l.id).toEqual([])
    }
  })
})

describe('approving a Contract change (US-07.2.2, US-03.4.1, DM-10)', () => {
  it('only the office approves; it stamps the Procedure, ends the flag and writes a labelled History row', () => {
    const api = createAppStore()
    expect(approveContractSelection(api, chen(api), { bookingId: CHANGE })).toMatchObject({ ok: false, code: 'officeOnly' })
    const p = procOf(api, CHANGE)
    expect(approveContractSelection(api, OFFICE, { bookingId: CHANGE, procedureId: p.id })).toMatchObject({ ok: true, value: { approved: 1 } })
    expect(api.getState().schedule.procedures[p.id]!.contractApproval).toMatchObject({ by: OFFICE.who, how: 'explicit' })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.contractApprove', entityId: p.id, after: { contractApproved: true, how: 'explicit' } })
    expect(ACTION_LABELS['procedure.contractApprove']).toBeDefined()
    expect(contractChangeFor(api.getState(), p.id)).toMatchObject({ status: 'approved', approval: { by: OFFICE.who, how: 'explicit' } })
    expect(rulesOf(api, CHANGE)).toEqual([])
    // Nothing left: a second press is refused with the trigger's reason.
    expect(approveContractRefusal(api.getState(), CHANGE)).toBe('No Contract change to approve')
  })

  it("a later change by the anaesthetist opens it again, naming the Contract the office approved", () => {
    const api = createAppStore()
    approveContractSelection(api, OFFICE, { bookingId: CHANGE })
    const p = procOf(api, CHANGE)
    expect(setProcedureContract(api, chen(api), p.id, CONTRACT_CHANGED_FROM).ok).toBe(true)
    expect(reviewFlagsFor(api.getState(), CHANGE).map((f) => f.text)).toContain('Changed by Dr Chen: was Christchurch Eye Surgery RVG')
  })

  it('not a change: an amount typed on the same Contract, or changing back to the Contract the office saw', () => {
    const api = createAppStore()
    // Dr Souter types the amount on BK0177's No contract · Fixed price: the Contract never changed.
    const needs = SEED_MARKERS.needsPriceBooking!.entityId
    const np = procOf(api, needs)
    expect(setProcedureContract(api, SOUTER_ACTOR, np.id, np.governingContractId!, { enteredPrice: 450 }).ok).toBe(true)
    expect(contractChangeFor(api.getState(), np.id)).toBeUndefined()
    expect(rulesOf(api, needs)).not.toContain('contractChanged')
    // Dr Chen changes back to the Contract the office last saw: nothing to approve.
    const p = procOf(api, CHANGE)
    expect(setProcedureContract(api, chen(api), p.id, CONTRACT_CHANGED_FROM).ok).toBe(true)
    expect(contractChangeFor(api.getState(), p.id)?.status).toBe('approved')
    expect(rulesOf(api, CHANGE)).not.toContain('contractChanged')
  })

  it("a later change by the anaesthetist clears the stored approval stamp", () => {
    const api = createAppStore()
    approveContractSelection(api, OFFICE, { bookingId: CHANGE })
    const p = procOf(api, CHANGE)
    expect(api.getState().schedule.procedures[p.id]!.contractApproval).toBeDefined()
    expect(setProcedureContract(api, chen(api), p.id, CONTRACT_CHANGED_FROM).ok).toBe(true)
    expect(api.getState().schedule.procedures[p.id]!.contractApproval).toBeUndefined()
  })

  it("the office's own re-pick counts as approved", () => {
    const api = createAppStore()
    const p = procOf(api, CHANGE)
    expect(setProcedureContract(api, OFFICE, p.id, CONTRACT_CHANGED_FROM).ok).toBe(true)
    expect(contractChangeFor(api.getState(), p.id)?.status).toBe('approved')
    expect(rulesOf(api, CHANGE)).not.toContain('contractChanged')
  })

  it('approve-all per List, and nothing to approve is refused', () => {
    const api = createAppStore()
    expect(approveContractChangesOnList(api, OFFICE, REVIEW)).toMatchObject({ ok: true, value: { approved: 1 } })
    expect(approveContractChangesOnList(api, OFFICE, REVIEW)).toMatchObject({ ok: false, code: 'nothingToApprove' })
  })

  it('authorise approves every change still unapproved in the same commit, and is never gated by flags', () => {
    const api = createAppStore()
    // The office types the missing price and completes the open-price Booking (completion still gates authorise).
    const needs = procOf(api, NEEDS)
    expect(setProcedurePrice(api, OFFICE, needs.id, 480).ok).toBe(true)
    expect(completeBooking(api, OFFICE, NEEDS).ok).toBe(true)
    const before = api.getState().audit.length
    expect(authoriseList(api, OFFICE, REVIEW).ok).toBe(true)
    const written = api.getState().audit.slice(before)
    expect(written.map((a) => a.action).slice(0, 2)).toEqual(['list.authorise', 'procedure.contractApprove'])
    const p = procOf(api, CHANGE)
    expect(api.getState().schedule.procedures[p.id]!.contractApproval).toMatchObject({ how: 'authorise' })
    expect(contractChangeFor(api.getState(), p.id)).toMatchObject({ status: 'approved', approval: { how: 'authorise' } })
    // The other flags (typed price, the other surgeon's Contract) never held it back.
  })

  it('the PWA stand-in approves on the Booking in the URL; disabled with nothing to approve or on an AUTHORISED List', () => {
    const api = createAppStore()
    expect(approveContractRefusal(api.getState(), TYPED)).toBe('No Contract change to approve')
    expect(approveContractChangeAsSimulatedOffice(api, CHANGE).ok).toBe(true)
    const count = api.getState().audit.length
    expect(approveContractChangeAsSimulatedOffice(api, CHANGE).ok).toBe(false)
    expect(api.getState().audit.length).toBe(count)
    const authorised = Object.values(api.getState().schedule.bookings).find((b) => api.getState().schedule.lists[b.listId]?.state === 'AUTHORISED')!
    expect(approveContractRefusal(api.getState(), authorised.id)).toBe("This Booking's List is authorised")
  })
})

/** Every Contract-bearing field of every Procedure: no move may change any of them. */
function contractFields(api: BoundAppStore): Record<string, unknown> {
  const pick = (p: Procedure) => ({
    governingContractId: p.governingContractId,
    enteredPrice: p.enteredPrice,
    railAnswers: p.railAnswers,
    rvgGroupId: p.rvgGroupId,
    baseUnitsSelected: p.baseUnitsSelected,
    anaestheticStartISO: p.anaestheticStartISO,
    handoverISO: p.handoverISO,
    modifierClaims: p.modifierClaims,
    modifiersConfirmed: p.modifiersConfirmed,
    contractApproval: p.contractApproval,
  })
  return Object.fromEntries(Object.values(api.getState().schedule.procedures).map((p) => [p.id, pick(p)]))
}

describe('a moved Booking keeps its Contracts on every move path (US-04.3.11, A41)', () => {
  const ropataPm = slotIdFor(ANAE.ropata, '2026-11-30', 'PM')
  const PATHS: { name: string; move: (api: BoundAppStore) => { ok: boolean } }[] = [
    { name: "reassignBooking (Admin Day's Move)", move: (api) => reassignBooking(api, OFFICE, MOVABLE, 'L-34821-2026-12-14-AM') },
    { name: 'reassignBooking (the integration day-move)', move: (api) => reassignBooking(api, { who: 'Hospital feed', role: 'system', source: 'integration' }, MOVABLE, 'L-34821-2026-12-14-AM') },
    { name: "32a's moveBookingToAnaesthetist (a prepaid Booking among them)", move: (api) => moveBookingToAnaesthetist(api, SOUTER_ACTOR, BOOKING_MOVE_DEMO.bookingId, BOOKING_MOVE_DEMO.receiverId) },
    { name: "32a's moveBookingToAnaesthetist, the prepaid Booking", move: (api) => moveBookingToAnaesthetist(api, SOUTER_ACTOR, BOOKING_MOVE_DEMO.prepaidBookingId, BOOKING_MOVE_DEMO.secondReceiverId) },
    { name: "32's reassignList", move: (api) => reassignList(api, OFFICE, LIST_MOVE_DEMO.movableListId, ANAE.ropata) },
    { name: "32's moveListToSlot (moveListToSlotCore)", move: (api) => moveListToSlot(api, OFFICE, LIST_MOVE_DEMO.movableListId, ropataPm) },
    { name: "32's pushListToSlot (the anaesthetist's hand-on)", move: (api) => pushListToSlot(api, SOUTER_ACTOR, LIST_MOVE_DEMO.movableListId, ropataPm) },
    { name: "31's assignDraftList", move: (api) => assignDraftList(api, OFFICE, SEED_DRAFT_LIST_IDS.eyeSurgery, { anaesthetistId: ANAE.sharma }) },
  ]

  it.each(PATHS)('$name leaves every Procedure\'s Contract, price, prepaid fields and RVG detail untouched', ({ move }) => {
    const api = createAppStore()
    const before = contractFields(api)
    const out = move(api)
    expect(out.ok).toBe(true)
    expect(contractFields(api)).toEqual(before)
  })

  it('a typed price keeps its amount on a move', () => {
    const api = createAppStore()
    const needs = SEED_MARKERS.needsPriceBooking!.entityId
    const p = procOf(api, needs)
    expect(p.governingContractId).toBe(seedFallbackId('patient-standard'))
    expect(setProcedurePrice(api, OFFICE, p.id, 650).ok).toBe(true)
    expect(reassignBooking(api, OFFICE, needs, 'L-34821-2026-12-14-AM').ok).toBe(true)
    expect(procOf(api, needs)).toMatchObject({ governingContractId: seedFallbackId('patient-standard'), enteredPrice: 650 })
  })

  it('the movable fixed price moved to another surgeon keeps its Contract, is flagged at review, and clears on a move back', () => {
    const api = createAppStore()
    const contractId = procOf(api, MOVABLE).governingContractId
    expect(reassignBooking(api, OFFICE, MOVABLE, 'L-34821-2026-12-14-AM').ok).toBe(true)
    expect(procOf(api, MOVABLE).governingContractId).toBe(contractId)
    expect(rulesOf(api, MOVABLE)).toContain('contractNoLongerFits')
    expect(reassignBooking(api, OFFICE, MOVABLE, 'L-34821-2026-12-14-PM').ok).toBe(true)
    expect(rulesOf(api, MOVABLE)).not.toContain('contractNoLongerFits')
  })

  it('moved to a date in a later range, an unedited fixed price re-prices at that range', () => {
    const api = createAppStore()
    const p = procOf(api, MOVABLE)
    const s = api.getState()
    const contract = s.masters.contracts[p.governingContractId!]!
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contract.id]: { ...contract, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-10-05', price: 3100 }, { startISO: '2026-12-15', price: 3300 }] } } } } })
    const priceOf = () => reviewInputFor(api.getState(), api.getState().schedule.bookings[MOVABLE]!)!.procedures[0]!.computedPrice
    expect(priceOf()).toBe(3100)
    const later = Object.values(api.getState().schedule.lists).find((l) => l.anaesthetistId === ANAE.souter && l.state === 'ACTIVE' && l.dateISO >= '2026-12-15' && l.surgeonId === api.getState().schedule.lists['L-34821-2026-12-14-PM']!.surgeonId)
    expect(later).toBeDefined()
    expect(reassignBooking(api, OFFICE, MOVABLE, later!.id).ok).toBe(true)
    expect(procOf(api, MOVABLE).governingContractId).toBe(contract.id)
    expect(priceOf()).toBe(3300)
  })

  it('a Contract linked only to the first anaesthetist is flagged once the Booking sits on a colleague\'s List', () => {
    const api = createAppStore()
    const s = api.getState()
    const p = procOf(api, MOVABLE)
    const contract = s.masters.contracts[p.governingContractId!]!
    // Link the Face lift to Dr Souter alone (no surgeons), then carry the Booking to a colleague's List.
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contract.id]: { ...contract, linkedSurgeonIds: [], linkedAnaesthetistId: ANAE.souter } } } })
    expect(rulesOf(api, MOVABLE)).not.toContain('contractNoLongerFits')
    const colleague = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.dateISO === '2026-12-14' && l.anaesthetistId !== undefined && l.anaesthetistId !== ANAE.souter)
    expect(colleague).toBeDefined()
    expect(reassignBooking(api, OFFICE, MOVABLE, colleague!.id).ok).toBe(true)
    expect(procOf(api, MOVABLE).governingContractId).toBe(contract.id)
    expect(rulesOf(api, MOVABLE)).toContain('contractNoLongerFits')
  })

  it('a price not held works out again on the new date; a date with no range reads "Needs a price" and is flagged', () => {
    const api = createAppStore()
    const p = procOf(api, MOVABLE)
    const s = api.getState()
    const contract = s.masters.contracts[p.governingContractId!]!
    // Two ranges: from 1 Aug at $3,100.00, from 10 Aug at $3,300.00 (the List's own date).
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contract.id]: { ...contract, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-12-05', price: 3100 }, { startISO: '2026-12-14', price: 3300 }] } } } } })
    const priced = reviewInputFor(api.getState(), api.getState().schedule.bookings[MOVABLE]!)!.procedures[0]!.computedPrice
    expect(priced).toBe(3300)
    // Moved to an earlier List of hers (Tue 28 Jul AM, before any range): no price, and flagged.
    expect(reassignBooking(api, OFFICE, MOVABLE, SEED_LIST_IDS.integrationStgList).ok).toBe(true)
    expect(procOf(api, MOVABLE).governingContractId).toBe(contract.id)
    expect(rulesOf(api, MOVABLE)).toEqual(expect.arrayContaining(['contractNoLongerFits', 'needsPrice']))
    // Back on a date inside the first range: works out again at that range's price.
    expect(reassignBooking(api, OFFICE, MOVABLE, 'L-34821-2026-12-08-AM').ok).toBe(true)
    expect(reviewInputFor(api.getState(), api.getState().schedule.bookings[MOVABLE]!)!.procedures[0]!.computedPrice).toBe(3100)
  })
})
