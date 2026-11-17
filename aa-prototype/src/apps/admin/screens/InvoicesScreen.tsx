import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { Invoice } from '../../../domain/types'
import { invoiceDeliveryLabel, layoutShortLabel } from '../../../domain/billing'
import { Card, Eyebrow, PageHeader, Pill, TextAction } from '../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import type { Actor } from '../../../store'
import { billedLists, invoiceAddresseeName, invoiceCountsByList, isBackdropInvoice, useAppStore } from '../../../store'
import { dateTimeMicroCap, dayMicroCap, formatCurrency, hhmm, plural } from '../../../shared/format'
import { listShortLabel, listSourceLabels } from '../util'
import { InvoiceDocument } from './InvoiceDocument'

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
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)

  const invoices = useMemo(
    // The seeded historical backdrop (Phase 10) belongs to the anaesthetist money
    // views, not this office pipeline table — exclude it (the billing monitor does too).
    () => Object.values(billing.invoices).filter((i) => !isBackdropInvoice(i)).sort((a, b) => b.id.localeCompare(a.id)),
    [billing.invoices],
  )

  const rows = useMemo(
    () =>
      invoices.map((invoice) => {
        const booking = schedule.bookings[invoice.bookingId]
        const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
        const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
        const anaesthetist =
          list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
        const source = list !== undefined ? listSourceLabels(list, masters) : undefined
        return { invoice, booking, list, patient, anaesthetist, source }
      }),
    [invoices, schedule.bookings, schedule.lists, masters],
  )

  const billed = useMemo(() => billedLists({ schedule }), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])

  // The failure record lives on the case itself (the Phase 09 monitor's seam).
  const failedCases = useMemo(
    () => Object.values(billing.cases).filter((c) => c.status === 'failed'),
    [billing.cases],
  )

  if (selectedInvoiceId !== null && billing.invoices[selectedInvoiceId] !== undefined) {
    const invoice = billing.invoices[selectedInvoiceId]
    return (
      <div data-testid="invoice-detail-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1048, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: neutral.mist }}>
            <button onClick={() => onSelect(null)} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Invoices</button>
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
          {failedCases.map((c) => (
            <div key={c.id} style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
              <span className="mono">{c.bookingId}</span> · {c.failure?.message ?? 'Needs manual review.'}
            </div>
          ))}
          <span style={{ fontSize: 12, color: semantic.warning.onTint }}>Open Billing monitor to resolve and retry.</span>
        </div>
      )}

      {invoices.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>
          No invoices yet. Authorise a submitted list and the billing run raises its invoices immediately.
        </div>
      ) : (
        <TableShell testId="invoice-list-table-shell" label="Invoices" density="compact" minWidth={1380}>
            <thead>
              <tr>
                {['Number', 'Patient / booking', 'Anaesthetist', 'List', 'List date', 'Raised', 'Counterparty', 'Layout', 'Total', 'Delivery', ''].map((h, i) => (
                  <Th key={h === '' ? 'view' : h} align={i === 8 ? 'right' : 'left'} {...(i === 0 || i >= 4 ? { nowrap: true } : {})}>
                    {h}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ invoice, booking, list, patient, anaesthetist, source }) => {
                const patientName = booking === undefined ? 'Booking unavailable' : (patient?.name ?? 'Unknown patient')
                const bookingLabel =
                  booking === undefined
                    ? invoice.bookingId
                    : booking.scheduledTime !== undefined
                      ? `Booking ${booking.scheduledTime}`
                      : 'Booking time not set'
                return (
                  <ClickableRow key={invoice.id} onOpen={() => onSelect(invoice.id)}>
                  <Td mono bold nowrap>{invoice.invoiceNumber}</Td>
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
                )
              })}
            </tbody>
        </TableShell>
      )}
    </div>
  )
}

/** The invoice's delivery as the run stamped it (catch-up Phase 22; FT-08.4), on U3's `Pill`. */
function DeliveryPill({ invoice }: { invoice: Invoice }) {
  const label = invoiceDeliveryLabel(invoice.delivery)
  const text = label.short
  return (
    <Pill tone={label.tone} shot="invoice-list-delivery" data-delivery={invoice.delivery?.status ?? 'none'} title={label.text} style={{ whiteSpace: 'nowrap' }}>
      {text}
    </Pill>
  )
}
