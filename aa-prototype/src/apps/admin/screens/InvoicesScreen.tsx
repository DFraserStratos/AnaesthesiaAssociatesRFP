import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import { billedLists, counterpartyName, invoiceCountsByList, useAppStore } from '../../../store'
import { dateTimeMicroCap, dayMicroCap, formatCurrency, hhmm } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'
import { listShortLabel } from '../util'
import { InvoiceDocument } from './InvoiceDocument'

interface InvoicesScreenProps {
  actor: Actor
  selectedInvoiceId: string | null
  onSelect: (invoiceId: string | null) => void
}

const cellStyle = adminCell()
const headCellStyle = adminHead()

/**
 * The invoices raised by the billing run (Phase 08; B6). A table of every
 * invoice with its delivery status, a recently-billed strip, and an inline
 * document view — inline rather than a dialog, because the print stylesheet
 * isolates the `.aa-invoice-doc` node and a fixed-position Dialog ancestor
 * would break `position: absolute` print isolation.
 */
export function InvoicesScreen({ actor, selectedInvoiceId, onSelect }: InvoicesScreenProps) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)

  const invoices = useMemo(
    () => Object.values(billing.invoices).sort((a, b) => b.id.localeCompare(a.id)),
    [billing.invoices],
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: neutral.mist }}>
          <button onClick={() => onSelect(null)} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Invoices</button>
          <span style={{ color: neutral.lineStrong }}> / </span>
          <span className="mono">{invoice?.invoiceNumber}</span>
        </div>
        <button onClick={() => onSelect(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> All invoices
        </button>
        <InvoiceDocument invoiceId={selectedInvoiceId} actor={actor} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Invoices</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 720 }}>
          Raised by the billing run when a list is authorised. Procedures billed to the same counterparty share one
          invoice per Card; where funders differ, separate invoices are raised, one per funder. This reading of the
          RFP split billing wording is held as a discovery question.
        </div>
      </div>

      {/* Recently billed lists */}
      {billed.length > 0 && (
        <div style={{ background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>Recently billed</span>
          {billed.slice(0, 6).map((l) => (
            <div key={l.id} style={{ fontSize: 12.5, color: neutral.ink, display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span>{listShortLabel(l, masters)} · {dayMicroCap(l.dateISO)}</span>
              <span style={{ color: neutral.mist }}>
                billed {hhmm(l.billedAtISO)} · {invoiceCountByList[l.id] ?? 0} invoice{(invoiceCountByList[l.id] ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Billing exceptions (Phase 09 owns the workflow) */}
      {failedCases.length > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: semantic.warning.onTint }}>
            {failedCases.length} card{failedCases.length === 1 ? '' : 's'} raised a billing exception
          </span>
          {failedCases.map((c) => (
            <div key={c.id} style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
              <span className="mono">{c.cardId}</span> · {c.failure?.message ?? 'Needs manual review.'}
            </div>
          ))}
          <span style={{ fontSize: 12, color: semantic.warning.onTint }}>The billing monitor handles retries in Phase 09.</span>
        </div>
      )}

      {invoices.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>
          No invoices yet. Authorise a submitted list and the billing run raises its invoices immediately.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 860 }}>
            <thead>
              <tr>
                {['Number', 'Raised', 'Counterparty', 'Layout', 'Total', 'Status', ''].map((h, i) => (
                  <th key={h === '' ? 'view' : h} style={{ ...headCellStyle, textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono" style={{ ...cellStyle, fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td className="mono" style={cellStyle}>{dateTimeMicroCap(inv.raisedAtISO)}</td>
                  <td style={cellStyle}>{counterpartyName({ masters }, inv.counterparty)}</td>
                  <td style={cellStyle}>{inv.layout === 'patient' ? 'Patient' : 'Contract holder'}</td>
                  <td className="mono" style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                  <td style={cellStyle}>
                    {inv.counterparty.kind === 'insurer' ? (
                      <StatusPill tone="warn" text="Upload portal" />
                    ) : inv.emailedAtISO !== undefined ? (
                      <StatusPill tone="ok" text={`Emailed ${hhmm(inv.emailedAtISO)}`} />
                    ) : (
                      <StatusPill text="Not emailed" />
                    )}
                  </td>
                  <td style={cellStyle}>
                    <button onClick={() => onSelect(inv.id)} style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusPill({ text, tone }: { text: string; tone?: 'ok' | 'warn' }) {
  const colours =
    tone === 'ok'
      ? { background: semantic.success.tint, color: semantic.success.onTint }
      : tone === 'warn'
        ? { background: semantic.warning.tint, color: semantic.warning.onTint }
        : { background: neutral.sunken, color: neutral.slate }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', ...colours }}>
      {text}
    </span>
  )
}
