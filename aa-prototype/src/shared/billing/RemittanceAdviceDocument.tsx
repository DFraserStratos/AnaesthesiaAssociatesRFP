/**
 * A remittance advice (catch-up Phase 39a; US-10.2.5: "the anaesthetist sees
 * the run washed up in their remittance advice"): REMITTANCE ADVICE on the
 * same sheet parts as the tax invoice and the credit note (`docParts`): the
 * anaesthetist as supplier, Anaesthesia Associates as agent, the payment run's
 * week, paid on and paid to, every BCTI paid, every negative invoice netted as
 * a signed amount, and the totals. One component for the Admin document and
 * web Accounts' sheet, read only. Held lines are not on it; no NHI. Negative
 * amounts are neutral, never red.
 */

import { formatCurrency, formatSignedCurrency, plural, shortDay } from '../format'
import { neutral } from '../../theme/tokens'
import { AA_AGENT } from '../../domain/billing/invoicePresentation'
import { Pill } from '../ui'
import { AgentBlock, DocLinesTable, DocMasthead, DocTotalLines, metaLabel, type DocLineRow } from './docParts'
import type { RemittanceAdviceView } from '../../store/remittanceSelectors'

export const REMITTANCE_COPY = {
  heading: 'REMITTANCE ADVICE',
  awaitingXero: 'Awaiting confirmation from Xero',
  noBank: 'No bank account on file',
  bctisPaid: 'BCTIs paid',
  negativesNetted: 'Negatives netted',
  paidToYou: 'Paid to you',
  stillToNet: 'Still to net in a later payment run',
  negativeLine: (number: string, creditOf: string) => (creditOf !== '' ? `Negative invoice ${number} · credit of ${creditOf}` : `Negative invoice ${number}`),
} as const

function Meta({ label, children, shot }: { label: string; children: React.ReactNode; shot?: string }) {
  return (
    <div data-shot={shot}>
      <div style={metaLabel}>{label}</div>
      <div className="mono" style={{ fontSize: 12.5, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

export function RemittanceAdviceDocument({ advice, shot = 'remittance-advice' }: { advice: RemittanceAdviceView; shot?: string }) {
  const rows: DocLineRow[] = [
    ...advice.lines.map((l) => ({
      key: l.pairId,
      description: (
        <span data-remittance-line={l.pairId}>
          <span className="mono" style={{ fontWeight: 600 }}>{l.billNumber}</span>
          <span style={{ color: neutral.slate }}>{' · '}</span>
          <span className="mono">{l.invoiceNumber}</span>
          <span style={{ color: neutral.slate }}>{` · ${shortDay(l.serviceDateISO)} · ${l.payerName}`}</span>
        </span>
      ),
      amount: l.amount,
    })),
    ...advice.netted.map((n) => ({ key: n.negativeInvoiceId, description: REMITTANCE_COPY.negativeLine(n.number, n.creditOf), amount: -n.amount, amountText: formatSignedCurrency(-n.amount), shot: 'remittance-netted' })),
  ]
  const totals = [{ label: `${REMITTANCE_COPY.bctisPaid} (${plural(advice.lines.length, 'BCTI')})`, value: formatCurrency(advice.positives) }]
  if (advice.nettedTotal > 0) totals.push({ label: REMITTANCE_COPY.negativesNetted, value: formatSignedCurrency(-advice.nettedTotal) })
  return (
    <div data-shot={shot} data-run-id={advice.run.id} style={{ display: 'flex', flexDirection: 'column', gap: 22, color: neutral.ink }}>
      <DocMasthead supplier={advice.supplier} heading={REMITTANCE_COPY.heading} number={advice.reference} />

      <div data-shot="remittance-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, borderTop: `1px solid ${neutral.line}`, borderBottom: `1px solid ${neutral.line}`, padding: '12px 0' }}>
        <Meta label="To">
          <span style={{ fontFamily: 'inherit' }}>{advice.anaesthetistName}</span>
          {advice.hpiId !== undefined && <span style={{ color: neutral.slate }}>{`HPI CPN ${advice.hpiId}`}</span>}
        </Meta>
        <Meta label="Payment run" shot="remittance-week">
          <span>{`${advice.week}, ${advice.run.isoYear}`}</span>
          <span style={{ color: neutral.slate }}>{advice.run.id}</span>
        </Meta>
        <Meta label="Paid on">
          <span>{advice.paidOnISO !== undefined && advice.status === 'paid' ? shortDay(advice.paidOnISO.slice(0, 10)) : REMITTANCE_COPY.awaitingXero}</span>
        </Meta>
        <Meta label="Paid to">
          <span>{advice.paidTo ?? REMITTANCE_COPY.noBank}</span>
        </Meta>
      </div>

      {/* A remittance advice is not a BCTI: the agency line without the OQ-29 marker. */}
      <AgentBlock supplierName={advice.supplier?.name ?? advice.anaesthetistName} agent={AA_AGENT} bcti={false} />

      <DocLinesTable rows={rows} quantityHead="" descriptionHead="BCTI · invoice · service date · payer" />

      <DocTotalLines
        rows={totals}
        totalLabel={REMITTANCE_COPY.paidToYou}
        totalValue={formatCurrency(advice.net)}
        totalShot="remittance-net"
        after={advice.remainingToNet > 0 ? [{ label: REMITTANCE_COPY.stillToNet, value: formatSignedCurrency(-advice.remainingToNet), shot: 'remittance-still-to-net' }] : []}
      />
      <div>
        <Pill size="sm" tone={advice.status === 'paid' ? 'success' : 'warning'}>{advice.status === 'paid' ? 'Paid' : 'Awaiting Xero'}</Pill>
      </div>
    </div>
  )
}
