import { useMemo, useState } from 'react'
import { Printer, Mail, Upload, Clock } from 'lucide-react'
import { fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import { counterpartyName, invoiceLinesFor, markInvoiceEmailed, useAppStore } from '../../../store'
import type { PatientPaymentCategory } from '../../../domain/types'
import { GST_RATE } from '../../../domain/billing'
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
 * `patientPaymentCategory` in its wording. No design mockup covers an invoice,
 * so this extends the Design Language tokens: serif for the document voice,
 * mono for money, crimson only as the masthead identity.
 *
 * The `.aa-invoice-doc` node is what the print stylesheet isolates — the
 * action bar below it never prints. NHI never appears here (D9).
 */
export function InvoiceDocument({ invoiceId, actor }: InvoiceDocumentProps) {
  const billing = useAppStore((s) => s.billing)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)

  const [error, setError] = useState<string | null>(null)

  const invoice = billing.invoices[invoiceId]

  const lines = useMemo(() => invoiceLinesFor({ billing }, invoiceId), [billing, invoiceId])

  const procedures = useMemo(() => {
    const ids = new Set(lines.map((l) => l.procedureId).filter((id): id is string => id !== undefined))
    return [...ids].map((id) => proceduresRecord[id]).filter((p): p is NonNullable<typeof p> => p !== undefined)
  }, [lines, proceduresRecord])

  if (invoice === undefined) return null
  const card = cardsRecord[invoice.cardId]
  const list = card !== undefined ? listsRecord[card.listId] : undefined
  const anaesthetist = list !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
  const patient = card !== undefined ? masters.patients[card.patientId] : undefined
  const addressee = counterpartyName({ masters }, invoice.counterparty)

  const isPatientLayout = invoice.layout === 'patient'
  const isInsurerDirect = invoice.counterparty.kind === 'insurer'
  // A grouped invoice can span procedures: list every distinct reference and
  // note every distinct payment category, not just the first found.
  const billingReferences = [
    ...new Set(procedures.map((p) => p.billingReference).filter((r): r is string => r !== undefined && r.trim() !== '')),
  ]
  const paymentCategories: PatientPaymentCategory[] = (() => {
    const distinct = [...new Set(procedures.map((p) => p.patientPaymentCategory).filter((c): c is PatientPaymentCategory => c !== undefined))]
    return distinct.length > 0 ? distinct : ['selfFundedPostProcedure']
  })()
  // Pre-payment detail for the category note (deposit vs full, and this
  // invoice's kind — the pre-invoice vs the post-procedure balance).
  const prepaymentProc = procedures.find((p) => p.patientPaymentCategory === 'selfFundedPrepayment')
  const gstLabel = `GST (${GST_RATE * 100}%)`

  function doEmail() {
    const outcome = markInvoiceEmailed(useAppStore, actor, invoiceId)
    setError(outcome.ok ? null : outcome.message)
  }

  const metaLabel = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: neutral.mist }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      {/* ---- the printable document ---- */}
      <div
        className="aa-invoice-doc"
        style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}
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
          <div style={{ fontSize: 12.5, color: neutral.slate, fontStyle: 'italic' }}>
            Billed by Anaesthesia Associates as agent for {anaesthetist?.name ?? 'the anaesthetist'}.
          </div>
        </div>

        {/* Patient payment-category wording (patient layout only) — one note
            per distinct category when a grouped invoice spans several. */}
        {isPatientLayout && paymentCategories.map((category) => (
          <PaymentCategoryNote
            key={category}
            category={category}
            invoiceKind={invoice.kind}
            prepaymentType={prepaymentProc?.prepaymentDetail?.type}
            depositAmount={prepaymentProc?.prepaymentDetail?.depositAmount}
          />
        ))}

        {/* Lines */}
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...docHead, textAlign: 'left' }}>Description</th>
              <th style={{ ...docHead, textAlign: 'right', width: 70 }}>Units</th>
              <th style={{ ...docHead, textAlign: 'right', width: 110 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td style={docCell}>{line.description}</td>
                <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{line.units ?? ''}</td>
                <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{formatCurrency(line.amount)}</td>
              </tr>
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

        <div style={{ fontSize: 10.5, color: neutral.mist, borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
          GST at the NZ standard rate of {GST_RATE * 100}% is a demo assumption; the RFP describes only the GST component of amounts received. A discovery item for AA.
        </div>
      </div>

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
      )}

      {/* ---- action bar (never prints) ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {isInsurerDirect ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '6px 12px' }}>
              <Upload size={14} aria-hidden /> Present via {addressee} upload portal
            </span>
            <DemoBadge label="Portal stub" />
          </>
        ) : invoice.emailedAtISO !== undefined ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '6px 12px' }}>
              <Mail size={14} aria-hidden /> Emailed {hhmm(invoice.emailedAtISO)}
            </span>
            <DemoBadge label="Simulated send" />
          </>
        ) : (
          <Button variant="primary" onClick={doEmail}>
            <Mail size={15} aria-hidden style={{ marginRight: 6 }} /> Email invoice
          </Button>
        )}
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={15} aria-hidden style={{ marginRight: 6 }} /> Print
        </Button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: neutral.mist, marginLeft: 'auto' }}>
          <Clock size={13} aria-hidden /> Xero handoff pending · Phase 10
        </span>
      </div>
    </div>
  )
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
 * The three RFP patient categories drive recipient wording (D4/M5). The
 * insured-reimbursement note is deliberately distinct from an Insurer-route
 * invoice: this document goes to the PATIENT, who claims from their own
 * insurer; AA never sends it on.
 */
function PaymentCategoryNote({
  category,
  invoiceKind,
  prepaymentType,
  depositAmount,
}: {
  category: PatientPaymentCategory
  invoiceKind: 'standard' | 'prePayment'
  prepaymentType?: 'full' | 'split'
  depositAmount?: number
}) {
  const prepaymentText =
    invoiceKind === 'prePayment'
      ? prepaymentType === 'split'
        ? `This pre-procedure invoice is the agreed deposit${depositAmount !== undefined ? ` of ${formatCurrency(depositAmount)}` : ''}. Payment is required before the procedure proceeds; the balance is invoiced after the procedure. The timing of pre-payment against the billing trigger is a discovery point for AA.`
        : 'This pre-procedure invoice is the full estimated fee, payable before the procedure proceeds. The timing of pre-payment against the billing trigger is a discovery point for AA.'
      : prepaymentType === 'split'
        ? 'A pre-payment deposit has already been invoiced for this procedure. This invoice covers the balance.'
        : 'This procedure was pre-paid; this invoice covers any remaining balance.'
  const content =
    category === 'insuredReimbursement'
      ? {
          badge: 'Insured reimbursement',
          text: 'You may claim this invoice from your insurer. It is issued to you, and Anaesthesia Associates does not send it to your insurer.',
        }
      : category === 'selfFundedPrepayment'
        ? { badge: invoiceKind === 'prePayment' ? 'Pre-payment (pre-procedure)' : 'Pre-payment balance', text: prepaymentText }
        : {
            badge: 'Self funded',
            text: 'Payment is due on receipt of this invoice.',
          }
  return (
    <div style={{ background: neutral.sunken, borderRadius: radius.ctl, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: neutral.slate }}>{content.badge}</span>
      <span style={{ fontSize: 12.5, color: neutral.ink }}>{content.text}</span>
    </div>
  )
}
