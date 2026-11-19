import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronLeft, ExternalLink, Info } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DemoSurface } from './DemoSurface'
import {
  OFFICE_ACTOR,
  XERO_STAFF_ACTOR,
  bankLineMatchRefusal,
  deliverPaymentWebhook,
  xeroBalanceOf,
  disbursePayable,
  matchBankLineInXero,
  unmatchedBankLines,
  useAppStore,
} from '../../store'
import { dateTimeMicroCap, dayMicroCap, formatCurrency, hhmm } from '../../shared/format'
import { HELD_UNTIL_AUTHORISED, LEAVES_ONLY_BY_SYSTEM, RELEASE_TRIGGER_CAPTION } from '../../domain/billing/prepayHolding'
import { transferOfPair } from '../../domain/billing/ledger'
import { toCents } from '../../domain/billing/money'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import { APP_CONFIG } from '../../shell/appConfig'
import { xeroInvoicePairViews, type XeroBillPaymentView, type XeroInvoicePairView } from './xeroPairView'
import { recordFeePaymentFor } from '../../shared/demoTriggers'
import { aaFeeMonthLabel } from '../../domain/billing/aaFee'
import { AA_HOLDING_ACCOUNT } from '../../domain/billing/prepayment'
import { BCTI_DOCUMENT_NAME, GST_NUMBER_NOT_HELD, OQ29_CAPTION, OQ29_PILL, formatGstNumber } from '../../domain/billing/invoicePresentation'
import { Button, Card, EmptyState, FormError, Notice, Pill, ResultLine, SelectField } from '../../shared/ui'
import { TableShell as KitTableShell, Td as KitTd, Th as KitTh } from '../../shared/table'
import type { XeroAccRec, XeroBankLine, XeroContact, XeroRemittance } from '../../domain/types'

/**
 * The simulated Xero organisation. Contacts are a read-only reference table;
 * invoice routes expose the ACCREC/ACCPAY pair and the Billing Engine link that
 * creates it. The link context is visibly separate so patient identity is
 * never presented as a Xero contact field.
 */
