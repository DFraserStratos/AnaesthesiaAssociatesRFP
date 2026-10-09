import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addMonths, format, parseISO } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { AaFeeFixedItem, AaFeeSettings } from '../../../domain/types'
import { aaFeeFixedTotal, aaFeeFor, aaFeeMonthLabel, validateAaFeeSettings } from '../../../domain/billing/aaFee'
import {
  aaFeeRunDisabledReason,
  aaFeeRunPreview,
  allAaFeeInvoices,
  runMonthlyFeeInvoices,
  saveAaFeeSettings,
  useAppStore,
  useToday,
  type Actor,
  type AaFeeInvoiceRow,
} from '../../../store'
import { useDemoTriggerContext } from '../../../shared/demoTriggers'
import { drSurname, formatCurrency } from '../../../shared/format'
import { cellStyle as cellFactory, headCellStyle as headFactory } from '../tableChrome'

export type AaFeesTab = 'invoices' | 'settings'

const cellStyle = cellFactory()
const headCellStyle = headFactory()
const numCell = { ...cellStyle, textAlign: 'right' as const }
const numHead = { ...headCellStyle, textAlign: 'right' as const }

/** The worked example's BCTI count (US-10.3.1's acceptance example). */
const EXAMPLE_BCTIS = 40
/** The earliest month the picker offers: fee invoice numbers carry the demo year. */
const FIRST_MONTH = '2026-01'

function dateLabel(iso: string | undefined): string {
  return iso === undefined ? '·' : format(parseISO(iso.slice(0, 10)), 'd MMM yyyy')
}

/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1 to US-10.3.3): the
 * monthly fee invoice run and every fee invoice paid or unpaid, and the fee
 * settings (fixed items plus a charge per BCTI, ex GST). Two sub-tabs, each a
 * URL under the Billing section.
 */
