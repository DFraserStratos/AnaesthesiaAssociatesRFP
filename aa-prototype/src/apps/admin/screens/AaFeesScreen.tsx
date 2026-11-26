import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addMonths, format, getDaysInMonth, parseISO } from 'date-fns'
import { Plus, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { accent, fontFamily, neutral, radius, type as typeScale } from '../../../theme/tokens'
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
import { drSurname, formatCount, formatMoney, nameWithoutTitle, parseAmountOrNaN, plainDate, plural, surnameOf } from '../../../shared/format'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import {
  Button,
  Card,
  CountBadge,
  DefList,
  DefRow,
  DisclosureButton,
  EmptyState,
  Eyebrow,
  FilterPills,
  FormError,
  IconButton,
  NameSearchBox,
  Notice,
  Pill,
  ResultLine,
  SelectField,
  TextAction,
  TextField,
  visuallyHidden,
} from '../../../shared/ui'
import { Pager, pageOf, pageParam, pageWindow } from '../components/Pager'
import { PageBody, PageToolbar } from '../components/AdminPage'
import { FinancesPage } from './finances/FinancesSection'
import { financePath } from './finances/financePaths'
import { AA_FEE_SHOW_LABEL, AA_FEE_SHOWS, aaFeeRows, parseAaFeeMonth, parseAaFeeShow, type AaFeeMonth, type AaFeeShow } from './aaFeeRows'

/** The worked example's BCTI count (US-10.3.1's acceptance example). */
const EXAMPLE_BCTIS = 40
/** The earliest month the select offers: fee invoice numbers carry the demo year. */
const FIRST_MONTH = '2026-01'
/** Fee invoices a page (about 830 at practice scale). */
const PAGE_SIZE = 50
/** Earlier runs shows this many months before See all. */
const EARLIER_RUNS_LIMIT = 5

function dateLabel(iso: string | undefined): string {
  return iso === undefined ? '·' : plainDate(iso.slice(0, 10))
}

/** The month's last day, `YYYY-MM-DD`: when the month's run is made (month end, OQ-112). */
function lastDayOf(monthISO: string): string {
  return `${monthISO}-${String(getDaysInMonth(parseISO(`${monthISO}-01`))).padStart(2, '0')}`
}

/** Every month from the first fee month to `toMonth`, newest first. */
function monthsTo(toMonth: string): string[] {
  const out: string[] = []
  for (let m = toMonth; m >= FIRST_MONTH; m = format(addMonths(parseISO(`${m}-01`), -1), 'yyyy-MM')) out.push(m)
  return out
}

type AaFeeParam = 'q' | 'show' | 'month' | 'page'

/**
 * The list's state in the URL, replaced, never pushed: `q`, `show`, `month` and `page`. A key at its
 * default or empty is dropped, and any change other than paging goes back to page 1.
 */
function useAaFeeListParams() {
  const [params, setParams] = useSearchParams()
  const set = useCallback(
    (patch: Partial<Record<AaFeeParam, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch) as [AaFeeParam, string][]) {
            const fallback = key === 'show' ? 'unpaid' : key === 'page' ? '1' : ''
            if (value === fallback || value === '') next.delete(key)
            else next.set(key, value)
          }
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )
  return { params, set }
}

/**
 * Finances' AA fees tab (FT-10.3, US-10.3.1 to US-10.3.3): AA's monthly fee invoices to the
 * anaesthetists, opening on the unpaid ones, with the month's run and its preview, the fee settings
 * (fixed items plus a charge per BCTI, ex GST) and the earlier runs beside them. The month select
 * drives both the list and the run card. `settingsOpen` (the tab's settings address) opens the fee
 * settings for a change and brings them into view.
 */
