import { useMemo } from 'react'
import { AlertTriangle, ChevronLeft, Info } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DemoSurface } from './DemoSurface'
import { useAppStore } from '../../store'
import { dateTimeMicroCap, formatCurrency } from '../../shared/format'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { XeroContact } from '../../domain/types'
import { xeroInvoicePairViews, type XeroInvoicePairView } from './xeroPairView'

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
  const location = useLocation()
  const { accRecId } = useParams<{ accRecId: string }>()

  const contacts = useMemo(
    () => Object.values(xero.contacts).sort((a, b) => a.contactNumber.localeCompare(b.contactNumber)),
    [xero.contacts],
  )
  const pairs = useMemo(
    () => xeroInvoicePairViews({ xero, billing, schedule, masters }),
    [xero, billing, schedule, masters],
  )
  const selectedPair = useMemo(
    () => (accRecId !== undefined ? pairs.find((pair) => pair.accRec.id === accRecId) : undefined),
    [accRecId, pairs],
  )

  if (accRecId !== undefined && selectedPair === undefined) {
    return <Navigate to="/demo/xero/invoices" replace />
  }

  const invoicesTab = location.pathname.startsWith('/demo/xero/invoices')
  const vs = settings.volumeStory
  const activePatientContacts = contacts.filter((c) => c.type !== 'organisation' && !c.archived).length
  const archivedContacts = contacts.filter((c) => c.archived).length

  return (
    <DemoSurface
      title="Xero simulation"
      subtitle="The simulated Xero organisation the Billing Engine hands off to: contacts, the ACCREC / ACCPAY invoice pairs and their payment state. All fake and in-browser; the apps never read this, only the Billing Engine's own mirror."
      maxWidth={1440}
      subtitleMaxWidth={820}
    >
      <Callout tone="warn" title="NHI never resides in Xero (Appendix 2 vs Appendix 1)">
        The prototype implements RFP Appendix 2 (data minimisation): only the hidden internal ID
        (ContactNumber) and the Xero ContactID cross to Xero, never the NHI. Appendix 1's design policy
        instead wants the NHI as a searchable cross-reference field on the Xero contact. This is an
        unresolved contradiction needing an AA ruling, not a settled requirement.
      </Callout>
      <Callout tone="warn" title="Duplicate-invoice-number-prevention (mandated Xero org setting)">
        The RFP requires the Xero organisation setting that prevents duplicate invoice numbers, so the
        Billing Engine's unique InvoiceNumber can be the reliable matching key for remittance
        reconciliation. Configuring this in the AA Xero org is an open item to confirm in discovery.
      </Callout>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}` }}>
        <TabLink active={!invoicesTab} to="/demo/xero">Contacts ({contacts.length})</TabLink>
        <TabLink active={invoicesTab} to="/demo/xero/invoices">Invoices ({pairs.length})</TabLink>
      </div>

      {!invoicesTab ? (
        <ContactsTable contacts={contacts} />
      ) : selectedPair !== undefined ? (
        <PairDetail pair={selectedPair} />
      ) : (
        <InvoicesTable pairs={pairs} />
      )}

      {selectedPair === undefined && (
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
        persist and never archive. Patient and Billable Party contacts carry only the hidden internal ID.
        <strong style={{ fontWeight: 600 }}> No NHI column exists.</strong> Open an invoice pair to see
        the payer and payee identifiers used for that transaction.
      </div>
      {contacts.length === 0 ? (
        <EmptyNote>No Xero contacts yet. Authorise a list (or raise a pre-payment invoice) to hand a pair off.</EmptyNote>
      ) : (
        <TableShell minWidth={720}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            <thead>
              <tr>{['ContactID', 'ContactNumber', 'Name', 'Type', 'Archived'].map((h) => <Th key={h}>{h}</Th>)}</tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.contactId}>
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
        Each row is one Billing Engine case: an ACCREC (money in, to the payer) paired with a DRAFT
        then AUTHORISED ACCPAY (owed to the anaesthetist). The pair is linked by the case, not
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
                    <span
                      title="ACCPAY bill number"
                      style={{ display: 'block', marginTop: 2, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {pair.accPay?.billNumber ?? `${pair.accRec.invoiceNumber}-P`}
                    </span>
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
                  <Td compact clip><StatusChip recStatus={pair.accRec.status} payStatus={pair.accPay?.status} /></Td>
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
  const accPayId = pair.accPay?.id ?? pair.engine.accPayId
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
        <StatusChip recStatus={pair.accRec.status} payStatus={pair.accPay?.status} />
      </div>

      {pair.incomplete && (
        <Callout tone="warn" title="Incomplete simulated pair">
          One or more linked Billing Engine, contact or ACCPAY records are unavailable. The identifiers
          that still exist are shown below so the handoff can be diagnosed without a blank screen.
        </Callout>
      )}

      <Callout tone="info" title="Linked Billing Engine case, not stored on the Xero contact">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>
            This presenter context comes from the Billing Engine link. Patient:
            {' '}<strong>{pair.engine.patientName ?? 'Unavailable'}</strong>.
          </span>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <InlineId label="Case reference" value={pair.engine.caseReference ?? pair.engine.caseId ?? 'Unavailable'} />
            <InlineId label="Card ID" value={pair.engine.cardId ?? 'Unavailable'} />
            <InlineId label="Billing invoice ID" value={pair.engine.billingInvoiceId} />
          </div>
          <div style={{ fontSize: 13, color: neutral.ink }}>
            Pair link:{' '}
            <span className="mono" style={{ fontWeight: 700 }}>{pair.accRec.id}</span>
            {' '}↔{' '}
            <span className="mono" style={{ fontWeight: 700 }}>{accPayId ?? 'ACCPAY unavailable'}</span>
          </div>
        </div>
      </Callout>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}>
        <AccRecCard pair={pair} />
        <AccPayCard pair={pair} />
      </div>
    </div>
  )
}

function AccRecCard({ pair }: { pair: XeroInvoicePairView }) {
  const rec = pair.accRec
  return (
    <RecordCard
      eyebrow="Accounts receivable · ACCREC"
      title={rec.invoiceNumber}
      status={<RecordStatus status={rec.status} />}
    >
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
        <TotalLine label="Total" value={rec.total ?? rec.amountDue} strong />
      </div>

      <MoneyGrid>
        <MoneyStat label="Amount due" value={rec.amountDue} />
        <MoneyStat label="Received" value={rec.amountReceived} />
        <MoneyStat label="Balance" value={rec.balance} />
      </MoneyGrid>
    </RecordCard>
  )
}

function AccPayCard({ pair }: { pair: XeroInvoicePairView }) {
  const pay = pair.accPay
  if (pay === undefined) {
    return (
      <RecordCard eyebrow="Accounts payable · ACCPAY" title={`${pair.accRec.invoiceNumber}-P`}>
        <Callout tone="warn" title="ACCPAY unavailable">
          The ACCREC still exists as <span className="mono">{pair.accRec.id}</span>, but its linked
          ACCPAY record could not be loaded. Expected identifier:
          {' '}<span className="mono">{pair.engine.accPayId ?? 'not recorded'}</span>.
        </Callout>
      </RecordCard>
    )
  }

  return (
    <RecordCard
      eyebrow="Accounts payable · ACCPAY"
      title={pay.billNumber}
      status={<RecordStatus status={pay.status} />}
    >
      <MetaGrid>
        <MetaItem label="Xero BillID" value={pay.id} mono />
        <MetaItem label="Linked ACCREC" value={pair.accRec.id} mono />
        <MetaItem label="Payee" value={pay.contact?.name ?? 'Contact unavailable'} />
        <MetaItem label="ContactID" value={pay.contact?.contactId ?? pay.contactId} mono />
        <MetaItem label="ContactNumber" value={pay.contact?.contactNumber ?? 'Unavailable'} mono />
        <MetaItem label="Pair reference" value={pair.engine.caseReference ?? pair.engine.caseId ?? 'Unavailable'} mono />
      </MetaGrid>

      <Callout tone="info" title="Undiscounted payable">
        The simulated ACCPAY total matches the ACCREC collection total. How AA's agency fee is deducted
        is outside the RFP's Billing Engine scope and remains a discovery item.
      </Callout>

      <MoneyGrid>
        <MoneyStat label="Total payable" value={pay.totalPayable} />
        <MoneyStat label="Authorised" value={pay.amountAuthorised} />
        <MoneyStat label="Disbursed" value={pay.amountDisbursed} />
        <MoneyStat label="Ready to disburse" value={pay.remainingAuthorised} />
      </MoneyGrid>
    </RecordCard>
  )
}

function RecordCard({ eyebrow, title, status, children }: { eyebrow: string; title: string; status?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 18 }}>
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

function TotalLine({ label, value, strong }: { label: string; value: number | undefined; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', width: 230, fontSize: strong === true ? 14 : 12.5, fontWeight: strong === true ? 700 : 500 }}>
      <span>{label}</span>
      <span className="mono">{value !== undefined ? formatCurrency(value) : 'Unavailable'}</span>
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
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap', background: on ? semantic.success.tint : neutral.sunken, color: on ? semantic.success.onTint : neutral.slate }}>
      {label}
    </span>
  )
}

function Callout({ tone, title, children }: { tone: 'warn' | 'info'; title: string; children: React.ReactNode }) {
  const colours = tone === 'warn'
    ? { bg: semantic.warning.tint, fg: semantic.warning.onTint, border: semantic.warning.solid }
    : { bg: neutral.sunken, fg: neutral.slate, border: neutral.lineStrong }
  const Icon = tone === 'warn' ? AlertTriangle : Info
  return (
    <div style={{ display: 'flex', gap: 10, background: colours.bg, border: `1px solid ${colours.border}44`, borderRadius: radius.card, padding: '12px 14px' }}>
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

function StatusChip({ recStatus, payStatus }: { recStatus: string; payStatus?: string }) {
  const paid = recStatus === 'paid'
  const disbursed = payStatus === 'paid'
  const label = disbursed ? 'Disbursed' : paid ? 'Paid · not disbursed' : payStatus === 'authorised' ? 'Part paid' : 'Awaiting payment'
  const on = paid || disbursed
  return (
    <span title={label} style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: on ? semantic.success.tint : neutral.sunken, color: on ? semantic.success.onTint : neutral.slate }}>
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
