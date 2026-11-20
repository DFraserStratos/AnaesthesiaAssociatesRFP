import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Printer, Mail, Clock, Send } from 'lucide-react'
import { accent, fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  additionalInvoicesFor,
  creditNoteForInvoice,
  creditRefusalFor,
  eventForInvoice,
  invoiceAddresseeName,
  invoiceLinesFor,
  invoiceStanding,
  originalInvoiceFor,
  raiseRefusal,
  rebillOriginFor,
  replacementsOf,
  resendInvoice,
  splitPartOf,
  paymentWeeksForPair,
  useAppStore,
} from '../../../store'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, CREDIT_MESSAGES, EVENT_LABELS, XERO_FLAG_COPY, XERO_FLAG_LABEL, XERO_FLAG_PAYOUT_LABEL, raisedByText, xeroFlagText } from '../../../shared/procedureEventCopy'
import { AdditionalInvoiceSheet } from '../../../shared/booking/AdditionalInvoiceForm'
import type { CreditFormMode } from '../../../shared/booking/CreditForm'
import { CreditSheet } from '../flows/CreditSheet'
import type { BookingLedgerPair, CreditNote, Invoice, InvoiceDelivery, InvoiceLineBtm } from '../../../domain/types'
import {
  GST_TREATMENT_CAPTION,
  OQ122_PILL,
  btmBreakdownText,
  formatMoney,
  invoiceDeliveryLabel,
  postalAddressLines,
  splitNoteText,
} from '../../../domain/billing'
import { Button, DemoBadge } from '../../../shared'
import { AgentBlock, DocLinesTable, DocMasthead, DocMeta, DocTotals, metaLabel } from '../../../shared/billing/docParts'
import { dateTimeMicroCap, drSurname, formatCurrency } from '../../../shared/format'
import { dayWithYear, hhmm } from '../../../domain/dateText'
import { DefList, DefRow, FormError, Notice, Pill, TextAction, TextField } from '../../../shared/ui'
import { lockStampText, lockViewFor, MIGRATED_LOCK_TEXT, partyKeyOf } from '../../../domain/billing/lock'
import { BILLS_LABEL, pricingLabel } from '../../../shared/contracts'
import { regenerateSummary, type RegenerateResult } from '../../../store/locks'
import { useDemoTriggerMemory } from '../../../shared/demoTriggers/memory'
import { HOLDING_ACCOUNT } from '../../../domain/billing/prepayHolding'
import { transferOfPair } from '../../../domain/billing/ledger'
import { handoffQueuedFor, openDivergenceFor, pairForInvoice } from '../../../store/ledgerSelectors'
import { toCents } from '../../../domain/billing/money'

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
  const procedureEvents = useAppStore((s) => s.schedule.procedureEvents)
  const standing = useAppStore((s) => invoiceStanding(s, invoiceId))

  const [error, setError] = useState<string | null>(null)

  const invoice = billing.invoices[invoiceId]
  // A locked invoice prints from its recipe (catch-up Phase 25; US-08.4.4): addressee, patient and supplier from the lock.
  // Pre-payment invoices (27's) and AA fee invoices (16's) have no lock and keep today's reads.
  const lockRecord = invoice !== undefined && invoice.kind === 'standard' ? billing.locks[invoice.bookingId] : undefined
  const lock = lockRecord !== undefined && lockRecord.state === 'locked' ? lockViewFor(lockRecord) : undefined

  const lines = useMemo(() => invoiceLinesFor({ billing }, invoiceId), [billing, invoiceId])
  // The invoice's ledger pair (catch-up Phase 36): its legs carry the money, whether or not Xero has it yet.
  const theCase = useMemo(() => pairForInvoice({ billing }, invoiceId), [billing, invoiceId])
  // A prepayment's money is held, then moved by its transfer (catch-up Phase 27a): the second state reads the transfer.
  const transfer = theCase?.kind === 'prePayment' ? transferOfPair(billing.transfers, theCase.id) : undefined


  if (invoice === undefined) return null
  const booking = bookingsRecord[invoice.bookingId]
  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const anaesthetist = list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
  const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
  // The name as at the run for a payer (catch-up Phase 21: `billedTo`), else the counterparty's.
  const addressee = lock?.addressees[partyKeyOf(invoice.counterparty)] ?? invoiceAddresseeName({ masters, schedule: { procedures: proceduresRecord } }, invoice)

  const isPatientLayout = invoice.layout === 'patient'
  // The supplier as at the run (catch-up Phase 22); an invoice from before it falls back to the List's anaesthetist.
  const supplier = invoice.supplier ?? lock?.supplier ?? (anaesthetist !== undefined ? { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name } : undefined)
  const careOf = lock !== undefined ? lock.patientName : patient?.name
  // The split's other shares, by number and addressee (US-08.2.3).
  const siblings = (invoice.lineage ?? [])
    .filter((l) => l.role === 'otherShareOfSplit')
    .map((l) => billing.invoices[l.invoiceId])
    .filter((i): i is Invoice => i !== undefined)
    .map((i) => ({ invoice: i, name: lock?.addressees[partyKeyOf(i.counterparty)] ?? invoiceAddresseeName({ masters, schedule: { procedures: proceduresRecord } }, i) }))
  // An additional invoice's original and its Procedure (catch-up Phase 38b), derived from its lineage.
  const originalLink = invoice.kind === 'additional' ? invoice.lineage?.find((l) => l.role === 'additionalTo') : undefined
  const original = originalLink !== undefined ? billing.invoices[originalLink.invoiceId] : undefined
  const firstProcedure = proceduresRecord[invoice.procedureIds?.[0] ?? '']
  const additionalProcedure = firstProcedure !== undefined ? procedureLabel(firstProcedure, masters.rvgGroups, 1) : 'the Procedure'
  const freeForm = invoice.kind === 'additional'
  const procedureDateISO = invoice.crossMatch?.procedureDateISO ?? list?.dateISO
  // Catch-up Phase 39: the invoice's standing, its credit note and what replaced it; a replacement's origin.
  const creditState = { schedule: { procedureEvents }, billing }

  const credited = standing === 'credited'
  const creditNote = creditNoteForInvoice(creditState, invoice.id)
  const replacements = creditNote !== undefined ? replacementsOf(creditState, invoice.id) : []
  const rebillOrigin = rebillOriginFor(creditState, invoice.id)
  const rebillCreditNote = rebillOrigin !== undefined ? creditNoteForInvoice(creditState, rebillOrigin.id) : undefined
  const splitPart = rebillOrigin !== undefined && rebillCreditNote?.cause === 'split' ? splitPartOf(creditState, invoice.id, rebillOrigin.id) : undefined

  function doSend(to?: string): boolean {
    const outcome = resendInvoice(useAppStore, actor, invoiceId, to !== undefined ? { to } : {})
    setError(outcome.ok ? null : outcome.message)
    return outcome.ok
  }

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
        <DocMasthead
          supplier={supplier}
          heading="TAX INVOICE"
          number={invoice.invoiceNumber}
          // The invoice's standing (catch-up Phase 39): derived, never stored; neutral, never red.
          badge={standing !== 'live' ? <Pill tone="neutral" size="sm" shot="invoice-standing" data-standing={standing} style={{ fontFamily: fontFamily.ui }}>{standing === 'credited' ? CREDIT_LABELS.credited : CREDIT_LABELS.pendingPill}</Pill> : undefined}
        >
            {/* A replacement names the invoice it rebills and the credit note (catch-up Phase 39). */}
            {/* A split's component (US-08.6.4): "Additional invoice · part 2 of 3 · replaces AA-2026-0007 · {Procedure}". */}
            {rebillOrigin !== undefined && splitPart !== undefined && (
              <div data-shot="invoice-split-part" data-part={splitPart.part} data-of={splitPart.of} style={{ marginTop: 6, fontSize: 12.5, color: neutral.slate }}>
                <Link to={`/admin/invoices/${rebillOrigin.id}`} style={{ color: neutral.slate }}>
                  {CREDIT_LABELS.splitPart(splitPart.part, splitPart.of, rebillOrigin.invoiceNumber, additionalProcedure)}
                </Link>
                {rebillCreditNote !== undefined && (
                  <>
                    {' '}
                    <Link to={`/admin/credit-notes/${rebillCreditNote.id}`} style={{ color: neutral.slate }}>{CREDIT_LABELS.creditedByParen(rebillCreditNote.creditNoteNumber)}</Link>
                  </>
                )}
              </div>
            )}
            {rebillOrigin !== undefined && splitPart === undefined && (
              <div data-shot="invoice-rebill-of" style={{ marginTop: 6, fontSize: 12.5, color: neutral.slate }}>
                <Link to={`/admin/invoices/${rebillOrigin.id}`} style={{ color: neutral.slate }}>{CREDIT_LABELS.rebills(rebillOrigin.invoiceNumber)}</Link>
                {rebillCreditNote !== undefined && (
                  <>
                    {' '}
                    <Link to={`/admin/credit-notes/${rebillCreditNote.id}`} style={{ color: neutral.slate }}>{CREDIT_LABELS.creditedByParen(rebillCreditNote.creditNoteNumber)}</Link>
                  </>
                )}
              </div>
            )}
            {/* An additional invoice names the original it relates to (catch-up Phase 38b; US-08.6.3 "Linked"). */}
            {original !== undefined && (
              <div data-shot="invoice-additional-of" style={{ marginTop: 6, fontSize: 12.5, color: neutral.slate }}>
                <Link to={`/admin/invoices/${original.id}`} style={{ color: neutral.slate }}>
                  {ADDITIONAL_INVOICE_COPY.relatesTo(original.invoiceNumber, additionalProcedure)}
                </Link>
                {list !== undefined && (
                  <>
                    {' · '}
                    <Link to={`/admin/day/${list.dateISO}/bookings/${invoice.bookingId}`} data-shot="invoice-additional-booking" style={{ color: neutral.slate }}>
                      {ADDITIONAL_INVOICE_COPY.openBooking}
                    </Link>
                  </>
                )}
              </div>
            )}
            {/* A Procedure priced at $0 (catch-up Phase 24): raised and delivered like any other, headed so. */}
            {invoice.noCharge === true && (
              <div data-shot="invoice-no-charge" style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <Pill tone="neutral">No charge</Pill>
              </div>
            )}
        </DocMasthead>

        {/* A credited invoice (catch-up Phase 39; US-07.3.2): never edited, so the credit and what replaced it are named here, all links. */}
        {creditNote !== undefined && <CreditedBanner creditNote={creditNote} replacements={replacements} />}

        <DocMeta dateLabel="Date raised" dateISO={invoice.raisedAtISO} procedureDateISO={procedureDateISO} caseReference={invoice.caseReference} />

        {/* Addressee + agency line */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={metaLabel}>Invoice to</div>
          <div style={{ fontSize: 15.5, fontWeight: 700 }}>{addressee}</div>
          {!isPatientLayout && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: neutral.slate }}>
              <span>{CREDIT_LABELS.attnAccounts}</span>
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
          {isPatientLayout && invoice.counterparty.kind === 'payer' && careOf !== undefined && (
            <div data-shot="invoice-care-of" style={{ fontSize: 12.5, color: neutral.slate }}>For the care of {careOf}</div>
          )}
        </div>

        {/* AA as agent (US-08.4.5; provisional, OQ-29) */}
        <AgentBlock supplierName={supplier?.name} agent={invoice.agent} />

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
            {...patientInvoiceNote(invoice.kind)}
          />
        )}

        {/* Lines: each prints the Procedure's invoice description (US-08.4.1, US-08.4.6), as the run snapshotted it. */}
        <DocLinesTable
          quantityHead={freeForm ? 'Qty' : 'Units'}
          unitAmount={freeForm}
          rows={lines.map((line) => ({
            key: line.id,
            kind: line.kind ?? 'fee',
            description: (
              <>
                <div>{line.description}</div>
                {line.btm !== undefined && <BtmBreakdown btm={line.btm} />}
              </>
            ),
            quantity: freeForm ? line.quantity : line.units,
            ...(line.unitAmount !== undefined ? { unitAmount: line.unitAmount } : {}),
            amount: line.amount,
          }))}
        />

        {/* The holder layout's cross-match strip (US-08.4.1). */}
        {!isPatientLayout && invoice.crossMatch !== undefined && (
          <div data-shot="invoice-cross-match" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: neutral.slate, background: neutral.bg, borderRadius: radius.ctl, padding: '8px 12px' }}>
            <CrossMatchItem label="Procedure date" value={dayWithYear(invoice.crossMatch.procedureDateISO)} />
            {invoice.crossMatch.surgeon !== undefined && <CrossMatchItem label="Surgeon" value={invoice.crossMatch.surgeon} plain />}
          </div>
        )}

        {/* Totals */}
        {/* A credited invoice is not due: its total reads Credited (catch-up Phase 39). */}
        <DocTotals subtotal={invoice.subtotal} gst={invoice.gst} totalLabel={credited ? CREDIT_LABELS.credited : 'Total due'} total={invoice.total} />

        {/* Two-state money (RFP): paid into the AA account, then disbursed to the
            anaesthetist. Two independent, separately-tracked states. */}
        {invoice.noCharge === true && theCase !== undefined && (
          <div data-shot="invoice-money-states" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <MoneyStatePill on label="No charge: nothing to pay or disburse" />
          </div>
        )}
        {/* Credited and never paid: nothing is awaited, nothing is disbursed. What was paid or disbursed before the credit still shows. */}
        {theCase !== undefined && invoice.noCharge !== true && credited && theCase.receivable.receivedAmount <= 0 && (theCase.payable?.disbursedAmount ?? 0) <= 0 && (
          <div data-shot="invoice-money-states" data-credited="true" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <Pill tone="neutral">{CREDIT_LABELS.credited}</Pill>
          </div>
        )}
        {theCase !== undefined && invoice.noCharge !== true && !(credited && theCase.receivable.receivedAmount <= 0 && (theCase.payable?.disbursedAmount ?? 0) <= 0) && (
          <div data-shot="invoice-money-states" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
            <MoneyStatePill
              on={theCase.receivable.paidInAtISO !== undefined}
              label={
                theCase.receivable.paidInAtISO !== undefined
                  ? `Paid into AA account ${dateTimeMicroCap(theCase.receivable.paidInAtISO)}`
                  : theCase.receivable.receivedAmount > 0
                    ? `Part paid ${formatCurrency(theCase.receivable.receivedAmount)} of ${formatCurrency(invoice.total)}`
                    : 'Awaiting payment'
              }
            />
            {theCase.kind === 'prePayment' ? (
              <MoneyStatePill
                on={transfer !== undefined && toCents(transfer.in.disbursedAmount) >= toCents(transfer.in.amount)}
                label={
                  transfer === undefined
                    ? `Held in the ${HOLDING_ACCOUNT.name}`
                    : toCents(transfer.in.disbursedAmount) >= toCents(transfer.in.amount)
                      ? 'Transferred and paid to the anaesthetist'
                      : transfer.in.disbursedAmount > 0
                        ? `Transferred, part paid ${formatCurrency(transfer.in.disbursedAmount)}`
                        : 'Transferred to the anaesthetist'
                }
              />
            ) : (
              <MoneyStatePill
                on={theCase.payable?.paidOutAtISO !== undefined}
                label={
                  theCase.payable?.paidOutAtISO !== undefined
                    ? `Disbursed to anaesthetist ${dateTimeMicroCap(theCase.payable.paidOutAtISO)}`
                    : (theCase.payable?.disbursedAmount ?? 0) > 0
                      ? `Part disbursed ${formatCurrency(theCase.payable?.disbursedAmount ?? 0)}`
                      : 'Not yet disbursed'
                }
              />
            )}
          </div>
        )}

        <div data-shot="invoice-gst-caption" style={{ fontSize: 10.5, color: neutral.mist, borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
          {GST_TREATMENT_CAPTION}
        </div>
      </div>

      <InvoiceInfoRail invoice={invoice} actor={actor} billingCase={theCase} siblings={siblings} error={error} onSend={doSend} credited={credited} />
    </div>
  )
}