export function AaFeesScreen({ actor, settingsOpen = false }: { actor: Actor; settingsOpen?: boolean }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const todayISO = useToday()
  const navigate = useNavigate()
  const location = useLocation()

  const { params, set } = useAaFeeListParams()
  const show = parseAaFeeShow(params.get('show'))
  const month = parseAaFeeMonth(params.get('month'))
  const q = params.get('q') ?? ''
  const page = pageParam(params.get('page'))

  // Every fee invoice, read once per billing change; one choice's rows, paged after.
  const invoices = useMemo(() => allAaFeeInvoices({ billing }), [billing])
  const anaesthetists = masters.anaesthetists
  const nameOf = useCallback((id: string) => anaesthetists[id]?.name ?? '', [anaesthetists])
  const list = useMemo(() => aaFeeRows(invoices, { show, ...(month !== undefined ? { month } : {}), q }, nameOf), [invoices, show, month, q, nameOf])
  const pager = pageWindow(list.rows.length, PAGE_SIZE, page)
  const shown = useMemo(() => pageOf(list.rows, PAGE_SIZE, pager.page), [list.rows, pager.page])

  // The run card's month: the month filter when set, else the demo month.
  const currentMonth = todayISO.slice(0, 7)
  const cardMonth = month ?? currentMonth
  useDemoTriggerContext('aaFees.month', cardMonth)

  const preview = useMemo(
    () =>
      aaFeeRunPreview({ billing, masters, appSettings }, cardMonth).sort(
        (a, b) => surnameOf(a.anaesthetistName).localeCompare(surnameOf(b.anaesthetistName)) || a.anaesthetistName.localeCompare(b.anaesthetistName),
      ),
    [billing, masters, appSettings, cardMonth],
  )
  const pending = preview.filter((r) => r.invoice === undefined)
  const pendingTotal = pending.reduce((sum, r) => sum + r.subtotal, 0)
  const disabledReason = aaFeeRunDisabledReason({ clock, masters, billing }, cardMonth)

  const [previewing, setPreviewing] = useState(false)
  // A run's outcome, shown while the card stays on the month it was made for.
  const [result, setResult] = useState<{ monthISO: string; ok: boolean; text: string } | null>(null)
  const shownResult = result !== null && result.monthISO === cardMonth ? result : null

  function run() {
    const res = runMonthlyFeeInvoices(useAppStore, actor, { monthISO: cardMonth })
    if (!res.ok) {
      setResult({ monthISO: cardMonth, ok: false, text: res.message })
      return
    }
    setResult({
      monthISO: cardMonth,
      ok: true,
      text:
        res.value.raisedCount === 0
          ? `Nothing to raise for ${aaFeeMonthLabel(cardMonth)}.`
          : `Raised ${plural(res.value.raisedCount, 'fee invoice')} for ${aaFeeMonthLabel(cardMonth)}, ${formatMoney(res.value.total)} incl GST.`,
    })
    setPreviewing(false)
    set({ show: 'unpaid' })
  }

  // The select: All months, then every month of the demo year to date and any month holding fee invoices.
  const monthOptions = useMemo(() => {
    const all = new Set([...monthsTo(currentMonth), ...list.months.map((m) => m.monthISO), ...(month !== undefined ? [month] : [])])
    return [...all].sort((a, b) => b.localeCompare(a))
  }, [currentMonth, list.months, month])

  const leaveSettings = () => {
    if (settingsOpen) navigate({ pathname: financePath('aa-fees'), search: location.search }, { replace: true })
  }

  const runButton = (
    <Button variant="primary" size="compact" onClick={run} disabled={disabledReason !== null} disabledReason={disabledReason ?? undefined}>
      Run monthly fee invoices
    </Button>
  )

  const lastRun = list.months[0]
  const rail = (
    <>
      <Card padding="card" title={`${aaFeeMonthLabel(cardMonth)} run`} shot="aa-fee-run-card" data-month={cardMonth}>
        <DefList gap={0}>
          <DefRow layout="settings" label="Runs on">{plainDate(lastDayOf(cardMonth))}</DefRow>
          <DefRow layout="settings" label="Anaesthetists">{formatCount(preview.length)}</DefRow>
          <DefRow layout="settings" label="Not yet invoiced">{formatCount(pending.length)}</DefRow>
          <DefRow layout="settings" label="Still to invoice (ex GST)">{formatMoney(pendingTotal)}</DefRow>
          <DefRow layout="settings" label="Last run" valueStyle={{ fontFamily: fontFamily.ui }}>
            {lastRun !== undefined ? `${aaFeeMonthLabel(lastRun.monthISO)} · ${plural(lastRun.invoices, 'invoice')}` : 'None yet'}
          </DefRow>
        </DefList>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="compact" onClick={() => setPreviewing(true)} disabled={previewing} shot="aa-fee-preview-open">
            Preview
          </Button>
          {runButton}
        </div>
        <ResultLine shot="aa-fee-run-result" line={shownResult?.ok === true ? shownResult.text : null} />
        <FormError message={shownResult?.ok === false ? shownResult.text : null} />
        <p data-testid="aa-fee-count-rule" style={QUIET_LINE}>
          Counts one BCTI per receivable invoice, once, against the anaesthetist who did the procedure, in the
          month its invoice is paid in full. Provisional: being confirmed with AA's accountant (OQ-29, OQ-60).
        </p>
      </Card>
      <FeeSettingsCard actor={actor} settingsOpen={settingsOpen} onLeave={leaveSettings} />
      <EarlierRunsCard months={list.months} selected={month} onPick={(m) => set({ month: m })} />
    </>
  )

  return (
    <FinancesPage
      tab="aa-fees"
      mode="fit"
      data-aa-fee-show={show}
    >
      <PageToolbar
        end={
          <span data-shot="aa-fee-totals">
            <span className="mono">{formatCount(list.unpaidCount)}</span> unpaid · <span className="mono">{formatMoney(list.owed)}</span> owed to AA
          </span>
        }
      >
        <NameSearchBox
          size="pill"
          label="Search fee invoices"
          placeholder="Anaesthetist or invoice number"
          value={q}
          onChange={(v) => set({ q: v })}
          shot="aa-fee-search"
          width={280}
        />
        <div data-shot="aa-fee-filter" data-aa-fee-show={show}>
          <FilterPills<AaFeeShow>
            ariaLabel="Fee invoices by state"
            value={show}
            options={AA_FEE_SHOWS.map((value) => ({ value, label: AA_FEE_SHOW_LABEL[value] }))}
            onSelect={(next) => set({ show: next })}
          />
        </div>
        <SelectField size="compact" hideLabel label="Month" value={month ?? ''} onChange={(v) => set({ month: v })} shot="aa-fee-month">
          <option value="">All months</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {aaFeeMonthLabel(m)}
            </option>
          ))}
        </SelectField>
      </PageToolbar>

      <PageBody rail={rail} railLabel="AA fees">
        {previewing ? (
          <>
            <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <TextAction size="sm" flush onClick={() => setPreviewing(false)} shot="aa-fee-preview-back">
                Back to fee invoices
              </TextAction>
              <Notice tone="neutral" style={{ alignSelf: 'stretch' }}>
                Nothing is raised until you run the month.
              </Notice>
            </div>
            <TableShell
              fit
              label={`AA fee run, ${aaFeeMonthLabel(cardMonth)}`}
              density="compact"
              minWidth={720}
              shot="aa-fee-preview-shell"
              tableData={{ 'data-testid': 'aa-fee-preview' }}
              footer={<div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0' }}>{runButton}</div>}
            >
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
                    <Td align="right" mono>{formatMoney(row.fixedTotal)}</Td>
                    <Td align="right" mono>{formatMoney(row.perBctiTotal)}</Td>
                    <Td align="right" mono bold>{formatMoney(row.subtotal)}</Td>
                    <Td mono={row.invoice !== undefined}>
                      {row.invoice !== undefined ? row.invoice.invoiceNumber : <span style={{ color: neutral.mist }}>Not yet</span>}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <Td colSpan={4} style={{ borderBottom: 'none', color: neutral.slate }}>
                    Still to invoice for {aaFeeMonthLabel(cardMonth)} (ex GST)
                  </Td>
                  <Td align="right" mono style={{ borderBottom: 'none', fontWeight: 700 }}>{formatMoney(pendingTotal)}</Td>
                  <Td style={{ borderBottom: 'none' }} />
                </tr>
              </tfoot>
            </TableShell>
          </>
        ) : invoices.length === 0 ? (
          <EmptyState variant="card" title="No fee invoices yet. Run a month." />
        ) : list.rows.length === 0 ? (
          show === 'unpaid' && list.unpaidCount === 0 ? (
            <EmptyState
              variant="card"
              title="No unpaid fee invoices"
              action={
                <TextAction size="sm" flush onClick={() => set({ show: 'all' })} shot="aa-fee-show-all">
                  Show all
                </TextAction>
              }
            >
              Every fee invoice raised so far is paid.
            </EmptyState>
          ) : (
            <EmptyState variant="card" title="No fee invoice matches.">
              Clear the search or the month, or choose All.
            </EmptyState>
          )
        ) : (
          <FeeInvoiceTable rows={shown} total={list.rows.length} page={pager.page} onPage={(p) => set({ page: String(p) })} />
        )}
      </PageBody>
    </FinancesPage>
  )
}

