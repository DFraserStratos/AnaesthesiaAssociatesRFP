import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fontFamily, neutral } from '../../../theme/tokens'
import type { CreditNote, Invoice } from '../../../domain/types'
import { invoiceDeliveryLabel, layoutShortLabel } from '../../../domain/billing'
import { CountBadge, EmptyState, LineTabLink, LineTabs, NameSearchBox, Pill, TextAction } from '../../../shared/ui'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../components/Pager'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import type { Actor } from '../../../store'
import { invoiceAddresseeName, invoiceStanding, isBackdropCreditNote, isBackdropInvoice, originalInvoiceFor, rebillOriginFor, useAppStore, usePendingPrepayments, openBillingExceptions } from '../../../store'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, PRE_POST_OP_COPY } from '../../../shared/procedureEventCopy'
import { dayMicroCap, drSurname, formatCount, formatCurrency, plural, pluralWord, shortDay, stampText } from '../../../shared/format'
import { listShortLabel, listSourceLabels } from '../util'
import { InvoiceDocument } from './InvoiceDocument'
import { PrepaymentApprovalStrip } from '../components/PrepaymentApprovalStrip'
import { AdminPage, PageBody, PageToolbar } from '../components/AdminPage'

/** The Kind column's words (catch-up Phase 38b). A credit note's row reads `CREDIT_LABELS.kind` (catch-up Phase 39): it is its own record, never an invoice kind. */
const INVOICE_KIND_LABEL: Record<Invoice['kind'], string> = {
  standard: 'Invoice',
  prePayment: 'Prepayment',
  additional: 'Additional',
}

interface InvoicesScreenProps {
  actor: Actor
  selectedInvoiceId: string | null
  onSelect: (invoiceId: string | null) => void
}


/**
 * The invoices raised by the billing run (Phase 08; B6). A `fit` Admin page with two tabs in the
 * URL: All invoices (`/admin/invoices`), the table of every invoice with how the run delivered it
 * (emailed, to post, or no address), the search in the toolbar and the pager in the card's foot; and
 * Awaiting approval (`?view=approval`), the prepayment invoices waiting on an admin with the
 * Prepayment approval switch. An invoice opens as a `document` page (the paper and its rail) inline
 * rather than in a dialog, because the print stylesheet isolates the `.aa-invoice-doc` node and a
 * fixed-position Dialog ancestor would break `position: absolute` print isolation.
 */
