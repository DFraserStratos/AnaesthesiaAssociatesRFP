import { useMemo, useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { DemoSurface } from './DemoSurface'
import { useAppStore } from '../../store'
import { formatCurrency } from '../../shared/format'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { XeroContact } from '../../domain/types'

/**
 * The Xero simulator (`/demo/xero`) — demo-badged (DemoSurface), and the ONE
 * surface that legitimately reads `state.xero`: it IS the simulated Xero org.
 *
 *  - Contacts: ContactID, ContactNumber, name, type, archived. NO NHI anywhere
 *    (convention 8 / RFP Appendix 2 — proven by the no-NHI-in-Xero test).
 *  - Invoices: the ACCREC + paired ACCPAY per case, linked by the Billing
 *    Engine's case GUIDs (not natively linked in Xero), with visibly similar
 *    numbers (a shared stem, the ACCPAY suffixed `-P`) and the two-state money.
 *
 * Two RFP discovery items are surfaced as callouts (flagged readings, NOT
 * settled requirements): the Appendix-1-vs-2 NHI contradiction (the prototype
 * implements Appendix 2) and the mandated duplicate-invoice-number-prevention
 * org setting. The narrated contact-volume story sits in the archiving callout.
 */
export function DemoXero() {
  const xero = useAppStore((s) => s.xero)
  const billing = useAppStore((s) => s.billing)
  const settings = useAppStore((s) => s.settings)
  const [tab, setTab] = useState<'contacts' | 'invoices'>('contacts')

  const contacts = useMemo(
    () => Object.values(xero.contacts).sort((a, b) => a.contactNumber.localeCompare(b.contactNumber)),
    [xero.contacts],
  )

  const pairs = useMemo(() => {
    return Object.values(xero.accRecs)
      .map((rec) => {
        const linkedCase = Object.values(billing.cases).find((c) => c.accRecId === rec.id)
        const invoice = billing.invoices[rec.invoiceId]
        const accPay = linkedCase?.accPayId !== undefined ? xero.accPays[linkedCase.accPayId] : undefined
        const payer = xero.contacts[rec.contactId]
        const payee = accPay !== undefined ? xero.contacts[accPay.contactId] : undefined
        const number = invoice?.invoiceNumber ?? rec.invoiceId
        return { rec, accPay, payer, payee, number, caseId: linkedCase?.id }
      })
      .sort((a, b) => a.number.localeCompare(b.number))
  }, [xero.accRecs, xero.accPays, xero.contacts, billing.cases, billing.invoices])

  const vs = settings.volumeStory
  const activePatientContacts = contacts.filter((c) => c.type !== 'organisation' && !c.archived).length
  const archivedContacts = contacts.filter((c) => c.archived).length

  return (
    <DemoSurface
      title="Xero simulation"
      subtitle="The simulated Xero organisation the Billing Engine hands off to: contacts, the ACCREC / ACCPAY invoice pairs and their payment state. All fake and in-browser; the apps never read this, only the Billing Engine's own mirror."
    >
      {/* Discovery-item callouts */}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}` }}>
        <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')}>Contacts ({contacts.length})</TabButton>
        <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices ({pairs.length})</TabButton>
      </div>

      {tab === 'contacts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            Organisational contacts (hospitals, insurers, surgeons, groups and the anaesthetist payees)
            persist and never archive. Patient and Billable Party contacts carry only the hidden internal ID.
            <strong style={{ fontWeight: 600 }}> No NHI column exists.</strong>
          </div>
          {contacts.length === 0 ? (
            <EmptyNote>No Xero contacts yet. Authorise a list (or raise a pre-payment invoice) to hand a pair off.</EmptyNote>
          ) : (
            <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
                <thead>
                  <tr>{['ContactID', 'ContactNumber', 'Name', 'Type', 'Archived'].map((h) => <Th key={h}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.contactId}>
                      <Td mono>{c.contactId}</Td>
                      <Td mono>{c.contactNumber}</Td>
                      <Td>{c.name}</Td>
                      <Td><ContactTypeChip type={c.type} /></Td>
                      <Td>{c.archived ? <span style={{ color: neutral.mist }}>Archived</span> : 'Active'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            Each row is one Billing-Engine case: an ACCREC (money in, to the payer) paired with a DRAFT
            then AUTHORISED ACCPAY (owed to the anaesthetist). The pair is linked by the case, not
            natively in Xero, and carries visibly similar numbers (the ACCPAY suffixed <span className="mono">-P</span>).
            The ACCPAY "undiscounted payable" equals the ACCREC collection total here; how AA's agency
            fee is deducted is out of the RFP's billing-engine scope, a discovery item.
          </div>
          {pairs.length === 0 ? (
            <EmptyNote>No invoices handed off yet.</EmptyNote>
          ) : (
            <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 920 }}>
                <thead>
                  <tr>{['ACCREC / ACCPAY', 'Payer', 'Payee', 'Amount due', 'Received', 'ACCPAY authorised', 'Disbursed', 'Status'].map((h, i) => (
                    <Th key={h} right={i >= 3 && i <= 6}>{h}</Th>
                  ))}</tr>
                </thead>
                <tbody>
                  {pairs.map((p) => (
                    <tr key={p.rec.id}>
                      <Td mono>
                        {p.number}
                        <span style={{ color: neutral.mist }}> · {p.number}-P</span>
                      </Td>
                      <Td>{p.payer?.name ?? p.rec.contactId}</Td>
                      <Td>{p.payee?.name ?? p.accPay?.contactId ?? '·'}</Td>
                      <Td mono right>{formatCurrency(p.rec.amountDue)}</Td>
                      <Td mono right>{formatCurrency(p.rec.amountReceived)}</Td>
                      <Td mono right>{p.accPay !== undefined ? formatCurrency(p.accPay.amountAuthorised) : '·'}</Td>
                      <Td mono right>{p.accPay !== undefined ? formatCurrency(p.accPay.amountDisbursed) : '·'}</Td>
                      <Td>
                        <StatusChip recStatus={p.rec.status} payStatus={p.accPay?.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Archiving + narrated volume story */}
      <Callout tone="info" title="Contact archiving & volume">
        Xero has a soft limit of about {vs.softLimit.toLocaleString('en-NZ')} contacts. AA raises roughly
        {' '}{vs.invoicesPerYear.toLocaleString('en-NZ')} invoices a year, and about {vs.oneTimePct}% of patients are one-time,
        so a nightly job archives individual contacts once fully paid and inactive (the window is a setting
        in Master data). Active contacts: <strong className="mono">{vs.activeContacts.toLocaleString('en-NZ')}</strong>
        {' '}(narrated scale) · in this demo {activePatientContacts} active and {archivedContacts} archived individual
        contact{archivedContacts === 1 ? '' : 's'}. Scale is narrated with counters, not simulated as records.
      </Callout>
    </DemoSurface>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colours.fg }}>{title}</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: colours.fg }}>{children}</span>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: 'none', background: 'none', padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? neutral.ink : neutral.slate, boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none', cursor: 'pointer' }}
    >
      {children}
    </button>
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
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: on ? semantic.success.tint : neutral.sunken, color: on ? semantic.success.onTint : neutral.slate }}>
      {label}
    </span>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ textAlign: right === true ? 'right' : 'left', padding: '11px 14px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${neutral.line}` }}>
      {children}
    </th>
  )
}

function Td({ children, mono, right }: { children: React.ReactNode; mono?: boolean; right?: boolean }) {
  return (
    <td className={mono === true ? 'mono' : undefined} style={{ padding: '10px 14px', fontSize: 13, color: neutral.ink, textAlign: right === true ? 'right' : 'left', whiteSpace: 'nowrap', borderBottom: `1px solid ${neutral.sunken}` }}>
      {children}
    </td>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: neutral.mist, padding: '8px 0' }}>{children}</div>
}
