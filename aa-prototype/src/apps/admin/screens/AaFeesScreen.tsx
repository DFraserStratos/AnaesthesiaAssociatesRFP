import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { addMonths, format, parseISO } from 'date-fns'
import { Plus, X } from 'lucide-react'
import { accent, neutral, radius } from '../../../theme/tokens'
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
import { drSurname, formatCurrency, parseAmountOrNaN, plainDate, plural } from '../../../shared/format'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import { Pill } from '../../../shared/ui/Pill'
import { Button, Card, DisclosureButton, Eyebrow, FormError, IconButton, LineTabLink, LineTabs, TextField, visuallyHidden } from '../../../shared/ui'
import { ResultLine } from '../../../shared/ui/ResultLine'
import { AdminPage } from '../components/AdminPage'
import { ADMIN_FORM_WIDTH, ADMIN_PROSE_WIDTH } from '../layout'

export type AaFeesTab = 'invoices' | 'settings'

/** The worked example's BCTI count (US-10.3.1's acceptance example). */
const EXAMPLE_BCTIS = 40
/** The earliest month the picker offers: fee invoice numbers carry the demo year. */
const FIRST_MONTH = '2026-01'

function dateLabel(iso: string | undefined): string {
  return iso === undefined ? '·' : plainDate(iso.slice(0, 10))
}

/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1 to US-10.3.3): the
 * monthly fee invoice run and every fee invoice paid or unpaid, and the fee
 * settings (fixed items plus a charge per BCTI, ex GST). Two sub-tabs, each a
 * URL under the Billing section.
 */