export function InvoicesScreen({ actor, selectedInvoiceId, onSelect }: InvoicesScreenProps) {
  const billing = useAppStore((s) => s.billing)
  const originalOf = (invoice: Invoice) => originalInvoiceFor({ billing }, invoice.id)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const navigate = useNavigate()
  // Credit notes join the table (catch-up Phase 39), each just above the invoice it credits.
  // Catch-up Phase 39b: each invoice's event lines, counted once (never a scan per row).
  const eventLineCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of Object.values(billing.invoiceLines)) if (l.eventId !== undefined) counts.set(l.invoiceId, (counts.get(l.invoiceId) ?? 0) + 1)
    return counts
  }, [billing.invoiceLines])
  const creditNotesByOriginal = useMemo(() => {
    const out = new Map<string, CreditNote[]>()
    for (const cn of Object.values(billing.creditNotes).sort((a, b) => b.id.localeCompare(a.id))) out.set(cn.originalInvoiceId, [...(out.get(cn.originalInvoiceId) ?? []), cn])
    return out
  }, [billing.creditNotes])
  // A credit note of an invoice this table leaves out (the seeded history) still lists, at the top.
  const shownIds = useMemo(() => new Set(Object.values(billing.invoices).filter((i) => !isBackdropInvoice(i)).map((i) => i.id)), [billing.invoices])
  const looseCreditNotes = useMemo(
    () => Object.values(billing.creditNotes).filter((cn) => !shownIds.has(cn.originalInvoiceId) && !isBackdropCreditNote(cn)).sort((a, b) => b.id.localeCompare(a.id)),
    [billing.creditNotes, shownIds],
  )
  const creditRow = (cn: CreditNote) => {
    const original = billing.invoices[cn.originalInvoiceId]
    const booking = schedule.bookings[cn.bookingId]
    const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
    const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
    const anaesthetist = list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
    if (original === undefined) return null
    return (
      <CreditNoteRow
        key={cn.id}
        creditNote={cn}
        original={original}
        patientName={booking === undefined ? 'Booking unavailable' : (patient?.name ?? 'Unknown patient')}
        bookingLabel={booking?.scheduledTime !== undefined ? `Booking ${booking.scheduledTime}` : 'Booking time not set'}
        anaesthetistName={anaesthetist?.name}
        listDateISO={list?.dateISO}
        listSource={list !== undefined ? listSourceLabels(list, masters) : undefined}
        addressee={invoiceAddresseeName({ masters, schedule, billing }, cn)}
        onOpen={() => navigate(`/admin/credit-notes/${cn.id}`)}
      />
    )
  }

  const invoices = useMemo(
    // The seeded historical backdrop (Phase 10) belongs to the anaesthetist money
    // views, not this office pipeline table — exclude it (the billing monitor does too).
    () => Object.values(billing.invoices).filter((i) => !isBackdropInvoice(i)).sort((a, b) => b.id.localeCompare(a.id)),
    [billing.invoices],
  )

  // Search then page (catch-up Phase 43; US-15.0.4): 50 a page over the existing sort; the search
  // ("Find by invoice number or payer") filters before paging and returns to page 1. A credit note
  // is found by its own number or addressee too: it shows above the invoice it credits.
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const q = query.trim().toLowerCase()
  const matching = useMemo(() => {
    if (q === '') return invoices
    const state = { masters, schedule, billing }
    const matches = (number: string, doc: Invoice | CreditNote) => number.toLowerCase().includes(q) || invoiceAddresseeName(state, doc).toLowerCase().includes(q)
    return invoices.filter((i) => matches(i.invoiceNumber, i) || (creditNotesByOriginal.get(i.id) ?? []).some((cn) => matches(cn.creditNoteNumber, cn)))
  }, [invoices, q, masters, schedule, billing, creditNotesByOriginal])
  const pageSize = FULL_SCALE.pageSizes.invoices
  const shownInvoices = useMemo(() => pageOf(matching, pageSize, page), [matching, pageSize, page])
  // A credit note whose invoice the table leaves out lists once, on the first page, and only when it matches.
  const shownLooseCreditNotes = useMemo(() => {
    if (page !== 1) return []
    if (q === '') return looseCreditNotes
    const state = { masters, schedule, billing }
    return looseCreditNotes.filter((cn) => cn.creditNoteNumber.toLowerCase().includes(q) || invoiceAddresseeName(state, cn).toLowerCase().includes(q))
  }, [page, q, looseCreditNotes, masters, schedule, billing])
  useScreenTiming('invoices', [invoices, query, page])

  const rows = useMemo(
    () =>
      shownInvoices.map((invoice) => {
        const booking = schedule.bookings[invoice.bookingId]
        const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
        const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
        const anaesthetist =
          list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
        const source = list !== undefined ? listSourceLabels(list, masters) : undefined
        return { invoice, booking, list, patient, anaesthetist, source }
      }),
    [shownInvoices, schedule.bookings, schedule.lists, masters],
  )

  // Prepayment invoices waiting on an admin (catch-up Phase 27, US-06.3.1): the "Awaiting approval" tab's count.
  const awaitingCount = usePendingPrepayments().length
  // The tab is in the URL (`?view=approval`), so a refresh or a link lands on it.
  const [params] = useSearchParams()
  const view: 'all' | 'approval' = params.get('view') === 'approval' ? 'approval' : 'all'

  // Billing-run exceptions not yet resolved (catch-up Phase 36; the Phase 09 monitor's seam).
  const failedCases = useMemo(() => openBillingExceptions({ billing }), [billing])

  if (selectedInvoiceId !== null && billing.invoices[selectedInvoiceId] !== undefined) {
    return (
      <AdminPage mode="document" testId="invoice-detail-screen" back={{ label: 'Invoices', onClick: () => onSelect(null) }}>
        <InvoiceDocument key={selectedInvoiceId} invoiceId={selectedInvoiceId} actor={actor} />
      </AdminPage>
    )
  }

  const tabs = (
    <LineTabs label="Invoices views" shot="invoices-tabs">
      <LineTabLink to="/admin/invoices" active={view === 'all'} data-view="all">All invoices</LineTabLink>
      <LineTabLink to="/admin/invoices?view=approval" active={view === 'approval'} data-view="approval" badge={<CountBadge count={awaitingCount} srNoun="to approve" />}>
        Awaiting approval
      </LineTabLink>
    </LineTabs>
  )
  const title = 'Invoices'
  const sub = "Raised when a list is authorised: one per billable party per Booking, or per share of a split fee, then emailed or marked to post as the party's delivery says."

  if (view === 'approval') {
    return (
      <AdminPage mode="fluid" testId="invoice-list-screen" data-view="approval" title={title} sub={sub} tabs={tabs}>
        <PageBody>
          {/* Prepayment invoices waiting on an admin, with the approval switch (catch-up Phase 27, US-06.3.1). */}
          <PrepaymentApprovalStrip actor={actor} />
        </PageBody>
      </AdminPage>
    )
  }

  return (
    <AdminPage mode="fit" testId="invoice-list-screen" data-view="all" title={title} sub={sub} tabs={tabs}>
      {invoices.length > 0 && (
        <PageToolbar
          end={
            <>
              {/* Billing exceptions are resolved through the monitor workflow. */}
              {failedCases.length > 0 && (
                <span data-shot="invoices-billing-exceptions" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Pill tone="warning" size="sm" title={failedCases.slice(0, 5).map((c) => `${c.bookingId} · ${c.message}`).join('\n')}>
                    {`${plural(failedCases.length, 'booking')} raised a billing exception`}
                  </Pill>
                  <TextAction size="sm" flush onClick={() => navigate('/admin/billing')}>Open Billing monitor</TextAction>
                </span>
              )}
              <span className="mono" data-shot="invoices-count">{`${formatCount(matching.length)} ${pluralWord(matching.length, 'invoice')}`}</span>
            </>
          }
        >
          <NameSearchBox
            size="pill"
            label="Find by invoice number or payer"
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            shot="invoices-search"
            width={300}
          />
        </PageToolbar>
      )}

      <PageBody>
      {invoices.length === 0 ? (
        <EmptyState variant="inline">No invoices yet. Authorise a submitted list and the billing run raises its invoices immediately.</EmptyState>
      ) : matching.length === 0 && shownLooseCreditNotes.length === 0 ? (
        <EmptyState variant="inline">No invoice matches that number or payer.</EmptyState>
      ) : (
        <TableShell
          fit
          testId="invoice-list-table-shell"
          label="Invoices"
          density="dense"
          minWidth={900}
          {...(matching.length > pageSize ? { footer: <Pager total={matching.length} size={pageSize} page={page} onPage={setPage} shot="invoices-pager" /> } : {})}
        >
            <thead>
              <tr>
                {/* Patient / booking and Counterparty take the spare width; the rest hug their content. */}
                {INVOICE_COLUMNS.map((h) => (
                  <Th key={h === '' ? 'view' : h} align={h === 'Total' ? 'right' : 'left'} nowrap {...(FLEX_COLUMNS.has(h) ? {} : { width: '1%' })}>
                    {h}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shownLooseCreditNotes.map(creditRow)}
              {rows.map(({ invoice, booking, list, patient, anaesthetist, source }) => {
                const patientName = booking === undefined ? 'Booking unavailable' : (patient?.name ?? 'Unknown patient')
                const bookingLabel =
                  booking === undefined
                    ? invoice.bookingId
                    : booking.scheduledTime !== undefined
                      ? `Booking ${booking.scheduledTime}`
                      : 'Booking time not set'
                const standing = invoiceStanding({ schedule, billing }, invoice.id)
                const rebillOrigin = rebillOriginFor({ billing }, invoice.id)
                return (
                  <Fragment key={invoice.id}>
                  {(creditNotesByOriginal.get(invoice.id) ?? []).map(creditRow)}
                  <ClickableRow onOpen={() => onSelect(invoice.id)} data-invoice-id={invoice.id}>
                  <Td mono bold>
                    <NumberLine number={invoice.invoiceNumber} kind={invoice.kind} />
                    {/* An additional invoice names its original (catch-up Phase 38b). */}
                    {invoice.kind === 'additional' && originalOf(invoice) !== undefined && (
                      <div data-shot="invoice-list-additional-to" style={SUBLINE}>{ADDITIONAL_INVOICE_COPY.additionalTo(originalOf(invoice)!.invoiceNumber)}</div>
                    )}
                    {/* Its event lines (catch-up Phase 39b): "+2 event lines". */}
                    {(eventLineCounts.get(invoice.id) ?? 0) > 0 && (
                      <div data-shot="invoice-list-event-lines" style={SUBLINE}>{PRE_POST_OP_COPY.eventLines(eventLineCounts.get(invoice.id)!)}</div>
                    )}
                    {/* A replacement names the invoice it rebills (catch-up Phase 39). */}
                    {rebillOrigin !== undefined && (
                      <div data-shot="invoice-list-rebills" style={SUBLINE}>{CREDIT_LABELS.rebills(rebillOrigin.invoiceNumber)}</div>
                    )}
                    {/* Its standing (catch-up Phase 39): derived, neutral. */}
                    {standing !== 'live' && (
                      <div style={{ marginTop: 4 }}>
                        <Pill size="sm" shot="invoice-list-standing" data-standing={standing} style={{ fontFamily: fontFamily.ui }}>{standing === 'credited' ? CREDIT_LABELS.credited : CREDIT_LABELS.pendingPill}</Pill>
                      </div>
                    )}
                  </Td>
                  <Td>
                    {booking !== undefined && list !== undefined ? (
                      <Link
                        aria-label={`View booking for ${patientName}, ${bookingLabel}`}
                        className="aa-table-entity-link"
                        to={`/admin/day/${list.dateISO}/bookings/${booking.id}`}
                        state={{ fromInvoiceId: invoice.id }}
                      >
                        <span>
                          <span className="aa-table-entity-link-title">{patientName}</span>
                          <span className="mono" style={{ ...SUBLINE, display: 'block', fontWeight: undefined, whiteSpace: 'nowrap' }}>
                            {bookingLabel}
                          </span>
                        </span>
                        <ChevronRight size={14} strokeWidth={2.2} color={neutral.mist} aria-hidden />
                      </Link>
                    ) : (
                      <PatientLines patientName={patientName} bookingLabel={bookingLabel} />
                    )}
                  </Td>
                  <Td bold nowrap><span title={anaesthetist?.name}>{anaesthetist !== undefined ? drSurname(anaesthetist.name) : 'Anaesthetist unavailable'}</span></Td>
                  <Td nowrap>
                    {list !== undefined && source !== undefined ? (
                      <Link
                        aria-label={`Open ${listShortLabel(list, masters)} in day view`}
                        className="aa-table-entity-link"
                        to={`/admin/day/${list.dateISO}`}
                        state={{ openListId: list.id }}
                      >
                        <span>
                          <span className="aa-table-entity-link-title">{source.primary}</span>
                          {source.secondary !== undefined && (
                            <span style={{ ...SUBLINE, display: 'block' }}>{source.secondary}</span>
                          )}
                        </span>
                        <ChevronRight size={14} strokeWidth={2.2} color={neutral.mist} aria-hidden />
                      </Link>
                    ) : (
                      <div style={{ fontWeight: 600 }}>List unavailable</div>
                    )}
                  </Td>
                  <Td mono nowrap>{list !== undefined ? dayMicroCap(list.dateISO) : '·'}</Td>
                  <CounterpartyCell name={invoiceAddresseeName({ masters, schedule, billing }, invoice)} layout={invoice.layout} split={invoice.split !== undefined} />
                  <Td mono bold nowrap align="right">{formatCurrency(invoice.total)}</Td>
                  <DeliveryCell pill={<DeliveryPill invoice={invoice} />} raisedISO={invoice.raisedAtISO} />
                  <Td nowrap>
                    {/* The row's keyboard handle, named in full (U6, U09); the row click stays for the mouse. */}
                    <TextAction size="sm" flush label={`View invoice ${invoice.invoiceNumber}`} onClick={() => onSelect(invoice.id)}>
                      View →
                    </TextAction>
                  </Td>
                  </ClickableRow>
                  </Fragment>
                )
              })}
            </tbody>
        </TableShell>
      )}
      </PageBody>
    </AdminPage>
  )
}

/** The table's columns: Delivery carries the day it was raised under it, Counterparty the layout, Number a credit note's or a non-standard invoice's kind. */
const INVOICE_COLUMNS = ['Number', 'Patient / booking', 'Anaesthetist', 'List', 'List date', 'Counterparty', 'Total', 'Delivery', ''] as const
const FLEX_COLUMNS: ReadonlySet<string> = new Set(['Patient / booking', 'Counterparty'])

/** A cell's quiet second line (mist, 11.5). */
const SUBLINE = { marginTop: 2, fontSize: 11.5, fontWeight: 400, color: neutral.mist } as const

/**
 * The number, with the kind as a pill beside it for anything but a standard invoice (a credit note, a
 * prepayment, an additional invoice). The column hugs the number: the pill and the lines under it wrap
 * rather than widen the table.
 */
function NumberLine({ number, kind }: { number: string; kind: Invoice['kind'] | 'creditNote' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px 6px', flexWrap: 'wrap' }}>
      <span style={{ whiteSpace: 'nowrap' }}>{number}</span>
      {kind !== 'standard' && (
        <Pill size="sm" shot="invoice-list-kind" data-kind={kind} style={{ fontFamily: fontFamily.ui }}>
          {kind === 'creditNote' ? CREDIT_LABELS.kind : INVOICE_KIND_LABEL[kind]}
        </Pill>
      )}
    </span>
  )
}

function PatientLines({ patientName, bookingLabel }: { patientName: string; bookingLabel: string }) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>{patientName}</div>
      <div className="mono" style={{ ...SUBLINE, whiteSpace: 'nowrap' }}>{bookingLabel}</div>
    </>
  )
}