function InvoiceInfoRail({
  invoice,
  actor,
  billingCase,
  siblings,
  error,
  onSend,
  credited,
}: {
  invoice: Invoice
  actor: Actor
  billingCase: BookingLedgerPair | undefined
  siblings: readonly { invoice: Invoice; name: string }[]
  error: string | null
  onSend: (to?: string) => boolean
  /** Credited in full (catch-up Phase 39): nothing is resent or added to it; its credit note and new invoices carry on. */
  credited: boolean
}) {
  const navigate = useNavigate()
  // Catch-up Phase 37: a hand-off waiting in the Xero sync queue, or a change made directly in Xero flagged by the poll.
  const queued = useAppStore((s) => (billingCase !== undefined ? handoffQueuedFor(s, billingCase.id) : undefined))
  const flag = useAppStore((s) => (billingCase !== undefined ? openDivergenceFor(s, billingCase.id) : undefined))
  const handoffFailed = queued !== undefined || flag !== undefined
  const accRecId = billingCase?.receivable.xeroAccRecId
  const accPayId = billingCase?.payable?.xeroAccPayId
  const handoffComplete = accRecId !== undefined
  // A prepayment's payable credits the AA Holding account; once transferred, its journal (catch-up Phase 27a).
  const collect = billingCase?.kind === 'prePayment'
  const journalNumber = useAppStore((s) => {
    if (!collect || billingCase === undefined) return undefined
    const transfer = transferOfPair(s.billing.transfers, billingCase.id)
    return transfer?.xeroJournalId !== undefined ? s.xero.journals[transfer.xeroJournalId]?.journalNumber : undefined
  })
  // The weeks this invoice's payable was paid out in (catch-up Phase 39a): its own payable, or a transferred prepayment's.
  const billing = useAppStore((s) => s.billing)
  const payoutWeeks = useMemo(() => {
    if (billingCase === undefined) return []
    const transfer = collect ? transferOfPair(billing.transfers, billingCase.id) : undefined
    return paymentWeeksForPair({ billing }, transfer?.id ?? billingCase.id)
  }, [billing, billingCase, collect])

  return (
    <aside
      data-testid="invoice-info-rail"
      aria-label="Invoice information and actions"
      style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12, width: 264 }}
    >
      <RailCard title="Delivery">
        <DeliveryState delivery={invoice.delivery} onSend={onSend} {...(credited ? { sendDisabledReason: CREDIT_MESSAGES.alreadyCredited } : {})} />
        <FormError message={error} />
      </RailCard>

      <LockedRecordCard invoice={invoice} />

      <AdditionalInvoicesCard invoice={invoice} actor={actor} credited={credited} />

      <CorrectInvoiceCard invoice={invoice} actor={actor} />

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

      {/* The invoice's ledger pair (catch-up Phase 36; US-08.3.1): both numbers, each with its Xero id or
          "Not yet in Xero". The pair stands whether or not Xero has it. */}
      <RailCard title="Ledger" warning={handoffFailed}>
        <div data-shot="invoice-ledger-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            data-testid="xero-handoff-status"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              color: flag !== undefined ? semantic.error.onTint : queued !== undefined ? semantic.warning.onTint : handoffComplete ? neutral.ink : neutral.slate,
            }}
          >
            <Clock size={15} aria-hidden style={{ marginTop: 1, flex: 'none' }} />
            <span style={{ fontSize: 12.5, lineHeight: '18px', fontWeight: 600 }}>
              {flag !== undefined
                ? `${flag.kind === 'paidAfterCredit' && flag.leg === 'payable' ? XERO_FLAG_PAYOUT_LABEL : XERO_FLAG_LABEL[flag.kind]} · ${XERO_FLAG_COPY.flagged}`
                : queued !== undefined
                  ? 'Waiting for Xero'
                  : handoffComplete
                    ? 'Mirrored in Xero'
                    : 'Not yet in Xero'}
            </span>
          </div>
          {queued !== undefined && (
            <div data-shot="invoice-waiting-for-xero" style={{ fontSize: 12.5, lineHeight: '18px', color: semantic.warning.onTint }}>
              {`The invoice and its ledger pair stand. Attempt ${queued.attempts} · next try `}
              <span className="mono">{hhmm(queued.nextAttemptAtISO)}</span>
              {'; the Xero sync queue retries it.'}
            </div>
          )}
          {flag !== undefined && billingCase !== undefined && (
            <div data-shot="invoice-xero-flag" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, lineHeight: '18px', color: semantic.error.onTint }}>
              <span>{`${xeroFlagText(flag.kind, flag.xeroShows.total, undefined, flag.leg)}. ${flag.kind === 'paidAfterCredit' ? XERO_FLAG_COPY.ledgerIgnoresPayment : XERO_FLAG_COPY.ledgerKeepsIssued}`}</span>
              <TextAction size="sm" flush shot="invoice-open-billing-monitor" onClick={() => navigate(`/admin/billing?list=${billingCase.listId}`)}>
                Resolve in the Billing monitor
              </TextAction>
            </div>
          )}
          {billingCase !== undefined && (
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
              <XeroReference label="Receivable" value={billingCase.receivable.number} testId="ledger-receivable-number" />
              {accRecId !== undefined ? <XeroReference label="Xero ACCREC" value={accRecId} testId="xero-accrec-reference" /> : null}
              <XeroReference label="Payable" value={billingCase.payable?.number ?? (invoice.noCharge === true ? 'None (no charge)' : 'None')} testId="ledger-payable-number" />
              {accPayId !== undefined ? <XeroReference label="Xero ACCPAY" value={accPayId} testId="xero-accpay-reference" /> : null}
              {collect && <XeroReference label="Payee" value={HOLDING_ACCOUNT.name} testId="xero-accpay-payee" />}
              {journalNumber !== undefined && <XeroReference label="Transfer journal" value={journalNumber} testId="xero-transfer-journal-reference" />}
            </dl>
          )}
          {/* The week each payment went out in (catch-up Phase 39a; US-10.2.7): cash, and any negative netted against it. */}
          {payoutWeeks.length > 0 && (
            <div data-shot="payment-week" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, lineHeight: '18px' }}>
              {payoutWeeks.map((w) => (
                <span key={w.runId} data-run-id={w.runId}>
                  {`Paid out in ${w.week ?? 'a payment run'} · `}
                  <span className="mono">{formatMoney(w.paid)}</span>
                  {w.netted > 0 && (
                    <>
                      {' · netted '}
                      <span className="mono">{formatMoney(w.netted)}</span>
                    </>
                  )}
                </span>
              ))}
            </div>
          )}
          {billingCase !== undefined && (
            <TextAction size="sm" flush shot="invoice-open-ledger" onClick={() => navigate(`/admin/ledger?pair=${billingCase.id}`)}>
              Open in the ledger
            </TextAction>
          )}
        </div>
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
function DeliveryState({
  delivery,
  onSend,
  caption,
  sendDisabledReason,
}: {
  delivery: InvoiceDelivery | undefined
  /** Resend and send to a typed email; omitted, the card only reports (a credit note, catch-up Phase 39). */
  onSend?: (to?: string) => boolean
  /** A quiet line under the badge ("Xero does not send credit notes; the engine sends it."). */
  caption?: string
  /** Why Resend and Send are off (a credited invoice, catch-up Phase 39), printed under them. */
  sendDisabledReason?: string
}) {
  const [to, setTo] = useState('')
  const label = invoiceDeliveryLabel(delivery)
  const sendOff = sendDisabledReason !== undefined
  const sendTyped = () => {
    if (onSend?.(to.trim()) === true) setTo('')
  }
  const captionLine = caption !== undefined ? <span data-shot="delivery-caption" style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>{caption}</span> : null
  const offLine = sendOff ? <span data-shot="invoice-send-disabled" role="note" style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>{sendDisabledReason}</span> : null
  const print = (
    <Button variant="secondary" onClick={() => window.print()} style={compactPrintButtonStyle}>
      <Printer size={15} aria-hidden /> Print
    </Button>
  )
  const emailField = (fieldLabel: string) => (
    <div data-testid="invoice-send-email" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TextField label={fieldLabel} value={to} onChange={setTo} type="email" placeholder="accounts@example.com" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="pill" onClick={sendTyped} disabled={sendOff || to.trim() === ''} style={compactEmailButtonStyle}>
          <Send size={15} aria-hidden /> Send
        </Button>
        {print}
      </div>
      {offLine}
    </div>
  )

  const fullPrint = (
    <Button variant="secondary" onClick={() => window.print()} style={compactFullButtonStyle}>
      <Printer size={15} aria-hidden /> Print
    </Button>
  )

  if (delivery === undefined) {
    return (
      <div data-shot="invoice-delivery" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Notice tone="neutral" icon={<Mail size={16} aria-hidden />}>{label.text}</Notice>
        {captionLine}
        {fullPrint}
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
        {captionLine}
        {delivery.sends.length > 1 && (
          <ol data-testid="invoice-send-history" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: neutral.slate }}>
            {delivery.sends.map((send, i) => (
              <li key={`${send.atISO}-${i}`}>
                <span className="mono">{dateTimeMicroCap(send.atISO)}</span> to {send.to}, by {send.by}
              </li>
            ))}
          </ol>
        )}
        {onSend !== undefined ? (
          <div data-testid="invoice-action-row" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <Button variant="pill" onClick={() => onSend()} disabled={sendOff} style={compactEmailButtonStyle}>
              <Send size={15} aria-hidden /> Resend
            </Button>
            {print}
          </div>
        ) : (
          fullPrint
        )}
        {onSend !== undefined && offLine}
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
        {captionLine}
        {onSend !== undefined ? emailField('Or email it to') : fullPrint}
      </div>
    )
  }
  return (
    <div data-shot="invoice-delivery" data-delivery="noAddress" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Notice tone="warning">{label.text}</Notice>
      {captionLine}
      {onSend !== undefined ? emailField('Email address') : fullPrint}
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

/**
 * "Locked record" (catch-up Phase 25; US-04.3.5, US-08.4.4): the recipe this
 * invoice was raised from, read through `lockViewFor`: the Contract as locked
 * with its settings and the range in force, who is billed, the price and its
 * basis per Procedure, the split as typed, the payee, who locked it and when.
 * Under it, the last Regenerate result ("identical", or the differences).
 */
function LockedRecordCard({ invoice }: { invoice: Invoice }) {
  const lock = useAppStore((s) => (invoice.kind === 'standard' ? s.billing.locks[invoice.bookingId] : undefined))
  const regenerated = useDemoTriggerMemory((m) => m.regenerated[invoice.id])
  if (lock === undefined || lock.state !== 'locked') return null
  const view = lockViewFor(lock)
  const mine = view.procedures.filter((p) => invoice.procedureIds === undefined || invoice.procedureIds.includes(p.procedureId))
  return (
    <RailCard title="Locked record">
      <div data-shot="invoice-locked-record" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {view.origin === 'migrated' && <span style={{ fontSize: 12.5, color: neutral.slate }}>{MIGRATED_LOCK_TEXT}</span>}
        {mine.map((p) => (
          <div key={p.procedureId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mine.length > 1 && p.label !== undefined && <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.ink }}>{p.label}</span>}
            <DefList gap={4}>
              {p.contractName !== undefined && (
                <DefRow label="Contract">
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontWeight: 600 }}>{p.contractName}</span>
                    <span style={{ fontSize: 12, color: neutral.slate }}>
                      <span className="mono">{p.contractAaCode}</span>
                      {p.pricing !== undefined ? ` · ${pricingLabel(p.pricing)}` : ''}
                      {p.billsTo !== undefined ? ` · bills ${BILLS_LABEL[p.billsTo].toLowerCase()}` : ''}
                    </span>
                  </span>
                </DefRow>
              )}
              {p.billedName !== undefined && <DefRow label="Billed to">{p.billedName}</DefRow>}
              <DefRow label="Price">
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span className="mono">{formatMoney(p.price)}{p.typed ? ' · typed' : ''}</span>
                  {p.basisText !== undefined && <span style={{ fontSize: 12, color: neutral.slate }}>{p.basisText}</span>}
                  {p.outOfGuideRange && <span><Pill tone="warning" size="sm" shot="invoice-locked-outside-range">Outside the range</Pill></span>}
                </span>
              </DefRow>
              <DefRow label="Split">{p.splitText}</DefRow>
            </DefList>
          </div>
        ))}
        <DefList gap={10}>
          <DefRow label="Paid to">{view.payeeName}</DefRow>
          <DefRow label="Priced on">{dayWithYear(view.pricingDateISO)}</DefRow>
        </DefList>
        <span style={{ fontSize: 12, color: neutral.slate }}>{lockStampText(view)}</span>
        {regenerated !== undefined && <RegenerateNotice result={regenerated} />}
      </div>
    </RailCard>
  )
}

