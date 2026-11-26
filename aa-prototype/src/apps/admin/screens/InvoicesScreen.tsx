import { useCallback, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fontFamily, neutral, type as typeScale } from '../../../theme/tokens'
import type { Invoice } from '../../../domain/types'
import { invoiceDeliveryLabel, layoutShortLabel } from '../../../domain/billing'
import { invoiceCountLine, type InvoiceRow } from '../../../domain/billing/invoiceState'
import {
  Card,
  CountBadge,
  DefList,
  DefRow,
  EmptyState,
  FilterPills,
  FormError,
  NameSearchBox,
  Pill,
  ResultLine,
  SelectField,
  TextAction,
} from '../../../shared/ui'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf, pageParam, pageWindow } from '../components/Pager'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import {
  invoiceStanding,
  originalInvoiceFor,
  rebillOriginFor,
  useAppStore,
  usePendingPrepayments,
  useToday,
  type Actor,
  type PendingPrepaymentRow,
} from '../../../store'
import type { AppState } from '../../../store/appStore'
import { pairByInvoice } from '../../../store/indexes'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, PRE_POST_OP_COPY } from '../../../shared/procedureEventCopy'
import { drSurname, formatCount, formatMoney, plainDate, stampText, surnameOf } from '../../../shared/format'
import { PrepaymentApprovalList, PrepaymentApprovalSwitchCard } from '../components/PrepaymentApprovalStrip'
import { PageBody, PageToolbar } from '../components/AdminPage'
import { FinancesPage } from './finances/FinancesSection'
import { creditNotePath, invoicePath } from './finances/financePaths'
import { INVOICES_LIST_STATE_KEY } from './finances/InvoicePage'
import {
  allInvoiceRows,
  bookingDayLine,
  INVOICE_KIND_LABEL,
  INVOICE_KINDS,
  INVOICE_SHOW_LABEL,
  INVOICE_SHOWS,
  invoiceList,
  invoiceListSummary,
  invoiceStateLabel,
  parseInvoiceKind,
  parseInvoiceShow,
  pendingRowId,
  type InvoiceShow,
} from './invoiceListRows'

interface InvoicesScreenProps {
  actor: Actor
}

type InvoiceParam = 'q' | 'show' | 'kind' | 'anaesthetist' | 'page'

/**
 * The list's state in the URL, replaced, never pushed: `q`, `show`, `kind`, `anaesthetist` and
 * `page`. A key at its default or empty is dropped; any write drops the old `view` link shape, and
 * any change other than paging goes back to page 1.
 */
function useInvoiceListParams() {
  const [params, setParams] = useSearchParams()
  const set = useCallback(
    (patch: Partial<Record<InvoiceParam, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch) as [InvoiceParam, string][]) {
            const fallback = key === 'show' ? 'unpaid' : key === 'page' ? '1' : ''
            if (value === fallback || value === '') next.delete(key)
            else next.set(key, value)
          }
          next.delete('view')
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )
  return { params, set }
}

/**
 * Finances' Invoices tab (US-08.4.7, US-06.3.1): every invoice, prepayment invoice and credit note AA
 * raises on a payer, in one list that opens on Unpaid. Filters for state, kind and anaesthetist and a
 * search over every key sit in the toolbar; a credit note rides just above the invoice it credits.
 * Awaiting approval is one of the filters: the prepayments waiting on an admin, with Approve and send,
 * and the approval switch in the rail beside "Unpaid by age". A row opens the invoice or credit note
 * on its own page under the tab.
 */
