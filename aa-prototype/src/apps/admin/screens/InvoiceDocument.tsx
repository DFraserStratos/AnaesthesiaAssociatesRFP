import { Fragment, useMemo, useState } from 'react'
import { invoiceLineGroups } from '../../../domain/billing/procedureStack'
import type { CSSProperties, ReactNode } from 'react'
import { Printer, Mail, Upload, Clock } from 'lucide-react'
import { fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import { counterpartyName, invoiceLinesFor, markInvoiceEmailed, useAppStore } from '../../../store'
import type { BillingCase, Invoice } from '../../../domain/types'
import { GST_RATE, procedureRequiresPrepayment } from '../../../domain/billing'
import { Button, DemoBadge, Logo } from '../../../shared'
import { dateTimeMicroCap, formatCurrency, hhmm } from '../../../shared/format'

interface InvoiceDocumentProps {
  invoiceId: string
  actor: Actor
}

/**
 * The on-screen invoice document (Phase 08; B6). Two layouts by recipient
 * class — contract holder vs patient — with the RFP's agency wording on both
 * ("Agent" has a specific GST interpretation, so invoices go out from the
 * Billing Engine, not Xero). The patient layout reflects the Procedure's
 * prepaid Contract in its note (`patientInvoiceNote`). No design mockup covers an invoice,
 * so this extends the Design Language tokens: serif for the document voice,
 * mono for money, crimson only as the masthead identity.
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
  const addressee = counterpartyName({ masters }, invoice.counterparty)

  const isPatientLayout = invoice.layout === 'patient'
  const isInsurerDirect = invoice.counterparty.kind === 'insurer'
  // A grouped invoice can span procedures: list every distinct reference.
  const billingReferences = [
    ...new Set(procedures.map((p) => p.billingReference).filter((r): r is string => r !== undefined && r.trim() !== '')),
  ]
  // The Procedure on a prepaid Contract, if any (INTERIM until Phase 27): the
  // patient note's prepayment wording follows it (catch-up Phase 20).
  const prepaymentProc = procedures.find((p) =>
    procedureRequiresPrepayment(p, p.governingContractId !== undefined ? masters.contracts[p.governingContractId] : undefined),
  )
  const gstLabel = `GST (${GST_RATE * 100}%)`

  function doEmail() {
    const outcome = markInvoiceEmailed(useAppStore, actor, invoiceId)
    setError(outcome.ok ? null : outcome.message)
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
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Logo height={26} />
            <div style={{ fontSize: 11.5, color: neutral.slate }}>Christchurch · New Zealand</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: fontFamily.serif, fontSize: 21, letterSpacing: '0.12em', color: neutral.ink }}>TAX INVOICE</div>
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{invoice.invoiceNumber}</div>
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: `1px solid ${neutral.line}`, borderBottom: `1px solid ${neutral.line}`, padding: '12px 0' }}>
          <div>
            <div style={metaLabel}>Date raised</div>
            <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{dateTimeMicroCap(invoice.raisedAtISO)}</div>
          </div>
          <div>
            <div style={metaLabel}>Anaesthetist</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>{anaesthetist?.name ?? '·'}</div>
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
          {!isPatientLayout && <div style={{ fontSize: 12.5, color: neutral.slate }}>Attn: Accounts</div>}
          {isPatientLayout && invoice.counterparty.kind === 'billableParty' && patient !== undefined && (
            <div style={{ fontSize: 12.5, color: neutral.slate }}>For the care of {patient.name}</div>
          )}
          {!isPatientLayout && billingReferences.length > 0 && (
            <div style={{ fontSize: 12.5, color: neutral.slate }}>
              Reference <span className="mono">{billingReferences.join(' · ')}</span>
            </div>
          )}
          <div data-shot="invoice-agency-line" style={{ fontSize: 12.5, color: neutral.slate, fontStyle: 'italic' }}>
            Billed by Anaesthesia Associates as agent for {anaesthetist?.name ?? 'the anaesthetist'}.
          </div>
        </div>

        {/* The patient note (patient layout only): prepayment wording when a
            Procedure is on a prepaid Contract, else payment on receipt. */}
        {isPatientLayout && (
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
            {/* One heading row per Procedure: its invoice description (catch-up Phase 20a, US-08.4.6). */}
            {invoiceLineGroups(lines, proceduresRecord).map((group, gi) => (
              <Fragment key={group.procedureId ?? `loose-${gi}`}>
                {group.heading !== undefined && (
                  <tr data-shot="invoice-procedure-heading">
                    <td colSpan={3} style={{ ...docCell, fontWeight: 600, color: neutral.ink, paddingTop: gi === 0 ? undefined : 14 }}>
                      {group.heading}
                    </td>
                  </tr>
                )}
                {group.lines.map((line) => (
                  <tr key={line.id}>
                    <td style={{ ...docCell, ...(group.heading !== undefined ? { paddingLeft: 18 } : {}) }}>{line.description}</td>
                    <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{line.units ?? ''}</td>
                    <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{formatCurrency(line.amount)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>

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
        {theCase !== undefined && theCase.accRecId !== undefined && (
          <div data-shot="invoice-money-states" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <StateChip
              on={theCase.paidInAtISO !== undefined}
              label={
                theCase.paidInAtISO !== undefined
                  ? `Paid into AA account ${dateTimeMicroCap(theCase.paidInAtISO)}`
                  : theCase.receivedAmount > 0
                    ? `Part paid ${formatCurrency(theCase.receivedAmount)} of ${formatCurrency(invoice.total)}`
                    : 'Awaiting payment'
              }
            />
            <StateChip
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

        <div style={{ fontSize: 10.5, color: neutral.mist, borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
          GST at the NZ standard rate of {GST_RATE * 100}% is a demo assumption; the RFP describes only the GST component of amounts received. A discovery item for AA.
        </div>
      </div>

      <InvoiceInfoRail
        invoice={invoice}
        billingCase={theCase}
        addressee={addressee}
        isInsurerDirect={isInsurerDirect}
        error={error}
        onEmail={doEmail}
      />
    </div>
  )
}

function InvoiceInfoRail({
  invoice,
  billingCase,
  addressee,
  isInsurerDirect,
  error,
  onEmail,
}: {
  invoice: Invoice
  billingCase: BillingCase | undefined
  addressee: string
  isInsurerDirect: boolean
  error: string | null
  onEmail: () => void
}) {
  const emailedAtISO = invoice.emailedAtISO
  const showEmailAction = !isInsurerDirect && emailedAtISO === undefined
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
        {isInsurerDirect ? (
          <>
            <RailStatus tone="warning" icon={<Upload size={16} aria-hidden />}>
              Present via {addressee} upload portal
            </RailStatus>
            <DemoBadge label="Simulated portal handoff" style={{ alignSelf: 'flex-start' }} />
          </>
        ) : emailedAtISO !== undefined ? (
          <>
            <RailStatus tone="success" icon={<Mail size={16} aria-hidden />}>
              Emailed {hhmm(emailedAtISO)}
            </RailStatus>
            <DemoBadge label="Simulated send" style={{ alignSelf: 'flex-start' }} />
          </>
        ) : null}

        <div data-testid="invoice-action-row" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          {showEmailAction && (
            <Button variant="primary" onClick={onEmail} style={compactEmailButtonStyle}>
              <Mail size={15} aria-hidden /> Email invoice
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => window.print()}
            style={showEmailAction ? compactPrintButtonStyle : compactFullButtonStyle}
          >
            <Printer size={15} aria-hidden /> Print
          </Button>
        </div>

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '9px 10px', fontSize: 12.5 }}>
            {error}
          </div>
        )}
      </RailCard>

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
            {handoffFailed ? 'Xero handoff failed' : handoffComplete ? 'ACCREC and ACCPAY created' : 'Xero handoff pending'}
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

function RailStatus({
  tone,
  icon,
  children,
}: {
  tone: 'success' | 'warning'
  icon: ReactNode
  children: ReactNode
}) {
  const colours = tone === 'success' ? semantic.success : semantic.warning
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '9px 10px',
        borderRadius: radius.ctl,
        background: colours.tint,
        color: colours.onTint,
        fontSize: 12.5,
        lineHeight: '18px',
        fontWeight: 600,
      }}
    >
      <span style={{ display: 'inline-flex', marginTop: 1, flex: 'none' }}>{icon}</span>
      <span>{children}</span>
    </div>
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

/** A two-state money chip: a filled tick when the state is reached, muted otherwise. */
function StateChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        padding: '5px 12px',
        background: on ? semantic.success.tint : neutral.sunken,
        color: on ? semantic.success.onTint : neutral.slate,
      }}
    >
      <span aria-hidden>{on ? '✓' : '○'}</span>
      {label}
    </span>
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