export function DemoXero() {
  const xero = useAppStore((s) => s.xero)
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const settings = useAppStore((s) => s.settings)
  const audit = useAppStore((s) => s.audit)
  const location = useLocation()
  const { accRecId } = useParams<{ accRecId: string }>()

  const contacts = useMemo(
    () => Object.values(xero.contacts).sort((a, b) => a.contactNumber.localeCompare(b.contactNumber)),
    [xero.contacts],
  )
  const pairs = useMemo(
    () => xeroInvoicePairViews({ xero, billing, schedule, masters, audit }),
    [xero, billing, schedule, masters, audit],
  )
  const selectedPair = useMemo(
    () => (accRecId !== undefined ? pairs.find((pair) => pair.accRec.id === accRecId) : undefined),
    [accRecId, pairs],
  )

  if (accRecId !== undefined && selectedPair === undefined) {
    return <Navigate to="/demo/xero/invoices" replace />
  }

  const invoicesTab = location.pathname.startsWith('/demo/xero/invoices')
  const bankTab = location.pathname.startsWith('/demo/xero/bank')
  const unmatchedCount = unmatchedBankLines({ xero }).length
  const vs = settings.volumeStory
  const activePatientContacts = contacts.filter((c) => c.type !== 'organisation' && !c.archived).length
  const archivedContacts = contacts.filter((c) => c.archived).length

  return (
    <DemoSurface
      title="Xero simulation"
      subtitle="The simulated Xero organisation that mirrors the Billing Engine's ledger: contacts, the ACCREC and ACCPAY pairs and their payment state. All fake and in-browser. The apps read the ledger, AA's system of record; Xero is the receivables and banking service behind it."
      maxWidth={1440}
      subtitleMaxWidth={820}
    >
      {settings.xeroOutage !== undefined && (
        <Notice tone="warning" title="Xero API unavailable to the Billing Engine (simulated)." shot="xero-outage-banner">
          <div>
            Payments and bill payments still land here; the engine's calls wait in its queue.
            <span style={{ display: 'block', marginTop: 2 }}>
              Unavailable since <span className="mono">{dateTimeMicroCap(settings.xeroOutage.sinceISO)}</span>
            </span>
          </div>
        </Notice>
      )}
      <Callout tone="info" title="No personal information in Xero" shot="xero-nhi-policy">
        Xero holds no NHI and no other personal information about a patient or a person paying for one.
        Each such contact is known to Xero only by a hidden internal ID in ContactNumber, shown as its
        name, and by Xero's own ContactID, which link each transaction back to its invoice in the billing
        system. Patient lookup happens in the billing system, never in Xero. Confirmed with AA.
      </Callout>
      <Callout tone="warn" title="Duplicate-invoice-number-prevention (mandated Xero org setting)" shot="xero-duplicate-number-policy">
        The RFP requires the Xero organisation setting that prevents duplicate invoice numbers, so the
        Billing Engine's unique InvoiceNumber can be the reliable matching key for remittance
        reconciliation, which Xero's bank reconciliation and remittance add-on do, not the Billing Engine
        (see{' '}<Link to="/demo/xero/bank" style={inlineLinkStyle}>Bank reconciliation</Link>). Configuring this
        in the AA Xero org is an open item to confirm in discovery.
      </Callout>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}` }}>
        <TabLink active={!invoicesTab && !bankTab} to="/demo/xero">Contacts ({contacts.length})</TabLink>
        <TabLink active={invoicesTab} to="/demo/xero/invoices">Invoices ({pairs.length})</TabLink>
        <TabLink active={bankTab} to="/demo/xero/bank">Bank reconciliation ({unmatchedCount} unmatched)</TabLink>
      </div>

      {bankTab ? (
        <BankReconciliation />
      ) : !invoicesTab ? (
        <ContactsTable contacts={contacts} />
      ) : selectedPair !== undefined ? (
        selectedPair.kind === 'aaFee' ? <FeePairDetail key={selectedPair.accRec.id} pair={selectedPair} /> : <PairDetail key={selectedPair.accRec.id} pair={selectedPair} />
      ) : (
        <InvoicesTable pairs={pairs} />
      )}

      {selectedPair === undefined && !bankTab && (
        <Callout tone="info" title="Contact archiving & volume">
          Xero has a soft limit of about {vs.softLimit.toLocaleString('en-NZ')} contacts. AA raises roughly
          {' '}{vs.invoicesPerYear.toLocaleString('en-NZ')} invoices a year, and about {vs.oneTimePct}% of patients are one-time,
          so a nightly job archives individual contacts once fully paid and inactive (the window is a setting
          in Master data). Active contacts: <strong className="mono">{vs.activeContacts.toLocaleString('en-NZ')}</strong>
          {' '}(narrated scale) · in this demo {activePatientContacts} active and {archivedContacts} archived individual
          contact{archivedContacts === 1 ? '' : 's'}. Scale is narrated with counters, not simulated as records.
        </Callout>
      )}
    </DemoSurface>
  )
}

function ContactsTable({ contacts }: { contacts: XeroContact[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        Organisational contacts (hospitals, insurers, surgeons, groups and the anaesthetist payees)
        persist and never archive. Patient and billable-party contacts carry only the hidden internal ID:
        no name, no NHI and no other personal information. Open an invoice pair to see the identifiers
        used for that transaction.
      </div>
      {contacts.length === 0 ? (
        <EmptyNote>No Xero contacts yet. Authorise a list (or approve and send a pre-payment invoice) to hand a pair off.</EmptyNote>
      ) : (
        <TableShell minWidth={720}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            <thead>
              <tr>{['ContactID', 'ContactNumber', 'Name', 'Type', 'Archived'].map((h) => <Th key={h}>{h}</Th>)}</tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.contactId} data-shot={`xero-contact-${contact.contactNumber.toLowerCase()}`}>
                  <Td mono>{contact.contactId}</Td>
                  <Td mono>{contact.contactNumber}</Td>
                  <Td>{contact.name}</Td>
                  <Td><ContactTypeChip type={contact.type} /></Td>
                  <Td>{contact.archived ? <span style={{ color: neutral.mist }}>Archived</span> : 'Active'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  )
}

function InvoicesTable({ pairs }: { pairs: XeroInvoicePairView[] }) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        Each row mirrors one ledger pair in the Billing Engine: an ACCREC (money in, to the payer) paired with a DRAFT
        then AUTHORISED ACCPAY (owed to the anaesthetist). The two records are linked by the ledger pair, not
        natively in Xero, and carries visibly similar numbers (the ACCPAY suffixed <span className="mono">-P</span>).
        Select any row to inspect both records and their linked identifiers.
      </div>
      {pairs.length === 0 ? (
        <EmptyNote>No invoices handed off yet.</EmptyNote>
      ) : (
        <TableShell testId="xero-invoice-table-shell">
          <table data-testid="xero-invoice-table" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr>
                <Th compact wrap>ACCREC / ACCPAY</Th>
                <Th compact wrap>Payer</Th>
                <Th compact wrap>Payee</Th>
                <Th compact wrap right>ACCREC<br />Due / received</Th>
                <Th compact wrap right>ACCPAY<br />Authorised / disbursed</Th>
                <Th compact wrap>Status</Th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair) => (
                <tr
                  key={pair.accRec.id}
                  className="aa-clickable-table-row"
                  data-testid={`xero-invoice-row-${pair.accRec.id}`}
                  onClick={() => navigate(`/demo/xero/invoices/${pair.accRec.id}`)}
                >
                  <Td compact mono clip>
                    <Link
                      to={`/demo/xero/invoices/${pair.accRec.id}`}
                      aria-label={`View pair ${pair.accRec.invoiceNumber}`}
                      onClick={(event) => event.stopPropagation()}
                      style={recordLinkStyle}
                    >
                      {pair.accRec.invoiceNumber}
                    </Link>
                    {pair.kind === 'aaFee' ? (
                      <span style={{ display: 'block', marginTop: 3 }}><AaFeeChip /></span>
                    ) : (
                      <span
                        title="ACCPAY bill number"
                        style={{ display: 'block', marginTop: 2, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {pair.accPay?.billNumber ?? '·'}
                      </span>
                    )}
                  </Td>
                  <Td compact clip>
                    <TruncatedText value={pair.accRec.contact?.name ?? pair.accRec.contactId} />
                  </Td>
                  <Td compact clip>
                    <TruncatedText value={pair.accPay?.contact?.name ?? pair.accPay?.contactId ?? '·'} />
                  </Td>
                  <Td compact mono right>
                    <StackedAmount label="Amount due" value={formatCurrency(pair.accRec.amountDue)} />
                    <StackedAmount label="Received" value={formatCurrency(pair.accRec.amountReceived)} secondary />
                  </Td>
                  <Td compact mono right>
                    <StackedAmount
                      label="ACCPAY authorised"
                      value={pair.accPay !== undefined ? formatCurrency(pair.accPay.amountAuthorised) : '·'}
                    />
                    <StackedAmount
                      label="Disbursed"
                      value={pair.accPay !== undefined ? formatCurrency(pair.accPay.amountDisbursed) : '·'}
                      secondary
                    />
                  </Td>
                  <Td compact clip><StatusChip recStatus={pair.accRec.status} payStatus={pair.accPay?.status} fee={pair.kind === 'aaFee'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  )
}

function PairDetail({ pair }: { pair: XeroInvoicePairView }) {
  const accPayId = pair.accPay?.id ?? pair.ledger.accPayId
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null)
  const fullySettled = pair.accRec.status === 'paid' && pair.accPay?.status === 'paid'
  const voided = pair.accRec.status === 'voided'
  const canOpenWebAccount =
    pair.accRec.amountReceived > 0 &&
    pair.ledger.anaesthetistId === APP_CONFIG.web.persona.anaesthetistId

  const heldInHolding = pair.accPay?.held === true
  // Once transferred, the money has left the AA Holding account: nothing to try from here (catch-up Phase 27a).
  const transferred = useAppStore((s) => heldInHolding && pair.ledger.pairId !== undefined && transferOfPair(s.billing.transfers, pair.ledger.pairId) !== undefined)
  function settleInvoice() {
    if (pair.accPay === undefined) {
      setSettlementMessage('This record has no linked payable to disburse.')
      return
    }

    // Three events in one click (catch-up Phase 37): the payer pays into AA's Xero and the webhook tells the
    // engine; Xero's payables run pays the bill; the bill-paid webhook tells the engine, which records it.
    let queuedPayment = false
    // What Xero shows owing less any payment it holds that the engine has not recorded yet (an outage's), so a second click never overpays.
    const owing = xeroBalanceOf(useAppStore.getState(), pair.accRec.id)
    const paidIn = owing > 0
    if (paidIn) {
      const payment = deliverPaymentWebhook(useAppStore, {
        accRecId: pair.accRec.id,
        amount: owing,
        idempotencyKey: `DEMO-INVOICE-SETTLEMENT-${pair.accRec.id}`,
      })
      if (!payment.ok) {
        setSettlementMessage(`Payment could not be applied: ${payment.message}`)
        return
      }
      queuedPayment = payment.value.queued === true
    }

    if (pair.ledger.pairId === undefined) return
    if (queuedPayment) {
      setSettlementMessage('The payment landed in Xero. Xero is unavailable to the Billing Engine, so it waits in the sync queue, and nothing is authorised to pay yet.')
      return
    }
    const payout = disbursePayable(useAppStore, OFFICE_ACTOR, pair.ledger.pairId)
    // A prepayment's payable credits the AA Holding account (catch-up Phases 27, 27a): the payment lands, the
    // payout is refused, because money leaves the account only by a transfer or refund the system raises.
    if (!payout.ok && payout.code === 'holdingSystemOnly') {
      setSettlementMessage(`The customer payment is recorded. ${payout.message}`)
      return
    }
    if (!payout.ok) {
      setSettlementMessage(`The anaesthetist payout could not be completed: ${payout.message}`)
      return
    }

    const who = pair.accPay.contact?.name ?? 'the anaesthetist'
    const payer = pair.accRec.contact?.type === 'organisation' ? `${pair.accRec.contact.name}'s` : "The payer's"
    // The two Xero events and the bill-paid webhook, named (the payment half only when this click paid it in).
    const paymentPart = paidIn ? `${payer} payment of ${formatCurrency(owing)} landed in Xero and the webhook told the engine; ` : ''
    const payoutPart =
      payout.value.disbursedCount > 0
        ? `Xero's payables run paid ${who} ${formatCurrency(payout.value.totalPaid)} and the bill-paid webhook recorded the disbursement.`
        : `Xero's payables run paid ${who} ${formatCurrency(payout.value.totalPaid)}; the bill-paid webhook's sync waits in the Billing Engine's Xero sync queue.`
    setSettlementMessage(
      payout.value.billsPaid === 0
        ? paidIn
          ? `${paymentPart}nothing is authorised to pay ${who} yet.`
          : 'Done. This customer payment and the bill to the anaesthetist were already complete.'
        : paidIn
          ? `${paymentPart}${payoutPart}`
          : payoutPart,
    )
  }

  return (
    <div data-testid="xero-pair-detail" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/demo/xero/invoices" style={{ ...recordLinkStyle, display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Back to invoices
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: neutral.mist, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Simulated Xero record pair
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 23, lineHeight: '29px' }}>
            {pair.accRec.invoiceNumber}
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9 }}>
          <StatusChip recStatus={pair.accRec.status} payStatus={pair.accPay?.status} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Hidden on a voided pair: Xero takes no payment on a voided invoice (catch-up Phase 37). */}
            {!voided && <button
              type="button"
              onClick={settleInvoice}
              disabled={pair.accPay === undefined || fullySettled || transferred}
              style={{
                font: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 14px',
                borderRadius: radius.ctl,
                border: `1px solid ${fullySettled || transferred ? neutral.lineStrong : accent.base}`,
                background: fullySettled || transferred ? neutral.sunken : accent.base,
                color: fullySettled || transferred ? neutral.mist : '#FFFFFF',
                cursor: fullySettled || transferred ? 'default' : 'pointer',
              }}
            >
              {heldInHolding
                ? transferred
                  ? 'Transferred to the anaesthetist'
                  : pair.accRec.status === 'paid'
                  ? `Pay out of the ${AA_HOLDING_ACCOUNT.name}`
                  : 'Simulate payment'
                : fullySettled
                ? 'Payment and payout complete'
                : pair.accRec.status === 'paid'
                  ? `Pay ${pair.accPay?.contact?.name ?? 'anaesthetist'} now`
                  : 'Simulate payment and payout'}
            </button>}
            {canOpenWebAccount && (
              <Link
                to={`/web/accounts/payments?invoice=${encodeURIComponent(pair.accRec.invoiceNumber)}`}
                style={{
                  ...recordLinkStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  border: `1px solid ${neutral.lineStrong}`,
                  borderRadius: radius.ctl,
                  background: neutral.surface,
                }}
              >
                View in Dr Souter's account
                <ExternalLink size={15} strokeWidth={2} aria-hidden />
              </Link>
            )}
          </div>
          {settlementMessage !== null && (
            <div
              role="status"
              style={{
                maxWidth: 520,
                padding: '8px 11px',
                borderRadius: radius.ctl,
                background: semantic.success.tint,
                color: semantic.success.onTint,
                fontSize: 12.5,
                lineHeight: 1.45,
                textAlign: 'right',
              }}
            >
              {settlementMessage}
            </div>
          )}
        </div>
      </div>

      {pair.incomplete && (
        <Callout tone="warn" title="Incomplete simulated pair">
          One or more linked Billing Engine, contact or ACCPAY records are unavailable. The identifiers
          that still exist are shown below so the handoff can be diagnosed without a blank screen.
        </Callout>
      )}

      <Callout tone="info" title="Ledger pair (the system of record)" shot="xero-engine-link">
        <div data-shot="xero-ledger-pair" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>
              The Billing Engine's ledger pair this record mirrors, not stored on the Xero contact. Patient:
              {' '}<strong>{pair.ledger.patientName ?? 'Unavailable'}</strong>.
            </span>
            {pair.ledger.matches !== undefined && (
              <Pill tone={pair.ledger.matches ? 'success' : 'warning'} size="sm" shot="xero-ledger-match">
                {pair.ledger.matches ? 'Matches the ledger' : 'Differs from the ledger'}
              </Pill>
            )}
          </span>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <InlineId label="Ledger pair" value={pair.ledger.caseReference ?? pair.ledger.pairId ?? 'Unavailable'} />
            <InlineId label="Receivable" value={pair.ledger.receivableNumber ?? 'Unavailable'} />
            <InlineId label="Payable" value={pair.ledger.payableNumber ?? 'None'} />
            <InlineId label="Booking ID" value={pair.ledger.bookingId ?? 'Unavailable'} />
          </div>
          {pair.ledger.received !== undefined && (
            <div className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>
              Ledger: received {formatCurrency(pair.ledger.received)}
              {pair.ledger.released !== undefined && ` · released ${formatCurrency(pair.ledger.released)} · paid out ${formatCurrency(pair.ledger.paidOut ?? 0)}`}
              {' '}| Xero: received {formatCurrency(pair.accRec.amountReceived)}
              {pair.accPay !== undefined && ` · authorised ${formatCurrency(pair.accPay.amountAuthorised)} · disbursed ${formatCurrency(pair.accPay.amountDisbursed)}`}
            </div>
          )}
          <div style={{ fontSize: 13, color: neutral.ink }}>
            Pair link:{' '}
            <span className="mono" style={{ fontWeight: 700 }}>{pair.accRec.id}</span>
            {' '}↔{' '}
            <span className="mono" style={{ fontWeight: 700 }}>{accPayId ?? 'ACCPAY unavailable'}</span>
          </div>
        </div>
      </Callout>

      <div
        data-testid="xero-money-flow-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MoneyFlowCard
            eyebrow="ACCREC · MONEY INTO AA"
            from={pair.accRec.contact?.name ?? 'Payer'}
            to="Anaesthesia Associates"
          >
            Simulated customer invoice and collection. This record tracks what the payer owes AA.
          </MoneyFlowCard>
          <AccRecCard pair={pair} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MoneyFlowCard
            eyebrow="ACCPAY · MONEY OUT OF AA"
            from="Anaesthesia Associates"
            to={pair.accPay?.contact?.name ?? 'Anaesthetist'}
          >
            {heldInHolding
              ? `Simulated payable crediting the ${AA_HOLDING_ACCOUNT.name}, not the anaesthetist. ${HELD_UNTIL_AUTHORISED}, then moved by a transfer to the anaesthetist who did the List. ${LEAVES_ONLY_BY_SYSTEM}.`
              : <>Simulated payable to the anaesthetist. This record tracks the full amount AA will disburse. {`Held as a ${BCTI_DOCUMENT_NAME.toLowerCase()} from the anaesthetist, one for each invoice and the same value.`}</>}
          </MoneyFlowCard>
          <AccPayCard pair={pair} />
        </div>
      </div>

      {heldInHolding && pair.ledger.pairId !== undefined && <TransferJournal caseId={pair.ledger.pairId} />}
    </div>
  )
}

