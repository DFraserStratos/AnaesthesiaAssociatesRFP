import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { wireBillingRun } from '../../store/billingRun'
import { authoriseList, submitList } from '../../store/lifecycle'
import { approveProcedureEvent, runEventInvoicing, submitCredit, type Actor } from '../../store'
import { completeAnswered } from '../../test/completeAnswered'
import { ANAE, SEED_LIST_IDS } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { CREDIT_LABELS, PREPAID_SETTLEMENT_COPY } from '../procedureEventCopy'
import { BookingStoreContext } from './draft'
import { PrepaidSettlementBlock } from './PrepaidSettlementBlock'
import { CreditForm } from './CreditForm'

/**
 * Catch-up Phase 41, work item 9 (US-06.4.1, D31): Nair's rhinoplasty, prepaid
 * on INV0001 (AA-2026-0001, $1,200.00 ex GST), on Dr Souter's List.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const NAIR_LIST = SEED_LIST_IDS.prepaymentPaidList

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => {
  cleanup()
  unwire()
})

const souter = (): Actor => ({ who: api.getState().masters.anaesthetists[ANAE.souter]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter })
const delaney = (): Actor => ({ who: api.getState().masters.anaesthetists[ANAE.delaney]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.delaney })
const nairProcedure = () => api.getState().billing.invoices['INV0001']!.procedureIds![0]!

function authorise(listId: string) {
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

function wrap(node: React.ReactNode, variant: 'web' | 'mobile' = 'web') {
  return render(
    <MemoryRouter>
      <BookingStoreContext.Provider value={{ api, mode: 'immediate', draft: null }}>
        <SurfaceProvider variant={variant}>{node}</SurfaceProvider>
      </BookingStoreContext.Provider>
    </MemoryRouter>,
  )
}

const block = () => document.querySelector('[data-shot="prepaid-settlement"]')

describe('the prepaid settlement block', () => {
  it('after authorise: the prepaid price, the recorded BTM for reference only, the move from the AA Holding account, and nothing automatic', () => {
    authorise(NAIR_LIST)
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={OFFICE} />)
    const root = block()!
    expect(root).not.toBeNull()
    const amount = root.querySelector('[data-shot="prepaid-settlement-amount"]')!.textContent!
    expect(amount).toContain(PREPAID_SETTLEMENT_COPY.prepaid)
    expect(amount).toContain('$1,200.00 · the price for this procedure')
    expect(amount).toContain('AA-2026-0001')
    const btm = root.querySelector('[data-shot="prepaid-settlement-btm"]')!.textContent!
    expect(btm).toMatch(/Recorded BTM\d+ units? · for reference only/)
    // The BTM line never carries a dollar figure.
    expect(btm).not.toContain('$')
    expect(root.querySelector('[data-shot="prepaid-settlement-transfer"]')!.textContent).toMatch(/^Moved from the AA Holding account to Dr Souter on \d{1,2} [A-Z][a-z]{2}$/)
    expect(root.textContent).toContain('Nothing is invoiced or credited automatically.')
    // The office's two entry points: Create additional invoice and Credit note.
    expect(root.querySelector('[data-shot="additional-invoice-button"]')).not.toBeNull()
    expect(root.querySelector('[data-shot="procedure-credit-note-button"]')).not.toBeNull()
  })

  it('the invoice number is plain text without the Admin link, and a link with it', () => {
    authorise(NAIR_LIST)
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={souter()} />, 'mobile')
    expect(block()!.querySelector('[data-shot="prepaid-settlement-invoice"]')!.tagName).toBe('SPAN')
    // Dr Souter reads the move as her own, and has her own entry points.
    expect(block()!.querySelector('[data-shot="prepaid-settlement-transfer"]')!.textContent).toContain('to you on')
    expect(block()!.querySelector('[data-shot="anaesthetist-credit-note-button"]')).not.toBeNull()
    cleanup()
    const opened: string[] = []
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={OFFICE} onOpenInvoice={(id) => opened.push(id)} />)
    const link = block()!.querySelector('[data-shot="prepaid-settlement-invoice"]') as HTMLButtonElement
    link.click()
    expect(opened).toEqual(['INV0001'])
  })

  it('a colleague sees the block but neither entry point', () => {
    authorise(NAIR_LIST)
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={delaney()} />)
    expect(block()).not.toBeNull()
    expect(block()!.querySelector('[data-shot="additional-invoice-button"]')).toBeNull()
    expect(block()!.querySelector('[data-shot="anaesthetist-credit-note-button"]')).toBeNull()
  })

  it('before authorise it shows to nobody while the prepayment still covers the Procedure', () => {
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={OFFICE} />)
    expect(block()).toBeNull()
    cleanup()
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={souter()} />)
    expect(block()).toBeNull()
  })

  it('once credited: the Credited line, and only Create additional invoice', () => {
    authorise(NAIR_LIST)
    const sub = submitCredit(api, OFFICE, { invoiceId: 'INV0001', procedureId: nairProcedure(), reason: 'Half the procedure was done', cause: 'correction', replacements: [] })
    if (!sub.ok) throw new Error(sub.message)
    const appr = approveProcedureEvent(api, OFFICE, sub.value.creditEventId)
    if (!appr.ok) throw new Error(appr.message)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    wrap(<PrepaidSettlementBlock procedureId={nairProcedure()} actor={OFFICE} />)
    const credit = block()!.querySelector('[data-shot="prepaid-settlement-credit"]')
    expect(credit).not.toBeNull()
    expect(credit!.textContent).toMatch(/^Credited\S+·\$1,380\.00$/)
    expect(block()!.querySelector('[data-shot="procedure-credit-note-button"]')).toBeNull()
    expect(block()!.querySelector('[data-shot="additional-invoice-button"]')).not.toBeNull()
  })
})

describe('the credit form on a prepayment invoice', () => {
  it('credits the whole invoice, says so with "A credit note is not a refund.", and offers no new invoice cards, even opened as a rebill', () => {
    authorise(NAIR_LIST)
    wrap(<CreditForm invoiceId="INV0001" actor={OFFICE} mode="rebill" onClose={() => {}} />)
    const notice = document.querySelector('[data-shot="prepayment-credit"]')!
    expect(notice.textContent).toContain(PREPAID_SETTLEMENT_COPY.creditWhole)
    expect(notice.textContent).toContain(CREDIT_LABELS.notARefund)
    expect(document.querySelector('[data-shot="credit-form"]')!.getAttribute('data-mode')).toBe('credit')
    expect(document.querySelectorAll('[data-shot="credit-replacement"]')).toHaveLength(0)
    expect(document.querySelector('[data-shot="credit-add-invoice"]')).toBeNull()
    expect(document.querySelectorAll('input[aria-label="Amount"], [aria-label="Amount"]')).toHaveLength(0)
  })

  it('a standard invoice keeps its own form: no prepayment notice', () => {
    wrap(<CreditForm invoiceId="HINV03" actor={OFFICE} onClose={() => {}} />)
    expect(document.querySelector('[data-shot="prepayment-credit"]')).toBeNull()
    expect(document.querySelector('[data-shot="credit-not-refund"]')).not.toBeNull()
    expect(document.querySelector('[data-shot="credit-add-invoice"]')).not.toBeNull()
  })
})
