/**
 * Phase 04 store guard tests — addBillingLine / removeBillingLine (incl. the
 * Method 3 individual-arrangement gate and the funder-allocation protection),
 * addProcedure, uncompleteCard and completionBlockersFor. Every test uses an
 * isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { addBillingLine, removeBillingLine } from './billingLineActions'
import { addProcedure } from './cardActions'
import {
  authoriseList,
  completionBlockersFor,
  editProcedure,
  uncompleteCard,
} from './lifecycle'
import { auditForEntity, cardsForList, proceduresForCard } from './selectors'
import type { Actor } from './mutate'
import { INDIVIDUAL_ARRANGEMENT_MESSAGE } from '../domain/billing/validateCardForBilling'
import { ANAE, SEED_MARKERS } from '../domain/seed'
import type { BillingValidationFailure } from '../domain/billing/validateCardForBilling'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const FITZGERALD: Actor = {
  who: 'Dr Emma Fitzgerald',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.fitzgerald,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_PM = marker('designDayPmList')
const MORRISON_LIST = marker('submittedListMorrison')
const WHITAKER_LIST = marker('submittedListWhitaker')
const ELLISON_CARD = marker('pendingCaptureCard')
const RATE_TIME_CARD = marker('rateTimeCard')
const TWO_FUNDER_CARD = marker('twoFunderCard')
const SPLIT_CARD = marker('splitBillingCard')
const CANCELLED_CARD = marker('cancelledCard')

function store(): BoundAppStore {
  return createAppStore()
}

function firstProcedureId(api: BoundAppStore, cardId: string): string {
  const procedure = proceduresForCard(api.getState(), cardId)[0]
  if (procedure === undefined) throw new Error(`card ${cardId} has no procedure`)
  return procedure.id
}

/** The design-day Tane card: completed, valid, on Souter's DRAFT PM list. */
function taneCardId(api: BoundAppStore): string {
  const card = cardsForList(api.getState(), SOUTER_PM)[0]
  if (card === undefined) throw new Error('no PM cards')
  return card.id
}