/**
 * The transfer of a prepayment out of the AA Holding account, as the Xero sim
 * mirrors it (catch-up Phase 27a; US-06.5.1, US-09.1.3): a manual journal with
 * two lines, referencing the prepayment invoice, never naming the patient. How
 * the real system posts the move is still open, so the record says so.
 */
function TransferJournal({ caseId }: { caseId: string }) {
  const transfers = useAppStore((s) => s.billing.transfers)
  const journals = useAppStore((s) => s.xero.journals)
  const contacts = useAppStore((s) => s.xero.contacts)
  const transfer = transferOfPair(transfers, caseId)
  const journal = transfer?.xeroJournalId !== undefined ? journals[transfer.xeroJournalId] : undefined
  if (transfer === undefined) {
    return (
      <Callout tone="info" title={`Held in the ${AA_HOLDING_ACCOUNT.name}`} shot="xero-holding-held">
        {RELEASE_TRIGGER_CAPTION}, by a transfer, not a payment. How this posts in Xero is still to be confirmed.
      </Callout>
    )
  }
  if (journal === undefined) {
    return (
      <Callout tone="warn" title="Transfer journal not posted">
        The transfer stands; its journal waits in the Billing Engine's Xero sync queue and posts when Xero answers.
      </Callout>
    )
  }
  return (
    <div data-testid="xero-transfer-journal">
      <RecordCard eyebrow="Manual journal" title={journal.journalNumber} status={<span style={{ fontSize: 12, fontWeight: 700, color: semantic.success.onTint }}>Transfer, not a payment</span>}>
        <MetaGrid>
          <MetaItem label="Date" value={dayMicroCap(journal.dateISO.slice(0, 10))} />
          <MetaItem label="Reference" value={journal.reference} mono />
          <MetaItem label="Transfer" value={transfer.id} mono />
        </MetaGrid>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${neutral.line}`, color: neutral.slate, textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', fontWeight: 600 }}>Creditor</th>
                <th style={{ padding: '6px 8px', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Debit</th>
                <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {journal.lines.map((line) => (
                <tr key={line.contactId} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                  <td style={{ padding: '6px 8px' }}>{contacts[line.contactId]?.name ?? line.contactId}</td>
                  <td style={{ padding: '6px 8px', color: neutral.slate }}>{line.description}</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right' }}>{line.debit > 0 ? formatCurrency(line.debit) : ''}</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right' }}>{line.credit > 0 ? formatCurrency(line.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={{ fontSize: 12, color: neutral.mist }}>How this posts in Xero is still to be confirmed.</span>
      </RecordCard>
    </div>
  )
}

/**
 * An AA fee pair (catch-up Phase 16): AA invoicing its own monthly fee to the
 * anaesthetist, paid into AA's own bank account, with no payable and never
 * netted against a payment to them.
 */
function FeePairDetail({ pair }: { pair: XeroInvoicePairView }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const paid = pair.accRec.status === 'paid'
  const feeId = pair.ledger.aaFeeInvoiceId
  const canOpenWebAccount = pair.ledger.anaesthetistId === APP_CONFIG.web.persona.anaesthetistId
  const anaesthetist = pair.accRec.contact?.name ?? 'Anaesthetist'

  function recordPayment() {
    const res = recordFeePaymentFor(useAppStore, feeId)
    setMessage({ ok: res.ok, text: res.message })
  }

  return (
    <div data-testid="xero-pair-detail" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/demo/xero/invoices" style={{ ...recordLinkStyle, display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Back to invoices
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: neutral.mist, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Simulated Xero AA fee invoice
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 23, lineHeight: '29px' }}>{pair.accRec.invoiceNumber}</h2>
          {pair.ledger.aaFeeMonthISO !== undefined && (
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>AA's fee for {aaFeeMonthLabel(pair.ledger.aaFeeMonthISO)}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9 }}>
          <StatusChip recStatus={pair.accRec.status} fee />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={recordPayment}
              disabled={paid}
              style={{
                font: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 14px',
                borderRadius: radius.ctl,
                border: `1px solid ${paid ? neutral.lineStrong : accent.base}`,
                background: paid ? neutral.sunken : accent.base,
                color: paid ? neutral.mist : '#FFFFFF',
                cursor: paid ? 'default' : 'pointer',
              }}
            >
              {paid ? 'Fee paid' : 'Record fee payment'}
            </button>
            {canOpenWebAccount && (
              <Link
                to={`/web/accounts/fees?invoice=${encodeURIComponent(pair.accRec.invoiceNumber)}`}
                style={{
                  ...recordLinkStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  border: `1px solid ${neutral.lineStrong}`,
                  borderRadius: radius.ctl,
                  background: neutral.surface,
                }}
              >
                View in Dr Souter's account
                <ExternalLink size={15} strokeWidth={2} aria-hidden />
              </Link>
            )}
          </div>
          {message !== null && (
            <div
              role="status"
              style={{
                maxWidth: 520,
                padding: '8px 11px',
                borderRadius: radius.ctl,
                background: message.ok ? semantic.success.tint : semantic.error.tint,
                color: message.ok ? semantic.success.onTint : semantic.error.onTint,
                fontSize: 12.5,
                lineHeight: 1.45,
                textAlign: 'right',
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      {pair.incomplete && (
        <Callout tone="warn" title="Incomplete simulated record">
          The AA fee invoice or the anaesthetist's contact behind this record is unavailable. The identifiers
          that still exist are shown below.
        </Callout>
      )}

      <div
        data-shot="xero-aa-fee-pair"
        data-testid="xero-money-flow-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MoneyFlowCard eyebrow="ACCREC · AA FEE" from={anaesthetist} to="Anaesthesia Associates (AA's own account)">
            AA's monthly fee to the anaesthetist. This record tracks what the anaesthetist owes AA.
          </MoneyFlowCard>
          <AccRecCard pair={pair} />
        </div>
        <section
          data-testid="xero-aa-fee-no-payable"
          style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '15px 18px', background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}
        >
          <div style={{ fontSize: 11, color: neutral.mist, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>No ACCPAY</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>No payable</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: neutral.slate }}>
            This is AA invoicing its own monthly fee to the anaesthetist. It is paid into AA's own bank account,
            not the account client money passes through, and is never netted against a payment to the
            anaesthetist.
          </div>
        </section>
      </div>
    </div>
  )
}

function AaFeeChip() {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 8px', background: neutral.sunken, color: neutral.slate, border: `1px solid ${neutral.line}` }}>
      AA fee
    </span>
  )
}

function AccRecCard({ pair }: { pair: XeroInvoicePairView }) {
  const rec = pair.accRec
  return (
    <RecordCard
      shot="xero-accrec-card"
      eyebrow="Accounts receivable · ACCREC"
      title={rec.invoiceNumber}
      status={<RecordStatus status={rec.status} />}
    >
      {rec.status === 'voided' && (
        <div data-shot="xero-accrec-voided" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: neutral.slate }}>
          <Pill tone="error" size="sm">Voided in Xero</Pill>
          <span>
            AA staff voided it directly in Xero
            {rec.voidedAtISO !== undefined && <> at <span className="mono">{dateTimeMicroCap(rec.voidedAtISO)}</span></>}.
            The Billing Engine learns of it at the next reconciliation poll.
          </span>
        </div>
      )}
      <IdentifierPair invoiceNumber={rec.invoiceNumber} reference={rec.reference} shot="xero-invoice-identifiers">
        {pair.kind === 'procedure'
          ? 'InvoiceNumber is the unique key hospitals and insurers quote on remittances, so automated remittance matching keys on it. Reference is for internal tracing only; Xero does not enforce its uniqueness.'
          : 'InvoiceNumber is the AA-FEE number the anaesthetist quotes when paying. Reference is for internal tracing only.'}
      </IdentifierPair>
      <MetaGrid>
        <MetaItem label="Xero InvoiceID" value={rec.id} mono />
        <MetaItem label="Billing invoice ID" value={rec.invoiceId} mono />
        <MetaItem label="Payer" value={rec.contact?.name ?? 'Contact unavailable'} />
        <MetaItem label="ContactID" value={rec.contact?.contactId ?? rec.contactId} mono />
        <MetaItem label="ContactNumber" value={rec.contact?.contactNumber ?? 'Unavailable'} mono />
        <MetaItem label="Raised" value={rec.raisedAtISO !== undefined ? dateTimeMicroCap(rec.raisedAtISO) : 'Unavailable'} mono />
      </MetaGrid>

      <div>
        <SectionLabel>Invoice lines handed off</SectionLabel>
        {rec.lines.length === 0 ? (
          <EmptyNote>Line details are unavailable for this simulated record.</EmptyNote>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 6 }}>
            <thead>
              <tr>
                <Th>Description</Th>
                <Th right>Units</Th>
                <Th right>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {rec.lines.map((line) => (
                <tr key={line.id}>
                  <Td>{line.description}</Td>
                  <Td mono right>{line.units ?? '·'}</Td>
                  <Td mono right>{formatCurrency(line.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', borderTop: `1px solid ${neutral.line}`, paddingTop: 10 }}>
        <TotalLine label="Subtotal" value={rec.subtotal} />
        <TotalLine label="GST" value={rec.gst} />
        {rec.amendedAtISO !== undefined ? (
          <>
            <TotalLine label="Issued total" value={rec.total} />
            <div data-shot="xero-accrec-amended" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Pill tone="error" size="sm">Amended in Xero <span className="mono">{hhmm(rec.amendedAtISO)}</span></Pill>
              <TotalLine label="Total in Xero" value={rec.amountDue} strong />
            </div>
          </>
        ) : (
          <TotalLine label="Total" value={rec.total ?? rec.amountDue} strong />
        )}
      </div>

      <MoneyGrid>
        <MoneyStat label="Amount due" value={rec.amountDue} />
        <MoneyStat label="Received" value={rec.amountReceived} />
        <MoneyStat label="Balance" value={rec.balance} />
      </MoneyGrid>
      {rec.landedAwaitingSync !== undefined && (
        <Notice tone="warning" shot="xero-accrec-landed-awaiting-sync">
          <span>
            {'Payment landed in Xero: '}
            <span className="mono">{formatCurrency(rec.landedAwaitingSync)}</span>
            {". Xero is unavailable to the Billing Engine, so the payment's sync waits in its queue; Received updates when it lands."}
          </span>
        </Notice>
      )}
    </RecordCard>
  )
}

function AccPayCard({ pair }: { pair: XeroInvoicePairView }) {
  const pay = pair.accPay
  if (pay === undefined) {
    return (
      <RecordCard eyebrow="Accounts payable · ACCPAY" title={pair.ledger.accPayId ?? 'ACCPAY'}>
        <Callout tone="warn" title="ACCPAY unavailable">
          The ACCREC still exists as <span className="mono">{pair.accRec.id}</span>, but its linked
          ACCPAY record could not be loaded. Expected identifier:
          {' '}<span className="mono">{pair.ledger.accPayId ?? 'not recorded'}</span>.
        </Callout>
      </RecordCard>
    )
  }

  return (
    <RecordCard
      shot="xero-accpay-card"
      eyebrow="Accounts payable · ACCPAY"
      title={pay.billNumber}
      status={<RecordStatus status={pay.status} />}
    >
      <IdentifierPair invoiceNumber={pay.billNumber} reference={pay.reference} />
      <MetaGrid>
        <MetaItem label="Xero BillID" value={pay.id} mono />
        <MetaItem label="Linked ACCREC" value={pair.accRec.id} mono />
        <MetaItem label="Payee" value={pay.contact?.name ?? 'Contact unavailable'} />
        <MetaItem label="ContactID" value={pay.contact?.contactId ?? pay.contactId} mono />
        <MetaItem label="ContactNumber" value={pay.contact?.contactNumber ?? 'Unavailable'} mono />
        <MetaItem label="Pair reference" value={pair.ledger.caseReference ?? pair.ledger.pairId ?? 'Unavailable'} mono />
      </MetaGrid>

      <MoneyGrid>
        <MoneyStat label="Payable" value={pay.totalPayable} />
        <MoneyStat label="Authorised" value={pay.amountAuthorised} />
        <MoneyStat label="Disbursed" value={pay.amountDisbursed} />
        <MoneyStat label="Ready to disburse" value={pay.remainingAuthorised} />
      </MoneyGrid>

      {!pay.held && <BillPayments payments={pay.billPayments} />}

      {/* A payable to the AA Holding account (catch-up Phase 27a): held, and not counted as a BCTI (OQ-29 provisional). */}
      {pay.held && (
        <div data-shot="xero-accpay-held" style={{ fontSize: 12.5, color: neutral.slate, borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }}>
          {HELD_UNTIL_AUTHORISED}. Not counted as a buyer-created tax invoice while AA&apos;s accountant confirms how prepayments are treated.
        </div>
      )}

      {/* The ACCPAY held as a buyer-created tax invoice (catch-up Phase 22; US-09.1.4; provisional, OQ-29). Not for a held prepayment payable. */}
      {pay.taxInvoice !== undefined && !pay.held && (
        <div data-shot="xero-accpay-buyer-created" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>{pay.taxInvoice.documentName}</h4>
            <Pill size="sm">{OQ29_PILL}</Pill>
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: neutral.ink }}>{pay.taxInvoice.wording}</div>
          <MetaGrid>
            <MetaItem label="Supplier" value={pay.taxInvoice.supplierName} />
            <MetaItem label="Supplier GST number" value={pay.taxInvoice.supplierGstNumber !== undefined ? formatGstNumber(pay.taxInvoice.supplierGstNumber) : GST_NUMBER_NOT_HELD} mono={pay.taxInvoice.supplierGstNumber !== undefined} />
            <MetaItem label="Agent" value={pay.taxInvoice.agentName} />
            <MetaItem label="Agent GST number" value={formatGstNumber(pay.taxInvoice.agentGstNumber)} mono />
            <MetaItem label="For invoice" value={pay.taxInvoice.relatesToInvoiceNumber} mono />
          </MetaGrid>
          <div style={{ fontSize: 11.5, color: neutral.mist }}>{OQ29_CAPTION}</div>
        </div>
      )}
    </RecordCard>
  )
}

/**
 * The ACCPAY's two sides (catch-up Phase 37; US-09.2.4): what Xero paid (its
 * bill payments) kept apart from what the Billing Engine has recorded of each,
 * so a missed bill-paid webhook shows as a gap the next poll closes.
 */
function BillPayments({ payments }: { payments: XeroBillPaymentView[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }}>
      <div data-shot="xero-accpay-paid-in-xero" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SectionLabel>Paid in Xero</SectionLabel>
        {payments.length === 0 ? (
          <span style={{ fontSize: 12.5, color: neutral.mist }}>No bill payment yet. Xero&apos;s payables run pays the bill once it is authorised.</span>
        ) : (
          payments.map((p) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 12, alignItems: 'baseline', fontSize: 13 }}>
              <span className="mono" title="Xero bill payment" style={{ fontWeight: 700 }}>{p.id}</span>
              <span className="mono" style={{ color: neutral.slate }}>{dateTimeMicroCap(p.atISO)}</span>
              <span className="mono" style={{ fontWeight: 700 }}>{formatCurrency(p.amount)}</span>
            </div>
          ))
        )}
      </div>
      {payments.length > 0 && (
        <div data-shot="xero-accpay-engine-detection" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {payments.map((p) => (
            <Notice key={p.id} tone={p.engine.state === 'recorded' ? 'success' : 'warning'} data-engine-state={p.engine.state}>
              <span>
                {payments.length > 1 && <span className="mono" style={{ fontWeight: 700 }}>{p.id} </span>}
                {engineDetectionText(p.engine)}
              </span>
            </Notice>
          ))}
        </div>
      )}
    </div>
  )
}

function engineDetectionText(engine: XeroBillPaymentView['engine']): React.ReactNode {
  if (engine.state === 'queued') return "Billing Engine: the bill-paid webhook's sync waits in its Xero sync queue."
  if (engine.state === 'notDetected') return 'Billing Engine: not yet detected; the next poll picks it up.'
  const by = engine.detectedBy === 'webhook' ? 'by webhook' : 'by the poll'
  return engine.recordedAtISO !== undefined
    ? <>Billing Engine: disbursement recorded <span className="mono">{hhmm(engine.recordedAtISO)}</span> {by}.</>
    : <>Billing Engine: disbursement recorded {by}.</>
}

/**
 * Xero's bank reconciliation (catch-up Phase 37; US-10.2.4): each bulk
 * remittance with its lines as Xero's remittance add-on matched them, and the
 * lines it could not match, which office staff match here, in Xero. A match
 * pays the invoice in Xero and reaches the Billing Engine by the ordinary
 * payment webhook; the engine itself never matches a remittance.
 */
function BankReconciliation() {
  const xero = useAppStore((s) => s.xero)
  const remittances = useMemo(
    () => Object.values(xero.remittances).sort((a, b) => a.receivedAtISO.localeCompare(b.receivedAtISO) || a.id.localeCompare(b.id)),
    [xero.remittances],
  )
  const unmatched = useMemo(() => unmatchedBankLines({ xero }), [xero])
  const [result, setResult] = useState<string | null>(null)

  return (
    <div data-shot="xero-bank-reconciliation" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate, maxWidth: 820 }}>
        Bulk deposits as they land in AA&apos;s Xero bank account, each with the remittance advice the payer sent.
        Xero&apos;s remittance add-on matches each line to an invoice by the InvoiceNumber it quotes.
      </div>
      <Callout tone="info" title="Matched in Xero, not by the Billing Engine" shot="xero-bank-scope">
        The Billing Engine does not match bulk remittances. Xero&apos;s bank reconciliation and remittance add-on do,
        keyed on the unique InvoiceNumber; the engine learns each matched payment through the normal payment
        webhook (US-10.2.4).
      </Callout>

      {remittances.length === 0 ? (
        <EmptyState variant="card" title="No remittance yet" shot="xero-bank-empty">
          &quot;Simulate bulk hospital remittance&quot; in Demo actions brings one in.
        </EmptyState>
      ) : (
        <>
          {remittances.map((r) => (
            <RemittanceCard key={r.id} remittance={r} xero={xero} />
          ))}

          <section data-shot="xero-bank-unmatched" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: neutral.ink }}>
              Unmatched items · for office staff, handled in Xero
            </h2>
            <div style={{ fontSize: 12.5, color: neutral.slate, maxWidth: 820 }}>
              An unmatched line is money in Xero&apos;s bank reconciliation, not an unmatched receipt in the Billing
              Engine (that is money the engine received and holds).
            </div>
            {unmatched.length === 0 ? (
              <EmptyState variant="inline">Every line is matched.</EmptyState>
            ) : (
              unmatched.map((line) => (
                <UnmatchedLineRow
                  key={line.id}
                  line={line}
                  remittance={xero.remittances[line.remittanceId]}
                  accRecs={xero.accRecs}
                  onMatched={setResult}
                />
              ))
            )}
            <ResultLine line={result} shot="xero-bank-match-result" onDismiss={() => setResult(null)} />
          </section>
        </>
      )}
    </div>
  )
}

function RemittanceCard({
  remittance,
  xero,
}: {
  remittance: XeroRemittance
  xero: { bankLines: Record<string, XeroBankLine>; accRecs: Record<string, XeroAccRec>; contacts: Record<string, XeroContact> }
}) {
  const lines = remittance.lineIds.map((id) => xero.bankLines[id]).filter((l): l is XeroBankLine => l !== undefined)
  const total = lines.reduce((n, l) => n + l.amount, 0)
  const payer = xero.contacts[remittance.payerContactId]?.name ?? remittance.payerContactId
  return (
    <Card
      padding="panel"
      shot={`xero-remittance-${remittance.id.toLowerCase()}`}
      title={<span className="mono">{remittance.reference}</span>}
      action={
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
          <SectionLabel>Deposit</SectionLabel>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(total)}</span>
        </span>
      }
    >
      <span style={{ fontSize: 12.5, color: neutral.slate }}>
        From {payer} · received <span className="mono">{dateTimeMicroCap(remittance.receivedAtISO)}</span>
      </span>
      <KitTableShell label={`Lines of ${remittance.reference}`} density="compact" nested>
        <thead>
          <tr>
            <KitTh>Quoted reference</KitTh>
            <KitTh align="right">Amount</KitTh>
            <KitTh>In Xero</KitTh>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const rec = line.accRecId !== undefined ? xero.accRecs[line.accRecId] : undefined
            return (
              <tr key={line.id} data-shot={`xero-bank-line-${line.id.toLowerCase()}`} data-line-status={line.status}>
                <KitTd mono>{line.quotedReference}</KitTd>
                <KitTd mono align="right">{formatCurrency(line.amount)}</KitTd>
                <KitTd>
                  {line.status === 'unmatched' ? (
                    <Pill tone="warning" size="sm">Unmatched</Pill>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Pill tone="success" size="sm">
                        {line.status === 'matchedByAddOn' ? 'Matched by the remittance add-on' : 'Matched by the office'}
                      </Pill>
                      {rec !== undefined && <span className="mono" style={{ fontSize: 12.5 }}>{rec.invoiceNumber}</span>}
                    </span>
                  )}
                </KitTd>
              </tr>
            )
          })}
        </tbody>
      </KitTableShell>
    </Card>
  )
}

function UnmatchedLineRow({
  line,
  remittance,
  accRecs,
  onMatched,
}: {
  line: XeroBankLine & { receivedAtISO: string; reference: string }
  remittance: XeroRemittance | undefined
  accRecs: Record<string, XeroAccRec>
  onMatched: (message: string) => void
}) {
  const [choice, setChoice] = useState('')
  const [error, setError] = useState<string | null>(null)
  // The payer's open invoices: not voided, with a balance (what Xero lets the office match the line to).
  const open = Object.values(accRecs)
    .filter((r) => remittance !== undefined && r.contactId === remittance.payerContactId && r.status !== 'voided' && toCents(xeroBalanceOf(useAppStore.getState(), r.id)) > 0)
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))

  function match() {
    const refusal = bankLineMatchRefusal(useAppStore.getState(), line.id, choice)
    if (refusal !== null) {
      setError(refusal)
      return
    }
    const out = matchBankLineInXero(useAppStore, XERO_STAFF_ACTOR, line.id, choice)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    const { invoiceNumber, amount, queued } = out.value
    onMatched(
      queued
        ? `Matched in Xero: ${formatCurrency(amount)} paid ${invoiceNumber}. Xero is unavailable to the Billing Engine, so the payment's sync waits in its Xero sync queue.`
        : `Matched in Xero: ${formatCurrency(amount)} paid ${invoiceNumber}, and the payment webhook told the Billing Engine, which recorded the receipt.`,
    )
  }

  return (
    <Card as="div" shot={`xero-bank-unmatched-${line.id.toLowerCase()}`} style={{ gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200, flex: '1 1 200px' }}>
          <span style={{ fontSize: 13, color: neutral.ink }}>
            Quotes <span className="mono" style={{ fontWeight: 700 }}>{line.quotedReference}</span>, which matches no invoice
          </span>
          <span style={{ fontSize: 12, color: neutral.slate }}>
            {line.reference} · <span className="mono">{dateTimeMicroCap(line.receivedAtISO)}</span>
          </span>
        </div>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(line.amount)}</span>
        <SelectField
          label={`Invoice to match ${line.quotedReference} to`}
          hideLabel
          size="compact"
          fill="well"
          value={choice}
          onChange={(v) => {
            setChoice(v)
            setError(null)
          }}
          shot={`xero-bank-pick-${line.id}`}
        >
          <option value="">Choose an invoice</option>
          {open.map((r) => (
            <option key={r.id} value={r.id}>
              {r.invoiceNumber} · {formatCurrency((toCents(r.amountDue) - toCents(r.amountReceived)) / 100)} open
            </option>
          ))}
        </SelectField>
        <Button variant="primary" size="compact" onClick={match} shot={`xero-bank-match-${line.id}`}>
          Match in Xero
        </Button>
      </div>
      <FormError message={error} variant="inline" />
    </Card>
  )
}

