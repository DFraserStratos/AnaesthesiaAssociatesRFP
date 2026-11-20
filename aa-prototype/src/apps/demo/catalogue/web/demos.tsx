/**
 * The live, interactive examples on the Web catalogue page (demo only). Each
 * holds its own state in a small wrapper and renders the REAL component, or a
 * recreation from ./recreations where the component is local to a screen.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { neutral, semantic } from '../../../../theme/tokens'
import type { DisplayKey, Procedure, RvgGroupId } from '../../../../domain/types'
import type { ListProgress } from '../../../../domain/listProgress'
import type { Warning, WarningStrength } from '../../../../domain/warnings'
import { isAssignedList } from '../../../../domain/draftLists'
import { anaesthetistLedgerPosition, editRefusal, POSITION_LABEL, slotViewsForDate, useAppStore, type SlotView } from '../../../../store'
import {
  ProgressPill,
  resolveDisplayStatus,
  Segmented,
  StatusChip,
  StatusLegend,
  TickBadge,
  useDefaultStatus,
  useLegendKeys,
  useSurface,
  WarningTriangle,
} from '../../../../shared'
import { AddRowButton, BackLink, Button, Card, DayChip, FilterPills, StatTile, IconButton, NameSearchBox, ProgressBar, SlidingSegmentedControl, TextAction, type SlidingSegmentSize, type SlidingSegmentVariant } from '../../../../shared/ui'
import { drSurname, formatCurrency, locationName, mondayOf, shiftWeeks } from '../../../../shared/format'
import { ListInvoices, useBookingSearch, useListInvoices } from '../../../../shared/schedule'
import { AddBookingFlow, AlertOfficeEntry, MovedToYouPanel, SubmitListSheet, useMovableLists } from '../../../../shared/flows'
import { AvailabilityEditor, SeriesList } from '../../../../shared/availability'
import { ResultLine } from '../../../../shared/ui/ResultLine'
import { HistoryTimeline } from '../../../../shared/booking'
import { sortAuditNewestFirst } from '../../../../shared/audit'
import { BookingTotalPanel } from '../../../../shared/capture/BookingTotalPanel'
import { BookingTotalStrip } from '../../../../shared/capture/BookingTotalStrip'
import { PriceCard } from '../../../../shared/capture/PriceCard'
import { CompleteBar } from '../../../../shared/capture/CompleteBar'
import { TimesCard } from '../../../../shared/capture/TimesCard'
import { RvgCodeField } from '../../../../shared/capture/ProcedureCodeCard'
import { CodePickerSheet } from '../../../../shared/capture/CodePickerSheet'
import { UnitsCard } from '../../../../shared/capture/UnitsCard'
import { bookingFee } from '../../../../shared/capture/feeContext'
import { sessionText } from '../../../../domain/outOfHours'
import { AvailabilityPageSwitch, WebNav, WeekStrip, type WebTab } from '../../../web/components'
import { AccountsScreen, AvailabilityGrid, ListDetailView, ListsScreen, MyAvailabilityCalendar, type AccountsSubTab } from '../../../web/screens'
import { WebDayTable, WebGoToDate, WebResultsTable } from '../../../web/screens/ListsLookback'
import { StageHint } from '../CatalogueKit'
import type { WebFixtures } from './fixtures'
import { KnobButton, Knobs, NavSandbox, RowBoundary, Sandboxed, Wide } from './sandbox'
import {
  AvailabilityCell,
  DayPill,
  SubmitAction,
  WhosFreeChip,
} from './recreations'
import { OverlayHeader } from '../../../../shared/surface/OverlayHeader'

type F = { f: WebFixtures }

/** A one-line readout of what the last click did (catalogue chrome). */
function Said({ text }: { text: string | null }) {
  if (text === null) return null
  return (
    <div role="status" style={{ marginTop: 8, fontSize: 12.5, color: neutral.slate }}>
      {text}
    </div>
  )
}

