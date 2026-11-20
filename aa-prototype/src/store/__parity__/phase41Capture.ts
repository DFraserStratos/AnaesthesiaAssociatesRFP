/**
 * Catch-up Phase 41 parity capture (work item 1): the figures the prepayment
 * follow-up must not move, keyed on invoice numbers and Booking ids, never on
 * pair or credit ids. `phase-41-baseline.json` was written from this capture
 * before any Phase 41 edit and is never rewritten.
 */

import { createAppStore, type BoundAppStore } from '../appStore'
import { wireBillingRun } from '../billingRun'
import { authoriseList, submitList } from '../lifecycle'
import { prepaymentStatusFor } from '../prepaymentSelectors'
import { anaesthetistLedgerPosition, ledgerPositionOf } from '../ledgerSelectors'
import { completeAnswered } from '../../test/completeAnswered'
import { approveAllPrepayments } from '../../test/approvePrepayments'
import { holdingBalance, holdingEntries } from '../../domain/billing/prepayHolding'
import { SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import type { Actor } from '../mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

export interface Phase41Capture {
  statuses: Record<string, { status: string; groups: { status: string; amount: number | null; invoiceNumber?: string; received: number }[] }>
  position: { received: number; holdingBalance: number; payablesDue: number; receivablesOutstanding: number; imbalance: number; inBalance: boolean }
  holding: { balance: number; entries: number }
  anaesthetists: Record<string, { owedToThem: number; collected: number; paidOut: number; imbalance: number }>
  riley: { before: string; invoiceNumber: string; total: number; after: string }
  nairAuthorised: {
    invoices: { number: string; kind: string; total: number; counterparty: string }[]
    transfers: { invoiceNumber: string; amount: number; to: string }[]
    holdingBalance: number
    imbalance: number
    nairStatus: string
  }
}

function statusesOf(api: BoundAppStore): Phase41Capture['statuses'] {
  const out: Phase41Capture['statuses'] = {}
  const s = api.getState()
  for (const id of Object.keys(s.schedule.bookings).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const p = prepaymentStatusFor(s, id)
    if (p.status === 'none') continue
    out[id] = { status: p.status, groups: p.groups.map((g) => ({ status: g.status, amount: g.amount, ...(g.invoiceNumber !== undefined ? { invoiceNumber: g.invoiceNumber } : {}), received: g.receivedTotal })) }
  }
  return out
}

function positionOf(api: BoundAppStore): Phase41Capture['position'] {
  const p = ledgerPositionOf(api.getState())
  return { received: p.received, holdingBalance: p.holdingBalance, payablesDue: p.payablesDue, receivablesOutstanding: p.receivablesOutstanding, imbalance: p.imbalance, inBalance: p.inBalance }
}

function authorise(api: BoundAppStore, listId: string): void {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const owner: Actor = { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}

export function capturePhase41(): Phase41Capture {
  const api = createAppStore()
  const unwire = wireBillingRun(api)
  try {
    const statuses = statusesOf(api)
    const position = positionOf(api)
    const entries = holdingEntries(api.getState().billing)
    const anaesthetists: Phase41Capture['anaesthetists'] = {}
    for (const id of Object.keys(api.getState().masters.anaesthetists).sort()) {
      const pos = anaesthetistLedgerPosition(api.getState(), id)
      if (pos.owedToThem === 0 && pos.collected === 0 && pos.paidOut === 0) continue
      anaesthetists[id] = { owedToThem: pos.owedToThem, collected: pos.collected, paidOut: pos.paidOut, imbalance: pos.imbalance }
    }

    // Riley (S4 Beat 1): awaiting approval, then approved and sent.
    const riley = SEED_MARKERS.prepaymentBooking!.entityId
    const before = prepaymentStatusFor(api.getState(), riley).status
    const [rileyInvoiceId] = approveAllPrepayments(api, riley, OFFICE)
    const rileyInvoice = api.getState().billing.invoices[rileyInvoiceId!]!
    const after = prepaymentStatusFor(api.getState(), riley).status

    // Nair: authorise Souter Fri 24 PM; nothing billed for her rhinoplasty, the transfer to Dr Souter.
    const store = createAppStore()
    const unwire2 = wireBillingRun(store)
    try {
      const listId = SEED_LIST_IDS.prepaymentPaidList
      const invoicesBefore = new Set(Object.keys(store.getState().billing.invoices))
      authorise(store, listId)
      const s = store.getState()
      const invoices = Object.values(s.billing.invoices)
        .filter((i) => !invoicesBefore.has(i.id))
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
        .map((i) => ({ number: i.invoiceNumber, kind: i.kind ?? 'final', total: i.total, counterparty: `${i.counterparty.kind}:${i.counterparty.id}` }))
      const transfers = Object.values(s.billing.transfers)
        .map((t) => ({ invoiceNumber: s.billing.invoices[t.invoiceId]?.invoiceNumber ?? t.invoiceId, amount: t.in.amount, to: t.in.payee.kind === 'anaesthetist' ? t.in.payee.anaesthetistId : t.in.payee.kind }))
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
      const pos = ledgerPositionOf(s)
      return {
        statuses,
        position,
        holding: { balance: holdingBalance(entries), entries: entries.length },
        anaesthetists,
        riley: { before, invoiceNumber: rileyInvoice.invoiceNumber, total: rileyInvoice.total, after },
        nairAuthorised: { invoices, transfers, holdingBalance: pos.holdingBalance, imbalance: pos.imbalance, nairStatus: prepaymentStatusFor(s, SEED_PREPAID_BOOKING_ID).status },
      }
    } finally {
      unwire2()
    }
  } finally {
    unwire()
  }
}