function MoneyFlowCard({
  eyebrow,
  from,
  to,
  children,
}: {
  eyebrow: string
  from: string
  to: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        minHeight: 118,
        padding: '15px 18px',
        background: neutral.sunken,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
      }}
    >
      <SectionLabel>{eyebrow}</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          alignItems: 'center',
          gap: 12,
          fontSize: 19,
          lineHeight: 1.2,
          fontWeight: 700,
          color: neutral.ink,
        }}
      >
        <span style={{ overflowWrap: 'anywhere' }}>{from}</span>
        <ArrowRight size={24} strokeWidth={2.2} color={neutral.ink} aria-hidden />
        <span style={{ overflowWrap: 'anywhere' }}>{to}</span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: neutral.slate }}>{children}</div>
    </section>
  )
}

function RecordCard({ eyebrow, title, status, children, shot }: { eyebrow: string; title: string; status?: React.ReactNode; children: React.ReactNode; shot?: string }) {
  return (
    <section data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 16, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, color: neutral.mist, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{eyebrow}</div>
          <h3 className="mono" style={{ margin: '4px 0 0', fontSize: 18 }}>{title}</h3>
        </div>
        {status}
      </div>
      {children}
    </section>
  )
}

function MetaGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 18px' }}>{children}</div>
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <SectionLabel>{label}</SectionLabel>
      <div className={mono === true ? 'mono' : undefined} style={{ marginTop: 3, fontSize: 13, color: neutral.ink, overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  )
}