/** How it went (the Delivery pill, with the send time), and under it the day it was raised (an invoice) or issued (a credit note), the full stamp in its title. */
function DeliveryCell({ pill, raisedISO, stampLabel = 'Raised' }: { pill: ReactNode; raisedISO: string | undefined; stampLabel?: 'Raised' | 'Issued' }) {
  return (
    <Td nowrap>
      {pill}
      <div data-shot="invoice-list-raised" title={raisedISO !== undefined ? `${stampLabel} ${stampText(raisedISO)}` : undefined} style={SUBLINE}>{`${stampLabel} ${raisedISO !== undefined ? shortDay(raisedISO) : '·'}`}</div>
    </Td>
  )
}

/** The party it goes to, a Split pill for a share, and the layout it prints in. */
function CounterpartyCell({ name, layout, split = false }: { name: string; layout: Invoice['layout']; split?: boolean }) {
  return (
    <Td>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {name}
        {split && <Pill size="sm" shot="invoice-list-split">Split</Pill>}
      </span>
      <div data-shot="invoice-list-layout" style={SUBLINE}>{`${layoutShortLabel(layout)} layout`}</div>
    </Td>
  )
}

/**
 * A credit note's row (catch-up Phase 39): kind "Credit note", "Credits
 * AA-2026-0007" under its number, the original's patient, anaesthetist and
 * List date, the party it goes to, its total as issued (never red) and how
 * the engine sent it. Opens the credit note's document.
 */
