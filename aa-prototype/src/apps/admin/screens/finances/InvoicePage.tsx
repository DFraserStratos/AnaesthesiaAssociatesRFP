/**
 * An invoice's page, under Finances' Invoices tab (build plan Phases 58 and 63; D107, D108,
 * US-13.3.3's Record page): the record pattern's header over the paper and its rail, as a `document`
 * page. Back to the Invoices tab, at the filter the office came from when the tab handed it over
 * (router state `invoicesList`); the number with its payable's ID chip and its state (Unpaid with its
 * age, Part paid, Paid: 59's model, the read the tab's State column uses), or its standing once a
 * credit is pending or issued; a summary line of payer, patient (the name, never the NHI, D9), the
 * Booking's day and the anaesthetist. The paper and rail are `InvoiceDocument`'s, mounted unchanged.
 * Inline rather than in a dialog, because the print stylesheet isolates the `.aa-invoice-doc` node
 * and a fixed-position Dialog ancestor would break its print isolation; the header never prints.
 * An unknown invoice falls back to the tab.
 */

import { useMemo, type ReactNode } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { invoiceStanding, useAppStore, useToday, type Actor } from '../../../../store'
import { pairForInvoice } from '../../../../store/ledgerSelectors'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { drSurname } from '../../../../shared/format'
import { Pill } from '../../../../shared/ui'
import { AdminPage } from '../../components/AdminPage'
import { IdChip } from '../../components/ProfileChrome'
import { useAdminOutlet } from '../../outlet'
import { InvoiceDocument } from '../InvoiceDocument'
import { bookingDayLine, invoiceRowFor, invoiceStateLabel } from '../invoiceListRows'
import { financePath } from './financePaths'

/** The router state key the Invoices tab hands a record it opens: the tab's own path and query. */
export const INVOICES_LIST_STATE_KEY = 'invoicesList'

/**
 * Where a record's Back goes: the Invoices tab at the filter the office opened the record from
 * (router state `invoicesList`, the tab's path and query), else the tab as it opens.
 */
function useInvoicesBack(): { label: string; to: string } {
  const location = useLocation()
  const tab = financePath('invoices')
  const carried = (location.state as Record<string, unknown> | null)?.[INVOICES_LIST_STATE_KEY]
  const to = typeof carried === 'string' && (carried === tab || carried.startsWith(`${tab}?`)) ? carried : tab
  return { label: 'Invoices', to }
}

/**
 * The frame of a record under Invoices (an invoice, a credit note): a `document` page whose Back
 * returns to the Invoices tab at the filter the office came from. The rest is the record's own.
 */
export function InvoicesRecordPage({
  testId,
  backShot,
  title,
  aside,
  sub,
  children,
}: {
  testId: string
  backShot: string
  title: string
  aside?: ReactNode
  sub?: ReactNode
  children: ReactNode
}) {
  const back = useInvoicesBack()
  return (
    <AdminPage
      mode="document"
      testId={testId}
      back={{ ...back, shot: backShot }}
      title={title}
      {...(aside !== undefined ? { aside } : {})}
      {...(sub !== undefined ? { sub } : {})}
    >
      {children}
    </AdminPage>
  )
}

/** "payer · patient · day · Dr Surname", each part only where it is known. */
function summaryLine(parts: readonly (string | undefined)[]): string {
  return parts.filter((p): p is string => p !== undefined && p !== '' && p !== '·').join(' · ')
}

export function InvoicePage() {
  const { invoiceId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.billing.invoices[invoiceId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      {exists && <InvoiceRecord key={invoiceId} invoiceId={invoiceId} actor={actor} />}
    </RequireEntity>
  )
}

function InvoiceRecord({ invoiceId, actor }: { invoiceId: string; actor: Actor }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const standing = useAppStore((s) => invoiceStanding(s, invoiceId))
  const todayISO = useToday()
  const invoice = billing.invoices[invoiceId]
  const row = useMemo(() => invoiceRowFor({ billing, schedule, masters }, invoiceId, todayISO), [billing, schedule, masters, invoiceId, todayISO])
  const payableNumber = useMemo(() => row?.payableNumber ?? pairForInvoice({ billing }, invoiceId)?.payable?.number, [row, billing, invoiceId])
  const state = row !== undefined ? invoiceStateLabel(row) : null

  const statusPill =
    standing !== 'live' ? (
      // The standing in place of the money state, as the paper's masthead badge reads it (catch-up Phase 39): neutral, never red.
      <Pill tone="neutral" shot="invoice-header-standing" data-standing={standing}>
        {standing === 'credited' ? CREDIT_LABELS.credited : CREDIT_LABELS.pendingPill}
      </Pill>
    ) : state !== null && row !== undefined ? (
      <Pill tone={state.tone} shot="invoice-header-state" data-state={row.state}>
        {state.text}
      </Pill>
    ) : null

  const sub =
    row !== undefined
      ? summaryLine([row.payerName, row.patientName, bookingDayLine(row), row.anaesthetistName !== undefined ? drSurname(row.anaesthetistName) : undefined])
      : ''

  return (
    <InvoicesRecordPage
      testId="invoice-detail-screen"
      backShot="invoice-back"
      title={invoice?.invoiceNumber ?? invoiceId}
      aside={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {payableNumber !== undefined && <IdChip label="Payable" value={payableNumber} shot="invoice-payable-chip" />}
          {statusPill}
        </span>
      }
      {...(sub !== '' ? { sub: <span data-shot="invoice-summary">{sub}</span> } : {})}
    >
      <InvoiceDocument invoiceId={invoiceId} actor={actor} />
    </InvoicesRecordPage>
  )
}
