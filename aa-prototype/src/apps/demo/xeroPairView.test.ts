import { describe, expect, it } from 'vitest'
import { INS, SEED_MARKERS, listIdForSlot, ANAE } from '../../domain/seed'
import { authoriseList, createAppStore, submitList, wireBillingRun } from '../../store'
import type { Actor, AppState } from '../../store'
import { xeroInvoicePairViews } from './xeroPairView'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function stagedS3State(): AppState {
  const api = createAppStore()
  const unwire = wireBillingRun(api)
  const pmListId = listIdForSlot(ANAE.souter, '2026-07-20', 'PM')
  try {
    expect(submitList(api, OFFICE, pmListId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, pmListId).ok).toBe(true)
    return api.getState()
  } finally {
    unwire()
  }
}

function nibPair(state: AppState) {
  const cardId = SEED_MARKERS.twoFunderCard?.entityId
  const invoice = Object.values(state.billing.invoices).find(
    (candidate) =>
      candidate.cardId === cardId &&
      candidate.counterparty.kind === 'insurer' &&
      candidate.counterparty.id === INS.nib,
  )
  if (invoice === undefined) throw new Error('expected the S3 nib invoice')
  const pair = xeroInvoicePairViews(state).find(
    (candidate) => candidate.engine.billingInvoiceId === invoice.id,
  )
  if (pair === undefined) throw new Error('expected the S3 nib Xero pair')
  return pair
}

describe('Xero invoice-pair view', () => {
  it('joins the S3 nib ACCREC, draft ACCPAY and Billing Engine context without an NHI', () => {
    const state = stagedS3State()
    const pair = nibPair(state)

    expect(pair.engine.patientName).toBe('Alan Prentice')
    expect(pair.engine.cardId).toBe(SEED_MARKERS.twoFunderCard?.entityId)
    expect(pair.engine.caseId).toBe(pair.engine.caseReference)
    expect(pair.accRec.contact?.name).toBe('nib')
    expect(pair.accPay?.contact?.name).toBe('Dr Melanie Souter')
    expect(pair.accPay?.id).toBe(
      state.billing.cases[pair.engine.caseId ?? '']?.accPayId,
    )
    expect(pair.accPay?.status).toBe('draft')
    expect(pair.accRec.amountDue).toBe(152.38)
    expect(pair.accRec.amountReceived).toBe(0)
    expect(pair.accRec.balance).toBe(152.38)
    expect(pair.accPay?.totalPayable).toBe(152.38)
    expect(pair.accPay?.amountAuthorised).toBe(0)
    expect(pair.accPay?.amountDisbursed).toBe(0)
    expect(pair.accPay?.remainingAuthorised).toBe(0)
    expect(pair.incomplete).toBe(false)
    expect(JSON.stringify(pair)).not.toContain('ZAC3326')
  })

  it('keeps an incomplete pair inspectable when the ACCPAY and payer contact are missing', () => {
    const state = stagedS3State()
    const original = nibPair(state)
    const contacts = { ...state.xero.contacts }
    const payerContactId = original.accRec.contact?.contactId
    if (payerContactId !== undefined) delete contacts[payerContactId]

    const degraded: AppState = {
      ...state,
      xero: {
        ...state.xero,
        contacts,
        accPays: {},
      },
    }
    const pair = xeroInvoicePairViews(degraded).find(
      (candidate) => candidate.accRec.id === original.accRec.id,
    )

    expect(pair).toBeDefined()
    expect(pair?.incomplete).toBe(true)
    expect(pair?.accRec.contact).toBeUndefined()
    expect(pair?.accPay).toBeUndefined()
    expect(pair?.engine.patientName).toBe('Alan Prentice')
    expect(pair?.accRec.id).toBe(original.accRec.id)
  })
})