/**
 * The two Xero identifiers stored on a record (US-09.1.1): InvoiceNumber, the
 * remittance-matching key, and Reference, internal tracing only.
 */
function IdentifierPair({
  invoiceNumber,
  reference,
  shot,
  children,
}: {
  invoiceNumber: string
  reference: string
  shot?: string
  children?: React.ReactNode
}) {
  return (
    <div
      data-shot={shot}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.ctl,
      }}
    >
      <MetaGrid>
        <MetaItem label="InvoiceNumber" value={invoiceNumber} mono />
        <MetaItem label="Reference" value={reference} mono />
      </MetaGrid>
      {children !== undefined && (
        <div style={{ fontSize: 12, lineHeight: 1.45, color: neutral.slate }}>{children}</div>
      )}
    </div>
  )
}

function InlineId({ label, value }: { label: string; value: string }) {
  return <span><strong>{label}:</strong> <span className="mono">{value}</span></span>
}

function MoneyGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>{children}</div>
}

function MoneyStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: neutral.sunken, borderRadius: radius.ctl, padding: '10px 12px' }}>
      <SectionLabel>{label}</SectionLabel>
      <div className="mono" style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>{formatCurrency(value)}</div>
    </div>
  )
}

function TotalLine({
  label,
  value,
  strong,
}: {
  label: string
  value: number | undefined
  strong?: boolean
}) {
  const formatted = value === undefined ? 'Unavailable' : formatCurrency(value)
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', width: 230, fontSize: strong === true ? 14 : 12.5, fontWeight: strong === true ? 700 : 500 }}>
      <span>{label}</span>
      <span className="mono">{formatted}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{children}</div>
}

