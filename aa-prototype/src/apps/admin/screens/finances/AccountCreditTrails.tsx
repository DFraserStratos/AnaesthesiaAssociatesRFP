/**
 * An anaesthetist's account page rail: their credit trails (build plan Phase 65; US-08.6.2, after the
 * Ledger's CreditTrails of catch-up Phases 39 and 39a). One row per negative invoice: the credit
 * note's number, opening it, over what became of the contra: offset at once, netted in which weeks,
 * or what still nets in the next payment run. Renders nothing when they have no negative invoices.
 */

import { useMemo } from 'react'
import { RailSection, type RailSectionRow } from '../../../../shared/ui'
import { formatCurrency } from '../../../../shared/format'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import type { NegativeInvoice } from '../../../../domain/types'
import type { AppState } from '../../../../store/appStore'

type BillingSlice = AppState['billing']
import { negativeInvoicesFor, negativeOpenAmount, paymentWeekFor, useAppStore } from '../../../../store'
import { creditNotePath, invoicePath } from './financePaths'

export function AccountCreditTrails({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const negatives = useMemo(() => negativeInvoicesFor({ billing }, anaesthetistId), [billing, anaesthetistId])
  if (negatives.length === 0) return null
  const nettingNote = (n: NegativeInvoice): string => negativeNettingNote(billing, n)
  const rows: RailSectionRow[] = negatives.map((n) => {
    const cn = billing.creditNotes[n.creditNoteId]
    const note = nettingNote(n)
    return {
      key: n.id,
      to: cn !== undefined ? creditNotePath(cn.id) : invoicePath(n.originalInvoiceId),
      title: cn?.creditNoteNumber ?? n.number,
      sub: n.status === 'toNet' ? <span data-shot="ledger-nets-next-run">{note}</span> : note,
      data: { 'data-negative-invoice-id': n.id },
    }
  })
  return <RailSection title="Credit trails" countNoun="credit trails" rows={rows} limit={5} empty="No credits." shot="ledger-credit-trail" />
}

/**
 * What a negative invoice's contra says (catch-up Phase 39a): offset at once, netted in which weeks,
 * or what is still to net. The account page's trails and the credit note page read it.
 */
export function negativeNettingNote(billing: BillingSlice, n: NegativeInvoice): string {
  if (n.status === 'offset' || n.recoveryDue <= 0) return CREDIT_LABELS.offsetDone
  const weeks = [...new Set((n.nettings ?? []).map((x) => paymentWeekFor({ billing }, x.runId)).filter((w): w is string => w !== undefined))]
  const open = negativeOpenAmount({ billing }, n.id)
  if (n.status === 'netted') return `Netted in ${weeks.join(' and ')}`
  return `${CREDIT_LABELS.netsNextRun} · ${formatCurrency(open)}${weeks.length > 0 ? ` (part netted in ${weeks.join(' and ')})` : ''}`
}