export function AaFeesScreen({ actor, tab }: { actor: Actor; tab: AaFeesTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>AA fee invoices</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 780 }}>
          AA invoices each anaesthetist its own fee once a month: fixed charges plus a charge for each
          buyer-created tax invoice (BCTI) paid that month. It is a separate invoice, never taken out of a
          payment to the anaesthetist.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}` }}>
        <TabLink active={tab === 'invoices'} to="/admin/billing/aa-fees">Fee invoices</TabLink>
        <TabLink active={tab === 'settings'} to="/admin/billing/aa-fees/settings">Fee settings</TabLink>
      </div>

      {tab === 'invoices' ? <FeeInvoicesTab actor={actor} /> : <FeeSettingsTab actor={actor} />}
    </div>
  )
}

function TabLink({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      style={{
        padding: '10px 14px',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? neutral.ink : neutral.slate,
        boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Fee invoices
// ---------------------------------------------------------------------------

function FeeInvoicesTab({ actor }: { actor: Actor }) {
  const todayISO = useToday()
  const currentMonth = todayISO.slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  // A Reset or a clock change can leave the picker ahead of the demo month.
  useEffect(() => {
    if (month > currentMonth) setMonth(currentMonth)
  }, [month, currentMonth])
  useDemoTriggerContext('aaFees.month', month)

  const billing = useAppStore((s) => s.billing)
  const xero = useAppStore((s) => s.xero)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const preview = useMemo(() => aaFeeRunPreview({ billing, xero, masters, appSettings }, month), [billing, xero, masters, appSettings, month])
  const invoices = useMemo(() => allAaFeeInvoices({ billing }), [billing])
  const disabledReason = aaFeeRunDisabledReason({ clock, masters, billing }, month)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  function step(delta: number) {
    const next = format(addMonths(parseISO(`${month}-01`), delta), 'yyyy-MM')
    if (next > currentMonth || next < FIRST_MONTH) return
    setMonth(next)
    setResult(null)
  }

  function run() {
    const res = runMonthlyFeeInvoices(useAppStore, actor, { monthISO: month })
    setResult(
      !res.ok
        ? { ok: false, text: res.message }
        : {
            ok: true,
            text:
              res.value.raisedCount === 0
                ? `Nothing to raise for ${aaFeeMonthLabel(month)}.`
                : `Raised ${res.value.raisedCount} fee invoice${res.value.raisedCount === 1 ? '' : 's'} for ${aaFeeMonthLabel(month)}, ${formatCurrency(res.value.total)} incl GST.`,
          },
    )
  }

  const pendingTotal = preview.filter((r) => r.invoice === undefined).reduce((sum, r) => sum + r.subtotal, 0)

  return (
    <div data-shot="admin-aa-fee-invoices" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: `1px solid ${neutral.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StepButton label="Previous month" onClick={() => step(-1)} disabled={month <= FIRST_MONTH}>
              <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
            </StepButton>
            <div data-testid="aa-fee-month" style={{ minWidth: 128, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
              {aaFeeMonthLabel(month)}
            </div>
            <StepButton label="Next month" onClick={() => step(1)} disabled={month >= currentMonth}>
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
            </StepButton>
          </div>
          <div style={{ flex: 1, minWidth: 240, fontSize: 12.5, color: neutral.slate }}>
            The real run is made at month end; in the demo, running the current month invoices it to date.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button
              type="button"
              onClick={run}
              disabled={disabledReason !== null}
              style={{
                minHeight: 38,
                padding: '0 16px',
                borderRadius: radius.ctl,
                border: 'none',
                background: disabledReason !== null ? neutral.line : accent.base,
                color: disabledReason !== null ? neutral.mist : '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: disabledReason !== null ? 'default' : 'pointer',
              }}
            >
              Run monthly fee invoices
            </button>
            {disabledReason !== null && <div style={{ fontSize: 12, color: neutral.mist }}>{disabledReason}</div>}
          </div>
        </div>
        {result !== null && (
          <div
            role="status"
            style={{
              padding: '9px 16px',
              fontSize: 12.5,
              background: result.ok ? semantic.success.tint : semantic.error.tint,
              color: result.ok ? semantic.success.onTint : semantic.error.onTint,
            }}
          >
            {result.text}
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="aa-fee-preview" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={headCellStyle}>Anaesthetist</th>
                <th style={numHead}>BCTIs paid</th>
                <th style={numHead}>Fixed</th>
                <th style={numHead}>Per-BCTI</th>
                <th style={numHead}>Fee (ex GST)</th>
                <th style={headCellStyle}>Invoiced</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.anaesthetistId} data-testid={`aa-fee-preview-${row.anaesthetistId}`}>
                  <td style={cellStyle}>{drSurname(row.anaesthetistName)}</td>
                  <td style={numCell} className="mono">{row.bctiCount}</td>
                  <td style={numCell} className="mono">{formatCurrency(row.fixedTotal)}</td>
                  <td style={numCell} className="mono">{formatCurrency(row.perBctiTotal)}</td>
                  <td style={{ ...numCell, fontWeight: 600 }} className="mono">{formatCurrency(row.subtotal)}</td>
                  <td style={cellStyle} className={row.invoice !== undefined ? 'mono' : undefined}>
                    {row.invoice !== undefined ? row.invoice.invoiceNumber : <span style={{ color: neutral.mist }}>Not yet</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...cellStyle, borderBottom: 'none', color: neutral.slate }} colSpan={4}>
                  Still to invoice for {aaFeeMonthLabel(month)} (ex GST)
                </td>
                <td style={{ ...numCell, borderBottom: 'none', fontWeight: 700 }} className="mono">{formatCurrency(pendingTotal)}</td>
                <td style={{ ...cellStyle, borderBottom: 'none' }} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, lineHeight: 1.5, color: neutral.slate, maxWidth: 780 }}>
        <span data-testid="aa-fee-count-rule">
          Counts one BCTI per receivable invoice, once, against the anaesthetist who did the procedure, in the
          month its invoice is paid in full. Being confirmed with AA's accountant.
        </span>
        <span>Always a separate invoice, paid into AA's own account and never deducted from a payment to the anaesthetist.</span>
      </div>

      <FeeInvoiceList invoices={invoices} />
    </div>
  )
}

function StepButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.ctl,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        color: disabled ? neutral.lineStrong : neutral.ink,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function FeeInvoiceList({ invoices }: { invoices: AaFeeInvoiceRow[] }) {
  const masters = useAppStore((s) => s.masters)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', fontSize: 14, fontWeight: 700 }}>Every fee invoice</div>
      {invoices.length === 0 ? (
        <div style={{ padding: '0 16px 16px', fontSize: 13, color: neutral.mist }}>No fee invoices yet. Run a month above.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="aa-fee-invoices" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={{ ...headCellStyle, width: 28 }} aria-label="Expand" />
                <th style={headCellStyle}>Number</th>
                <th style={headCellStyle}>Anaesthetist</th>
                <th style={headCellStyle}>Month</th>
                <th style={numHead}>BCTIs</th>
                <th style={numHead}>Fee (ex GST)</th>
                <th style={numHead}>GST</th>
                <th style={numHead}>Total</th>
                <th style={headCellStyle}>Raised</th>
                <th style={headCellStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((f) => {
                const expanded = open === f.id
                const name = masters.anaesthetists[f.anaesthetistId]?.name ?? f.anaesthetistId
                return (
                  <Fragment key={f.id}>
                    <tr
                      data-testid={`aa-fee-row-${f.invoiceNumber}`}
                      className="aa-clickable-table-row"
                      onClick={() => setOpen(expanded ? null : f.id)}
                      style={{ background: expanded ? neutral.bg : undefined }}
                    >
                      <td style={cellStyle}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={`${expanded ? 'Hide' : 'Show'} ${f.invoiceNumber} details`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpen(expanded ? null : f.id)
                          }}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: neutral.slate, display: 'inline-flex' }}
                        >
                          {expanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                        </button>
                      </td>
                      <td style={{ ...cellStyle, fontWeight: 600 }} className="mono">{f.invoiceNumber}</td>
                      <td style={cellStyle}>{drSurname(name)}</td>
                      <td style={cellStyle}>{aaFeeMonthLabel(f.monthISO)}</td>
                      <td style={numCell} className="mono">{f.bctiCount}</td>
                      <td style={numCell} className="mono">{formatCurrency(f.subtotal)}</td>
                      <td style={numCell} className="mono">{formatCurrency(f.gst)}</td>
                      <td style={{ ...numCell, fontWeight: 600 }} className="mono">{formatCurrency(f.total)}</td>
                      <td style={cellStyle} className="mono">{dateLabel(f.raisedAtISO)}</td>
                      <td style={cellStyle}><FeeStatusPill row={f} /></td>
                    </tr>
                    {expanded && (
                      <tr data-testid={`aa-fee-detail-${f.invoiceNumber}`}>
                        <td style={{ ...cellStyle, background: neutral.bg }} />
                        <td colSpan={9} style={{ ...cellStyle, background: neutral.bg }}>
                          <FeeInvoiceDetail row={f} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function FeeStatusPill({ row }: { row: AaFeeInvoiceRow }) {
  const paid = row.status === 'paid'
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '3px 9px',
        borderRadius: radius.pill,
        whiteSpace: 'nowrap',
        fontSize: 11.5,
        fontWeight: 600,
        color: paid ? semantic.success.onTint : neutral.slate,
        background: paid ? semantic.success.tint : neutral.sunken,
      }}
    >
      {paid ? `Paid ${dateLabel(row.paidAtISO)}` : 'Unpaid'}
    </span>
  )
}

function FeeInvoiceDetail({ row }: { row: AaFeeInvoiceRow }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(320px, 1.4fr)', gap: 24, padding: '4px 0' }}>
      <div>
        <DetailLabel>Lines (ex GST)</DetailLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {row.lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
              <span>{line.description}</span>
              <span className="mono">{formatCurrency(line.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, borderTop: `1px solid ${neutral.line}`, paddingTop: 4 }}>
            <span>GST</span>
            <span className="mono">{formatCurrency(row.gst)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, fontWeight: 700 }}>
            <span>Total</span>
            <span className="mono">{formatCurrency(row.total)}</span>
          </div>
        </div>
      </div>
      <div>
        <DetailLabel>Counted BCTIs ({row.bctiCount})</DetailLabel>
        {row.bctis.length === 0 ? (
          <div style={{ marginTop: 6, fontSize: 12.5, color: neutral.mist }}>No BCTIs paid in {aaFeeMonthLabel(row.monthISO)}: fixed charges only.</div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headCellStyle, background: 'transparent' }}>BCTI (ACCPAY)</th>
                  <th style={{ ...headCellStyle, background: 'transparent' }}>Procedure invoice</th>
                  <th style={{ ...headCellStyle, background: 'transparent' }}>Issued</th>
                  <th style={{ ...headCellStyle, background: 'transparent' }}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {row.bctis.map((b) => (
                  <tr key={b.accPayId}>
                    <td style={{ ...cellStyle, padding: '5px 10px' }} className="mono">{b.billNumber}</td>
                    <td style={{ ...cellStyle, padding: '5px 10px' }} className="mono">{b.receivableInvoiceNumber}</td>
                    <td style={{ ...cellStyle, padding: '5px 10px' }} className="mono">{dateLabel(b.issuedAtISO)}</td>
                    <td style={{ ...cellStyle, padding: '5px 10px' }} className="mono">{dateLabel(b.receivablePaidAtISO)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{children}</div>
}

// ---------------------------------------------------------------------------
// Fee settings
// ---------------------------------------------------------------------------

interface DraftItem {
  id: string
  description: string
  amount: string
}

function toDraft(settings: AaFeeSettings): { items: DraftItem[]; perBcti: string } {
  return {
    items: settings.fixedItems.map((item) => ({ id: item.id, description: item.description, amount: item.amount.toFixed(2) })),
    perBcti: settings.perBctiCharge.toFixed(2),
  }
}

function parseAmount(text: string): number {
  const trimmed = text.replace(/[$,\s]/g, '')
  return trimmed === '' ? Number.NaN : Number(trimmed)
}

function fromDraft(items: DraftItem[], perBcti: string): AaFeeSettings {
  return {
    fixedItems: items.map((item): AaFeeFixedItem => ({ id: item.id, description: item.description, amount: parseAmount(item.amount) })),
    perBctiCharge: parseAmount(perBcti),
  }
}

function nextItemId(items: DraftItem[]): string {
  let n = items.length + 1
  while (items.some((item) => item.id === `FX${n}`)) n += 1
  return `FX${n}`
}

function FeeSettingsTab({ actor }: { actor: Actor }) {
  const saved = useAppStore((s) => s.appSettings.aaFee)
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(saved).items)
  const [perBcti, setPerBcti] = useState(() => toDraft(saved).perBcti)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  // Re-sync the form whenever the stored settings change (a save, or a Reset).
  useEffect(() => {
    const next = toDraft(saved)
    setItems(next.items)
    setPerBcti(next.perBcti)
  }, [saved])

  const draft = fromDraft(items, perBcti)
  const invalid = validateAaFeeSettings(draft)
  const example = invalid === null ? aaFeeFor(draft, EXAMPLE_BCTIS) : null

  function update(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setMessage(null)
  }

  function save() {
    const res = saveAaFeeSettings(useAppStore, actor, draft)
    setMessage(res.ok ? { ok: true, text: 'Fee settings saved. They apply from the next monthly run.' } : { ok: false, text: res.message })
  }

  const inputStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    minHeight: 40,
    borderRadius: radius.ctl,
    border: `1px solid ${neutral.line}`,
    background: neutral.bg,
    padding: '0 12px',
    fontFamily: 'inherit',
    fontSize: 14,
    color: neutral.ink,
  }

  return (
    <div data-shot="admin-aa-fee-settings" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 }}>
      <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Monthly fee schedule</div>
          <span data-testid="aa-fee-sample" style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, fontSize: 11.5, fontWeight: 600 }}>
            Sample schedule
          </span>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: neutral.slate }}>
          A sample until AA's accountant supplies the real fixed charges. Amounts exclude GST; GST is added at
          the foot of each fee invoice. Changes apply from the next monthly run. Raised fee invoices keep the
          settings they were raised with.
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist, marginBottom: 6 }}>
            <span>Fixed item</span>
            <span style={{ textAlign: 'right' }}>Amount (ex GST)</span>
            <span />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, index) => (
              <div key={item.id} data-testid={`aa-fee-item-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, alignItems: 'center' }}>
                <input aria-label={`Fixed item ${index + 1} description`} value={item.description} onChange={(e) => update(item.id, { description: e.target.value })} style={inputStyle} />
                <input aria-label={`Fixed item ${index + 1} amount`} value={item.amount} onChange={(e) => update(item.id, { amount: e.target.value })} className="mono" inputMode="decimal" style={{ ...inputStyle, textAlign: 'right' }} />
                <button
                  type="button"
                  aria-label={`Remove ${item.description.trim() === '' ? `fixed item ${index + 1}` : item.description}`}
                  onClick={() => {
                    setItems((prev) => prev.filter((x) => x.id !== item.id))
                    setMessage(null)
                  }}
                  style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer' }}
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setItems((prev) => [...prev, { id: nextItemId(prev), description: '', amount: '0.00' }])
              setMessage(null)
            }}
            style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', padding: '6px 0', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: accent.pressed, cursor: 'pointer' }}
          >
            <Plus size={15} aria-hidden /> Add item
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, alignItems: 'center', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
          <label htmlFor="aa-fee-per-bcti" style={{ fontSize: 13.5, fontWeight: 600 }}>Charge per BCTI paid that month (ex GST)</label>
          <input id="aa-fee-per-bcti" value={perBcti} onChange={(e) => { setPerBcti(e.target.value); setMessage(null) }} className="mono" inputMode="decimal" style={{ ...inputStyle, textAlign: 'right' }} />
          <span />
        </div>

        <div data-testid="aa-fee-example" style={{ background: neutral.bg, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
          {example === null ? (
            <span style={{ color: neutral.mist }}>Fix the settings to see the worked example.</span>
          ) : (
            <>
              With {EXAMPLE_BCTIS} BCTIs:{' '}
              <span className="mono">
                {formatCurrency(aaFeeFixedTotal(draft))} + {formatCurrency(draft.perBctiCharge)} x {EXAMPLE_BCTIS} = <strong>{formatCurrency(example.subtotal)}</strong>
              </span>
              , plus GST at the foot of the invoice.
            </>
          )}
        </div>

        {invalid !== null && (
          <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '8px 12px', fontSize: 12.5 }}>
            {invalid}
          </div>
        )}
        {message !== null && (
          <div role="status" style={{ background: message.ok ? semantic.success.tint : semantic.error.tint, color: message.ok ? semantic.success.onTint : semantic.error.onTint, borderRadius: radius.ctl, padding: '8px 12px', fontSize: 12.5 }}>
            {message.text}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={save}
            disabled={invalid !== null}
            style={{ minHeight: 40, padding: '0 18px', borderRadius: radius.ctl, border: 'none', background: invalid !== null ? neutral.line : accent.base, color: invalid !== null ? neutral.mist : '#FFFFFF', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: invalid !== null ? 'default' : 'pointer' }}
          >
            Save settings
          </button>
        </div>
      </section>
    </div>
  )
}
