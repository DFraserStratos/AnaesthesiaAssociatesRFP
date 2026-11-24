import { Fragment, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { CreditNote, Invoice } from '../../../domain/types'
import { invoiceDeliveryLabel, layoutShortLabel } from '../../../domain/billing'
import { Card, Eyebrow, PageHeader, Pill, TextAction, TextField } from '../../../shared/ui'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../components/Pager'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import type { Actor } from '../../../store'
import { billedLists, invoiceAddresseeName, invoiceCountsByList, invoiceStanding, isBackdropCreditNote, isBackdropInvoice, originalInvoiceFor, rebillOriginFor, useAppStore, openBillingExceptions } from '../../../store'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, PRE_POST_OP_COPY } from '../../../shared/procedureEventCopy'
import { dateTimeMicroCap, dayMicroCap, formatCount, formatCurrency, hhmm, plural } from '../../../shared/format'
import { listShortLabel, listSourceLabels } from '../util'
import { InvoiceDocument } from './InvoiceDocument'
import { PrepaymentApprovalStrip } from '../components/PrepaymentApprovalStrip'

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
 * The invoices raised by the billing run (Phase 08; B6). A table of every
 * invoice with how the run delivered it (emailed, to post, or no address), a recently-billed strip, and an inline
 * document view — inline rather than a dialog, because the print stylesheet
 * isolates the `.aa-invoice-doc` node and a fixed-position Dialog ancestor
 * would break `position: absolute` print isolation.
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

  const billed = useMemo(() => billedLists({ schedule }), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])

  // Billing-run exceptions not yet resolved (catch-up Phase 36; the Phase 09 monitor's seam).
  const failedCases = useMemo(() => openBillingExceptions({ billing }), [billing])
  // At scale the strip names the first few; the monitor holds the rest.
  const failedShown = failedCases.slice(0, 5)

  if (selectedInvoiceId !== null && billing.invoices[selectedInvoiceId] !== undefined) {
    const invoice = billing.invoices[selectedInvoiceId]
    return (
      <div data-testid="invoice-detail-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1048, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: neutral.mist }}>
            <button type="button" className="aa-ctl" onClick={() => onSelect(null)} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Invoices</button>
            <span style={{ color: neutral.lineStrong }}> / </span>
            <span className="mono">{invoice.invoiceNumber}</span>
          </div>
        </div>
        <InvoiceDocument key={selectedInvoiceId} invoiceId={selectedInvoiceId} actor={actor} />
      </div>
    )
  }

  return (
    <div data-testid="invoice-list-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <PageHeader
        size="admin"
        title="Invoices"
        subStyle={{ maxWidth: 720 }}
        sub={
          <>
            Raised and sent by the billing run when a list is authorised: one invoice per billable party per Booking, and
            one per share where a procedure&apos;s fee is split on the Booking. Each is emailed, or marked to post, as its
            party&apos;s delivery says.
          </>
        }
      />

      {/* Prepayment invoices waiting on an admin, with the approval switch (catch-up Phase 27, US-06.3.1). */}
      <PrepaymentApprovalStrip actor={actor} />

      {/* Recently billed lists */}
      {billed.length > 0 && (
        <Card style={{ background: neutral.sunken, padding: '12px 16px', gap: 6 }}>
          <Eyebrow as="h2">Recently billed</Eyebrow>
          {billed.slice(0, 6).map((l) => (
            <div key={l.id} style={{ fontSize: 12.5, color: neutral.ink, display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span>{listShortLabel(l, masters)} · {dayMicroCap(l.dateISO)}</span>
              <span style={{ color: neutral.mist }}>
                billed {hhmm(l.billedAtISO)} · {plural(invoiceCountByList[l.id] ?? 0, 'invoice')}
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Billing exceptions are resolved through the monitor workflow. */}
      {failedCases.length > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: semantic.warning.onTint }}>
            {plural(failedCases.length, 'booking')} raised a billing exception
          </span>
          {failedShown.map((c) => (
            <div key={c.id} style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
              <span className="mono">{c.bookingId}</span> · {c.message}
            </div>
          ))}
          {failedCases.length > failedShown.length && <span style={{ fontSize: 12.5, color: semantic.warning.onTint }}>{`and ${formatCount(failedCases.length - failedShown.length)} more`}</span>}
          <span style={{ fontSize: 12, color: semantic.warning.onTint }}>Open Billing monitor to resolve and retry.</span>
        </div>
      )}

      {invoices.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>
          No invoices yet. Authorise a submitted list and the billing run raises its invoices immediately.
        </div>
      ) : (
        <>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <TextField
            label="Find by invoice number or payer"
            size="compact"
            fill="surface"
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            shot="invoices-search"
            width={320}
          />
          {matching.length > pageSize && <Pager total={matching.length} size={pageSize} page={page} onPage={setPage} shot="invoices-pager" />}
        </div>
        {matching.length === 0 && shownLooseCreditNotes.length === 0 ? (
          <div style={{ fontSize: 13, color: neutral.mist }}>No invoice matches that number or payer.</div>
        ) : (
        <TableShell testId="invoice-list-table-shell" label="Invoices" density="compact" minWidth={1460}>
            <thead>
              <tr>
                {['Number', 'Kind', 'Patient / booking', 'Anaesthetist', 'List', 'List date', 'Raised', 'Counterparty', 'Layout', 'Total', 'Delivery', ''].map((h, i) => (
                  <Th key={h === '' ? 'view' : h} align={h === 'Total' ? 'right' : 'left'} {...(i <= 1 || i >= 5 ? { nowrap: true } : {})}>
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
                  <Td mono bold nowrap>
                    {invoice.invoiceNumber}
                    {/* An additional invoice names its original (catch-up Phase 38b). */}
                    {invoice.kind === 'additional' && originalOf(invoice) !== undefined && (
                      <div data-shot="invoice-list-additional-to" style={{ marginTop: 2, fontSize: 11.5, fontWeight: 400, color: neutral.mist }}>{ADDITIONAL_INVOICE_COPY.additionalTo(originalOf(invoice)!.invoiceNumber)}</div>
                    )}
                    {/* Its event lines (catch-up Phase 39b): "+2 event lines". */}
                    {(eventLineCounts.get(invoice.id) ?? 0) > 0 && (
                      <div data-shot="invoice-list-event-lines" style={{ marginTop: 2, fontSize: 11.5, fontWeight: 400, color: neutral.mist }}>{PRE_POST_OP_COPY.eventLines(eventLineCounts.get(invoice.id)!)}</div>
                    )}
                    {/* A replacement names the invoice it rebills (catch-up Phase 39). */}
                    {rebillOrigin !== undefined && (
                      <div data-shot="invoice-list-rebills" style={{ marginTop: 2, fontSize: 11.5, fontWeight: 400, color: neutral.mist }}>{CREDIT_LABELS.rebills(rebillOrigin.invoiceNumber)}</div>
                    )}
                    {/* Its standing (catch-up Phase 39): derived, neutral. */}
                    {standing !== 'live' && (
                      <div style={{ marginTop: 4 }}>
                        <Pill size="sm" shot="invoice-list-standing" data-standing={standing} style={{ fontFamily: fontFamily.ui }}>{standing === 'credited' ? CREDIT_LABELS.credited : CREDIT_LABELS.pendingPill}</Pill>
                      </div>
                    )}
                  </Td>
                  <Td nowrap><span data-shot="invoice-list-kind" data-kind={invoice.kind}>{INVOICE_KIND_LABEL[invoice.kind]}</span></Td>
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
                          <span className="mono" style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: neutral.mist, whiteSpace: 'nowrap' }}>
                            {bookingLabel}
                          </span>
                        </span>
                        <ChevronRight size={14} strokeWidth={2.2} color={neutral.mist} aria-hidden />
                      </Link>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600 }}>{patientName}</div>
                        <div className="mono" style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist, whiteSpace: 'nowrap' }}>{bookingLabel}</div>
                      </>
                    )}
                  </Td>
                  <Td bold>{anaesthetist?.name ?? 'Anaesthetist unavailable'}</Td>
                  <Td>
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
                            <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: neutral.mist }}>{source.secondary}</span>
                          )}
                        </span>
                        <ChevronRight size={14} strokeWidth={2.2} color={neutral.mist} aria-hidden />
                      </Link>
                    ) : (
                      <div style={{ fontWeight: 600 }}>List unavailable</div>
                    )}
                  </Td>
                  <Td mono nowrap>{list !== undefined ? dayMicroCap(list.dateISO) : '·'}</Td>
                  <Td mono nowrap>{dateTimeMicroCap(invoice.raisedAtISO)}</Td>
                  <Td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {invoiceAddresseeName({ masters, schedule, billing }, invoice)}
                      {invoice.split !== undefined && <Pill size="sm" shot="invoice-list-split">Split</Pill>}
                    </span>
                  </Td>
                  <Td>{layoutShortLabel(invoice.layout)}</Td>
                  <Td mono bold nowrap align="right">{formatCurrency(invoice.total)}</Td>
                  <Td>
                    <DeliveryPill invoice={invoice} />
                  </Td>
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
        {matching.length > pageSize && <Pager total={matching.length} size={pageSize} page={page} onPage={setPage} />}
        </>
      )}
    </div>
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
      <Td mono bold nowrap>
        {creditNote.creditNoteNumber}
        <div data-shot="invoice-list-credits" style={{ marginTop: 2, fontSize: 11.5, fontWeight: 400, color: neutral.mist }}>{CREDIT_LABELS.credits(original.invoiceNumber)}</div>
      </Td>
      <Td nowrap><span data-shot="invoice-list-kind" data-kind="creditNote">{CREDIT_LABELS.kind}</span></Td>
      <Td>
        <div style={{ fontWeight: 600 }}>{patientName}</div>
        <div className="mono" style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist, whiteSpace: 'nowrap' }}>{bookingLabel}</div>
      </Td>
      <Td bold>{anaesthetistName ?? 'Anaesthetist unavailable'}</Td>
      <Td>
        {listSource !== undefined ? (
          <>
            <div style={{ fontWeight: 600 }}>{listSource.primary}</div>
            {listSource.secondary !== undefined && <div style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist }}>{listSource.secondary}</div>}
          </>
        ) : (
          <div style={{ fontWeight: 600 }}>List unavailable</div>
        )}
      </Td>
      <Td mono nowrap>{listDateISO !== undefined ? dayMicroCap(listDateISO) : '·'}</Td>
      <Td mono nowrap>{dateTimeMicroCap(creditNote.issuedAtISO)}</Td>
      <Td>{addressee}</Td>
      <Td>{layoutShortLabel(original.layout)}</Td>
      <Td mono bold nowrap align="right">{formatCurrency(creditNote.total)}</Td>
      <Td>
        <DeliveryPill delivery={creditNote.delivery} />
      </Td>
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