function Missing({ what }: { what: string }) {
  return <div style={{ fontSize: 13, color: neutral.mist }}>The seed has no {what} for this persona right now.</div>
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function WebNavDemo({ f }: F) {
  const [tab, setTab] = useState<WebTab>('dashboard')
  return (
    <Wide width={1000}>
      <WebNav tab={tab} onTab={setTab} personaName={f.personaName} initials={f.initials} profileActive={false} onProfile={() => undefined} />
    </Wide>
  )
}

export function PageSwitchDemo() {
  const [current, setCurrent] = useState<'find' | 'mine'>('find')
  return (
    <>
      <NavSandbox onNavigate={(p) => setCurrent(p.endsWith('/mine') ? 'mine' : 'find')}>
        <AvailabilityPageSwitch current={current} />
      </NavSandbox>
      <StageHint>Its route change is intercepted here; the selection follows the would-be route.</StageHint>
    </>
  )
}

export function BackLinkDemo() {
  const [said, setSaid] = useState<string | null>(null)
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BackLink onClick={() => setSaid('Would go back to the Lists page (or the search it came from).')}>Lists</BackLink>
        <BackLink to="/demo/catalogue/web" size="desktop">A real link (a route)</BackLink>
        <BackLink size="step" onClick={() => setSaid('A move sheet\'s step back.')}>Choose another List</BackLink>
      </div>
      <Said text={said} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export function PanelDemo() {
  const [flush, setFlush] = useState<'padded' | 'flush'>('padded')
  return (
    <>
      <Knobs label="Padding" value={flush} options={[{ value: 'padded', label: 'Padded' }, { value: 'flush', label: 'Flush' }]} onChange={setFlush} />
      <Card padding="panel" title="Financial position" action={<span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>$11,350.50 owed</span>} flush={flush === 'flush'}>
        <div style={{ fontSize: 13, color: neutral.slate }}>Any content: a list, a table or a chart.</div>
      </Card>
    </>
  )
}

export function StatTileDemo({ f }: F) {
  const billing = useAppStore((s) => s.billing)
  const p = useMemo(() => anaesthetistLedgerPosition({ billing }, f.anaesthetistId), [billing, f.anaesthetistId])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
      <StatTile variant="quiet" label={POSITION_LABEL.owedToThem} value={formatCurrency(p.owedToThem)} />
      <StatTile variant="quiet" label={POSITION_LABEL.collected} value={formatCurrency(p.collected)} />
      <StatTile variant="quiet" label={POSITION_LABEL.paidOut} value={formatCurrency(p.paidOut)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggles, chips and badges
// ---------------------------------------------------------------------------

export function SlidingSegmentedDemo() {
  const [variant, setVariant] = useState<SlidingSegmentVariant>('surface')
  const [size, setSize] = useState<SlidingSegmentSize>('md')
  const [value, setValue] = useState<'everyone' | 'free' | 'mine'>('everyone')
  return (
    <>
      <Knobs label="Variant" value={variant} options={[{ value: 'surface', label: 'surface' }, { value: 'teal', label: 'teal' }]} onChange={setVariant} />
      <Knobs label="Size" value={size} options={[{ value: 'md', label: 'md' }, { value: 'sm', label: 'sm' }]} onChange={setSize} />
      <div style={{ width: 360 }}>
        <SlidingSegmentedControl
          value={value}
          variant={variant}
          size={size}
          ariaLabel="Who to show"
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'free', label: 'Free only' },
            { value: 'mine', label: 'Mine' },
          ]}
          onSelect={setValue}
          buttonStyle={{ height: 38 }}
        />
      </div>
    </>
  )
}

type DemoStatus = 'active' | 'inactive'

/** The Segmented control, as the office's anaesthetist editor uses it for the status. */
export function SegmentedDemo() {
  const [status, setStatus] = useState<DemoStatus>('active')
  return (
    <div style={{ width: 320 }}>
      <Segmented<DemoStatus>
        value={status}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        onChange={setStatus}
      />
    </div>
  )
}

export function FilterChipDemo({ f }: F) {
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const schedule = useAppStore((s) => s.schedule)
  const appSettings = useAppStore((s) => s.appSettings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const freeCount = useMemo(
    () => slotViewsForDate({ schedule, appSettings, masters: { slotStatuses } }, f.todayISO).filter((v) => v.open).length,
    [schedule, appSettings, slotStatuses, f.todayISO],
  )
  return (
    <FilterPills
      value={filter}
      ariaLabel="Anaesthetists shown"
      options={[{ value: 'all', label: 'All anaesthetists' }, { value: 'free', label: `Free only · ${freeCount}` }]}
      onSelect={setFilter}
    />
  )
}

export function StatusLegendDemo() {
  const keys = useLegendKeys()
  const [active, setActive] = useState<ReadonlySet<DisplayKey>>(() => new Set(keys))
  return (
    <>
      <StatusLegend
        variant="chips"
        activeStatuses={active}
        onToggleStatus={(k) =>
          setActive((prev) => {
            const next = new Set(prev)
            if (next.has(k)) next.delete(k)
            else next.add(k)
            return next
          })
        }
      />
      <StageHint>
        {active.size} of {keys.length} statuses shown. Without the toggle props it is the plain legend the Lists and Find cover pages show.
      </StageHint>
    </>
  )
}

export function StatusChipDemo() {
  const keys = useLegendKeys()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {keys.map((k) => (
        <StatusChip key={k} status={k} />
      ))}
    </div>
  )
}

const PROGRESSES: ListProgress[] = ['toFinish', 'readyToSubmit', 'submitted', 'invoiced', 'authorised']

export function ProgressPillDemo() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {PROGRESSES.map((p) => (
        <ProgressPill key={p} progress={p} />
      ))}
    </div>
  )
}

export function DayChipDemo({ f }: F) {
  const [shown, setShown] = useState(true)
  return shown ? (
    <DayChip dateISO={f.pastDayISO ?? f.todayISO} onClose={() => setShown(false)} />
  ) : (
    <KnobButton onClick={() => setShown(true)}>Show the chip again</KnobButton>
  )
}

