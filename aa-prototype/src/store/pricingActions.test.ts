/**
 * Changing a Procedure's price (catch-up Phase 24; FT-05.4, US-03.5.1,
 * US-05.4.1, US-05.4.2): the rights matrix, clearing, the audit and the last
 * change standing. The Contract is arranged directly on Ellison's Procedure
 * (Dr Souter's ACTIVE Tue 21 Jul PM List) so each gate is tested alone.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, editProcedure } from './lifecycle'
import { priceChangeRefusal, setProcedurePrice } from './pricingActions'
import { setProcedureContract } from './contractSelectionActions'
import { prepaymentRaisedFor, proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import { ANAE, CONTRACT, SEED_MARKERS } from '../domain/seed'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { seedFallbackId } from '../domain/billing/fallbacks'
import { completeAnswered } from '../test/completeAnswered'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const FEED: Actor = { who: 'St George’s feed', role: 'system', source: 'integration' }
const ELLISON = 'P0009'

function onContract(api: BoundAppStore, procedureId: string, contractId: string): void {
  const s = api.getState()
  const p = s.schedule.procedures[procedureId]!
  api.setState({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: { ...p, governingContractId: contractId } } } })
}

function hospitalFallback(api: BoundAppStore): string {
  return Object.values(api.getState().masters.contracts).find((c) => c.systemRole === 'openPriceFallback' && c.billsTo === 'holder')!.id
}

const typed = (api: BoundAppStore, id = ELLISON) => api.getState().schedule.procedures[id]!.enteredPrice

describe('the anaesthetist (US-03.5.1, US-05.4.1; OQ-107, OQ-117, OQ-96, A37)', () => {
  it('types a price on an RVG Contract whose override setting is on (No contract · RVG)', () => {
    const api = createAppStore()
    onContract(api, ELLISON, CONTRACT.noContractRvg)
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450)).toEqual({ ok: true, value: undefined })
    expect(typed(api)).toBe(450)
  })

  it('is refused on an RVG Contract whose setting is off, in its own words', () => {
    const api = createAppStore()
    onContract(api, ELLISON, CONTRACT.ariaContractRate)
    const name = api.getState().masters.contracts[CONTRACT.ariaContractRate]!.name
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450)).toEqual({ ok: false, code: 'priceSetByContract', message: `${name} sets this price. Change the Contract or alert the office.` })
  })

  it('is refused on a fixed price (her own price list included) and on a prepaid Contract', () => {
    const api = createAppStore()
    // A fixed price (Merivale's Face lift), whatever the setting says.
    onContract(api, ELLISON, 'CT-MER-FACELIFT')
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450)).toMatchObject({ ok: false, code: 'priceSetByContract' })
    // Her own price list: every item is a prepaid fixed price.
    onContract(api, ELLISON, PRICED_ITEM.souterRhinoplasty)
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450)).toMatchObject({ ok: false, code: 'pricePrepaid' })
    onContract(api, ELLISON, PRICED_ITEM.souterRhinoCosmetic)
    const name = api.getState().masters.contracts[PRICED_ITEM.souterRhinoCosmetic]!.name
    // She cannot change a prepaid Contract either (A17), so only the office is offered.
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450)).toEqual({ ok: false, code: 'pricePrepaid', message: `${name} sets this price. Alert the office.` })
  })

  it('types the amount on No contract · Fixed price; any other fallback is the office’s', () => {
    const api = createAppStore()
    onContract(api, ELLISON, seedFallbackId('patient-standard'))
    expect(setProcedurePrice(api, SOUTER, ELLISON, 650).ok).toBe(true)
    onContract(api, ELLISON, hospitalFallback(api))
    expect(setProcedurePrice(api, SOUTER, ELLISON, 700)).toEqual({ ok: false, code: 'officeTypesAmount', message: 'The office types this amount.' })
  })

  it('her List until AUTHORISED (38a): SUBMITTED yes, AUTHORISED no', () => {
    const api = createAppStore()
    const booking = SEED_MARKERS.typedPriceBooking!.entityId // Dr Chen's SUBMITTED review-flags List
    const p = proceduresForBooking(api.getState(), booking)[0]!
    const chen: Actor = { who: 'Dr Chen', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.chen }
    expect(setProcedurePrice(api, chen, p.id, 1100).ok).toBe(true)
    expect(setProcedurePrice(api, SOUTER, p.id, 1000)).toMatchObject({ ok: false, code: 'notOwnList' })
    const listId = api.getState().schedule.bookings[booking]!.listId
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && !x.completed && x.cancellation === undefined)) {
      // Price and complete what is left so the List can be authorised.
      for (const q of proceduresForBooking(api.getState(), b.id)) setProcedurePrice(api, OFFICE, q.id, 100)
      completeAnswered(api, OFFICE, b.id)
    }
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(setProcedurePrice(api, chen, p.id, 900)).toMatchObject({ ok: false, code: 'listAuthorised' })
    expect(setProcedurePrice(api, OFFICE, p.id, 900)).toMatchObject({ ok: false, code: 'listAuthorised' })
  })
})

describe('the office (US-05.4.2; D30 narrowed, A16)', () => {
  it('changes any price on any Contract, the override setting and the kind ignored', () => {
    const api = createAppStore()
    for (const id of [CONTRACT.ariaContractRate, PRICED_ITEM.souterRhinoplasty, hospitalFallback(api), CONTRACT.noContractRvg]) {
      onContract(api, ELLISON, id)
      expect(setProcedurePrice(api, OFFICE, ELLISON, 300), id).toEqual({ ok: true, value: undefined })
      expect(setProcedurePrice(api, OFFICE, ELLISON, null).ok).toBe(true)
    }
  })

  it('a prepaid price: changeable before its prepayment invoice is raised, read-only after', () => {
    const api = createAppStore()
    const procedure = Object.values(api.getState().schedule.procedures).find((p) => prepaymentRaisedFor(api.getState(), p.id))
    expect(procedure, 'a seeded raised full prepayment').toBeDefined()
    expect(setProcedurePrice(api, OFFICE, procedure!.id, 400)).toEqual({
      ok: false,
      code: 'prepaidPriceRaised',
      message: 'This price is on a raised prepayment invoice. Use a credit or an additional invoice.',
    })
    // Before raising: Ellison on Dr Souter's prepaid price list, no prepayment invoice yet; then one raised.
    onContract(api, ELLISON, PRICED_ITEM.souterRhinoCosmetic)
    expect(priceChangeRefusal(api.getState(), OFFICE, ELLISON)).toBeNull()
    const s = api.getState()
    const invoice = { ...Object.values(s.billing.invoices).find((i) => i.kind === 'prePayment')!, id: 'INV-T1', bookingId: 'BK0009' }
    const line = { id: 'IL-T1', invoiceId: 'INV-T1', procedureId: ELLISON, kind: 'fee' as const, description: 'Pre-payment, estimated full fee', amount: 500 }
    api.setState({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoice.id]: invoice }, invoiceLines: { ...s.billing.invoiceLines, [line.id]: line } } })
    expect(setProcedurePrice(api, OFFICE, ELLISON, 400)).toMatchObject({ ok: false, code: 'prepaidPriceRaised' })
    // Read-only for everyone (D30 narrowed): the anaesthetist too, even once the office moves it to No contract · RVG.
    onContract(api, ELLISON, CONTRACT.noContractRvg)
    expect(setProcedurePrice(api, SOUTER, ELLISON, 400)).toMatchObject({ ok: false, code: 'prepaidPriceRaised' })
    // And the step rail's typed amount takes the same gate.
    expect(setProcedureContract(api, OFFICE, ELLISON, seedFallbackId('patient-standard'), { enteredPrice: 400 })).toMatchObject({ ok: false, code: 'prepaidPriceRaised' })
  })

  it('an integration never changes a price', () => {
    const api = createAppStore()
    expect(setProcedurePrice(api, FEED, ELLISON, 300)).toMatchObject({ ok: false, code: 'integrationPrice' })
  })
})

describe('the write itself', () => {
  it('a price is 0 or more, to the cent; no reason parameter exists', () => {
    const api = createAppStore()
    expect(setProcedurePrice(api, OFFICE, ELLISON, -1)).toMatchObject({ ok: false, code: 'priceInvalid' })
    expect(setProcedurePrice(api, OFFICE, ELLISON, 10.005)).toMatchObject({ ok: false, code: 'priceInvalid' })
    expect(setProcedurePrice(api, OFFICE, ELLISON, 0).ok).toBe(true)
    expect(typed(api)).toBe(0)
    expect(setProcedurePrice.length).toBe(4)
  })

  it('clears with null, back to the computed price; audits procedure.price with the actor and both figures', () => {
    const api = createAppStore()
    expect(setProcedurePrice(api, OFFICE, ELLISON, 450).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.price', who: 'Kirsty W.', role: 'office', entityId: ELLISON, before: { enteredPrice: null }, after: { enteredPrice: 450 } })
    expect(setProcedurePrice(api, OFFICE, ELLISON, null).ok).toBe(true)
    expect(typed(api)).toBeUndefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.price', before: { enteredPrice: 450 }, after: { enteredPrice: null } })
    // No change, no entry.
    const count = api.getState().audit.length
    expect(setProcedurePrice(api, OFFICE, ELLISON, null).ok).toBe(true)
    expect(api.getState().audit.length).toBe(count)
  })

  it('the last change stands: the anaesthetist $450, the office $300, the anaesthetist again $420', () => {
    const api = createAppStore()
    onContract(api, ELLISON, CONTRACT.noContractRvg)
    expect(setProcedurePrice(api, SOUTER, ELLISON, 450).ok).toBe(true)
    expect(setProcedurePrice(api, OFFICE, ELLISON, 300).ok).toBe(true)
    expect(setProcedurePrice(api, SOUTER, ELLISON, 420).ok).toBe(true)
    expect(typed(api)).toBe(420)
    const whos = api.getState().audit.filter((a) => a.action === 'procedure.price' && a.entityId === ELLISON).map((a) => a.who)
    expect(whos).toEqual(['Dr Melanie Souter', 'Kirsty W.', 'Dr Melanie Souter'])
  })

  it('editProcedure never writes the typed price (A15: only Change price and the rail)', () => {
    const api = createAppStore()
    const patch = { enteredPrice: 100 } as unknown as Parameters<typeof editProcedure>[3]
    expect(editProcedure(api, OFFICE, ELLISON, patch)).toMatchObject({ ok: false, code: 'priceThroughSetPrice' })
  })

  it('a Contract change clears a typed price (20, A15)', () => {
    const api = createAppStore()
    expect(setProcedurePrice(api, OFFICE, ELLISON, 450).ok).toBe(true)
    const before = api.getState().schedule.procedures[ELLISON]!.governingContractId
    const next = before === CONTRACT.noContractRvg ? seedFallbackId('patient-standard') : CONTRACT.noContractRvg
    expect(setProcedureContract(api, OFFICE, ELLISON, next).ok).toBe(true)
    expect(typed(api)).toBeUndefined()
  })
})