export function InvoicesScreen({ actor }: InvoicesScreenProps) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const navigate = useNavigate()
  const location = useLocation()
  const pending = usePendingPrepayments()

  const { params, set } = useInvoiceListParams()
  const show = parseInvoiceShow(params.get('show'), params.get('view'))
  const kind = show === 'approval' ? undefined : parseInvoiceKind(params.get('kind'))
  const anaesthetistParam = params.get('anaesthetist')
  const anaesthetistId = anaesthetistParam !== null && masters.anaesthetists[anaesthetistParam] !== undefined ? anaesthetistParam : undefined
  const q = params.get('q') ?? ''
  const page = pageParam(params.get('page'))
  const choose = (next: InvoiceShow) => set({ show: next })

  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Every row, derived once per state; the figures over the whole book; then one filter's rows, paged after.
  const all = useMemo(() => allInvoiceRows({ billing, schedule, masters }, todayISO), [billing, schedule, masters, todayISO])
  const summary = useMemo(() => invoiceListSummary(all), [all])
  const hasInvoices = useMemo(() => all.some((r) => r.state !== 'awaitingApproval'), [all])
  const rows = useMemo(
    () =>
      invoiceList(all, {
        show,
        ...(kind !== undefined ? { kind } : {}),
        ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
        q,
      }),
    [all, show, kind, anaesthetistId, q],
  )
  const pageSize = FULL_SCALE.pageSizes.invoices
  const pager = pageWindow(rows.length, pageSize, page)
  const shown = useMemo(() => pageOf(rows, pageSize, pager.page), [rows, pageSize, pager.page])
  useScreenTiming('invoices', [all, show, kind, anaesthetistId, q, pager.page])

  // Under Awaiting approval: the store's pending rows, in the list's order.
  const approvalRows = useMemo(() => {
    if (show !== 'approval') return []
    const byId = new Map<string, PendingPrepaymentRow>(pending.map((r) => [pendingRowId(r.bookingId, r.payerKey), r]))
    return rows.map((r) => byId.get(r.id)).filter((r): r is PendingPrepaymentRow => r !== undefined)
  }, [show, pending, rows])

  // Each invoice's event lines, counted once (never a scan per row).
  const eventLineCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of Object.values(billing.invoiceLines)) if (l.eventId !== undefined) counts.set(l.invoiceId, (counts.get(l.invoiceId) ?? 0) + 1)
    return counts
  }, [billing.invoiceLines])

  const anaesthetists = useMemo(
    () =>
      Object.entries(masters.anaesthetists)
        .map(([id, a]) => ({ id, name: a.name }))
        .sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.name.localeCompare(b.name)),
    [masters.anaesthetists],
  )

  const sub = "Raised when a list is authorised: one per billable party per Booking, or per share of a split fee, then emailed or marked to post as the party's delivery says."
  const filtered = q.trim() !== '' || anaesthetistId !== undefined

  const rail = (
    <>
      <PrepaymentApprovalSwitchCard actor={actor} count={summary.counts.toApprove} onShow={() => choose('approval')} onDone={setDone} onError={setError} />
      <Card padding="card" title="Unpaid by age" shot="invoices-unpaid-by-age">
        <DefList gap={0}>
          {summary.ageBands.map((band) => (
            <DefRow key={band.key} layout="settings" label={band.label} data-band={band.key}>
              {`${formatCount(band.count)} · ${formatMoney(band.owing)}`}
            </DefRow>
          ))}
        </DefList>
        <p style={QUIET_LINE}>A patient's own balance and follow-up are on their page in People.</p>
      </Card>
    </>
  )

  return (
    <FinancesPage tab="invoices" mode="fit" testId="invoice-list-screen" data-view={show} sub={sub}>
      <PageToolbar end={<span className="mono" data-shot="invoices-count">{invoiceCountLine(summary.counts)}</span>}>
        <NameSearchBox
          size="pill"
          label="Search invoices"
          placeholder="Number, -P number, case reference, patient, payer"
          value={q}
          onChange={(v) => set({ q: v })}
          shot="invoices-search"
          width={280}
        />
        <div data-shot="invoices-tabs" data-invoices-view={show}>
          <FilterPills
            ariaLabel="Invoices by state"
            value={show}
            options={INVOICE_SHOWS.map((value) => ({
              value,
              label:
                value === 'approval' ? (
                  <span data-view={value}>
                    {INVOICE_SHOW_LABEL[value]} <CountBadge count={summary.counts.toApprove} srNoun="to approve" />
                  </span>
                ) : (
                  <span data-view={value}>{INVOICE_SHOW_LABEL[value]}</span>
                ),
            }))}
            onSelect={choose}
          />
        </div>
        {show !== 'approval' && (
          <SelectField size="compact" hideLabel label="Kind" value={kind ?? ''} onChange={(v) => set({ kind: v })} shot="invoices-kind">
            <option value="">All kinds</option>
            {INVOICE_KINDS.map((k) => (
              <option key={k} value={k}>
                {INVOICE_KIND_LABEL[k]}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField size="compact" hideLabel label="Anaesthetist" value={anaesthetistId ?? ''} onChange={(v) => set({ anaesthetist: v })} shot="invoices-anaesthetist">
          <option value="">All anaesthetists</option>
          {anaesthetists.map((a) => (
            <option key={a.id} value={a.id}>
              {drSurname(a.name)}
            </option>
          ))}
        </SelectField>
      </PageToolbar>

      <PageBody rail={rail} railLabel="Invoices summary">
        <FormError message={error} />
        <ResultLine line={done} shot="approve-and-send-result" />
        {show === 'approval' ? (
          <PrepaymentApprovalList actor={actor} rows={approvalRows} filtered={filtered} onDone={setDone} onError={setError} />
        ) : !hasInvoices ? (
          <EmptyState variant="inline">No invoices yet. Authorise a submitted list and the billing run raises its invoices immediately.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState variant="card" title="No invoice matches.">
            {filtered || kind !== undefined ? 'Clear the search or the filters, or choose All.' : 'None of the invoices is in this state. Choose All to see every invoice.'}
          </EmptyState>
        ) : (
          <TableShell
            fit
            testId="invoice-list-table-shell"
            label="Invoices"
            density="dense"
            minWidth={1100}
            {...(rows.length > pageSize
              ? { footer: <Pager total={rows.length} size={pageSize} page={pager.page} onPage={(p) => set({ page: String(p) })} shot="invoices-pager" /> }
              : {})}
          >
            <thead>
              <tr>
                {/* Payer and Patient · Booking take the spare width; the rest hug their content. */}
                {INVOICE_COLUMNS.map((h) => (
                  <Th key={h} align={RIGHT_COLUMNS.has(h) ? 'right' : 'left'} nowrap {...(FLEX_COLUMNS.has(h) ? {} : { width: '1%' })}>
                    {h}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <InvoiceListRow key={row.id} row={row} billing={billing} schedule={schedule} eventLines={eventLineCounts.get(row.id) ?? 0} onOpen={(path) => navigate(path, { state: { [INVOICES_LIST_STATE_KEY]: `${location.pathname}${location.search}` } })} />
              ))}
            </tbody>
          </TableShell>
        )}
      </PageBody>
    </FinancesPage>
  )
}

const INVOICE_COLUMNS = ['Number', 'Kind', 'Payer', 'Patient · Booking', 'Anaesthetist', 'Raised', 'Total', 'Owing', 'State', 'Delivery'] as const
const FLEX_COLUMNS: ReadonlySet<string> = new Set(['Payer', 'Patient · Booking'])
const RIGHT_COLUMNS: ReadonlySet<string> = new Set(['Total', 'Owing'])

/** A cell's quiet second line. */
const SUBLINE = { marginTop: 2, fontSize: typeScale.captionSm.size, fontWeight: 400, color: neutral.mist } as const

/** The rail's closing line. */
const QUIET_LINE = { margin: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.mist } as const

/** The slices a row reads its records from, by id. */
type RecordState = Pick<AppState, 'billing' | 'schedule'>

/**
 * One invoice or credit note. Its records are looked up by id here, so the sublines cost only the
 * rows on the page.
 */
function InvoiceListRow({ row, billing, schedule, eventLines, onOpen }: { row: InvoiceRow; eventLines: number; onOpen: (path: string) => void } & RecordState) {
  const credit = row.kind === 'creditNote'
  const invoice: Invoice | undefined = credit ? undefined : billing.invoices[row.id]
  const original = credit && row.originalInvoiceId !== undefined ? billing.invoices[row.originalInvoiceId] : undefined
  const path = credit ? creditNotePath(row.id) : invoicePath(row.id)
  const number = row.number ?? row.id
  const booking = schedule.bookings[row.bookingId]
  const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
  const dayLine = bookingDayLine(row)
  const layout = invoice?.layout ?? original?.layout
  const state = invoiceStateLabel(row)
  const raisedLabel = credit ? 'Issued' : 'Raised'

  return (
    <ClickableRow onOpen={() => onOpen(path)} {...(credit ? { 'data-credit-note-id': row.id } : { 'data-invoice-id': row.id })}>
      <Td mono bold>
        {/* The row's keyboard handle, named in full; the row click stays for the mouse. */}
        <TextAction size="sm" flush label={credit ? `View credit note ${number}` : `View invoice ${number}`} onClick={() => onOpen(path)}>
          {number}
        </TextAction>
        {invoice !== undefined && <InvoiceSublines invoice={invoice} billing={billing} schedule={schedule} eventLines={eventLines} />}
        {credit && <CreditSubline originalInvoiceId={row.originalInvoiceId} billing={billing} />}
      </Td>
      <Td nowrap>
        <span data-shot="invoice-list-kind" data-kind={credit ? 'creditNote' : (invoice?.kind ?? 'standard')}>
          {INVOICE_KIND_LABEL[row.kind]}
        </span>
      </Td>
      <Td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {row.payerName}
          {invoice?.split !== undefined && <Pill size="sm" shot="invoice-list-split">Split</Pill>}
        </span>
        {layout !== undefined && <div data-shot="invoice-list-layout" style={SUBLINE}>{`${layoutShortLabel(layout)} layout`}</div>}
      </Td>
      <Td>
        {!credit && booking !== undefined && list !== undefined ? (
          <Link
            aria-label={`View booking for ${row.patientName}, ${dayLine}`}
            className="aa-table-entity-link"
            to={`/admin/day/${list.dateISO}/bookings/${booking.id}`}
            state={{ fromInvoiceId: row.id }}
          >
            <span>
              <span className="aa-table-entity-link-title">{row.patientName}</span>
              <span className="mono" style={{ ...SUBLINE, display: 'block', whiteSpace: 'nowrap' }}>{dayLine}</span>
            </span>
            <ChevronRight size={14} strokeWidth={2.2} color={neutral.mist} aria-hidden />
          </Link>
        ) : (
          <>
            <div style={{ fontWeight: 600 }}>{row.patientName}</div>
            <div className="mono" style={{ ...SUBLINE, whiteSpace: 'nowrap' }}>{dayLine}</div>
          </>
        )}
      </Td>
      <Td bold nowrap>
        <span title={row.anaesthetistName}>{row.anaesthetistName !== undefined ? drSurname(row.anaesthetistName) : 'Anaesthetist unavailable'}</span>
      </Td>
      <Td mono nowrap>
        <span data-shot="invoice-list-raised" title={row.raisedISO !== undefined ? `${raisedLabel} ${stampText(row.raisedISO)}` : undefined}>
          {row.raisedISO !== undefined ? plainDate(row.raisedISO) : '·'}
        </span>
      </Td>
      <Td mono bold nowrap align="right">{formatMoney(row.total)}</Td>
      <Td mono nowrap align="right">{credit ? '·' : formatMoney(row.owing)}</Td>
      <Td nowrap>
        {state !== null ? (
          <Pill size="sm" tone={state.tone} shot="invoice-list-state" data-state={row.state}>
            {state.text}
          </Pill>
        ) : (
          '·'
        )}
      </Td>
      <Td nowrap>
        <DeliveryPill delivery={row.delivery} />
      </Td>
    </ClickableRow>
  )
}

/** Under an invoice's number: what it is additional to, its event lines, what it rebills, and its standing. */
function InvoiceSublines({ invoice, billing, schedule, eventLines }: { invoice: Invoice; eventLines: number } & RecordState) {
  const original = invoice.kind === 'additional' ? originalInvoiceFor({ billing }, invoice.id) : undefined
  const rebillOrigin = rebillOriginFor({ billing }, invoice.id)
  const standing = invoiceStanding({ schedule, billing }, invoice.id)
  return (
    <>
      {original !== undefined && <div data-shot="invoice-list-additional-to" style={SUBLINE}>{ADDITIONAL_INVOICE_COPY.additionalTo(original.invoiceNumber)}</div>}
      {eventLines > 0 && <div data-shot="invoice-list-event-lines" style={SUBLINE}>{PRE_POST_OP_COPY.eventLines(eventLines)}</div>}
      {rebillOrigin !== undefined && <div data-shot="invoice-list-rebills" style={SUBLINE}>{CREDIT_LABELS.rebills(rebillOrigin.invoiceNumber)}</div>}
      {standing !== 'live' && (
        <div style={{ marginTop: 4 }}>
          <Pill size="sm" shot="invoice-list-standing" data-standing={standing} style={{ fontFamily: fontFamily.ui }}>
            {standing === 'credited' ? CREDIT_LABELS.credited : CREDIT_LABELS.pendingPill}
          </Pill>
        </div>
      )}
    </>
  )
}

/** Under a credit note's number: the invoice it credits (from the invoice, else its pair's receivable). */
function CreditSubline({ originalInvoiceId, billing }: { originalInvoiceId: string | undefined; billing: AppState['billing'] }) {
  if (originalInvoiceId === undefined) return null
  const number = billing.invoices[originalInvoiceId]?.invoiceNumber ?? pairByInvoice(billing.ledger).get(originalInvoiceId)?.receivable.number
  if (number === undefined) return null
  return <div data-shot="invoice-list-credits" style={SUBLINE}>{CREDIT_LABELS.credits(number)}</div>
}

/** How the run delivered it (emailed, to post, or no address), on the shared `Pill`. */
function DeliveryPill({ delivery }: { delivery: Invoice['delivery'] }) {
  const label = invoiceDeliveryLabel(delivery)
  return (
    <Pill tone={label.tone} shot="invoice-list-delivery" data-delivery={delivery?.status ?? 'none'} title={label.text} style={{ whiteSpace: 'nowrap' }}>
      {label.short}
    </Pill>
  )
}