function warningsFor(kind: string, todayISO: string): Warning[] {
  const base = { kind: 'afterProcedure' as const, bookingId: 'catalogue', ruleId: 'baseUnitsOutsideGuide' as const }
  const mk = (strength: WarningStrength, text: string, n: number): Warning => ({ ...base, strength, text, key: `catalogue:${n}` })
  if (kind === 'mild') return [mk('mild', 'Base units are outside the guide range for this RVG code.', 1)]
  if (kind === 'strong') return [mk('strong', 'Prepayment invoice AA-2026-0003 to Annette Riley unpaid. Check with the payer before surgery starts.', 1)]
  if (kind === 'two') return [mk('strong', 'Prepayment invoice AA-2026-0003 to Annette Riley unpaid. Check with the payer before surgery starts.', 1), mk('mild', 'Base units are outside the guide range for this RVG code.', 2)]
  if (kind === 'cleared') {
    const w = mk('mild', 'Base units are outside the guide range for this RVG code.', 1)
    return [{ ...w, clearance: { key: w.key, bookingId: w.bookingId, ruleId: w.ruleId, strength: 'mild', by: 'Kirsty W.', role: 'office', atISO: `${todayISO}T09:00:00` } }]
  }
  return []
}

export function WarningTriangleDemo({ f }: F) {
  const [kind, setKind] = useState<'mild' | 'strong' | 'two' | 'cleared' | 'none'>('mild')
  return (
    <>
      <Knobs
        label="Warnings"
        value={kind}
        options={[
          { value: 'mild', label: 'Mild' },
          { value: 'strong', label: 'Strong' },
          { value: 'two', label: 'Two' },
          { value: 'cleared', label: 'Cleared' },
          { value: 'none', label: 'None' },
        ]}
        onChange={setKind}
      />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        Patient name <WarningTriangle warnings={warningsFor(kind, f.todayISO)} />
      </span>
      <StageHint>Hover the marker: its only explanation is a native title tooltip.</StageHint>
    </>
  )
}

export function WhosFreeChipDemo({ f }: F) {
  const open = useDefaultStatus().visual
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const names = Object.values(anaesthetists)
    .filter((a) => a.registrationNumber !== f.anaesthetistId)
    .map((a) => a.name)
    .sort()
    .slice(0, 2)
  const [said, setSaid] = useState<string | null>(null)
  const [a = 'Dr A', b = 'Dr B'] = names
  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <WhosFreeChip name={drSurname(a)} title={`Move your AM List to ${a}`} tint={open.tint} onTint={open.onTint} onClick={() => setSaid(`Would open the move sheet for ${a}.`)} />
        <WhosFreeChip name={drSurname(b)} title="You have no List in this session" tint={open.tint} onTint={open.onTint} />
      </div>
      <Said text={said} />
      <StageHint>The first is a button, the second a plain span. Both explain themselves only in a title tooltip.</StageHint>
    </>
  )
}

// ---------------------------------------------------------------------------
// Buttons and actions
// ---------------------------------------------------------------------------

export function IconButtonsDemo() {
  const [said, setSaid] = useState<string | null>(null)
  const [atEnd, setAtEnd] = useState(false)
  return (
    <>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ display: 'flex', gap: 6 }}>
          <IconButton size={38} label="Previous day" onClick={() => setSaid('Previous day (Find cover, 38px)')}>‹</IconButton>
          <IconButton size={38} label="Next day" onClick={() => setSaid('Next day (Find cover, 38px)')}>›</IconButton>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <IconButton size={38} label="Previous month" disabled={!atEnd} onClick={() => setAtEnd(false)}>‹</IconButton>
          <IconButton size={38} label="Next month" disabled={atEnd} onClick={() => setAtEnd(true)}>›</IconButton>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <IconButton size={32} label="Previous week" onClick={() => setSaid('Previous week (the week strip, 32px)')}>‹</IconButton>
          <IconButton size={32} label="Next week" onClick={() => setSaid('Next week (the week strip, 32px)')}>›</IconButton>
        </span>
      </div>
      <Said text={said} />
      <StageHint>Left to right: Find cover's day step (38px), My availability's month step (38px, disables at the horizon), the dashboard week strip (32px).</StageHint>
    </>
  )
}

export function DayStepperDemo({ f }: F) {
  const [dateISO, setDateISO] = useState(f.todayISO)
  const shift = (d: number) => setDateISO(format(addDays(parseISO(dateISO), d), 'yyyy-MM-dd'))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <IconButton size={38} label="Previous day" onClick={() => shift(-1)}>‹</IconButton>
      <DayPill>{format(parseISO(dateISO), 'EEEE d MMMM')}</DayPill>
      <IconButton size={38} label="Next day" onClick={() => shift(1)}>›</IconButton>
      <Button variant="outline" size="compact" style={{ minHeight: 38 }} onClick={() => setDateISO(f.todayISO)}>Today</Button>
    </div>
  )
}