function CreditNoteRow({
  creditNote,
  original,
  patientName,
  bookingLabel,
  anaesthetistName,
  listDateISO,
  listSource,
  addressee,
  onOpen,
}: {
  creditNote: CreditNote
  original: Invoice
  patientName: string
  bookingLabel: string
  anaesthetistName: string | undefined
  listDateISO: string | undefined
  /** The List it was billed from, as the invoice rows name it. */
  listSource: { primary: string; secondary?: string } | undefined
  addressee: string
  onOpen: () => void
}) {
  return (
    <ClickableRow onOpen={onOpen} data-credit-note-id={creditNote.id}>
      <Td mono bold>
        <NumberLine number={creditNote.creditNoteNumber} kind="creditNote" />
        <div data-shot="invoice-list-credits" style={SUBLINE}>{CREDIT_LABELS.credits(original.invoiceNumber)}</div>
      </Td>
      <Td>
        <PatientLines patientName={patientName} bookingLabel={bookingLabel} />
      </Td>
      <Td bold nowrap><span title={anaesthetistName}>{anaesthetistName !== undefined ? drSurname(anaesthetistName) : 'Anaesthetist unavailable'}</span></Td>
      <Td nowrap>
        {listSource !== undefined ? (
          <>
            <div style={{ fontWeight: 600 }}>{listSource.primary}</div>
            {listSource.secondary !== undefined && <div style={SUBLINE}>{listSource.secondary}</div>}
          </>
        ) : (
          <div style={{ fontWeight: 600 }}>List unavailable</div>
        )}
      </Td>
      <Td mono nowrap>{listDateISO !== undefined ? dayMicroCap(listDateISO) : '·'}</Td>
      <CounterpartyCell name={addressee} layout={original.layout} />
      <Td mono bold nowrap align="right">{formatCurrency(creditNote.total)}</Td>
      <DeliveryCell pill={<DeliveryPill delivery={creditNote.delivery} />} raisedISO={creditNote.issuedAtISO} stampLabel="Issued" />
      <Td nowrap>
        <TextAction size="sm" flush label={`View credit note ${creditNote.creditNoteNumber}`} onClick={onOpen}>
          View →
        </TextAction>
      </Td>
    </ClickableRow>
  )
}

/** The invoice's delivery as the run stamped it (catch-up Phase 22; FT-08.4), on U3's `Pill`; a credit note's as the engine sent it (catch-up Phase 39). */
function DeliveryPill({ invoice, delivery: given }: { invoice?: Invoice; delivery?: Invoice['delivery'] }) {
  const delivery = invoice !== undefined ? invoice.delivery : given
  const label = invoiceDeliveryLabel(delivery)
  const text = label.short
  return (
    <Pill tone={label.tone} shot="invoice-list-delivery" data-delivery={delivery?.status ?? 'none'} title={label.text} style={{ whiteSpace: 'nowrap' }}>
      {text}
    </Pill>
  )
}