function RecordStatus({ status }: { status: string }) {
  const label =
    status === 'awaitingPayment' ? 'Awaiting payment' :
      status === 'authorised' ? 'Authorised' :
        status === 'paid' ? 'Paid' :
          status === 'voided' ? 'Voided' :
            status === 'draft' ? 'Draft' : status
  const on = status === 'paid' || status === 'authorised'
  // Voided in Xero is the danger state (catch-up Phase 37).
  const colours = status === 'voided'
    ? { background: semantic.error.tint, color: semantic.error.onTint }
    : on ? { background: semantic.success.tint, color: semantic.success.onTint } : { background: neutral.sunken, color: neutral.slate }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap', ...colours }}>
      {label}
    </span>
  )
}

function Callout({ tone, title, children, shot }: { tone: 'warn' | 'info'; title: string; children: React.ReactNode; shot?: string }) {
  const colours = tone === 'warn'
    ? { bg: semantic.warning.tint, fg: semantic.warning.onTint, border: semantic.warning.solid }
    : { bg: neutral.sunken, fg: neutral.slate, border: neutral.lineStrong }
  const Icon = tone === 'warn' ? AlertTriangle : Info
  return (
    <div data-shot={shot} style={{ display: 'flex', gap: 10, background: colours.bg, border: `1px solid ${colours.border}44`, borderRadius: radius.card, padding: '12px 14px' }}>
      <Icon size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', marginTop: 2, color: colours.fg }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colours.fg }}>{title}</span>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: colours.fg }}>{children}</div>
      </div>
    </div>
  )
}