/** The Regenerate result under the Locked record card: identical, or the differences (US-08.4.4). */
function RegenerateNotice({ result }: { result: RegenerateResult }) {
  if (!result.ok) return <Notice tone="warning" shot="invoice-regenerated">{result.reason}</Notice>
  if (result.comparison.identical) {
    return (
      <Notice tone="success" shot="invoice-regenerated" data-identical="true">
        {regenerateSummary(result)}
      </Notice>
    )
  }
  return (
    <Notice tone="warning" shot="invoice-regenerated" data-identical="false" title="Regenerated from locked data: differs">
      {result.comparison.differences.map((d) => (
        <span key={d.field} style={{ display: 'block' }}>{d.field}: stored {d.stored}, regenerated {d.regenerated}</span>
      ))}
    </Notice>
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

/** A linked document number, in the teal of every other invoice link (the rail's, the New invoices card's). */
function DocLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mono" style={{ color: accent.base, fontWeight: 600, textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

/**
 * "Credited in full by CN-2026-0001 on Tue 21 Jul 2026 · rebilled as
 * AA-2026-0013" (or "· replaced by" several), all links (catch-up Phase 39).
 * The invoice itself is never written: this is derived.
 */
export function CreditedBanner({ creditNote, replacements }: { creditNote: CreditNote; replacements: readonly Invoice[] }) {
  return (
    <div data-shot="invoice-credited-banner" data-credit-note-id={creditNote.id} style={{ fontSize: 13, lineHeight: '19px', color: neutral.ink, borderLeft: `3px solid ${neutral.lineStrong}`, padding: '2px 0 2px 12px' }}>
      {`${CREDIT_LABELS.creditedInFullBy} `}
      <DocLink to={`/admin/credit-notes/${creditNote.id}`}>{creditNote.creditNoteNumber}</DocLink>
      {` ${CREDIT_LABELS.on} ${dayWithYear(creditNote.issuedAtISO.slice(0, 10))}`}
      {replacements.length > 0 && (
        <>
          {` · ${replacements.length === 1 ? CREDIT_LABELS.rebilledAs : CREDIT_LABELS.replacedBy} `}
          {replacements.map((r, i) => (
            <span key={r.id}>
              {i > 0 ? ', ' : ''}
              <DocLink to={`/admin/invoices/${r.id}`}>{r.invoiceNumber}</DocLink>
            </span>
          ))}
        </>
      )}
    </div>
  )
}

/**
 * "Correct this invoice" (catch-up Phase 39; US-08.6.5, US-08.6.2): Credit
 * note and Credit in full and rebill on a live standard or additional invoice
 * (each of a split's per-party invoices on its own), both opening the side
 * sheet. Disabled with the sentence while a credit is pending or once it is
 * credited; on a prepayment invoice the refusal sentence is the caption and
 * there are no buttons. Teal text actions, as the Additional invoices card
 * above draws Create additional invoice; the sentence once, under the first
 * (`disabledReason`). Split into additional invoices checks this invoice
 * itself (a fee split's per-party invoices each split on their own).
 */
export function CorrectInvoiceCard({ invoice, actor }: { invoice: Invoice; actor: Actor }) {
  const refusal = useAppStore((s) => creditRefusalFor(s, { role: 'office' }, invoice.id)?.message ?? null)
  // Split into additional invoices (US-08.6.4): on a live standard invoice, the office's; this invoice's own refusal otherwise.
  const procedureId = invoice.procedureIds?.[0]
  const splitRefusal = useAppStore((s) => (procedureId !== undefined ? (creditRefusalFor(s, { role: 'office' }, invoice.id, 'split', { procedureId })?.message ?? null) : null))
  const [open, setOpen] = useState<CreditFormMode | null>(null)
  if (invoice.kind === 'prePayment') {
    return (
      <RailCard title={CREDIT_LABELS.correctCard}>
        <span data-shot="invoice-correct-refusal" style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>{refusal ?? CREDIT_LABELS.correctCaption}</span>
      </RailCard>
    )
  }
  const disabled = refusal !== null
  const splits = invoice.kind === 'standard' && procedureId !== undefined
  return (
    <RailCard title={CREDIT_LABELS.correctCard}>
      <div data-shot="invoice-correct" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>{CREDIT_LABELS.correctCaption}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <TextAction
            size="sm"
            disabled={disabled}
            disabledReason={refusal !== null ? <span data-shot="invoice-correct-refusal">{refusal}</span> : null}
            onClick={() => setOpen('credit')}
            shot="credit-note-button"
          >
            {CREDIT_LABELS.creditNote}
          </TextAction>
          <TextAction size="sm" disabled={disabled} onClick={() => setOpen('rebill')} shot="credit-rebill-button">
            {CREDIT_LABELS.creditRebill}
          </TextAction>
          {splits && (
            <TextAction
              size="sm"
              disabled={disabled || splitRefusal !== null}
              disabledReason={!disabled && splitRefusal !== null ? <span data-shot="split-combined-refusal">{splitRefusal}</span> : null}
              onClick={() => setOpen('split')}
              shot="split-combined-rail-button"
            >
              {CREDIT_LABELS.splitButton}
            </TextAction>
          )}
        </div>
      </div>
      <CreditSheet open={open !== null} invoiceId={invoice.id} {...(procedureId !== undefined ? { procedureId } : {})} actor={actor} mode={open ?? 'credit'} onClose={() => setOpen(null)} />
    </RailCard>
  )
}

// ---------------------------------------------------------------------------
// The credit note document (catch-up Phase 39; DM-24, US-08.6.2, US-08.6.5)
// ---------------------------------------------------------------------------

/**
 * A credit note on the invoice's own sheet: CREDIT NOTE, "Credits AA-2026-0007
 * in full", the party it goes to, the reason, who raised it, the mirrored
 * lines, "Total credited", the supplier and agent block. The rail: Delivery
 * (sent by the engine, "Simulated send"), the Negative invoice, the New
 * invoices, and the Xero card. No NHI. Amounts are as issued, never red.
 */
export function CreditNoteDocument({ creditNoteId }: { creditNoteId: string }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const xeroCreditNotes = useAppStore((s) => s.xero.creditNotes)
  const navigate = useNavigate()
  const cn = billing.creditNotes[creditNoteId]
  if (cn === undefined) return null
  const original = billing.invoices[cn.originalInvoiceId]
  const booking = schedule.bookings[cn.bookingId]
  const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
  const supplier = cn.supplier ?? original?.supplier
  const addressee = invoiceAddresseeName({ masters, schedule }, cn)
  const procedureDateISO = original?.crossMatch?.procedureDateISO ?? list?.dateISO
  const replacements = cn.replacementInvoiceIds.map((id) => billing.invoices[id]).filter((i): i is Invoice => i !== undefined)
  const negative = cn.negativeInvoiceId !== undefined ? billing.negativeInvoices[cn.negativeInvoiceId] : undefined
  const negativeTo = negative !== undefined && masters.anaesthetists[negative.anaesthetistId] !== undefined ? drSurname(masters.anaesthetists[negative.anaesthetistId]!.name) : 'the anaesthetist'
  const accRecCredit = cn.xero?.accRecCreditNoteId !== undefined ? xeroCreditNotes[cn.xero.accRecCreditNoteId] : undefined
  const accPayCredit = cn.xero?.accPayCreditNoteId !== undefined ? xeroCreditNotes[cn.xero.accPayCreditNoteId] : undefined

  return (
    <div data-testid="credit-note-workspace" style={{ display: 'grid', gridTemplateColumns: '760px 264px', alignItems: 'start', gap: 24, width: '100%', maxWidth: 1048, margin: '0 auto' }}>
      <div
        className="aa-invoice-doc"
        data-shot="credit-note-document"
        data-credit-note-id={cn.id}
        style={{ minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}
      >
        <DocMasthead supplier={supplier} heading={CREDIT_LABELS.documentHeading} number={cn.creditNoteNumber}>
          {original !== undefined && (
            <div data-shot="credit-note-credits" style={{ marginTop: 6, fontSize: 12.5, color: neutral.slate }}>
              <DocLink to={`/admin/invoices/${original.id}`}>{CREDIT_LABELS.creditsInFull(original.invoiceNumber)}</DocLink>
            </div>
          )}
        </DocMasthead>

        <DocMeta dateLabel={CREDIT_LABELS.dateIssued} dateISO={cn.issuedAtISO} procedureDateISO={procedureDateISO} caseReference={original?.caseReference} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={metaLabel}>{CREDIT_LABELS.creditToDoc}</div>
          <div data-shot="credit-note-addressee" style={{ fontSize: 15.5, fontWeight: 700 }}>{addressee}</div>
          {/* The holder layout's line, as the original printed it. */}
          {original !== undefined && original.layout !== 'patient' && <span style={{ fontSize: 12.5, color: neutral.slate }}>{CREDIT_LABELS.attnAccounts}</span>}
          {cn.billedTo?.email !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{cn.billedTo.email}</span>}
        </div>

        {/* A credit note is not a BCTI: the agency line without the OQ-29 marker. */}
        <AgentBlock supplierName={supplier?.name} agent={cn.agent} bcti={false} />

        <div data-shot="credit-note-reason" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '96px 1fr', columnGap: 12 }}>
            <dt style={{ color: neutral.slate }}>{CREDIT_LABELS.reason}</dt>
            <dd style={{ margin: 0, color: neutral.ink }}>{cn.reason}</dd>
          </dl>
          <span style={{ color: neutral.slate }}>{raisedByText(cn.issuedBy)}</span>
        </div>

        <DocLinesTable quantityHead="Qty" rows={cn.lines.map((line, i) => ({ key: String(i), description: line.description, ...(line.quantity !== undefined ? { quantity: line.quantity } : {}), amount: line.amount }))} />

        <DocTotals subtotal={cn.subtotal} gst={cn.gst} totalLabel={CREDIT_LABELS.totalCredited} total={cn.total} />

        <div data-shot="invoice-gst-caption" style={{ fontSize: 10.5, color: neutral.mist, borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
          {GST_TREATMENT_CAPTION}
        </div>
      </div>

      <aside data-testid="credit-note-info-rail" aria-label="Credit note information" style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12, width: 264 }}>
        <RailCard title="Delivery">
          <DeliveryState delivery={cn.delivery} caption={CREDIT_LABELS.deliveryCaption} />
        </RailCard>

        {negative !== undefined && (
          <RailCard title={CREDIT_LABELS.negativeInvoiceCard}>
            <div data-shot="negative-invoice-card" data-status={negative.status} style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>
              <span className="mono" style={{ fontWeight: 600 }}>{negative.number}</span>
              {` to ${negativeTo} · `}
              <span className="mono">{formatMoney(negative.amount)}</span>
              {' · '}
              {negative.status === 'toNet' ? CREDIT_LABELS.negativeNets(formatMoney(negative.recoveryDue)) : CREDIT_LABELS.negativeOffset}
            </div>
          </RailCard>
        )}

        <RailCard title={CREDIT_LABELS.newInvoices}>
          <div data-shot="credit-note-new-invoices" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
            {replacements.length === 0 && <span style={{ color: neutral.slate }}>{CREDIT_LABELS.newInvoicesNoneDoc}</span>}
            {replacements.map((r) => (
              <Link key={r.id} to={`/admin/invoices/${r.id}`} data-invoice-id={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: neutral.ink, textDecoration: 'none' }}>
                <span className="mono" style={{ fontWeight: 600, color: accent.base }}>{r.invoiceNumber}</span>
                <span className="mono">{formatMoney(r.total)}</span>
              </Link>
            ))}
          </div>
        </RailCard>

        <RailCard title={CREDIT_LABELS.xeroCard} warning={cn.xeroFailure !== undefined}>
          <div data-shot="credit-note-xero" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, lineHeight: '18px' }}>
            {cn.xeroFailure !== undefined ? (
              <>
                <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>{CREDIT_LABELS.xeroFailed}</span>
                <TextAction size="sm" flush shot="credit-note-open-billing-monitor" onClick={() => navigate(list !== undefined ? `/admin/billing?list=${list.id}` : '/admin/billing')}>
                  {CREDIT_LABELS.openBillingMonitor}
                </TextAction>
              </>
            ) : cn.xero === undefined ? (
              <span style={{ color: neutral.slate }}>{CREDIT_LABELS.xeroWaiting}</span>
            ) : (
              <>
                {accRecCredit !== undefined && <span className="mono" data-testid="xero-accreccredit">{`ACCRECCREDIT ${accRecCredit.creditNoteNumber}`}</span>}
                {accPayCredit !== undefined && <span className="mono" data-testid="xero-accpaycredit">{`ACCPAYCREDIT ${accPayCredit.creditNoteNumber}`}</span>}
                {cn.xero.accPayVoided && <span data-testid="xero-accpay-voided">{CREDIT_LABELS.xeroAccPayVoided}</span>}
              </>
            )}
          </div>
        </RailCard>
      </aside>
    </div>
  )
}

