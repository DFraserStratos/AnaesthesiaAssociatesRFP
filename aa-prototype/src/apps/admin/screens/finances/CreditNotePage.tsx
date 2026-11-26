/**
 * A credit note's page, under Finances' Invoices tab (catch-up Phase 39; build plan Phases 58 and
 * 63; D107, D108, US-13.3.3's Record page): the record pattern's header over the paper and its rail.
 * Back to the Invoices tab at the filter the office came from; the number with its status (every
 * credit note credits its original in full); a summary line naming the invoice it credits (a link to
 * that invoice's page), the payer it goes to, the patient (the name, never the NHI, D9) and the
 * anaesthetist. The paper and rail are `CreditNoteDocument`'s. An unknown credit note falls back to
 * the tab, as an unknown invoice does.
 */

import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { invoiceAddresseeName, useAppStore, useToday } from '../../../../store'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { drSurname } from '../../../../shared/format'
import { Pill, TextAction } from '../../../../shared/ui'
import { CreditNoteDocument } from '../InvoiceDocument'
import { invoiceRowFor } from '../invoiceListRows'
import { invoicePath } from './financePaths'
import { INVOICES_LIST_STATE_KEY, InvoicesRecordPage } from './InvoicePage'

/** A credit note always credits its original in full ("Credits AA-2026-0007 in full"). */
const CREDITED_IN_FULL = `${CREDIT_LABELS.credited} in full`

export function CreditNotePage() {
  const { creditNoteId = '' } = useParams()
  const exists = useAppStore((s) => s.billing.creditNotes[creditNoteId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      {exists && <CreditNoteRecord key={creditNoteId} creditNoteId={creditNoteId} />}
    </RequireEntity>
  )
}

function CreditNoteRecord({ creditNoteId }: { creditNoteId: string }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const location = useLocation()
  const cn = billing.creditNotes[creditNoteId]
  const original = cn !== undefined ? billing.invoices[cn.originalInvoiceId] : undefined
  // The patient and anaesthetist as the original's row reads them (59's model, the Invoices tab's read).
  const originalRow = useMemo(
    () => (cn !== undefined ? invoiceRowFor({ billing, schedule, masters }, cn.originalInvoiceId, todayISO) : undefined),
    [billing, schedule, masters, cn, todayISO],
  )
  if (cn === undefined) return null
  const payer = invoiceAddresseeName({ masters, schedule }, cn)
  const rest = [payer, originalRow?.patientName, originalRow?.anaesthetistName !== undefined ? drSurname(originalRow.anaesthetistName) : undefined].filter(
    (p): p is string => p !== undefined && p !== '',
  )
  // The original's page keeps the way back to the filter this page was opened from.
  const carried = (location.state as Record<string, unknown> | null)?.[INVOICES_LIST_STATE_KEY]

  return (
    <InvoicesRecordPage
      testId="credit-note-detail-screen"
      backShot="credit-note-back"
      title={cn.creditNoteNumber}
      aside={<Pill tone="neutral" shot="credit-note-status">{CREDITED_IN_FULL}</Pill>}
      sub={
        <span data-shot="credit-note-summary">
          {original !== undefined && (
            <>
              {'Credits '}
              <TextAction
                inline
                to={invoicePath(original.id)}
                {...(typeof carried === 'string' ? { linkState: { [INVOICES_LIST_STATE_KEY]: carried } } : {})}
                shot="credit-note-original-link"
              >
                {original.invoiceNumber}
              </TextAction>
              {rest.length > 0 ? ' · ' : ''}
            </>
          )}
          {rest.join(' · ')}
        </span>
      }
    >
      <CreditNoteDocument creditNoteId={cn.id} />
    </InvoicesRecordPage>
  )
}