/** The rail's quiet closing line. */
const QUIET_LINE = { margin: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

// ---------------------------------------------------------------------------
// Fee invoices
// ---------------------------------------------------------------------------

const FEE_COLUMNS = ['Number', 'Anaesthetist', 'Month', 'BCTIs', 'Fee (ex GST)', 'GST', 'Total', 'State', 'Raised'] as const
const RIGHT_COLUMNS: ReadonlySet<string> = new Set(['BCTIs', 'Fee (ex GST)', 'GST', 'Total'])

function FeeInvoiceTable({ rows, total, page, onPage }: { rows: AaFeeInvoiceRow[]; total: number; page: number; onPage: (page: number) => void }) {
  const masters = useAppStore((s) => s.masters)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <TableShell
      fit
      label="Fee invoices"
      density="compact"
      minWidth={860}
      shot="admin-aa-fee-invoices"
      tableData={{ 'data-testid': 'aa-fee-invoices' }}
      {...(total > PAGE_SIZE ? { footer: <Pager total={total} size={PAGE_SIZE} page={page} onPage={onPage} shot="aa-fee-pager" /> } : {})}
    >
      <thead>
        <tr>
          <Th width={28}><span style={visuallyHidden}>Expand</span></Th>
          {FEE_COLUMNS.map((h) => (
            <Th key={h} nowrap align={RIGHT_COLUMNS.has(h) ? 'right' : 'left'}>
              {h}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((f) => {
          const expanded = open === f.id
          const name = masters.anaesthetists[f.anaesthetistId]?.name ?? f.anaesthetistId
          return (
            <Fragment key={f.id}>
              <ClickableRow
                align="top"
                data-testid={`aa-fee-row-${f.invoiceNumber}`}
                data-state={f.status}
                onOpen={() => setOpen(expanded ? null : f.id)}
                {...(expanded ? { style: { background: neutral.bg } } : {})}
              >
                <Td>
                  <DisclosureButton open={expanded} label={`${expanded ? 'Hide' : 'Show'} ${f.invoiceNumber} details`} onToggle={() => setOpen(expanded ? null : f.id)} />
                </Td>
                <Td mono bold nowrap>{f.invoiceNumber}</Td>
                <Td bold nowrap>
                  <span title={nameWithoutTitle(name)}>{drSurname(name)}</span>
                </Td>
                <Td nowrap>{aaFeeMonthLabel(f.monthISO)}</Td>
                <Td align="right" mono>{f.bctiCount}</Td>
                <Td align="right" mono>{formatMoney(f.subtotal)}</Td>
                <Td align="right" mono>{formatMoney(f.gst)}</Td>
                <Td align="right" mono bold>{formatMoney(f.total)}</Td>
                <Td nowrap><FeeStatePill row={f} /></Td>
                <Td mono nowrap>{dateLabel(f.raisedAtISO)}</Td>
              </ClickableRow>
              {expanded && (
                <tr data-testid={`aa-fee-detail-${f.invoiceNumber}`}>
                  <Td style={{ background: neutral.bg }} />
                  <Td colSpan={FEE_COLUMNS.length} style={{ background: neutral.bg }}>
                    <FeeInvoiceDetail row={f} />
                  </Td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </TableShell>
  )
}

function FeeStatePill({ row }: { row: AaFeeInvoiceRow }) {
  const paid = row.status === 'paid'
  return (
    <Pill size="lg" tone={paid ? 'success' : 'warning'} shot="aa-fee-state" data-state={row.status}>
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
              <span className="mono">{formatMoney(line.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, borderTop: `1px solid ${neutral.line}`, paddingTop: 4 }}>
            <span>GST</span>
            <span className="mono">{formatMoney(row.gst)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, fontWeight: 700 }}>
            <span>Total</span>
            <span className="mono">{formatMoney(row.total)}</span>
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
// Earlier runs
// ---------------------------------------------------------------------------

/** Each month holding fee invoices, newest first; a row sets the month filter (a control, so a button). */
function EarlierRunsCard({ months, selected, onPick }: { months: AaFeeMonth[]; selected: string | undefined; onPick: (monthISO: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? months : months.slice(0, EARLIER_RUNS_LIMIT)
  return (
    <Card padding="card" shot="aa-fee-earlier-runs" title={<>Earlier runs <CountBadge count={months.length} hideAtZero={false} mono srNoun="months" /></>}>
      {months.length === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>No runs yet.</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {shown.map((m, i) => (
            <li
              key={m.monthISO}
              data-month={m.monthISO}
              style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}
            >
              <TextAction
                size="sm"
                flush
                onClick={() => onPick(m.monthISO)}
                label={`Show ${aaFeeMonthLabel(m.monthISO)}'s fee invoices`}
                {...(selected === m.monthISO ? { 'data-selected': true } : {})}
                style={{ textAlign: 'left' }}
              >
                {aaFeeMonthLabel(m.monthISO)}
              </TextAction>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                {`${plural(m.invoices, 'invoice')} · `}
                <span className="mono">{formatMoney(m.total)}</span>
                {` · ${m.unpaid > 0 ? `${formatCount(m.unpaid)} unpaid` : 'all paid'}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {months.length > shown.length && (
        <TextAction size="sm" flush onClick={() => setExpanded(true)} shot="aa-fee-earlier-runs-all">{`See all ${months.length}`}</TextAction>
      )}
      {expanded && months.length > EARLIER_RUNS_LIMIT && (
        <TextAction size="sm" flush onClick={() => setExpanded(false)} shot="aa-fee-earlier-runs-fewer">Show fewer</TextAction>
      )}
    </Card>
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

/** The amount column of the settings form: sized for the rail. */
const FORM_GRID = '1fr 104px 36px'

/**
 * The fee settings card (US-10.3.3): the schedule at rest, with Change opening today's form in the
 * card (items add and remove, validation, the worked example) and Save audited through
 * `saveAaFeeSettings`. `settingsOpen` opens it in Change and scrolls it into view; Cancel and Save
 * call `onLeave` so the address leaves the settings path.
 */
function FeeSettingsCard({ actor, settingsOpen, onLeave }: { actor: Actor; settingsOpen: boolean; onLeave: () => void }) {
  const saved = useAppStore((s) => s.appSettings.aaFee)
  const [changing, setChanging] = useState(settingsOpen)
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(saved).items)
  const [perBcti, setPerBcti] = useState(() => toDraft(saved).perBcti)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const changeRef = useRef<HTMLButtonElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)
  const addItemRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // Re-sync the form whenever the stored settings change (a save, or a Reset).
  useEffect(() => {
    const next = toDraft(saved)
    setItems(next.items)
    setPerBcti(next.perBcti)
  }, [saved])

  // The settings address opens the form and brings the card into view.
  useEffect(() => {
    if (!settingsOpen) return
    setChanging(true)
    headingRef.current?.closest('section')?.scrollIntoView?.({ block: 'start' })
  }, [settingsOpen])

  // Closing the form hands focus back to Change.
  useEffect(() => {
    if (changing || !returnFocus.current) return
    returnFocus.current = false
    changeRef.current?.focus()
  }, [changing])

  const draft = fromDraft(items, perBcti)
  const invalid = validateAaFeeSettings(draft)
  const example = invalid === null ? aaFeeFor(draft, EXAMPLE_BCTIS) : null

  function update(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setMessage(null)
  }

  function start() {
    const next = toDraft(saved)
    setItems(next.items)
    setPerBcti(next.perBcti)
    setMessage(null)
    setChanging(true)
  }

  function close() {
    returnFocus.current = true
    setChanging(false)
    onLeave()
  }

  function cancel() {
    const next = toDraft(saved)
    setItems(next.items)
    setPerBcti(next.perBcti)
    setMessage(null)
    close()
  }

  function save() {
    const res = saveAaFeeSettings(useAppStore, actor, draft)
    if (!res.ok) {
      setMessage({ ok: false, text: res.message })
      return
    }
    setMessage({ ok: true, text: 'Fee settings saved. They apply from the next monthly run.' })
    close()
  }

  return (
    <Card
      padding="card"
      title="Fee settings"
      headingRef={headingRef}
      shot="admin-aa-fee-settings"
      data-testid="admin-aa-fee-settings"
      aside={<Pill data-testid="aa-fee-sample">Sample schedule</Pill>}
      editing={changing}
      {...(!changing
        ? {
            action: (
              <TextAction size="sm" flush onClick={start} shot="aa-fee-settings-change" buttonRef={changeRef} label="Change fee settings">
                Change
              </TextAction>
            ),
          }
        : {
            footer: (
              <>
                <Button variant="secondary" size="compact" onClick={cancel} shot="aa-fee-settings-cancel">
                  Cancel
                </Button>
                <Button variant="primary" size="compact" onClick={save} disabled={invalid !== null} shot="aa-fee-settings-save">
                  Save settings
                </Button>
              </>
            ),
          })}
    >
      {!changing ? (
        <>
          <DefList gap={0}>
            {saved.fixedItems.map((item) => (
              <DefRow key={item.id} layout="settings" label={item.description} data-fee-item={item.id}>
                {formatMoney(item.amount)}
              </DefRow>
            ))}
            <DefRow layout="settings" label="Per BCTI paid that month">{formatMoney(saved.perBctiCharge)}</DefRow>
          </DefList>
          <p style={QUIET_LINE}>Ex GST. Applies from the next monthly run.</p>
          <ResultLine shot="aa-fee-settings-result" line={message?.ok === true ? message.text : null} />
        </>
      ) : (
        <>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: neutral.slate }}>
            A sample until AA's accountant supplies the real fixed charges. Amounts exclude GST; GST is added at
            the foot of each fee invoice. Changes apply from the next monthly run. Raised fee invoices keep the
            settings they were raised with.
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: FORM_GRID, gap: 8, marginBottom: 6 }}>
              <Eyebrow as="span">Fixed item</Eyebrow>
              <Eyebrow as="span" style={{ textAlign: 'right' }}>Ex GST</Eyebrow>
              <span />
            </div>
            <div ref={itemsRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, index) => (
                <div key={item.id} data-testid={`aa-fee-item-${index}`} style={{ display: 'grid', gridTemplateColumns: FORM_GRID, gap: 8, alignItems: 'center' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: FORM_GRID, gap: 8, alignItems: 'center', borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
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
                  {formatMoney(aaFeeFixedTotal(draft))} + {formatMoney(draft.perBctiCharge)} x {EXAMPLE_BCTIS} = <strong>{formatMoney(example.subtotal)}</strong>
                </span>
                , plus GST at the foot of the invoice.
              </>
            )}
          </div>

          <FormError message={invalid} />
          <FormError message={message?.ok === false ? message.text : null} />
        </>
      )}
    </Card>
  )
}