/**
 * The patient note on a patient-layout invoice (catch-up Phase 27): a
 * prepayment invoice is the prepaid amount, the price for the anaesthetic in
 * full; every other invoice is due on receipt (a prepaid Procedure is left off
 * it, so there is no balance to explain). The letters are Phase 41's.
 */
export function patientInvoiceNote(invoiceKind: Invoice['kind']): { badge: string; text: string } {
  if (invoiceKind === 'prePayment') {
    return { badge: 'Prepayment (before the procedure)', text: 'This invoice is the prepaid amount for the procedure. It is the price for the anaesthetic.' }
  }
  return { badge: 'Payment', text: 'Payment is due on receipt of this invoice.' }
}

/**
 * The Additional invoices rail card (catch-up Phase 38b; US-08.6.3 "Linked"):
 * on an original, its additional invoices (derived from their lineage, never
 * stored on it), each with number, total, status and who raised it, and
 * Create additional invoice for its Procedure; on an additional invoice, the
 * original it relates to and the event it was raised from.
 */
function AdditionalInvoicesCard({ invoice, actor, credited = false }: { invoice: Invoice; actor: Actor; credited?: boolean }) {
  const state = useAppStore((s) => s)
  const [open, setOpen] = useState<string | null>(null)
  if (invoice.kind === 'additional') {
    const original = originalInvoiceFor(state, invoice.id)
    const event = eventForInvoice(state, invoice.id)
    if (original === undefined) return null
    return (
      <RailCard title={ADDITIONAL_INVOICE_COPY.additionalInvoicesCard}>
        <div data-shot="invoice-additional-links" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
          <span style={{ color: neutral.slate }}>{ADDITIONAL_INVOICE_COPY.additionalTo(original.invoiceNumber)}</span>
          <Link to={`/admin/invoices/${original.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: neutral.ink, textDecoration: 'none' }}>
            <span className="mono" style={{ fontWeight: 600, color: accent.base }}>{original.invoiceNumber}</span>
            <span className="mono">{formatMoney(original.total)}</span>
          </Link>
          {event !== undefined && <span style={{ color: neutral.slate }}>{raisedByText(event.addedBy)}</span>}
        </div>
      </RailCard>
    )
  }
  const additional = additionalInvoicesFor(state, invoice.id)
  const procedureIds = (invoice.procedureIds ?? []).filter((id) => state.schedule.procedures[id] !== undefined)
  const raisable = procedureIds.filter((id) => raiseRefusal(state, { role: 'office' }, id) === null)
  if (additional.length === 0 && raisable.length === 0) return null
  return (
    <RailCard title={ADDITIONAL_INVOICE_COPY.additionalInvoicesCard}>
      <div data-shot="invoice-additional-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
        {additional.map((a) => {
          const ev = eventForInvoice(state, a.id)
          const pair = pairForInvoice(state, a.id)
          const paid = pair?.receivable.paidInAtISO !== undefined
          return (
            <Link key={a.id} to={`/admin/invoices/${a.id}`} data-invoice-id={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, color: neutral.ink, textDecoration: 'none' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span className="mono" style={{ fontWeight: 600, color: accent.base }}>{a.invoiceNumber}</span>
                <span className="mono">{formatMoney(a.total)}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: neutral.slate }}>
                <Pill size="sm" tone={paid ? 'success' : 'neutral'}>{paid ? 'Paid' : 'Unpaid'}</Pill>
                {ev !== undefined ? raisedByText(ev.addedBy) : ''}
              </span>
            </Link>
          )
        })}
        {/* A credited invoice takes nothing more: its additional invoices go on the invoice that replaced it. */}
        {raisable.map((id, i) => (
          <TextAction
            key={id}
            size="sm"
            onClick={() => setOpen(id)}
            disabled={credited}
            disabledReason={credited && i === 0 ? CREDIT_MESSAGES.alreadyCredited : null}
            shot="invoice-create-additional"
            style={{ alignSelf: 'flex-start' }}
          >
            {procedureIds.length > 1 ? `${EVENT_LABELS.createAdditional} · ${procedureLabel(state.schedule.procedures[id]!, state.masters.rvgGroups, procedureIds.indexOf(id) + 1)}` : EVENT_LABELS.createAdditional}
          </TextAction>
        ))}
        {open !== null && <AdditionalInvoiceSheet open procedureId={open} actor={actor} onClose={() => setOpen(null)} />}
      </div>
    </RailCard>
  )
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
