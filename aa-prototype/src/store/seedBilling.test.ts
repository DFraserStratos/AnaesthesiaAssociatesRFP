/**
 * Seeded PAID pre-payment slice tests (Phase 09): freshAppState / a fresh
 * store install exactly the mixed + full card's paid pre-invoice, with the
 * billing counters bumped so the first runtime billing run continues the
 * sequence (+1) without colliding. Deterministic and restored by
 * resetDomainState through the same seam.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type BoundAppStore } from './appStore'
import { buildSeed, buildSeedBillingSlice, SEED_MARKERS, SEED_PREPAID_CARD_ID } from '../domain/seed'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { resetDomainState } from './mutate'
import { prepaymentStatusFor } from './selectors'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

describe('the seeded paid pre-payment slice', () => {
  it('ships exactly one prePayment invoice and clears the gate for the mixed + full card', () => {
    const api = createAppStore()
    const billing = api.getState().billing
    const prePayInvoices = Object.values(billing.invoices).filter((i) => i.kind === 'prePayment')
    expect(prePayInvoices).toHaveLength(1)
    const invoice = prePayInvoices[0]!
    expect(invoice.cardId).toBe(SEED_PREPAID_CARD_ID)
    expect(invoice.layout).toBe('patient')
    // Card B's full pre-payment procedure: base 5 + T4 + M0 = 9 units at $26.50.
    expect(invoice.subtotal).toBe(238.5)

    // The pre-payment case is fully paid in (and, in the seed, disbursed).
    const preCase = Object.values(billing.cases).find((c) => c.invoiceId === invoice.id)!
    expect(preCase.cardId).toBe(SEED_PREPAID_CARD_ID)
    expect(preCase.receivedAmount).toBe(invoice.total)

    // The gate reads paid via the case->invoice join (money-based).
    expect(prepaymentStatusFor(api.getState(), SEED_PREPAID_CARD_ID)).toBe('paid')
  })

  it('numbers the seeded pre-payment INV/BC/IL/number 0001 and the runtime run starts at 0002', () => {
    const api = createAppStore()
    // The AA-2026-#### series: the seeded pre-payment is 0001 (history uses the
    // disjoint AA-2026-H## series, so the runtime run continues cleanly at 0002).
    const prePayInvoice = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'prePayment')!
    expect(prePayInvoice.id).toBe('INV0001')
    expect(prePayInvoice.invoiceNumber).toBe('AA-2026-0001')
    expect(prePayInvoice.caseReference).toBe('BC0001')

    // First runtime run: a single-invoice list continues the sequence at 0002.
    const cosList = api.getState().schedule.cards[marker('cosAccContractCard')]!.listId
    expect(submitList(api, OFFICE, cosList).ok).toBe(true)
    expect(authoriseList(api, OFFICE, cosList).ok).toBe(true)
    expect(runBillingForList(api, cosList).ok).toBe(true)
    const runtime = Object.values(api.getState().billing.invoices).filter((i) => /^AA-2026-\d{4}$/.test(i.invoiceNumber) && i.kind === 'standard')
    expect(runtime).toHaveLength(1)
    expect(runtime[0]!.id).toBe('INV0002')
    expect(runtime[0]!.invoiceNumber).toBe('AA-2026-0002')
  })

  it('is deterministic (two builds deep-equal) and restored by resetDomainState', () => {
    const a = buildSeedBillingSlice(buildSeed(), SEED_PREPAID_CARD_ID)
    const b = buildSeedBillingSlice(buildSeed(), SEED_PREPAID_CARD_ID)
    expect(a).toEqual(b)

    const api = createAppStore()
    const pristine = JSON.parse(JSON.stringify(api.getState().billing)) as unknown

    // Bill something, then reset — the billing slice returns to the seeded one.
    const cosList = api.getState().schedule.cards[marker('cosAccContractCard')]!.listId
    submitList(api, OFFICE, cosList)
    authoriseList(api, OFFICE, cosList)
    runBillingForList(api, cosList)
    expect(Object.values(api.getState().billing.invoices).length).toBeGreaterThan(1)

    resetDomainState(api as unknown as BoundAppStore)
    expect(api.getState().billing).toEqual(pristine)
  })

  it('freshAppState composes the same slice as a fresh store', () => {
    const fromFresh = freshAppState().billing
    const fromStore = createAppStore().getState().billing
    expect(fromFresh).toEqual(fromStore)
  })
})