export function LinkButtonDemo() {
  const [said, setSaid] = useState<string | null>(null)
  return (
    <>
      <div style={{ fontSize: 13, color: neutral.slate }}>
        9 unpaid invoices · <TextAction size="sm" flush onClick={() => setSaid('Would open Accounts, Outstanding.')}>View outstanding invoices</TextAction>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
        <TextAction size="sm" onClick={() => setSaid('sm: 12.5 in a table')}>Open</TextAction>
        <TextAction onClick={() => setSaid('md: 14 in a card')}>Edit</TextAction>
        <TextAction size="lg" onClick={() => setSaid('lg: 15 with a 44px target on the phone')}>Show all</TextAction>
        <span style={{ fontSize: 13, color: neutral.slate }}>Edited. <TextAction inline onClick={() => setSaid('inline: underlined inside a sentence')}>Amend</TextAction></span>
        <TextAction disabled disabledReason="Submitted Lists are locked" onClick={() => undefined}>Remove</TextAction>
      </div>
      <Said text={said} />
    </>
  )
}

export function SubmitActionDemo({ f }: F) {
  const [state, setState] = useState<'ready' | 'blocked' | 'submitted' | 'authorised'>('blocked')
  const [blockers, setBlockers] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  return (
    <>
      <Knobs
        label="State"
        value={state}
        options={[
          { value: 'blocked', label: 'Blocked' },
          { value: 'ready', label: 'Ready' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'authorised', label: 'Authorised' },
        ]}
        onChange={(v) => {
          setState(v)
          setSaid(null)
        }}
      />
      <SubmitAction
        state={state === 'submitted' ? 'SUBMITTED' : state === 'authorised' ? 'AUTHORISED' : 'ACTIVE'}
        authorisedLabel="Invoiced"
        incomplete={state === 'blocked' ? 2 : 0}
        onBlockers={() => (f.detailListId !== undefined ? setBlockers(true) : setSaid('Would open the blockers sheet.'))}
        onConfirm={() => setSaid('Would open the confirm sheet (left out here: it submits the List).')}
      />
      <Said text={said} />
      {f.detailListId !== undefined && blockers && (
        <SubmitListSheet open listId={f.detailListId} actor={f.actor} mode="blockers" onClose={() => setBlockers(false)} onSubmitted={() => setBlockers(false)} />
      )}
    </>
  )
}

export function AddBookingButtonDemo({ f }: F) {
  const [open, setOpen] = useState(false)
  if (f.detailListId === undefined) return <Missing what="active List" />
  return (
    <>
      <AddRowButton onClick={() => setOpen(true)}>Add a booking</AddRowButton>
      <AddBookingFlow open={open} listId={f.detailListId} actor={f.actor} onClose={() => setOpen(false)} onCreated={() => undefined} />
      <StageHint>Opens the real Add a booking dialog for her next List.</StageHint>
    </>
  )
}

