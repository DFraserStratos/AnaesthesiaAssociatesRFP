/**
 * Test helper (catch-up Phase 27): approve and send every prepayment payer
 * group awaiting approval on a Booking, as the office does on the Invoices
 * strip. Returns the invoice ids generated.
 */

import type { AppStoreApi } from '../store/appStore'
import type { Actor } from '../store/mutate'
import { approvePrepayment } from '../store/prepaymentActions'
import { prepaymentStatusFor } from '../store/prepaymentSelectors'

export const TEST_OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

export function approveAllPrepayments(api: AppStoreApi, bookingId: string, actor: Actor = TEST_OFFICE): string[] {
  const ids: string[] = []
  for (const g of prepaymentStatusFor(api.getState(), bookingId).groups) {
    if (g.status !== 'awaitingApproval') continue
    const out = approvePrepayment(api, actor, bookingId, g.payerKey)
    if (out.ok) ids.push(out.value.invoiceId)
  }
  return ids
}