function TabLink({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      style={{ textDecoration: 'none', padding: '10px 14px', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? neutral.ink : neutral.slate, boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none' }}
    >
      {children}
    </Link>
  )
}

function ContactTypeChip({ type }: { type: XeroContact['type'] }) {
  const label = type === 'organisation' ? 'Organisation' : type === 'patient' ? 'Patient' : 'Billable party'
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', background: neutral.sunken, color: neutral.slate }}>
      {label}
    </span>
  )
}

function StatusChip({ recStatus, payStatus, fee = false }: { recStatus: string; payStatus?: string; fee?: boolean }) {
  const paid = recStatus === 'paid'
  const disbursed = payStatus === 'paid'
  const label = recStatus === 'voided'
    ? 'Voided'
    : fee
    ? paid ? 'Paid' : 'Awaiting payment'
    : disbursed ? 'Disbursed' : paid ? 'Paid · not disbursed' : payStatus === 'authorised' ? 'Part paid' : 'Awaiting payment'
  const on = paid || disbursed
  // Voided in Xero is the danger state (catch-up Phase 37).
  const colours = recStatus === 'voided'
    ? { background: semantic.error.tint, color: semantic.error.onTint }
    : on ? { background: semantic.success.tint, color: semantic.success.onTint } : { background: neutral.sunken, color: neutral.slate }
  return (
    <span title={label} style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', ...colours }}>
      {label}
    </span>
  )
}

function TruncatedText({ value }: { value: string }) {
  return <span title={value} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
}

function StackedAmount({ label, value, secondary }: { label: string; value: string; secondary?: boolean }) {
  return (
    <span
      title={`${label}: ${value}`}
      style={{ display: 'block', marginTop: secondary === true ? 2 : 0, color: secondary === true ? neutral.mist : neutral.ink }}
    >
      {value}
    </span>
  )
}

function TableShell({ minWidth = 0, testId, children }: { minWidth?: number; testId?: string; children: React.ReactNode }) {
  return (
    <div data-testid={testId} style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, minWidth: 0 }}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

function Th({ children, right, compact, wrap }: { children: React.ReactNode; right?: boolean; compact?: boolean; wrap?: boolean }) {
  return (
    <th style={{ textAlign: right === true ? 'right' : 'left', padding: compact === true ? '10px 8px' : '11px 14px', fontSize: 10.5, lineHeight: 1.25, fontWeight: 700, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: wrap === true ? 'normal' : 'nowrap', borderBottom: `1px solid ${neutral.line}` }}>
      {children}
    </th>
  )
}

function Td({ children, mono, right, compact, clip }: { children: React.ReactNode; mono?: boolean; right?: boolean; compact?: boolean; clip?: boolean }) {
  return (
    <td className={mono === true ? 'mono' : undefined} style={{ padding: compact === true ? '9px 8px' : '10px 14px', fontSize: 13, color: neutral.ink, textAlign: right === true ? 'right' : 'left', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: clip === true ? 'hidden' : undefined, textOverflow: clip === true ? 'ellipsis' : undefined, borderBottom: `1px solid ${neutral.sunken}` }}>
      {children}
    </td>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: neutral.mist, padding: '8px 0' }}>{children}</div>
}

/** A link inside a sentence (a callout's pointer to another tab). */
const inlineLinkStyle = {
  color: 'inherit',
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
} as const

const recordLinkStyle = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: neutral.ink,
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationColor: neutral.lineStrong,
  textUnderlineOffset: 3,
} as const