export function AaFeesScreen({ actor, tab }: { actor: Actor; tab: AaFeesTab }) {
  return (
    <AdminPage
      mode="fluid"
      title="AA fee invoices"
      sub="AA invoices each anaesthetist its fee monthly: fixed charges plus a charge per buyer-created tax invoice (BCTI) paid. A separate invoice, never deducted from a payment."
      tabs={
        <LineTabs label="AA fees">
          <LineTabLink active={tab === 'invoices'} to="/admin/billing/aa-fees">Fee invoices</LineTabLink>
          <LineTabLink active={tab === 'settings'} to="/admin/billing/aa-fees/settings">Fee settings</LineTabLink>
        </LineTabs>
      }
    >
      {tab === 'invoices' ? <FeeInvoicesTab actor={actor} /> : <FeeSettingsTab actor={actor} />}
    </AdminPage>
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
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const preview = useMemo(() => aaFeeRunPreview({ billing, masters, appSettings }, month), [billing, masters, appSettings, month])
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
                : `Raised ${plural(res.value.raisedCount, 'fee invoice')} for ${aaFeeMonthLabel(month)}, ${formatCurrency(res.value.total)} incl GST.`,
          },
    )
  }

  const pendingTotal = preview.filter((r) => r.invoice === undefined).reduce((sum, r) => sum + r.subtotal, 0)

  return (
    <div data-shot="admin-aa-fee-invoices" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card flush elevation="e1" style={{ overflow: 'hidden', gap: 0, display: 'block' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: `1px solid ${neutral.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconButton size={36} label="Previous month" onClick={() => step(-1)} disabled={month <= FIRST_MONTH}>
              ‹
            </IconButton>
            <div data-testid="aa-fee-month" style={{ minWidth: 128, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
              {aaFeeMonthLabel(month)}
            </div>
            <IconButton size={36} label="Next month" onClick={() => step(1)} disabled={month >= currentMonth}>
              ›
            </IconButton>
          </div>
          <div style={{ flex: 1, minWidth: 240, fontSize: 12.5, color: neutral.slate }}>
            The real run is made at month end; in the demo, running the current month invoices it to date.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <Button variant="primary" size="compact" onClick={run} disabled={disabledReason !== null} disabledReason={disabledReason ?? undefined}>
              Run monthly fee invoices
            </Button>
          </div>
        </div>
        <ResultLine shot="aa-fee-run-result" line={result?.ok === true ? result.text : null} style={{ margin: '0 16px 12px' }} />
        <FormError message={result?.ok === false ? result.text : null} style={{ margin: '0 16px 12px' }} />
        <TableShell label={`AA fee run, ${aaFeeMonthLabel(month)}`} density="compact" minWidth={720} bare tableData={{ 'data-testid': 'aa-fee-preview' }}>
            <thead>
              <tr>
                <Th>Anaesthetist</Th>
                <Th align="right">BCTIs paid</Th>
                <Th align="right">Fixed</Th>
                <Th align="right">Per-BCTI</Th>
                <Th align="right">Fee (ex GST)</Th>
                <Th>Invoiced</Th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.anaesthetistId} data-testid={`aa-fee-preview-${row.anaesthetistId}`}>
                  <Td>{drSurname(row.anaesthetistName)}</Td>
                  <Td align="right" mono>{row.bctiCount}</Td>
                  <Td align="right" mono>{formatCurrency(row.fixedTotal)}</Td>
                  <Td align="right" mono>{formatCurrency(row.perBctiTotal)}</Td>
                  <Td align="right" mono bold>{formatCurrency(row.subtotal)}</Td>
                  <Td mono={row.invoice !== undefined}>
                    {row.invoice !== undefined ? row.invoice.invoiceNumber : <span style={{ color: neutral.mist }}>Not yet</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <Td colSpan={4} style={{ borderBottom: 'none', color: neutral.slate }}>
                  Still to invoice for {aaFeeMonthLabel(month)} (ex GST)
                </Td>
                <Td align="right" mono style={{ borderBottom: 'none', fontWeight: 700 }}>{formatCurrency(pendingTotal)}</Td>
                <Td style={{ borderBottom: 'none' }} />
              </tr>
            </tfoot>
        </TableShell>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, lineHeight: 1.5, color: neutral.slate, maxWidth: ADMIN_PROSE_WIDTH }}>
        <span data-testid="aa-fee-count-rule">
          Counts one BCTI per receivable invoice, once, against the anaesthetist who did the procedure, in the
          month its invoice is paid in full. Provisional: being confirmed with AA's accountant (OQ-29, OQ-60).
        </span>
        <span>Always a separate invoice, paid into AA's own account and never deducted from a payment to the anaesthetist.</span>
      </div>

      <FeeInvoiceList invoices={invoices} />
    </div>
  )
}

function FeeInvoiceList({ invoices }: { invoices: AaFeeInvoiceRow[] }) {
  const masters = useAppStore((s) => s.masters)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Card flush elevation="e1" title="Every fee invoice" style={{ overflow: 'hidden' }}>
      {invoices.length === 0 ? (
        <div style={{ padding: '0 16px 16px', fontSize: 13, color: neutral.mist }}>No fee invoices yet. Run a month above.</div>
      ) : (
        <TableShell label="Every fee invoice" density="compact" minWidth={860} bare tableData={{ 'data-testid': 'aa-fee-invoices' }}>
            <thead>
              <tr>
                <Th width={28}><span style={visuallyHidden}>Expand</span></Th>
                <Th>Number</Th>
                <Th>Anaesthetist</Th>
                <Th>Month</Th>
                <Th align="right">BCTIs</Th>
                <Th align="right">Fee (ex GST)</Th>
                <Th align="right">GST</Th>
                <Th align="right">Total</Th>
                <Th>Raised</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((f) => {
                const expanded = open === f.id
                const name = masters.anaesthetists[f.anaesthetistId]?.name ?? f.anaesthetistId
                return (
                  <Fragment key={f.id}>
                    <ClickableRow
                      align="top"
                      data-testid={`aa-fee-row-${f.invoiceNumber}`}
                      onOpen={() => setOpen(expanded ? null : f.id)}
                      {...(expanded ? { style: { background: neutral.bg } } : {})}
                    >
                      <Td>
                        <DisclosureButton
                          open={expanded}
                          label={`${expanded ? 'Hide' : 'Show'} ${f.invoiceNumber} details`}
                          onToggle={() => setOpen(expanded ? null : f.id)}
                        />
                      </Td>
                      <Td mono bold>{f.invoiceNumber}</Td>
                      <Td>{drSurname(name)}</Td>
                      <Td>{aaFeeMonthLabel(f.monthISO)}</Td>
                      <Td align="right" mono>{f.bctiCount}</Td>
                      <Td align="right" mono>{formatCurrency(f.subtotal)}</Td>
                      <Td align="right" mono>{formatCurrency(f.gst)}</Td>
                      <Td align="right" mono bold>{formatCurrency(f.total)}</Td>
                      <Td mono>{dateLabel(f.raisedAtISO)}</Td>
                      <Td><FeeStatusPill row={f} /></Td>
                    </ClickableRow>
                    {expanded && (
                      <tr data-testid={`aa-fee-detail-${f.invoiceNumber}`}>
                        <Td style={{ background: neutral.bg }} />
                        <Td colSpan={9} style={{ background: neutral.bg }}>
                          <FeeInvoiceDetail row={f} />
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
        </TableShell>
      )}
    </Card>
  )
}

function FeeStatusPill({ row }: { row: AaFeeInvoiceRow }) {
  const paid = row.status === 'paid'
  return (
    <Pill size="lg" tone={paid ? 'success' : 'neutral'}>
      {paid ? `Paid ${dateLabel(row.paidAtISO)}` : 'Unpaid'}
    </Pill>
  )
}

function FeeInvoiceDetail({ row }: { row: AaFeeInvoiceRow }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(320px, 1.4fr)', gap: 24, padding: '4px 0' }}>
      <div>
        <Eyebrow>Lines (ex GST)</Eyebrow>
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
        <Eyebrow>Counted BCTIs ({row.bctiCount})</Eyebrow>
        {row.bctis.length === 0 ? (
          <div style={{ marginTop: 6, fontSize: 12.5, color: neutral.mist }}>No BCTIs paid in {aaFeeMonthLabel(row.monthISO)}: fixed charges only.</div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Th style={{ background: 'transparent' }}>BCTI (ACCPAY)</Th>
                  <Th style={{ background: 'transparent' }}>Procedure invoice</Th>
                  <Th style={{ background: 'transparent' }}>Issued</Th>
                  <Th style={{ background: 'transparent' }}>Paid</Th>
                </tr>
              </thead>
              <tbody>
                {row.bctis.map((b) => (
                  <tr key={b.accPayId}>
                    <Td mono style={{ padding: '5px 10px' }}>{b.billNumber}</Td>
                    <Td mono style={{ padding: '5px 10px' }}>{b.receivableInvoiceNumber}</Td>
                    <Td mono style={{ padding: '5px 10px' }}>{dateLabel(b.issuedAtISO)}</Td>
                    <Td mono style={{ padding: '5px 10px' }}>{dateLabel(b.receivablePaidAtISO)}</Td>
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


function fromDraft(items: DraftItem[], perBcti: string): AaFeeSettings {
  return {
    fixedItems: items.map((item): AaFeeFixedItem => ({ id: item.id, description: item.description, amount: parseAmountOrNaN(item.amount) })),
    perBctiCharge: parseAmountOrNaN(perBcti),
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
  const itemsRef = useRef<HTMLDivElement>(null)
  const addItemRef = useRef<HTMLButtonElement>(null)
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

  return (
    <div data-shot="admin-aa-fee-settings" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: ADMIN_FORM_WIDTH }}>
      <Card
        title="Monthly fee schedule"
        aside={<Pill data-testid="aa-fee-sample">Sample schedule</Pill>}
        style={{ gap: 14 }}
      >
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: neutral.slate }}>
          A sample until AA's accountant supplies the real fixed charges. Amounts exclude GST; GST is added at
          the foot of each fee invoice. Changes apply from the next monthly run. Raised fee invoices keep the
          settings they were raised with.
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, marginBottom: 6 }}>
            <Eyebrow as="span">Fixed item</Eyebrow>
            <Eyebrow as="span" style={{ textAlign: 'right' }}>Amount (ex GST)</Eyebrow>
            <span />
          </div>
          <div ref={itemsRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, index) => (
              <div key={item.id} data-testid={`aa-fee-item-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 8, alignItems: 'center' }}>
                <TextField label={`Fixed item ${index + 1} description`} hideLabel size="compact" value={item.description} onChange={(v) => update(item.id, { description: v })} />
                <TextField label={`Fixed item ${index + 1} amount`} hideLabel size="compact" mono inputMode="decimal" align="right" value={item.amount} onChange={(v) => update(item.id, { amount: v })} />
                <IconButton
                  size={36}
                  label={`Remove ${item.description.trim() === '' ? `fixed item ${index + 1}` : item.description}`}
                  // the row goes with its button: focus the next row's remove, else the last one left, else Add item
                  returnFocusTo={() => {
                    const removes = Array.from(itemsRef.current?.querySelectorAll<HTMLElement>('[data-fee-remove]') ?? []).filter((_, i) => i !== index)
                    return removes[Math.min(index, removes.length - 1)] ?? addItemRef.current
                  }}
                  data-fee-remove
                  onClick={() => {
                    setItems((prev) => prev.filter((x) => x.id !== item.id))
                    setMessage(null)
                  }}
                >
                  <X size={16} aria-hidden />
                </IconButton>
              </div>
            ))}
          </div>
          <button
            ref={addItemRef}
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
          {/* The visible words stay this row's own; the field carries them as its name. */}
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Charge per BCTI paid that month (ex GST)</span>
          <TextField label="Charge per BCTI paid that month (ex GST)" hideLabel size="compact" mono inputMode="decimal" align="right" value={perBcti} onChange={(v) => { setPerBcti(v); setMessage(null) }} />
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

        <FormError message={invalid} />
        <ResultLine shot="aa-fee-settings-result" line={message?.ok === true ? message.text : null} />
        <FormError message={message?.ok === false ? message.text : null} />

        <div>
          <Button variant="primary" size="compact" onClick={save} disabled={invalid !== null}>
            Save settings
          </Button>
        </div>
      </Card>
    </div>
  )
}