export function ProgressBarDemo() {
  const [done, setDone] = useState(2)
  const total = 5
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{done} of {total} complete</span>
        <ProgressBar done={done} total={total} width={200} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <KnobButton onClick={() => setDone((d) => Math.max(0, d - 1))}>One fewer</KnobButton>
        <KnobButton onClick={() => setDone((d) => Math.min(total, d + 1))}>One more</KnobButton>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

export function DialogDemo({ f }: F) {
  const { Overlay } = useSurface()
  const movable = useMovableLists(f.anaesthetistId, 6)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [open, setOpen] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  return (
    <>
      <KnobButton onClick={() => setOpen(true)}>Open the Which List? dialog</KnobButton>
      <Said text={said} />
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460, maxWidth: '100%' }}>
          <div>
            <OverlayHeader title="Which List?" />
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Your Lists in the next six days. Choose one to move it back to the office or to a colleague.</div>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {movable.length === 0 && <li style={{ padding: '12px 14px', fontSize: 13, color: neutral.mist }}>No upcoming Lists to move.</li>}
            {movable.map((l, i) => (
              <li key={l.id} style={{ display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setSaid(`Would open the move sheet for ${format(parseISO(l.dateISO), 'EEE d MMM')} ${sessionText(l.session)}.`)
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`, background: neutral.surface, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="mono" style={{ width: 92, fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{format(parseISO(l.dateISO), 'EEE d MMM')} {sessionText(l.session)}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: neutral.ink }}>{locationName(l.hospitalId, hospitals)}</span>
                  <span style={{ fontSize: 13, color: neutral.slate }}>{surgeons[l.surgeonId]?.name ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Overlay>
      <StageHint>Escape or a scrim click closes it.</StageHint>
    </>
  )
}

export function SubmitListSheetDemo({ f }: F) {
  const [open, setOpen] = useState(false)
  if (f.detailListId === undefined) return <Missing what="active List" />
  return (
    <>
      <KnobButton onClick={() => setOpen(true)}>Open Bookings still to finish</KnobButton>
      {open && <SubmitListSheet open listId={f.detailListId} actor={f.actor} mode="blockers" onClose={() => setOpen(false)} onSubmitted={() => setOpen(false)} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Search and dates
// ---------------------------------------------------------------------------

/** The Lists page's search: the shared NameSearchBox as the 38px page pill (UI unification U4). */
function ListsSearchBox({ query, onQueryChange }: { query: string; onQueryChange: (q: string) => void }) {
  return (
    <NameSearchBox
      value={query}
      onChange={onQueryChange}
      label="Search your Bookings"
      placeholder="Search patient name or NHI"
      size="pill"
      height={38}
      width={280}
      fill="surface"
      testId="web-lists-search"
      clearLabel="Clear the search field"
    />
  )
}

export function ListsSearchDemo() {
  const [query, setQuery] = useState('')
  return (
    <>
      <ListsSearchBox query={query} onQueryChange={setQuery} />
      <Said text={query === '' ? null : `Query handed up: "${query}"`} />
    </>
  )
}

export function NameSearchBoxDemo() {
  const [size, setSize] = useState<'pill' | 'field'>('pill')
  const [fill, setFill] = useState<'surface' | 'well'>('surface')
  const [value, setValue] = useState('')
  return (
    <>
      <Knobs label="Size" value={size} options={[{ value: 'pill', label: 'pill' }, { value: 'field', label: 'field' }]} onChange={setSize} />
      <Knobs label="Fill" value={fill} options={[{ value: 'surface', label: 'surface' }, { value: 'well', label: 'well' }]} onChange={setFill} />
      <div style={{ background: fill === 'surface' ? neutral.bg : 'transparent', borderRadius: 8, padding: fill === 'surface' ? 12 : 0 }}>
        <NameSearchBox value={value} onChange={setValue} label="Search name" size={size} fill={fill} />
      </div>
    </>
  )
}

export function GoToDateDemo({ f }: F) {
  const [dayISO, setDayISO] = useState<string | null>(null)
  return (
    <>
      <WebGoToDate anaesthetistId={f.anaesthetistId} dayISO={dayISO} onDayChange={setDayISO} />
      <Said text={dayISO === null ? null : `Picked ${dayISO}`} />
      <StageHint>The shared DateJumpInput, bounded by her first and last day with work. The Lists page's To input is the shared FilterDateInput.</StageHint>
    </>
  )
}

export function WeekStripDemo({ f }: F) {
  const [anchor, setAnchor] = useState(mondayOf(f.todayISO))
  return (
    <Sandboxed>
      {(go) => (
        <Wide width={1000}>
          <WeekStrip
            anaesthetistId={f.anaesthetistId}
            weekAnchorISO={anchor}
            todayISO={f.todayISO}
            onPrevWeek={() => setAnchor((a) => shiftWeeks(a, -1))}
            onNextWeek={() => setAnchor((a) => shiftWeeks(a, 1))}
            onOpenList={(id) => go(`Would open List ${id}`)}
          />
        </Wide>
      )}
    </Sandboxed>
  )
}

export function MyAvailabilityDemo({ f }: F) {
  return (
    <Sandboxed>
      {() => (
        <Wide width={1180}>
          <MyAvailabilityCalendar actor={f.actor} anaesthetistId={f.anaesthetistId} />
        </Wide>
      )}
    </Sandboxed>
  )
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function ListsTableDemo({ f }: F) {
  const [query, setQuery] = useState('')
  const [dayISO, setDayISO] = useState<string | null>(null)
  return (
    <Sandboxed>
      {(go) => (
        <Wide width={1180}>
          <ListsScreen
            anaesthetistId={f.anaesthetistId}
            todayISO={f.todayISO}
            query={query}
            dayISO={dayISO}
            onQueryChange={(q) => {
              setQuery(q)
              setDayISO(null)
            }}
            onDayChange={(d) => {
              setDayISO(d)
              setQuery('')
            }}
            onOpenList={(id) => go(`Would open List ${id}`)}
            onOpenBooking={(listId, bookingId) => go(`Would open Booking ${bookingId} on List ${listId}`)}
          />
        </Wide>
      )}
    </Sandboxed>
  )
}

export function ResultsTableDemo({ f }: F) {
  const [query, setQuery] = useState(f.searchSeed)
  const results = useBookingSearch(f.anaesthetistId, query, f.todayISO)
  return (
    <Sandboxed>
      {(go) => (
        <>
          <div style={{ marginBottom: 10 }}>
            <ListsSearchBox query={query} onQueryChange={setQuery} />
          </div>
          <Wide width={1000}>
            <WebResultsTable upcoming={results.upcoming} past={results.past} onOpenBooking={(_l, b) => go(`Would open Booking ${b}`)} />
          </Wide>
        </>
      )}
    </Sandboxed>
  )
}

export function DayTableDemo({ f }: F) {
  const [dateISO, setDateISO] = useState(f.pastDayISO ?? f.todayISO)
  return (
    <Sandboxed>
      {(go) => (
        <>
          <input
            type="date"
            aria-label="Day to show"
            value={dateISO}
            onChange={(e) => e.target.value !== '' && setDateISO(e.target.value)}
            style={{ height: 32, marginBottom: 10, fontFamily: 'inherit' }}
          />
          <Wide width={900}>
            <WebDayTable anaesthetistId={f.anaesthetistId} dateISO={dateISO} todayISO={f.todayISO} onOpenList={(id) => go(`Would open List ${id}`)} />
          </Wide>
        </>
      )}
    </Sandboxed>
  )
}

export function AccountsDemo({ f }: F) {
  const [tab, setTab] = useState<AccountsSubTab>('outstanding')
  return (
    <Wide width={1100}>
      <AccountsScreen anaesthetistId={f.anaesthetistId} subTab={tab} onSubTab={setTab} />
    </Wide>
  )
}

export function ListDetailDemo({ f }: F) {
  if (f.detailListId === undefined) return <Missing what="active List" />
  const listId = f.detailListId
  return (
    <Sandboxed>
      {(go) => (
        <Wide width={1180}>
          <ListDetailView
            listId={listId}
            actor={f.actor}
            todayISO={f.todayISO}
            onBack={() => go('Would go back to Lists')}
            onOpenBooking={(id) => go(`Would open Booking ${id}`)}
          />
        </Wide>
      )}
    </Sandboxed>
  )
}

export function ListInvoicesDemo({ f }: F) {
  const rows = useListInvoices(f.authorisedListId ?? '')
  if (f.authorisedListId === undefined) return <Missing what="authorised List" />
  return <ListInvoices rows={rows} />
}

// ---------------------------------------------------------------------------
// Shared panels and forms
// ---------------------------------------------------------------------------

export function AlertOfficeDemo({ f }: F) {
  if (f.detailListId === undefined) return <Missing what="active List" />
  return <AlertOfficeEntry actor={f.actor} target={{ listId: f.detailListId }} compact />
}

export function AvailabilityEditorDemo({ f }: F) {
  const [span, setSpan] = useState<'one' | 'three'>('one')
  const toISO = format(addDays(parseISO(f.todayISO), 2), 'yyyy-MM-dd')
  return (
    <>
      <Knobs label="Selection" value={span} options={[{ value: 'one', label: 'One day' }, { value: 'three', label: 'Three days' }]} onChange={setSpan} />
      <AvailabilityEditor
        key={span}
        actor={f.actor}
        anaesthetistId={f.anaesthetistId}
        fromISO={f.todayISO}
        {...(span === 'three' ? { toISO } : {})}
        shot="catalogue-availability-editor"
      />
    </>
  )
}

export function SeriesListDemo({ f }: F) {
  return <SeriesList actor={f.actor} anaesthetistId={f.anaesthetistId} shot="catalogue-series" emptyText="No repeating days off. Choose Repeat in the form to set one." />
}

export function MovedToYouDemo({ f }: F) {
  return (
    <Sandboxed>
      {(go) => (
        <>
          <MovedToYouPanel anaesthetistId={f.movedToId} onOpenList={(id) => go(`Would open List ${id}`)} onOpenBooking={(_l, b) => go(`Would open Booking ${b}`)} />
          {f.movedToId === f.anaesthetistId && <StageHint>Nothing has been moved to anyone in the current data, so the panel renders nothing. Move a List in the app to see it.</StageHint>}
        </>
      )}
    </Sandboxed>
  )
}

const RESULT_SAMPLES = ['Your three days off are saved.', 'Thursday AM is open for cover again.'] as const

export function ResultLineDemo() {
  const [line, setLine] = useState<string | null>(RESULT_SAMPLES[0])
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {RESULT_SAMPLES.map((s, i) => (
          <KnobButton key={s} onClick={() => setLine(s)}>Sample {i + 1}</KnobButton>
        ))}
        <KnobButton onClick={() => setLine(null)}>Clear</KnobButton>
      </div>
      <ResultLine line={line} shot="availability-result" onDismiss={() => setLine(null)} />
    </>
  )
}

export function HistoryTimelineDemo({ f }: F) {
  const audit = useAppStore((s) => s.audit)
  const entries = useMemo(() => sortAuditNewestFirst(audit.filter((a) => a.entityId === f.historyEntityId)), [audit, f.historyEntityId])
  if (f.historyEntityId === undefined) return <Missing what="Booking history" />
  return <HistoryTimeline entries={entries} subject="booking" />
}

// ---------------------------------------------------------------------------
// Availability (custom)
// ---------------------------------------------------------------------------

export function AvailabilityCellDemo({ f }: F) {
  const schedule = useAppStore((s) => s.schedule)
  const appSettings = useAppStore((s) => s.appSettings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [said, setSaid] = useState<string | null>(null)
  const views = useMemo(() => {
    const all = slotViewsForDate({ schedule, appSettings, masters: { slotStatuses } }, f.todayISO)
    const seen = new Set<string>()
    const out: SlotView[] = []
    for (const v of [...all].sort((a, b) => a.slot.id.localeCompare(b.slot.id))) {
      const k = v.open ? 'open' : v.displayKey
      if (seen.has(k)) continue
      seen.add(k)
      out.push(v)
      if (out.length === 4) break
    }
    return out
  }, [schedule, appSettings, slotStatuses, f.todayISO])

  function labels(view: SlotView): { l1: string; l2: string } {
    const list = view.list
    if (list === undefined) {
      const status = resolveDisplayStatus(view.slot.status, slotStatuses)
      if (view.open) return { l1: status.label, l2: 'Open for booking' }
      return { l1: status.longLabel, l2: view.slot.note ?? '' }
    }
    if (list.kind === 'preop') return { l1: 'Pre-op clinic', l2: locationName(list.hospitalId, hospitals) }
    const l2 = surgeons[list.surgeonId]?.name ?? ''
    return { l1: locationName(list.hospitalId, hospitals), l2 }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {views.map((v) => (
          <AvailabilityCell
            key={v.slot.id}
            view={v}
            labels={labels(v)}
            {...(v.open ? { onClick: () => setSaid('Would open the move sheet into this free session.'), action: 'Move here', title: 'Move your List here' } : {})}
          />
        ))}
        <AvailabilityCell view={undefined} labels={{ l1: 'No session', l2: '' }} />
      </div>
      <Said text={said} />
      <StageHint>Real session views for today. Only an actionable cell is enabled; the rest are disabled buttons, so a keyboard skips them.</StageHint>
    </>
  )
}

export function AvailabilityGridDemo({ f }: F) {
  return (
    <Sandboxed>
      {() => (
        <Wide width={1180}>
          <AvailabilityGrid anaesthetistId={f.anaesthetistId} todayISO={f.todayISO} />
        </Wide>
      )}
    </Sandboxed>
  )
}

// ---------------------------------------------------------------------------
// Charts, numbers and motion
// ---------------------------------------------------------------------------

export function BookingTotalDemo({ f }: F) {
  const rate = useAppStore((s) => s.masters.anaesthetists[f.anaesthetistId]?.unitValue ?? 26.5)
  const [units, setUnits] = useState(12)
  const [needsPrice, setNeedsPrice] = useState<'no' | 'yes'>('no')
  const base = Math.min(units, 6)
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <KnobButton onClick={() => setUnits((u) => Math.max(0, u - 1))}>One unit less</KnobButton>
        <KnobButton onClick={() => setUnits((u) => u + 1)}>One unit more</KnobButton>
        <Knobs label="Needs a price" value={needsPrice} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={setNeedsPrice} />
      </div>
      <BookingTotalPanel
        units={units}
        fee={units * rate}
        needsPrice={needsPrice === 'yes'}
        lines={[
          { label: 'Procedure 1', amount: base * rate },
          { label: 'Procedure 2', amount: (units - base) * rate, note: 'Additional · T' },
        ]}
        rateLabel={`FEE @ ${formatCurrency(rate)}/UNIT`}
        overrideNote={null}
      />
      <StageHint>Change the units: both figures tick (useTickingValue) with the green flash.</StageHint>
    </>
  )
}

export function TickBadgeDemo() {
  const [n, setN] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: semantic.success.onTint }}>
        Complete <TickBadge key={n} size={26} animate={n > 0} />
      </span>
      <KnobButton onClick={() => setN((x) => x + 1)}>Replay the tick</KnobButton>
    </div>
  )
}

export function CompleteBarDemo() {
  const [completed, setCompleted] = useState(false)
  const [canAmend, setCanAmend] = useState<'yes' | 'no'>('yes')
  return (
    <>
      <Knobs label="List still active" value={canAmend} options={[{ value: 'yes', label: 'Yes (Amend shown)' }, { value: 'no', label: 'No' }]} onChange={setCanAmend} />
      <CompleteBar completed={completed} canAmend={canAmend === 'yes'} onComplete={() => setCompleted(true)} onAmend={() => setCompleted(false)} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Capture cards (live on a seeded Booking)
// ---------------------------------------------------------------------------

/** The seeded Procedure, its List and whether it can be captured, read live from the store. */
function CaptureHost({ f, children }: F & { children: (ctx: { procedure: Procedure; canCapture: boolean; onError: (m: string) => void }) => ReactNode }) {
  const procedure = useAppStore((s) => (f.capture !== undefined ? s.schedule.procedures[f.capture.procedureId] : undefined))
  const list = useAppStore((s) => (f.capture !== undefined ? s.schedule.lists[f.capture.listId] : undefined))
  const completed = useAppStore((s) => (f.capture !== undefined ? s.schedule.bookings[f.capture.bookingId]?.completed === true : false))
  const [error, setError] = useState<string | null>(null)
  if (procedure === undefined || list === undefined) return <Missing what="Booking still to capture" />
  const canCapture = isAssignedList(list) && editRefusal(f.actor, list) === null && !completed
  return (
    <RowBoundary>
      {children({ procedure, canCapture, onError: setError })}
      {error !== null && <div style={{ marginTop: 8, fontSize: 12.5, color: semantic.error.onTint }}>{error}</div>}
    </RowBoundary>
  )
}

export function TimesCardDemo({ f }: F) {
  return <CaptureHost f={f}>{({ procedure, canCapture, onError }) => <TimesCard procedure={procedure} actor={f.actor} canCapture={canCapture} failures={[]} onError={onError} />}</CaptureHost>
}

export function RvgCodeFieldDemo({ f }: F) {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  return (
    <CaptureHost f={f}>
      {({ procedure, canCapture, onError }) => (
        <RvgCodeField
          procedure={procedure}
          rvgGroup={procedure.rvgGroupId !== undefined ? rvgGroups[procedure.rvgGroupId] : undefined}
          rvgGroups={rvgGroups}
          actor={f.actor}
          canCapture={canCapture}
          failures={[]}
          onError={onError}
        />
      )}
    </CaptureHost>
  )
}

export function CodePickerDemo() {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<RvgGroupId | undefined>(undefined)
  const row = picked !== undefined ? rvgGroups[picked] : undefined
  return (
    <>
      <KnobButton onClick={() => setOpen(true)}>Choose an RVG code</KnobButton>
      <Said text={row !== undefined ? `Picked ${row.code} · ${row.description} (held locally, nothing saved)` : null} />
      <CodePickerSheet
        open={open}
        {...(picked !== undefined ? { currentId: picked } : {})}
        rvgGroups={rvgGroups}
        onPick={(id) => {
          setPicked(id)
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

function UnitsCardBody({ f, procedure, canCapture, onError }: F & { procedure: Procedure; canCapture: boolean; onError: (m: string) => void }) {
  const list = useAppStore((s) => (f.capture !== undefined ? s.schedule.lists[f.capture.listId] : undefined))
  const masters = useAppStore((s) => s.masters)
  const patientId = useAppStore((s) => s.schedule.bookings[procedure.bookingId]?.patientId)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  if (list === undefined || !isAssignedList(list)) return null
  const procedures = Object.values(proceduresRecord).filter((p) => p.bookingId === procedure.bookingId).sort((a, b) => a.id.localeCompare(b.id))
  const view = bookingFee({ procedures, list, masters, patientId }).views[procedure.id]
  if (view === undefined) return null
  return <UnitsCard procedure={procedure} btm={view.fee.btm} rvgGroup={view.rvgGroup} actor={f.actor} canCapture={canCapture} allocation={view.allocation} onError={onError} />
}

export function UnitsCardDemo({ f }: F) {
  return <CaptureHost f={f}>{(ctx) => <UnitsCardBody f={f} {...ctx} />}</CaptureHost>
}

function PriceCardBody({ f, procedure, canCapture, onError }: F & { procedure: Procedure; canCapture: boolean; onError: (m: string) => void }) {
  const list = useAppStore((s) => (f.capture !== undefined ? s.schedule.lists[f.capture.listId] : undefined))
  const masters = useAppStore((s) => s.masters)
  const patientId = useAppStore((s) => s.schedule.bookings[procedure.bookingId]?.patientId)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  if (list === undefined || !isAssignedList(list)) return null
  const procedures = Object.values(proceduresRecord).filter((p) => p.bookingId === procedure.bookingId).sort((a, b) => a.id.localeCompare(b.id))
  const view = bookingFee({ procedures, list, masters, patientId }).views[procedure.id]
  if (view === undefined) return null
  return <PriceCard procedure={procedure} actor={f.actor} fee={view.fee} contract={view.contract} canCapture={canCapture} failures={[]} onError={onError} />
}

/** Catch-up Phase 24: the price line on a seeded Booking still to capture (live; Save writes to the demo data). */
export function PriceCardDemo({ f }: F) {
  return <CaptureHost f={f}>{(ctx) => <PriceCardBody f={f} {...ctx} />}</CaptureHost>
}

/** Catch-up Phase 24: the phone's dock strip, fed local figures. */
export function BookingTotalStripDemo({ f }: F) {
  const rate = useAppStore((s) => s.masters.anaesthetists[f.anaesthetistId]?.unitValue ?? 26.5)
  const [units, setUnits] = useState(12)
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <KnobButton onClick={() => setUnits((u) => Math.max(0, u - 1))}>One unit less</KnobButton>
        <KnobButton onClick={() => setUnits((u) => u + 1)}>One unit more</KnobButton>
      </div>
      <div style={{ maxWidth: 340 }}>
        <BookingTotalStrip units={units} fee={units * rate} lines={[]} rateLabel={`FEE @ ${formatCurrency(rate)}/UNIT`} overrideNote={null} />
      </div>
      <StageHint>Change the units: both figures tick with the green flash, as a modifier claimed on the phone does.</StageHint>
    </>
  )
}