describe('addBillingLine', () => {
  it('adds a fixed ancillary line, audited, stamping the parent card', () => {
    const api = store()
    const procedureId = firstProcedureId(api, ELLISON_CARD)
    const outcome = addBillingLine(api, SOUTER, procedureId, {
      chargeBasis: 'fixed',
      description: 'ACC pre-op flat fee',
      amount: 85.5,
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const state = api.getState()
    const line = state.schedule.billingLines[outcome.value.billingLineId]
    expect(line?.chargeBasis).toBe('fixed')
    expect(line?.amount).toBe(85.5)
    expect(line?.procedureId).toBe(procedureId)

    const entry = auditForEntity(state, outcome.value.billingLineId).at(-1)
    expect(entry?.action).toBe('billingLine.add')
    // The wrapper stamped the PARENT card in lockstep with the audit entry.
    const card = state.schedule.cards[ELLISON_CARD]
    expect(card?.lastModifiedBy).toBe('Dr Melanie Souter')
    expect(card?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('permits rate x time under the individual-arrangement contract, amount = roundToCents(hours x rate)', () => {
    const api = store()
    const procedureId = firstProcedureId(api, RATE_TIME_CARD)
    const outcome = addBillingLine(api, FITZGERALD, procedureId, {
      chargeBasis: 'rateTime',
      description: 'Second theatre session, hourly',
      hours: 1.5,
      rate: 481.13,
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const line = api.getState().schedule.billingLines[outcome.value.billingLineId]
    expect(line?.hours).toBe(1.5)
    expect(line?.rate).toBe(481.13)
    expect(line?.amount).toBe(721.7) // 1.5 x 481.13 = 721.695 → cents
  })

  it('refuses rate x time when the governing contract does not permit it (SXAP), with no state change', () => {
    const api = store()
    const before = api.getState()
    const auditBefore = before.audit.length
    const linesBefore = Object.keys(before.schedule.billingLines).length
    const procedureId = firstProcedureId(api, ELLISON_CARD)

    const outcome = addBillingLine(api, SOUTER, procedureId, {
      chargeBasis: 'rateTime',
      description: 'Hourly attempt',
      hours: 2,
      rate: 400,
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('individualArrangementNotPermitted')
      expect(outcome.message).toBe(INDIVIDUAL_ARRANGEMENT_MESSAGE)
    }
    const state = api.getState()
    expect(state.audit.length).toBe(auditBefore)
    expect(Object.keys(state.schedule.billingLines).length).toBe(linesBefore)
  })

  it('refuses rate x time when the procedure has no governing contract at all', () => {
    const api = store()
    const procedureId = firstProcedureId(api, marker('guardianMinorCard'))
    const outcome = addBillingLine(api, OFFICE, procedureId, {
      chargeBasis: 'rateTime',
      description: 'Hourly attempt',
      hours: 1,
      rate: 300,
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('individualArrangementNotPermitted')
  })

  it('refuses bad input: empty description, non-positive amount / hours / rate', () => {
    const api = store()
    const auditBefore = api.getState().audit.length
    const ellisonProc = firstProcedureId(api, ELLISON_CARD)
    const rateTimeProc = firstProcedureId(api, RATE_TIME_CARD)

    const noDescription = addBillingLine(api, SOUTER, ellisonProc, {
      chargeBasis: 'fixed',
      description: '   ',
      amount: 50,
    })
    expect(noDescription.ok).toBe(false)
    if (!noDescription.ok) expect(noDescription.code).toBe('descriptionRequired')

    const zeroAmount = addBillingLine(api, SOUTER, ellisonProc, {
      chargeBasis: 'fixed',
      description: 'Zero',
      amount: 0,
    })
    expect(zeroAmount.ok).toBe(false)
    if (!zeroAmount.ok) expect(zeroAmount.code).toBe('amountRequired')

    const zeroHours = addBillingLine(api, FITZGERALD, rateTimeProc, {
      chargeBasis: 'rateTime',
      description: 'Zero hours',
      hours: 0,
      rate: 400,
    })
    expect(zeroHours.ok).toBe(false)
    if (!zeroHours.ok) expect(zeroHours.code).toBe('hoursRequired')

    const zeroRate = addBillingLine(api, FITZGERALD, rateTimeProc, {
      chargeBasis: 'rateTime',
      description: 'Zero rate',
      hours: 2,
      rate: 0,
    })
    expect(zeroRate.ok).toBe(false)
    if (!zeroRate.ok) expect(zeroRate.code).toBe('rateRequired')

    expect(api.getState().audit.length).toBe(auditBefore)
  })

  it('role/state matrix: anaesthetist refused on SUBMITTED, office allowed; not-own refused; AUTHORISED locked', () => {
    const api = store()
    const morrisonProc = firstProcedureId(api, cardsForList(api.getState(), MORRISON_LIST)[0]!.id)

    const anaesthetist = addBillingLine(api, MORRISON, morrisonProc, {
      chargeBasis: 'fixed',
      description: 'Late ancillary',
      amount: 40,
    })
    expect(anaesthetist.ok).toBe(false)
    if (!anaesthetist.ok) expect(anaesthetist.code).toBe('listSubmitted')

    const office = addBillingLine(api, OFFICE, morrisonProc, {
      chargeBasis: 'fixed',
      description: 'Office-added ancillary',
      amount: 40,
    })
    expect(office.ok).toBe(true)

    const notOwn = addBillingLine(api, SOUTER, firstProcedureId(api, RATE_TIME_CARD), {
      chargeBasis: 'fixed',
      description: 'Not my list',
      amount: 40,
    })
    expect(notOwn.ok).toBe(false)
    if (!notOwn.ok) expect(notOwn.code).toBe('notOwnList')

    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const locked = addBillingLine(api, OFFICE, morrisonProc, {
      chargeBasis: 'fixed',
      description: 'Too late',
      amount: 40,
    })
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.code).toBe('listAuthorised')
  })
})

describe('removeBillingLine', () => {
  it('removes a line, audited with the full line as before, stamping the card explicitly', () => {
    const api = store()
    const procedureId = firstProcedureId(api, ELLISON_CARD)
    const added = addBillingLine(api, SOUTER, procedureId, {
      chargeBasis: 'fixed',
      description: 'Removable',
      amount: 30,
    })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const lineId = added.value.billingLineId

    const outcome = removeBillingLine(api, SOUTER, lineId)
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.schedule.billingLines[lineId]).toBeUndefined()

    const entry = auditForEntity(state, lineId).at(-1)
    expect(entry?.action).toBe('billingLine.remove')
    expect((entry?.before as { amount?: number } | undefined)?.amount).toBe(30)
    // The deleted line cannot be derived post-recipe: the explicit stampCardId
    // still stamps the parent card in lockstep.
    expect(state.schedule.cards[ELLISON_CARD]?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('the anaesthetist may not remove a funder-override line; the office may', () => {
    const api = store()
    const state = api.getState()
    const procedureIds = proceduresForCard(state, TWO_FUNDER_CARD).map((p) => p.id)
    const funderLine = Object.values(state.schedule.billingLines).find(
      (l) => procedureIds.includes(l.procedureId) && l.funderOverride !== undefined,
    )
    if (funderLine === undefined) throw new Error('no funder-override line seeded')

    const refused = removeBillingLine(api, SOUTER, funderLine.id)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('funderAllocationOfficeOnly')
    expect(api.getState().schedule.billingLines[funderLine.id]).toBeDefined()

    const office = removeBillingLine(api, OFFICE, funderLine.id)
    expect(office.ok).toBe(true)
    expect(api.getState().schedule.billingLines[funderLine.id]).toBeUndefined()
  })
})

describe('addProcedure', () => {
  it('adds an isAdditional skeleton inheriting the funding context from the first procedure', () => {
    const api = store()
    const first = proceduresForCard(api.getState(), ELLISON_CARD)[0]
    const outcome = addProcedure(api, SOUTER, ELLISON_CARD)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const procedure = api.getState().schedule.procedures[outcome.value.procedureId]
    expect(procedure?.isAdditional).toBe(true)
    expect(procedure?.description).toBe('')
    expect(procedure?.rvgBaseCode).toBeUndefined()
    // The funding context mirrors the first procedure — the same shape
    // copyCard's skeleton inherits (splitCard's second procedure pattern).
    expect(procedure?.billingRoute).toBe(first?.billingRoute)
    expect(procedure?.governingContractId).toBe(first?.governingContractId)

    const entry = auditForEntity(api.getState(), outcome.value.procedureId).at(-1)
    expect(entry?.action).toBe('procedure.create')
  })

  it('refuses cancelled and completed cards', () => {
    const api = store()
    const cancelled = addProcedure(api, OFFICE, CANCELLED_CARD)
    expect(cancelled.ok).toBe(false)
    if (!cancelled.ok) expect(cancelled.code).toBe('cardCancelled')

    const completed = addProcedure(api, SOUTER, SPLIT_CARD)
    expect(completed.ok).toBe(false)
    if (!completed.ok) {
      expect(completed.code).toBe('cardCompleted')
      expect(completed.message).toContain('Amend it before adding a procedure')
    }
  })

  it('refuses the anaesthetist on a SUBMITTED list', () => {
    const api = store()
    const morrisonCard = cardsForList(api.getState(), MORRISON_LIST)[0]!.id
    // Re-open the completed card (office may, on SUBMITTED) so the list gate
    // itself is what refuses the anaesthetist.
    expect(uncompleteCard(api, OFFICE, morrisonCard).ok).toBe(true)
    const outcome = addProcedure(api, MORRISON, morrisonCard)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })
})

describe('uncompleteCard', () => {
  it('re-opens a completed card on the anaesthetist\'s own DRAFT list, audited', () => {
    const api = store()
    const cardId = taneCardId(api)
    expect(api.getState().schedule.cards[cardId]?.completed).toBe(true)

    const outcome = uncompleteCard(api, SOUTER, cardId)
    expect(outcome).toEqual({ ok: true, value: undefined })
    const card = api.getState().schedule.cards[cardId]
    expect(card?.completed).toBe(false)
    expect(card?.completedAtISO).toBeUndefined()
    expect(auditForEntity(api.getState(), cardId).at(-1)?.action).toBe('card.uncomplete')
  })

  it('refuses a card that is not completed, and a cancelled card', () => {
    const api = store()
    const notCompleted = uncompleteCard(api, SOUTER, ELLISON_CARD)
    expect(notCompleted.ok).toBe(false)
    if (!notCompleted.ok) expect(notCompleted.code).toBe('notCompleted')

    const cancelled = uncompleteCard(api, OFFICE, CANCELLED_CARD)
    expect(cancelled.ok).toBe(false)
    if (!cancelled.ok) expect(cancelled.code).toBe('cardCancelled')
  })

  it('anaesthetist refused on SUBMITTED; office allowed on SUBMITTED', () => {
    const api = store()
    const morrisonCard = cardsForList(api.getState(), MORRISON_LIST)[0]!.id
    const refused = uncompleteCard(api, MORRISON, morrisonCard)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('listSubmitted')

    const whitakerCard = cardsForList(api.getState(), WHITAKER_LIST)[0]!.id
    const office = uncompleteCard(api, OFFICE, whitakerCard)
    expect(office.ok).toBe(true)
    expect(api.getState().schedule.cards[whitakerCard]?.completed).toBe(false)
  })
})

describe('completionBlockersFor', () => {
  it('returns [] for a valid card, and validationFailed with named failures once the route is stripped', () => {
    const api = store()
    const cardId = taneCardId(api)
    const state = api.getState()
    const card = state.schedule.cards[cardId]
    if (card === undefined) throw new Error('no card')
    expect(completionBlockersFor(state, card)).toEqual([])

    const procedureId = firstProcedureId(api, cardId)
    expect(editProcedure(api, OFFICE, procedureId, { billingRoute: undefined }).ok).toBe(true)

    const after = api.getState()
    const blockers = completionBlockersFor(after, after.schedule.cards[cardId]!)
    expect(blockers[0]?.code).toBe('validationFailed')
    const failures = blockers[0]?.details as BillingValidationFailure[]
    expect(failures.some((f) => f.field === 'billingRoute')).toBe(true)
  })
})
