/**
 * The printed documents' parts (catch-up Phase 39 for the tax invoice and the
 * credit note, shared since catch-up Phase 39a with the remittance advice):
 * one masthead, agent block, meta strip, lines table and totals, so the
 * documents never drift into two families. Lifted from `InvoiceDocument.tsx`
 * unchanged; the lines table gained an optional printed amount (a signed
 * figure) and the totals a list form.
 */

import type { ReactNode } from 'react'
import { fontFamily, neutral, radius } from '../../theme/tokens'
import type { InvoiceAgent, InvoiceSupplier } from '../../domain/types'
import { GST_RATE, OQ29_CAPTION, OQ29_PILL, agentStatement, supplierGstText } from '../../domain/billing/invoicePresentation'
import { dayWithYear } from '../../domain/dateText'
import { dateTimeMicroCap, formatCurrency } from '../format'
import { Pill } from '../ui'
import { Logo } from '../Logo'

export const metaLabel = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: neutral.mist }

export const docCell = {
  padding: '9px 8px',
  fontSize: 13,
  borderBottom: `1px solid ${neutral.line}`,
  verticalAlign: 'top' as const,
}

export const docHead = {
  ...docCell,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: neutral.mist,
  borderBottom: `1.5px solid ${neutral.lineStrong}`,
}

