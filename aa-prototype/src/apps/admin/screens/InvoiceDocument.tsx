import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Printer, Mail, Clock, Send } from 'lucide-react'
import { accent, fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import { invoiceAddresseeName, invoiceLinesFor, resendInvoice, useAppStore } from '../../../store'
import type { BillingCase, Invoice, InvoiceLineBtm } from '../../../domain/types'
import {
  GST_RATE,
  GST_TREATMENT_CAPTION,
  OQ122_PILL,
  OQ29_CAPTION,
  OQ29_PILL,
  agentStatement,
  btmBreakdownText,
  formatMoney,
  invoiceDeliveryLabel,
  postalAddressLines,
  procedureRequiresPrepayment,
  splitNoteText,
  supplierGstText,
} from '../../../domain/billing'
import { Button, DemoBadge, Logo } from '../../../shared'
import { dateTimeMicroCap, formatCurrency } from '../../../shared/format'
import { dayWithYear } from '../../../domain/dateText'
import { FormError, Notice, Pill, TextField } from '../../../shared/ui'

interface InvoiceDocumentProps {
  invoiceId: string
  actor: Actor
}

/**
 * The on-screen invoice document (Phase 08; B6; catch-up Phase 22). Issued in
 * the anaesthetist's name with their GST number, AA named as agent (US-08.4.5;
 * provisional, OQ-29), laid out as its Contract says (US-08.4.1: the holder's
 * layout carries the BTM breakdown, the cross-match strip and the Contract's
 * holder reference code; the patient's neither), every price GST exclusive
 * with GST at the foot (US-05.2.7). Everything printed is the run's snapshot
 * on the invoice and its lines, never the live masters. The rail shows how the
 * run sent it (US-08.4.2); the office only resends. No design mockup covers an
 * invoice, so this extends the Design Language tokens: serif for the document
 * voice, mono for money, crimson only as identity (the AA logo in the agent block).
 *
 * The `.aa-invoice-doc` node is what the print stylesheet isolates — the
 * information rail beside it never prints. NHI never appears here (D9).
 */
export function InvoiceDocument({ invoiceId, actor }: InvoiceDocumentProps) {
  const billing = useAppStore((s) => s.billing)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)

  const [error, setError] = useState<string | null>(null)

  const invoice = billing.invoices[invoiceId]

  const lines = useMemo(() => invoiceLinesFor({ billing }, invoiceId), [billing, invoiceId])
  const theCase = useMemo(
    () => Object.values(billing.cases).find((c) => c.invoiceId === invoiceId),
    [billing.cases, invoiceId],
  )

  const procedures = useMemo(() => {
    const ids = new Set(lines.map((l) => l.procedureId).filter((id): id is string => id !== undefined))
    return [...ids].map((id) => proceduresRecord[id]).filter((p): p is NonNullable<typeof p> => p !== undefined)
  }, [lines, proceduresRecord])

  if (invoice === undefined) return null
  const booking = bookingsRecord[invoice.bookingId]
  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const anaesthetist = list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
  const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
  // The name as at the run for a payer (catch-up Phase 21: `billedTo`), else the counterparty's.
  const addressee = invoiceAddresseeName({ masters, schedule: { procedures: proceduresRecord } }, invoice)

  const isPatientLayout = invoice.layout === 'patient'
  // The supplier as at the run (catch-up Phase 22); an invoice from before it falls back to the List's anaesthetist.
  const supplier = invoice.supplier ?? (anaesthetist !== undefined ? { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name } : undefined)
  // The split's other shares, by number and addressee (US-08.2.3).
  const siblings = (invoice.lineage ?? [])
    .map((l) => billing.invoices[l.invoiceId])
    .filter((i): i is Invoice => i !== undefined)
    .map((i) => ({ invoice: i, name: invoiceAddresseeName({ masters, schedule: { procedures: proceduresRecord } }, i) }))
  const procedureDateISO = invoice.crossMatch?.procedureDateISO ?? list?.dateISO
  // The Procedure on a prepaid Contract, if any (INTERIM until Phase 27): the
  // patient note's prepayment wording follows it (catch-up Phase 20).
  const prepaymentProc = procedures.find((p) =>
    procedureRequiresPrepayment(p.governingContractId !== undefined ? masters.contracts[p.governingContractId] : undefined),
  )
  const gstLabel = `GST (${GST_RATE * 100}%)`

  function doSend(to?: string): boolean {
    const outcome = resendInvoice(useAppStore, actor, invoiceId, to !== undefined ? { to } : {})
    setError(outcome.ok ? null : outcome.message)
    return outcome.ok
  }

  const metaLabel = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: neutral.mist }

  return (
    <div
      data-testid="invoice-detail-workspace"
      style={{
        display: 'grid',
        gridTemplateColumns: '760px 264px',
        alignItems: 'start',
        gap: 24,
        width: '100%',
        maxWidth: 1048,
        margin: '0 auto',
      }}
    >
      {/* ---- the printable document ---- */}
      <div
        className="aa-invoice-doc"
        style={{ minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}
      >
        {/* Masthead: the supplier, the anaesthetist (US-08.4.5) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div data-shot="invoice-supplier" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: fontFamily.serif, fontSize: 21, color: neutral.ink }}>{supplier?.name ?? 'The anaesthetist'}</div>
            {supplier !== undefined && (
              <div className={supplier.gstNumber !== undefined ? 'mono' : undefined} style={{ fontSize: 12, color: neutral.slate }}>
                {supplierGstText(supplier)}
              </div>
            )}
            <div style={{ fontSize: 11.5, color: neutral.slate }}>Christchurch · New Zealand</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: fontFamily.serif, fontSize: 21, letterSpacing: '0.12em', color: neutral.ink }}>TAX INVOICE</div>
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{invoice.invoiceNumber}</div>
            {/* A Procedure priced at $0 (catch-up Phase 24): raised and delivered like any other, headed so. */}
            {invoice.noCharge === true && (
              <div data-shot="invoice-no-charge" style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <Pill tone="neutral">No charge</Pill>
              </div>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: `1px solid ${neutral.line}`, borderBottom: `1px solid ${neutral.line}`, padding: '12px 0' }}>
          <div>
            <div style={metaLabel}>Date raised</div>
            <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{dateTimeMicroCap(invoice.raisedAtISO)}</div>
          </div>
          <div>
            <div style={metaLabel}>Procedure date</div>
            <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{procedureDateISO !== undefined ? dayWithYear(procedureDateISO) : '·'}</div>
          </div>
          <div>
            <div style={metaLabel}>Case reference</div>
            <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{invoice.caseReference}</div>
            <div style={{ fontSize: 10.5, color: neutral.mist }}>internal reference only</div>
          </div>
        </div>

        {/* Addressee + agency line */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={metaLabel}>Invoice to</div>
          <div style={{ fontSize: 15.5, fontWeight: 700 }}>{addressee}</div>
          {!isPatientLayout && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: neutral.slate }}>
              <span>Attn: Accounts</span>
              {invoice.holderReference !== undefined && (
                <span data-shot="invoice-holder-reference">
                  Your reference <span className="mono" style={{ color: neutral.ink }}>{invoice.holderReference}</span>
                </span>
              )}
            </div>
          )}
          {/* The payer's email, or postal address in NZ Post layout, as at the run (catch-up Phase 21). */}
          {invoice.billedTo !== undefined && (
            <div data-shot="invoice-billed-to" style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>
              {invoice.billedTo.email !== undefined && <span className="mono" style={{ fontSize: 12 }}>{invoice.billedTo.email}</span>}
              {invoice.billedTo.email === undefined && invoice.billedTo.postalAddress !== undefined &&
                postalAddressLines(invoice.billedTo.postalAddress).map((line) => <span key={line}>{line}</span>)}
            </div>
          )}
          {isPatientLayout && invoice.counterparty.kind === 'payer' && patient !== undefined && (
            <div style={{ fontSize: 12.5, color: neutral.slate }}>For the care of {patient.name}</div>
          )}
        </div>

        {/* AA as agent (US-08.4.5; provisional, OQ-29) */}
        <div
          data-shot="invoice-agent-block"
          style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '12px 14px' }}
        >
          <Logo height={20} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div data-shot="invoice-agency-line" style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>
              {agentStatement(supplier?.name ?? 'the anaesthetist', invoice.agent)}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Pill size="sm" style={{ flex: 'none' }}>{OQ29_PILL}</Pill>
              <span style={{ fontSize: 11, lineHeight: '16px', color: neutral.mist }}>{OQ29_CAPTION}</span>
            </div>
          </div>
        </div>

        {/* A split share's note (US-08.2.3): the other shares, each linked. */}
        {invoice.split !== undefined && siblings.length > 0 && (
          <div data-shot="invoice-split-note" style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate, borderLeft: `3px solid ${neutral.lineStrong}`, padding: '2px 0 2px 12px' }}>
            {splitNoteText(invoice.split.feeExGst, siblings.map((s) => ({ partyName: s.name, invoiceNumber: s.invoice.invoiceNumber })))}
          </div>
        )}

        {/* The patient note (patient layout only): prepayment wording when a
            Procedure is on a prepaid Contract, else payment on receipt. */}
        {isPatientLayout && invoice.noCharge !== true && (
          <PatientInvoiceNote
            {...patientInvoiceNote(prepaymentProc !== undefined, invoice.kind, prepaymentProc?.prepaymentDetail?.type, prepaymentProc?.prepaymentDetail?.depositAmount)}
          />
        )}

        {/* Lines */}
        <table data-shot="invoice-lines" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...docHead, textAlign: 'left' }}>Description</th>
              <th style={{ ...docHead, textAlign: 'right', width: 70 }}>Units</th>
              <th style={{ ...docHead, textAlign: 'right', width: 110 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Each line prints the Procedure's invoice description (US-08.4.1, US-08.4.6), as the run snapshotted it. */}
            {lines.map((line) => (
              <tr key={line.id} data-line-kind={line.kind ?? 'fee'}>
                <td style={docCell}>
                  <div>{line.description}</div>
                  {line.btm !== undefined && <BtmBreakdown btm={line.btm} />}
                </td>
                <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{line.units ?? ''}</td>
                <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* The holder layout's cross-match strip (US-08.4.1). */}
        {!isPatientLayout && invoice.crossMatch !== undefined && (
          <div data-shot="invoice-cross-match" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: neutral.slate, background: neutral.bg, borderRadius: radius.ctl, padding: '8px 12px' }}>
            <CrossMatchItem label="Procedure date" value={dayWithYear(invoice.crossMatch.procedureDateISO)} />
            {invoice.crossMatch.surgeon !== undefined && <CrossMatchItem label="Surgeon" value={invoice.crossMatch.surgeon} plain />}
            {invoice.crossMatch.hospitalRef !== undefined && <CrossMatchItem label="Hospital reference" value={invoice.crossMatch.hospitalRef} />}
          </div>
        )}

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          <TotalRow label={gstLabel} value={formatCurrency(invoice.gst)} />
          <div style={{ display: 'flex', gap: 24, borderTop: `2px solid ${neutral.ink}`, paddingTop: 6, marginTop: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Total due</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Two-state money (RFP): paid into the AA account, then disbursed to the
            anaesthetist. Two independent, separately-tracked states. */}
        {invoice.noCharge === true && theCase?.accRecId !== undefined && (
          <div data-shot="invoice-money-states" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <MoneyStatePill on label="No charge: nothing to pay or disburse" />
          </div>
        )}
        {theCase !== undefined && theCase.accRecId !== undefined && invoice.noCharge !== true && (
          <div data-shot="invoice-money-states" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <MoneyStatePill
              on={theCase.paidInAtISO !== undefined}
              label={
                theCase.paidInAtISO !== undefined
                  ? `Paid into AA account ${dateTimeMicroCap(theCase.paidInAtISO)}`
                  : theCase.receivedAmount > 0
                    ? `Part paid ${formatCurrency(theCase.receivedAmount)} of ${formatCurrency(invoice.total)}`
                    : 'Awaiting payment'
              }
            />
            <MoneyStatePill
              on={theCase.disbursedAtISO !== undefined}
              label={
                theCase.disbursedAtISO !== undefined
                  ? `Disbursed to anaesthetist ${dateTimeMicroCap(theCase.disbursedAtISO)}`
                  : theCase.disbursedAmount > 0
                    ? `Part disbursed ${formatCurrency(theCase.disbursedAmount)}`
                    : 'Not yet disbursed'
              }
            />
          </div>
        )}

        <div data-shot="invoice-gst-caption" style={{ fontSize: 10.5, color: neutral.mist, borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
          {GST_TREATMENT_CAPTION}
        </div>
      </div>

      <InvoiceInfoRail invoice={invoice} billingCase={theCase} siblings={siblings} error={error} onSend={doSend} />
    </div>
  )
}

function InvoiceInfoRail({
  invoice,
  billingCase,
  siblings,
  error,
  onSend,
}: {
  invoice: Invoice
  billingCase: BillingCase | undefined
  siblings: readonly { invoice: Invoice; name: string }[]
  error: string | null
  onSend: (to?: string) => boolean
}) {
  const handoffFailed = billingCase?.handoffFailure !== undefined
  const handoffComplete = billingCase?.accRecId !== undefined
  // The InvoiceNumbers stored on the Xero records (US-09.1.1), not derived here.
  const accRecNumber = useAppStore((s) =>
    billingCase?.accRecId !== undefined ? s.xero.accRecs[billingCase.accRecId]?.invoiceNumber : undefined,
  )
  const accPayNumber = useAppStore((s) =>
    billingCase?.accPayId !== undefined ? s.xero.accPays[billingCase.accPayId]?.invoiceNumber : undefined,
  )

  return (
    <aside
      data-testid="invoice-info-rail"
      aria-label="Invoice information and actions"
      style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12, width: 264 }}
    >
      <RailCard title="Delivery">
        <DeliveryState invoice={invoice} onSend={onSend} />
        <FormError message={error} />
      </RailCard>

      {siblings.length > 0 && (
        <RailCard title="Related invoices">
          <div data-shot="invoice-related" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: neutral.slate }}>The other shares of this split fee.</div>
            {siblings.map((s) => (
              <Link key={s.invoice.id} to={`/admin/invoices/${s.invoice.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, color: neutral.ink, textDecoration: 'none' }}>
                <span>
                  <span className="mono" style={{ fontWeight: 600, color: accent.base }}>{s.invoice.invoiceNumber}</span> {s.name}
                </span>
                <span className="mono">{formatMoney(s.invoice.total)}</span>
              </Link>
            ))}
          </div>
        </RailCard>
      )}

      <RailCard title="Xero handoff" warning={handoffFailed}>
        <div
          data-testid="xero-handoff-status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            color: handoffFailed ? semantic.warning.onTint : handoffComplete ? neutral.ink : neutral.slate,
          }}
        >
          <Clock size={15} aria-hidden style={{ marginTop: 1, flex: 'none' }} />
          <span style={{ fontSize: 12.5, lineHeight: '18px', fontWeight: 600 }}>
            {handoffFailed ? 'Xero handoff failed' : handoffComplete ? (invoice.noCharge === true ? 'ACCREC created at $0.00, no ACCPAY' : 'ACCREC and ACCPAY created') : 'Xero handoff pending'}
          </span>
        </div>

        {handoffFailed ? (
          <div style={{ fontSize: 12.5, lineHeight: '18px', color: semantic.warning.onTint }}>
            The invoice remains valid. Resolve and retry in Billing monitor.
          </div>
        ) : handoffComplete ? (
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
            <XeroReference label="ACCREC" value={accRecNumber ?? invoice.invoiceNumber} testId="xero-accrec-reference" />
            {accPayNumber !== undefined && (
              <XeroReference label="ACCPAY" value={accPayNumber} testId="xero-accpay-reference" />
            )}
          </dl>
        ) : null}
      </RailCard>
    </aside>
  )
}

/**
 * The Delivery card's body (catch-up Phase 22; US-08.4.2, FT-08.4): what the
 * billing run did with the invoice. Emailed (success, the send history, a
 * Resend); To post (neutral, a print view, OQ-122's provisional pill, and Send
 * once an email is typed); no invoice address (warning, an email field and a
 * teal Send). Print is always there. No posting or email integration.
 */
function DeliveryState({ invoice, onSend }: { invoice: Invoice; onSend: (to?: string) => boolean }) {
  const [to, setTo] = useState('')
  const delivery = invoice.delivery
  const label = invoiceDeliveryLabel(delivery)
  const sendTyped = () => {
    if (onSend(to.trim())) setTo('')
  }
  const print = (
    <Button variant="secondary" onClick={() => window.print()} style={compactPrintButtonStyle}>
      <Printer size={15} aria-hidden /> Print
    </Button>
  )
  const emailField = (fieldLabel: string) => (
    <div data-testid="invoice-send-email" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TextField label={fieldLabel} value={to} onChange={setTo} type="email" placeholder="accounts@example.com" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="pill" onClick={sendTyped} disabled={to.trim() === ''} style={compactEmailButtonStyle}>
          <Send size={15} aria-hidden /> Send
        </Button>
        {print}
      </div>
    </div>
  )

  if (delivery === undefined) {
    return (
      <div data-shot="invoice-delivery" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Notice tone="neutral" icon={<Mail size={16} aria-hidden />}>{label.text}</Notice>
        <Button variant="secondary" onClick={() => window.print()} style={compactFullButtonStyle}>
          <Printer size={15} aria-hidden /> Print
        </Button>
      </div>
    )
  }
  if (delivery.status === 'sent') {
    return (
      <div data-shot="invoice-delivery" data-delivery="sent" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Notice tone="success" icon={<Mail size={16} aria-hidden />}>
          <span style={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{label.text}</span>
        </Notice>
        <DemoBadge label="Simulated send" style={{ alignSelf: 'flex-start' }} />
        {delivery.sends.length > 1 && (
          <ol data-testid="invoice-send-history" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: neutral.slate }}>
            {delivery.sends.map((send, i) => (
              <li key={`${send.atISO}-${i}`}>
                <span className="mono">{dateTimeMicroCap(send.atISO)}</span> to {send.to}, by {send.by}
              </li>
            ))}
          </ol>
        )}
        <div data-testid="invoice-action-row" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <Button variant="pill" onClick={() => onSend()} style={compactEmailButtonStyle}>
            <Send size={15} aria-hidden /> Resend
          </Button>
          {print}
        </div>
      </div>
    )
  }
  if (delivery.status === 'toPost') {
    return (
      <div data-shot="invoice-delivery" data-delivery="toPost" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Notice tone="neutral" icon={<Printer size={16} aria-hidden />} title={label.text}>
          {delivery.address.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </Notice>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DemoBadge label="Simulated posting" />
          <Pill size="sm">{OQ122_PILL}</Pill>
        </div>
        {emailField('Or email it to')}
      </div>
    )
  }
  return (
    <div data-shot="invoice-delivery" data-delivery="noAddress" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Notice tone="warning">{label.text}</Notice>
      {emailField('Email address')}
    </div>
  )
}

/** One holder-layout line's B/T/M breakdown (US-08.4.1), worded by `btmBreakdownText`. */
function BtmBreakdown({ btm }: { btm: InvoiceLineBtm }) {
  return (
    <div data-shot="invoice-btm-breakdown" className="mono" style={{ fontSize: 11.5, color: neutral.slate, marginTop: 3 }}>
      {btmBreakdownText(btm)}
    </div>
  )
}

function CrossMatchItem({ label, value, plain = false }: { label: string; value: string; plain?: boolean }) {
  return (
    <span>
      {label} <span className={plain ? undefined : 'mono'} style={{ color: neutral.ink, fontWeight: 600 }}>{value}</span>
    </span>
  )
}

function RailCard({
  title,
  warning = false,
  children,
}: {
  title: string
  warning?: boolean
  children: ReactNode
}) {
  return (
    <section
      style={{
        ...railCardStyle,
        ...(warning
          ? {
              background: semantic.warning.tint,
              borderColor: `${semantic.warning.solid}55`,
            }
          : {}),
      }}
    >
      <h2 style={{ margin: 0, fontSize: 13, lineHeight: '18px', fontWeight: 700 }}>{title}</h2>
      {children}
    </section>
  )
}

function XeroReference({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div>
      <dt style={railMetaLabel}>{label}</dt>
      <dd data-testid={testId} className="mono" style={{ margin: '3px 0 0', fontSize: 12, lineHeight: '17px', color: neutral.ink, overflowWrap: 'anywhere' }}>
        {value}
      </dd>
    </div>
  )
}

/** A two-state money pill (U3's `Pill`): a tick when the state is reached, a circle otherwise. */
function MoneyStatePill({ on, label }: { on: boolean; label: string }) {
  return (
    <Pill tone={on ? 'success' : 'neutral'} leading={<span aria-hidden>{on ? '✓' : '○'}</span>}>
      {label}
    </Pill>
  )
}

const railCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  background: neutral.surface,
  border: `1px solid ${neutral.line}`,
  borderRadius: radius.card,
}

const compactButtonStyle: CSSProperties = {
  minHeight: 40,
  height: 40,
  padding: '0 12px',
  borderRadius: radius.ctl,
  fontSize: 13,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
}

const compactEmailButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  flex: '1 1 auto',
  minWidth: 0,
}

const compactPrintButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  flex: '0 0 84px',
}

const compactFullButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  width: '100%',
}

const railMetaLabel: CSSProperties = {
  fontSize: 10,
  lineHeight: '14px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: neutral.mist,
}

const docCell = {
  padding: '9px 8px',
  fontSize: 13,
  borderBottom: `1px solid ${neutral.line}`,
  verticalAlign: 'top' as const,
}

const docHead = {
  ...docCell,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: neutral.mist,
  borderBottom: `1.5px solid ${neutral.lineStrong}`,
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <span style={{ fontSize: 12.5, color: neutral.slate }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, minWidth: 110, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/**
 * The patient note on a patient-layout invoice (catch-up Phase 20): a Booking
 * with a Procedure on a prepaid Contract gives the prepayment wording (the
 * pre-procedure invoice, or the balance after it); otherwise payment is due on
 * receipt. The insured-reimbursement wording went with the payment category
 * (US-11.4.2 Retired).
 */
export function patientInvoiceNote(
  requiresPrepayment: boolean,
  invoiceKind: 'standard' | 'prePayment',
  prepaymentType?: 'full' | 'split',
  depositAmount?: number,
): { badge: string; text: string } {
  if (!requiresPrepayment) return { badge: 'Payment', text: 'Payment is due on receipt of this invoice.' }
  if (invoiceKind === 'prePayment') {
    return {
      badge: 'Prepayment (before the procedure)',
      text:
        prepaymentType === 'split'
          ? `This pre-procedure invoice is the agreed first payment${depositAmount !== undefined ? ` of ${formatCurrency(depositAmount)}` : ''}. Payment is required before the procedure proceeds; the balance is invoiced after the procedure.`
          : 'This pre-procedure invoice is the full fee, payable before the procedure proceeds.',
    }
  }
  return {
    badge: 'Prepayment balance',
    text:
      prepaymentType === 'split'
        ? 'A first payment has already been invoiced for this procedure. This invoice covers the balance.'
        : 'This procedure was prepaid; this invoice covers any remaining balance.',
  }
}

function PatientInvoiceNote({ badge, text }: { badge: string; text: string }) {
  const content = { badge, text }
  return (
    <div style={{ background: neutral.sunken, borderRadius: radius.ctl, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: neutral.slate }}>{content.badge}</span>
      <span style={{ fontSize: 12.5, color: neutral.ink }}>{content.text}</span>
    </div>
  )
}
