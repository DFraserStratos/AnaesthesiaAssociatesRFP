/**
 * Pre-payment gate, override and pre-invoice tests (Phase 09; B7).
 *
 * The gate blocks completing an unpaid selfFundedPrepayment card; the audited
 * office override lifts it; a seeded PAID pre-invoice clears it with no
 * override; a non-prepayment card is unaffected. `raisePreProcedureInvoice` is
 * office-only, idempotent, and refused once the List is authorised. The
 * balance-after-override run bills the remainder (deposit + balance = the full
 * self funded fee).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeCard, completionBlockersFor, submitList } from './lifecycle'
import { overridePrepaymentGate, raisePreProcedureInvoice } from './prepaymentActions'
import { runBillingForList } from './billingRun'
import {
  billingMonitor,
  prePaymentInvoicesForCard,
  prepaymentStatusFor,
  proceduresForCard,
} from './selectors'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function listOf(api: BoundAppStore, cardId: string): string {
  const card = api.getState().schedule.cards[cardId]
  if (card === undefined) throw new Error(`missing card ${cardId}`)
  return card.listId
}

describe('the completion gate', () => {
  it('blocks completing an unpaid selfFundedPrepayment card (required, no invoice yet)', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('required')
    const blockers = completionBlockersFor(api.getState(), api.getState().schedule.cards[riley]!)
    expect(blockers.some((b) => b.code === 'prepaymentUnpaid')).toBe(true)
    expect(completeCard(api, SOUTER, riley)).toMatchObject({ ok: false, code: 'prepaymentUnpaid' })
  })

  it('a seeded PAID pre-invoice clears the gate with no override', () => {
    const api = store()
    const paid = marker('prepaymentPaidCard')
    expect(prepaymentStatusFor(api.getState(), paid)).toBe('paid')
    expect(completeCard(api, SOUTER, paid).ok).toBe(true)
    expect(api.getState().schedule.cards[paid]!.completed).toBe(true)
    expect(api.getState().schedule.cards[paid]!.prepaymentOverride).toBeUndefined()
  })

  it('a non-prepayment card is unaffected by the gate', () => {
    const api = store()
    const acc = marker('accRelatedCard')
    expect(prepaymentStatusFor(api.getState(), acc)).toBe('none')
    const blockers = completionBlockersFor(api.getState(), api.getState().schedule.cards[acc]!)
    expect(blockers.some((b) => b.code === 'prepaymentUnpaid')).toBe(false)
  })
})

describe('overridePrepaymentGate', () => {
  it('is office-only and needs a reason', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    expect(overridePrepaymentGate(api, SOUTER, riley, 'proceeding')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(overridePrepaymentGate(api, OFFICE, riley, '  ')).toMatchObject({ ok: false, code: 'reasonRequired' })
  })

  it('lifts the gate (audited), then the card completes; a second override is refused', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    const outcome = overridePrepaymentGate(api, OFFICE, riley, 'Patient paid in clinic, receipt on file')
    expect(outcome.ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('overridden')
    expect(
      api.getState().audit.some((a) => a.entityId === riley && a.action === 'card.prepaymentOverride'),
    ).toBe(true)
    expect(completeCard(api, SOUTER, riley).ok).toBe(true)
    expect(overridePrepaymentGate(api, OFFICE, riley, 'again')).toMatchObject({ ok: false, code: 'alreadyOverridden' })
  })
})

describe('raisePreProcedureInvoice', () => {
  it('is office-only and idempotent', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    expect(raisePreProcedureInvoice(api, SOUTER, riley)).toMatchObject({ ok: false, code: 'officeOnly' })
    const first = raisePreProcedureInvoice(api, OFFICE, riley)
    expect(first.ok).toBe(true)
    const invoices = prePaymentInvoicesForCard(api.getState(), riley)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]!.kind).toBe('prePayment')
    expect(invoices[0]!.subtotal).toBe(800)
    expect(invoices[0]!.total).toBe(920)
    expect(prepaymentStatusFor(api.getState(), riley)).toBe('outstanding')
    expect(raisePreProcedureInvoice(api, OFFICE, riley)).toMatchObject({ ok: false, code: 'alreadyRaised' })
  })

  it('is refused once the List is authorised (would double charge the balance run)', () => {
    const api = store()
    const paid = marker('prepaymentPaidCard') // its list has no other cards to block submit
    expect(completeCard(api, OFFICE, paid).ok).toBe(true)
    const listId = listOf(api, paid)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(raisePreProcedureInvoice(api, OFFICE, paid)).toMatchObject({ ok: false, code: 'listBilled' })
  })
})

describe('balance after override (deposit + balance = the full self funded fee)', () => {
  it('raises the $800 deposit, overrides, then bills the $400 balance with a visible deduction line', () => {
    const api = store()
    const riley = marker('prepaymentCard')
    const listId = listOf(api, riley)

    expect(raisePreProcedureInvoice(api, OFFICE, riley).ok).toBe(true)
    // The gate still blocks (outstanding) until the override.
    expect(completeCard(api, SOUTER, riley)).toMatchObject({ ok: false, code: 'prepaymentUnpaid' })
    expect(overridePrepaymentGate(api, OFFICE, riley, 'Proceeding on the office call').ok).toBe(true)
    expect(completeCard(api, SOUTER, riley).ok).toBe(true)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const run = runBillingForList(api, listId)
    expect(run.ok).toBe(true)

    const state = api.getState()
    const balance = Object.values(state.billing.invoices).filter((i) => i.cardId === riley && i.kind === 'standard')
    expect(balance).toHaveLength(1)
    expect(balance[0]!.subtotal).toBe(400) // 1200 fee less the 800 deposit
    const lines = Object.values(state.billing.invoiceLines).filter((l) => l.invoiceId === balance[0]!.id)
    expect(lines.some((l) => l.description === 'Less pre-payment deposit already invoiced' && l.amount === -800)).toBe(true)
    // deposit (800) + balance (400) = the full $1,200 self funded fee.
    const deposit = prePaymentInvoicesForCard(state, riley)[0]!
    expect(deposit.subtotal + balance[0]!.subtotal).toBe(1200)
    // A procedure with only one procedure means only one invoice for the card kind standard.
    void proceduresForCard(state, riley)
  })
})

describe('the monitor does not conflate the paid pre-invoice with the run', () => {
  it('a billed mixed + full card reads invoiced (not paid) and its list counts only run invoices', () => {
    const api = store()
    const paid = marker('prepaymentPaidCard')
    const listId = listOf(api, paid)
    // Paid gate clears completion; bill the list.
    expect(completeCard(api, OFFICE, paid).ok).toBe(true)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)

    const rows = billingMonitor(api.getState())
    const listRow = rows.find((r) => r.listId === listId)
    expect(listRow).toBeDefined()
    // The run produced ONE hospital invoice (the full pre-payment procedure nets to $0);
    // the seeded PAID pre-invoice is NOT counted as run output.
    expect(listRow!.invoiceCount).toBe(1)
    const cardRow = listRow!.cardRows.find((c) => c.cardId === paid)
    expect(cardRow).toBeDefined()
    // The card's run status is 'invoiced' (the unpaid hospital invoice), NOT 'paid'
    // (which the seeded deposit case would have masked before the fix).
    expect(cardRow!.status).toBe('invoiced')
  })
})