export function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <span style={{ fontSize: 12.5, color: neutral.slate }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, minWidth: 110, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/** The supplier on the left; the heading ("TAX INVOICE", "CREDIT NOTE", "REMITTANCE ADVICE"), the number and its badge on the right, then the lines under it. */
export function DocMasthead({ supplier, heading, number, badge, children }: { supplier: InvoiceSupplier | undefined; heading: string; number: string; badge?: ReactNode; children?: ReactNode }) {
  return (
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
        <div style={{ fontFamily: fontFamily.serif, fontSize: 21, letterSpacing: '0.12em', color: neutral.ink }}>{heading}</div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {badge}
          <span className="mono" style={{ fontSize: 13.5, fontWeight: 700 }}>{number}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * AA as agent (US-08.4.5). On a tax invoice (a BCTI) the wording is
 * provisional (OQ-29) and says so; a credit note and a remittance advice are
 * not BCTIs, so they carry the agency line without the marker (`bcti={false}`).
 */
export function AgentBlock({ supplierName, agent, bcti = true }: { supplierName: string | undefined; agent: InvoiceAgent | undefined; bcti?: boolean }) {
  return (
    <div
      data-shot="invoice-agent-block"
      style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '12px 14px' }}
    >
      <Logo height={20} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div data-shot="invoice-agency-line" style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.ink }}>
          {agentStatement(supplierName ?? 'the anaesthetist', agent)}
        </div>
        {bcti && (
          <div data-shot="invoice-agent-provisional" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Pill size="sm" style={{ flex: 'none' }}>{OQ29_PILL}</Pill>
            <span style={{ fontSize: 11, lineHeight: '16px', color: neutral.mist }}>{OQ29_CAPTION}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/** The meta strip under the masthead, one for both documents: the date (raised or issued), the Procedure date and the internal case reference. */
export function DocMeta({ dateLabel, dateISO, procedureDateISO, caseReference }: { dateLabel: string; dateISO: string | undefined; procedureDateISO: string | undefined; caseReference: string | undefined }) {
  return (
    <div data-shot="invoice-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: `1px solid ${neutral.line}`, borderBottom: `1px solid ${neutral.line}`, padding: '12px 0' }}>
      <div>
        <div style={metaLabel}>{dateLabel}</div>
        <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{dateTimeMicroCap(dateISO)}</div>
      </div>
      <div>
        <div style={metaLabel}>Procedure date</div>
        <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{procedureDateISO !== undefined ? dayWithYear(procedureDateISO) : '·'}</div>
      </div>
      <div>
        <div style={metaLabel}>Case reference</div>
        <div className="mono" style={{ fontSize: 12.5, marginTop: 3 }}>{caseReference ?? '·'}</div>
        <div style={{ fontSize: 10.5, color: neutral.mist }}>internal reference only</div>
      </div>
    </div>
  )
}

export interface DocLineRow {
  key: string
  description: ReactNode
  quantity?: number
  unitAmount?: number
  amount: number
  /** The amount as printed, when it is not a plain one (a signed negative netted on a remittance advice). */
  amountText?: string
  /** `data-line-kind` on the row (fee, discount, adjustment). */
  kind?: string
  /** A hook on the row (`data-shot`; catch-up Phase 39b: `invoice-event-lines`). */
  shot?: string
  /** `data-event-id` on an event's line (catch-up Phase 39b). */
  eventId?: string
}

/**
 * The lines table, one for every document: Description, then the quantity
 * column (`quantityHead`, "Units" on a priced invoice, "Qty" on a free-form
 * one; left out when no line has a quantity, as a credit note's mirrored fee
 * lines), Unit amount on a free-form invoice, and Amount.
 */
export function DocLinesTable({ rows, quantityHead, unitAmount = false, descriptionHead = 'Description' }: { rows: readonly DocLineRow[]; quantityHead: string; unitAmount?: boolean; descriptionHead?: string }) {
  const showQuantity = rows.some((r) => r.quantity !== undefined)
  return (
    <table data-shot="invoice-lines" style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ ...docHead, textAlign: 'left' }}>{descriptionHead}</th>
          {showQuantity && <th style={{ ...docHead, textAlign: 'right', width: 70 }}>{quantityHead}</th>}
          {unitAmount && <th style={{ ...docHead, textAlign: 'right', width: 110 }}>Unit amount</th>}
          <th style={{ ...docHead, textAlign: 'right', width: 110 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} {...(r.kind !== undefined ? { 'data-line-kind': r.kind } : {})} {...(r.shot !== undefined ? { 'data-shot': r.shot } : {})} {...(r.eventId !== undefined ? { 'data-event-id': r.eventId } : {})}>
            <td style={docCell}>{r.description}</td>
            {showQuantity && <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{r.quantity ?? ''}</td>}
            {unitAmount && <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{r.unitAmount !== undefined ? formatCurrency(r.unitAmount) : ''}</td>}
            <td className="mono" style={{ ...docCell, textAlign: 'right' }}>{r.amountText ?? formatCurrency(r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Subtotal, GST and the total ("Total due", "Total credited"). */
export function DocTotals({ subtotal, gst, totalLabel, total }: { subtotal: number; gst: number; totalLabel: string; total: number }) {
  return <DocTotalLines rows={[{ label: 'Subtotal', value: formatCurrency(subtotal) }, { label: `GST (${GST_RATE * 100}%)`, value: formatCurrency(gst) }]} totalLabel={totalLabel} totalValue={formatCurrency(total)} />
}

/** The totals block in its general form: lines, then the ruled total, then any line after it ("Still to net"). */
export function DocTotalLines({ rows, totalLabel, totalValue, after = [], shot = 'invoice-totals', totalShot }: { rows: readonly { label: string; value: string }[]; totalLabel: string; totalValue: string; after?: readonly { label: string; value: string; shot?: string }[]; shot?: string; totalShot?: string }) {
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      {rows.map((r) => (
        <TotalRow key={r.label} label={r.label} value={r.value} />
      ))}
      <div data-shot={totalShot} style={{ display: 'flex', gap: 24, borderTop: `2px solid ${neutral.ink}`, paddingTop: 6, marginTop: 2 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{totalLabel}</span>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{totalValue}</span>
      </div>
      {after.map((r) => (
        <div key={r.label} data-shot={r.shot}>
          <TotalRow label={r.label} value={r.value} />
        </div>
      ))}
    </div>
  )
}
