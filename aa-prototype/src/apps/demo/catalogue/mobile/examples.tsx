/**
 * Live, interactive examples for the Mobile catalogue. Each holds its own state
 * and renders the REAL component (or a recreation from `recreations.tsx` where
 * the component is local to a screen). Navigation is stubbed: handlers write a
 * line under the example instead of changing the route.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeftRight, BellRing, ChevronLeft } from 'lucide-react'
import { accent, neutral, radius } from '../../../../theme/tokens'
import { motion } from '../../../../theme/motion'
import { LIST_KINDS, type AssignedList } from '../../../../domain/types'
import type { Warning } from '../../../../domain/warnings/types'
import type { ListProgress } from '../../../../domain/listProgress'
import { listProgress } from '../../../../domain/listProgress'
import { isAssignedList } from '../../../../domain/draftLists'
import { editRefusal, profileFor, useAppStore, useToday, type Actor, type CalendarSession } from '../../../../store'
import { ProfileRow } from '../../../../shared/profile'
import {
  Avatar,
  DockSpacer,
  ListRow,
  ProgressPill,
  StatusChip,
  SuccessOverlay,
  TickBadge,
  useAnaesthetistStatusChoices,
  useSurface,
  WarningTriangle,
  type ListRowRight,
} from '../../../../shared'
import { Button, DefList, FilterPills, FormError, ProgressBar, Segmented, SlidingSegmentedControl, TextAction, TextArea, TextField } from '../../../../shared/ui'
import { OutOfHoursMoon, useBookingSearch } from '../../../../shared/schedule'
import { AlertOfficeSheet, MovedToYouPanel, SubmitListSheet, useBookingsMovedToMe, useMovedToMe } from '../../../../shared/flows'
import { AvailabilityEditor, SeriesList, useAvailabilityMonth } from '../../../../shared/availability'
import { TimesCard } from '../../../../shared/capture/TimesCard'
import { CaptureSection, NudgeButton, NumberStepper, StepperButton, Caption } from '../../../../shared/capture/ui'
import { CompleteBar } from '../../../../shared/capture/CompleteBar'
import { useTickingValue } from '../../../../shared/capture/useTickingValue'
import { BookingDetailBody, PrepaymentPanel } from '../../../../shared/booking'
import { monthOf } from '../../../../shared/availability'
import { EditRateSheet, ListOptionsSheet, MobileHeader, SlideStack, type ListOption, type SlideLayer } from '../../../mobile/components'
import { LookbackDateSheet, LookbackResults, LookbackSearchRow } from '../../../mobile/screens/ListsLookback'
import { DayChip } from '../../../../shared/ui/DayChip'
import { listRowModel } from '../../../mobile/screens/listRowModel'
import { dayWithYear, formatCurrency } from '../../../../shared/format'
import {
  BookingCardCopy,
  BottomTabBarCopy,
  ColleagueCellsCopy,
  DateStripCopy,
  HalfBlockCopy,
  HeroFigureCardCopy,
  InstallCoachCopy,
  MyCalendarGridCopy,
  SubmitDockCopy,
  ToggleRowCopy,
  UpdatePromptCopy,
  type BookingCardState,
  type DockState,
  FILTERS,
  type Filter,
} from './recreations'
import { useMobilePersona, type SeedPicks } from './persona'
import { procedureLabel } from '../../../../domain/billing/procedureStack'
import { OverlayHeader } from '../../../../shared/surface/OverlayHeader'
import { DoneStep, InlineConfirm } from '../../../../shared/ui'
import { EmptyState } from '../../../../shared/ui/EmptyState'
import { SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../../../../domain/seed'
import { SEED_STUB } from '../../../../domain/seed/intakeSeed'
import { STUB_ONLY_REASON } from '../../../../domain/intake/stubs'

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Fills the whole stage (escaping its padding), as a phone screen does. */
export function Bleed({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', ...style }}>{children}</div>
}

/** The line a stubbed handler writes, so a tap visibly does something. */
export function Said({ line }: { line: string | null }) {
  if (line === null) return null
  return (
    <div role="status" style={{ marginTop: 10, fontSize: 12.5, color: neutral.slate, background: neutral.surface, border: `1px dashed ${neutral.lineStrong}`, borderRadius: radius.ctl, padding: '6px 10px' }}>
      {line}
    </div>
  )
}

function Missing({ what }: { what: string }) {
  return <div style={{ fontSize: 13, color: neutral.mist }}>No seeded {what} for this persona.</div>
}

const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 }
const row: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }

function useList(listId: string | null): AssignedList | undefined {
  const list = useAppStore((s) => (listId !== null ? s.schedule.lists[listId] : undefined))
  return isAssignedList(list) ? list : undefined
}

// ---------------------------------------------------------------------------
// Navigation and headers
// ---------------------------------------------------------------------------

export function BottomTabBarExample() {
  const [tab, setTab] = useState<'lists' | 'availability' | 'balances' | 'more'>('lists')
  return (
    <Bleed>
      <div style={{ padding: 20, fontSize: 15, color: neutral.slate }}>
        Showing the <strong style={{ color: neutral.ink }}>{tab}</strong> tab.
      </div>
      <BottomTabBarCopy active={tab} onSelect={setTab} />
    </Bleed>
  )
}

export function MobileHeaderExample() {
  const { initials } = useMobilePersona()
  return <MobileHeader eyebrow="Find cover" title="Availability" initials={initials} />
}

function MiniLayer({ title, back, onBack, children }: { title: string; back?: string; onBack?: () => void; children: ReactNode }) {
  return (
    <div style={{ height: '100%', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
      {back !== undefined && onBack !== undefined && (
        <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          {back}
        </button>
      )}
      <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  )
}

export function SlideStackExample() {
  const [depth, setDepth] = useState(0)
  const pop = () => setDepth((d) => Math.max(0, d - 1))
  const push = () => setDepth((d) => Math.min(2, d + 1))
  const layers: SlideLayer[] = [
    { key: 'home', mounted: true, node: <MiniLayer title="Lists"><Button onClick={push}>Open a List</Button></MiniLayer> },
    { key: 'list', mounted: true, node: <MiniLayer title="List" back="Lists" onBack={pop}><Button onClick={push}>Open a Booking</Button></MiniLayer> },
    { key: 'booking', mounted: true, node: <MiniLayer title="Booking" back="List" onBack={pop}><div style={{ fontSize: 14, color: neutral.slate }}>Swipe from the left edge (touch only) or tap back.</div></MiniLayer> },
  ]
  return (
    <Bleed>
      <div style={{ position: 'relative', flex: 1 }}>
        <SlideStack layers={layers} depth={depth} onPop={depth > 0 ? pop : undefined} />
      </div>
      <div style={{ ...row, padding: '10px 14px', borderTop: `1px solid ${neutral.line}`, background: neutral.surface }}>
        <Button variant="pill" onClick={pop} disabled={depth === 0}>Pop</Button>
        <Button variant="pill" onClick={push} disabled={depth === 2}>Push</Button>
        <span style={{ fontSize: 12.5, color: neutral.mist }}>Depth {depth}</span>
      </div>
    </Bleed>
  )
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

export function BottomSheetExample() {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open a bottom sheet</Button>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={col}>
          <OverlayHeader title="A bottom sheet" />
          <div style={{ fontSize: 14, color: neutral.slate }}>Tap the scrim, the handle or Close, or press Escape on a keyboard. There is no drag to dismiss.</div>
          <Button variant="secondary" block onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Overlay>
    </>
  )
}

export function InlineConfirmExample() {
  const [asking, setAsking] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  return (
    <div style={col}>
      {deleted ? (
        <div style={{ fontSize: 13, color: neutral.slate }}>Deleted (locally). Reload the page to try again.</div>
      ) : (
        <>
          <div style={{ fontSize: 14, color: neutral.ink }}>Weekly clinic series</div>
          {asking ? (
            <InlineConfirm
              label="Delete the series"
              message="Delete the whole series? This cannot be undone."
              confirmLabel="Delete"
              onConfirm={() => setDeleted(true)}
              cancelLabel="Keep it"
              onCancel={() => setAsking(false)}
              returnFocus={() => openerRef.current}
            />
          ) : (
            <button ref={openerRef} type="button" onClick={() => setAsking(true)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, color: accent.pressed, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Delete
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function DoneStepExample() {
  const [done, setDone] = useState(false)
  return done ? (
    <Button variant="secondary" onClick={() => setDone(false)}>Show the done step again</Button>
  ) : (
    <DoneStep title="Sent" detail="The office has been told." action={<Button block onClick={() => setDone(true)}>Done</Button>} />
  )
}

export function ListOptionsSheetExample() {
  const [open, setOpen] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const options: ListOption[] = [
    { key: 'move', shot: 'catalogue-list-move', icon: <ArrowLeftRight size={18} strokeWidth={2.2} />, label: 'Move this List', hint: 'Give it to a colleague or back to the office', onSelect: () => { setOpen(false); setLine('Move this List: would open the move sheet.') } },
    { key: 'alert', shot: 'catalogue-list-alert', icon: <BellRing size={18} strokeWidth={2.2} />, label: 'Alert the office', hint: 'Ask the office to check this List, with a note', onSelect: () => { setOpen(false); setLine('Alert the office: would open its sheet.') } },
    { key: 'done', shot: 'catalogue-list-alerted', icon: <BellRing size={18} strokeWidth={2.2} />, label: 'The office has been alerted', hint: 'It stays with the office until someone there deals with it', disabled: true, onSelect: () => undefined },
  ]
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>List options</Button>
      <Said line={line} />
      <ListOptionsSheet open={open} title="St George's AM" subtitle="Today · 08:00 to 12:30" options={options} onClose={() => setOpen(false)} />
    </>
  )
}

export function AlertOfficeSheetExample({ picks }: { picks: SeedPicks }) {
  const { actor } = useMobilePersona()
  const [open, setOpen] = useState(false)
  if (picks.listId === null) return <Missing what="List" />
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <BellRing size={16} aria-hidden /> Alert the office
      </Button>
      {open && <AlertOfficeSheet open actor={actor} target={{ listId: picks.listId }} onClose={() => setOpen(false)} />}
    </>
  )
}

export function SubmitListSheetExample({ picks }: { picks: SeedPicks }) {
  const { actor } = useMobilePersona()
  const [open, setOpen] = useState<'rows' | 'held' | null>(null)
  if (picks.listId === null) return <Missing what="List" />
  return (
    <>
      <div style={row}>
        <Button variant="secondary" onClick={() => setOpen('rows')}>What is left to finish?</Button>
        <Button variant="secondary" onClick={() => setOpen('held')}>A List waiting at intake</Button>
      </div>
      {open === 'rows' && <SubmitListSheet open listId={picks.listId} actor={actor} mode="blockers" onClose={() => setOpen(null)} onSubmitted={() => setOpen(null)} />}
      {/* The stub-only List (Dr Souter's Tue 8 Dec PM): the List-level reason, "Waiting at intake". */}
      {open === 'held' && <SubmitListSheet open listId={SEED_STUB.listId} actor={actor} mode="blockers" listReason={STUB_ONLY_REASON} onClose={() => setOpen(null)} onSubmitted={() => setOpen(null)} />}
    </>
  )
}

export function AvailabilityEditorExample() {
  const { actor, anaesthetistId } = useMobilePersona()
  const todayISO = useToday()
  const { Overlay } = useSurface()
  const [sheet, setSheet] = useState<'day' | 'add' | null>(null)
  return (
    <>
      <div style={row}>
        <Button variant="secondary" onClick={() => setSheet('day')}>Change {dayWithYear(todayISO)}</Button>
        <Button onClick={() => setSheet('add')}>Add days off</Button>
      </div>
      <Overlay open={sheet !== null} onClose={() => setSheet(null)}>
        {sheet !== null && (
          <AvailabilityEditor
            key={sheet}
            actor={actor}
            anaesthetistId={anaesthetistId}
            fromISO={todayISO}
            {...(sheet === 'add' ? { formPreset: { sessions: 'both' as const, span: 'week' as const } } : {})}
            shot="catalogue-availability-sheet"
            onDone={() => setSheet(null)}
          />
        )}
      </Overlay>
    </>
  )
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export function ButtonExample() {
  const [line, setLine] = useState<string | null>(null)
  return (
    <div style={col}>
      <Button block onClick={() => setLine('Primary tapped')}>Mark complete</Button>
      <div style={row}>
        <Button variant="secondary" onClick={() => setLine('Secondary tapped')}>Secondary</Button>
        <Button variant="pill" onClick={() => setLine('Pill tapped')}>Pill</Button>
        <Button variant="pill" disabled>Disabled</Button>
      </div>
      <Button block disabled>Primary, disabled</Button>
      <Said line={line} />
    </div>
  )
}

export function PressFeedbackExample() {
  const [n, setN] = useState(0)
  return (
    <div style={col}>
      <div style={{ fontSize: 13, color: neutral.slate }}>Press and hold: every enabled button in the phone UI sinks 1px and scales to 0.985.</div>
      <Button block onClick={() => setN((x) => x + 1)}>Hold me</Button>
      <button type="button" onClick={() => setN((x) => x + 1)} style={{ padding: '14px 16px', borderRadius: radius.card, border: `1px solid ${neutral.line}`, background: neutral.surface, fontFamily: 'inherit', fontSize: 15, textAlign: 'left', cursor: 'pointer' }}>
        A card button
      </button>
      <span style={{ fontSize: 12.5, color: neutral.mist }}>Pressed {n} times</span>
    </div>
  )
}

export function SlidingSegmentedExample() {
  const [mode, setMode] = useState<'everyone' | 'free'>('everyone')
  const [section, setSection] = useState<'outstanding' | 'gst'>('outstanding')
  const [asa, setAsa] = useState<string>('2')
  return (
    <div style={col}>
      <SlidingSegmentedControl value={mode} options={[{ value: 'everyone', label: 'Everyone' }, { value: 'free', label: 'Free only' }]} onSelect={setMode} variant="surface" ariaLabel="Availability view" buttonStyle={{ height: 40 }} />
      <SlidingSegmentedControl
        value={section}
        options={[{ value: 'outstanding', label: 'Outstanding' }, { value: 'gst', label: 'GST this month' }]}
        onSelect={setSection}
        variant="teal"
        ariaLabel="Balance section"
      />
      <SlidingSegmentedControl value={asa} options={['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: v }))} onSelect={setAsa} variant="teal" ariaLabel="ASA" />
    </div>
  )
}

export function SegmentedExample() {
  const [value, setValue] = useState<'am' | 'pm' | 'both'>('both')
  const [locked, setLocked] = useState(false)
  return (
    <div style={col}>
      <Segmented label="Sessions" value={value} options={[{ value: 'am', label: 'AM' }, { value: 'pm', label: 'PM' }, { value: 'both', label: 'Both' }]} onChange={setValue} disabled={locked} />
      <Button variant="pill" onClick={() => setLocked((l) => !l)}>{locked ? 'Make editable' : 'Make read only'}</Button>
    </div>
  )
}

export function FilterChipsExample() {
  const [filter, setFilter] = useState<Filter>('week')
  return (
    <div style={col}>
      <FilterPills size="lg" ariaLabel="Show Lists" value={filter} options={FILTERS.map((f) => ({ value: f.key, label: f.label }))} onSelect={setFilter} />
      <span style={{ fontSize: 12.5, color: neutral.mist }}>Filter: {filter}</span>
    </div>
  )
}

export function StepperButtonExample() {
  const [units, setUnits] = useState(5)
  return (
    <div style={{ ...row, flexWrap: 'nowrap' }}>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Base units</span>
      <StepperButton glyph="−" label="Fewer base units" onClick={() => setUnits((u) => Math.max(0, u - 1))} disabled={units === 0} />
      <span className="mono" style={{ width: 36, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>{units}</span>
      <StepperButton glyph="+" label="More base units" onClick={() => setUnits((u) => u + 1)} />
    </div>
  )
}

export function NumberStepperExample() {
  const [units, setUnits] = useState(2)
  const [base, setBase] = useState(12)
  return (
    <div style={col}>
      <div style={{ ...row, flexWrap: 'nowrap' }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Modifier units (0 to 5)</span>
        <NumberStepper value={units} onChange={setUnits} min={0} max={5} label="modifier units" />
      </div>
      <div style={{ ...row, flexWrap: 'nowrap' }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Base units (tap to type)</span>
        <NumberStepper value={base} onChange={setBase} min={10} max={14} label="base units" typeable={{ name: 'Base units' }} />
      </div>
      <span style={{ fontSize: 12.5, color: neutral.mist }}>Modifier {units} · base {base}. The base takes a typed whole number from 10 to 14.</span>
    </div>
  )
}

export function NudgeButtonExample() {
  const [mins, setMins] = useState(8 * 60 + 30)
  const label = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
  return (
    <div style={{ ...row, flexWrap: 'nowrap' }}>
      <NudgeButton label="−5" ariaLabel="5 minutes earlier" onClick={() => setMins((m) => Math.max(0, m - 5))} />
      <span className="mono" style={{ fontSize: 28, fontWeight: 700, minWidth: 90, textAlign: 'center' }}>{label}</span>
      <NudgeButton label="+5" ariaLabel="5 minutes later" onClick={() => setMins((m) => Math.min(23 * 60 + 55, m + 5))} />
    </div>
  )
}

export function ToggleRowExample() {
  const [on, setOn] = useState(false)
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: '6px 16px' }}>
      <ToggleRowCopy on={on} onChange={setOn} label="Play the office" />
    </div>
  )
}

export function TextFieldExample() {
  const [value, setValue] = useState('')
  const [email, setEmail] = useState('payer@')
  const emailInvalid = email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  return (
    <div style={col}>
      <TextField label="Patient name" value={value} onChange={setValue} placeholder="Surname, first name" hint="As it appears on the List" fill="surface" />
      <TextField label="Payer email" type="email" value={email} onChange={setEmail} invalid={emailInvalid} hint={emailInvalid ? 'Type a whole email address.' : 'Where the invoice goes.'} fill="surface" />
    </div>
  )
}

export function TextAreaExample() {
  const [value, setValue] = useState('')
  return <TextArea label="Note for the office" value={value} onChange={setValue} placeholder="What should the office check?" maxLength={280} fill="surface" />
}

export function FormErrorExample() {
  const [show, setShow] = useState(true)
  return (
    <div style={col}>
      <FormError message={show ? 'Add a note of at least 3 characters.' : null} />
      <FormError variant="inline" message={show ? 'Could not clear: the warning was already cleared.' : null} />
      <Button variant="pill" onClick={() => setShow((s) => !s)}>{show ? 'Clear the error' : 'Show the error'}</Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Search and dates
// ---------------------------------------------------------------------------

export function LookbackSearchRowExample() {
  const [query, setQuery] = useState('')
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      <LookbackSearchRow query={query} onQueryChange={setQuery} onOpenCalendar={() => setLine('Go to a date: would open the date sheet.')} />
      <Said line={query !== '' ? `Query: "${query}"` : line} />
    </>
  )
}

export function DayChipExample() {
  const todayISO = useToday()
  const [open, setOpen] = useState(true)
  return open ? <DayChip dateISO={todayISO} onClose={() => setOpen(false)} size="touch" testId="mobile-lists-day-chip" /> : <Button variant="pill" onClick={() => setOpen(true)}>Bring the chip back</Button>
}

export function MonthGridExample() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Go to a date</Button>
      <Said line={picked !== null ? `Picked ${dayWithYear(picked)}` : null} />
      <LookbackDateSheet
        open={open}
        onClose={() => setOpen(false)}
        anaesthetistId={anaesthetistId}
        todayISO={todayISO}
        selectedISO={picked}
        onPick={(d) => {
          setOpen(false)
          setPicked(d)
        }}
      />
    </>
  )
}

export function LookbackResultsExample() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday()
  const patients = useAppStore((s) => s.masters.patients)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const lists = useAppStore((s) => s.schedule.lists)
  // A surname from one of her own Bookings, so the search finds something real.
  const query = useMemo(() => {
    const b = Object.values(bookings)
              .filter((x) => lists[x.listId]?.anaesthetistId === anaesthetistId)
              .sort((x, y) => x.id.localeCompare(y.id))[0]
    const name = b !== undefined ? patients[b.patientId]?.name : undefined
    return name?.split(/[ ,]+/).find((p) => p.length >= 3) ?? ''
  }, [bookings, lists, patients, anaesthetistId])
  const results = useBookingSearch(anaesthetistId, query, todayISO)
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      <div style={{ fontSize: 12.5, color: neutral.mist }}>Results for "{query}"</div>
      <LookbackResults upcoming={results.upcoming.slice(0, 3)} past={results.past.slice(0, 3)} onOpenBooking={() => setLine('Would open the Booking.')} />
      <Said line={line} />
    </>
  )
}

export function DateStripExample() {
  const todayISO = useToday()
  const [selected, setSelected] = useState(todayISO)
  return (
    <div style={col}>
      <DateStripCopy selected={selected} onSelect={setSelected} />
      <span style={{ fontSize: 12.5, color: neutral.mist }}>Selected {dayWithYear(selected)}. A dot marks a day with a free session.</span>
    </div>
  )
}

export function MyCalendarGridExample() {
  const { anaesthetistId } = useMobilePersona()
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      <MyCalendarGridCopy anaesthetistId={anaesthetistId} onOpenDay={(d) => setLine(`Would open the sheet for ${dayWithYear(d)}.`)} />
      <Said line={line} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Rows, cards and display
// ---------------------------------------------------------------------------

export function ListRowExample({ picks }: { picks: SeedPicks }) {
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const [line, setLine] = useState<string | null>(null)
  const real = useMemo(() => {
    return picks.ownListIds
      .map((id) => lists[id])
      .filter((l): l is AssignedList => isAssignedList(l) && l.dateISO >= todayISO)
      .slice(0, 2)
      .map((l) => {
        const active = Object.values(bookings).filter((b) => b.listId === l.id && b.cancellation === undefined)
        return { list: l, model: listRowModel(l, active, listProgress(l, active, todayISO), masters) }
      })
  }, [picks.ownListIds, lists, bookings, masters, todayISO])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {real.map(({ list, model }, i) => (
        <ListRow key={list.id} statusKey={list.kind} session={list.session} {...model} listId={list.id} {...(i === 0 ? { badge: 'New' } : { stubCount: 1 })} onClick={() => setLine(`Would open ${model.title}.`)} />
      ))}
      <ListRow statusKey="free" variant="open" session="PM" title="Free session" subtitle="Open for bookings" right={{ kind: 'chip', statusKey: 'free', label: 'Free' }} />
      <ListRow statusKey="holiday" variant="closed" title="On holiday" subtitle="On holiday" right={{ kind: 'chip', statusKey: 'holiday', label: 'Holiday' }} />
      <ListRow statusKey="private" session="AM" title="A submitted List" subtitle="Quiet: less prominent, still editable" right={{ kind: 'progress', progress: 'submitted' } satisfies ListRowRight} quiet onClick={() => setLine('Would open the submitted List.')} />
      <Said line={line} />
    </div>
  )
}

export function BookingCardExample({ picks }: { picks: SeedPicks }) {
  const bookings = useAppStore((s) => s.schedule.bookings)
  const procedures = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const rvgGroupsForLabels = useAppStore((s) => s.masters.rvgGroups)
  const rows = useMemo(() => {
    if (picks.listId === null) return []
    return Object.values(bookings)
      .filter((b) => b.listId === picks.listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((b) => {
        const proc = Object.values(procedures).find((p) => p.bookingId === b.id && p.isPrimary)
        const patient = patients[b.patientId]
        return { id: b.id, time: b.scheduledTime ?? '·', patientName: patient?.name ?? 'Unknown patient', nhi: patient?.nhi, operation: proc !== undefined ? procedureLabel(proc, rvgGroupsForLabels, 1) : 'Procedure to capture' }
      })
  }, [picks.listId, bookings, procedures, patients, rvgGroupsForLabels])
  const [states, setStates] = useState<Record<string, BookingCardState>>({})
  const next: Record<BookingCardState, BookingCardState> = { capture: 'done', done: 'cancelled', cancelled: 'capture' }
  if (rows.length === 0) return <Missing what="Bookings" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r) => {
        const state = states[r.id] ?? 'capture'
        return <BookingCardCopy key={r.id} row={r} state={state} animateTick onClick={() => setStates((s) => ({ ...s, [r.id]: next[state] }))} />
      })}
    </div>
  )
}

export function ProgressBarExample() {
  const [done, setDone] = useState(2)
  const total = 5
  return (
    <div style={col}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{done} of {total} complete</span>
        <ProgressBar done={done} total={total} width="fill" />
      </div>
      <div style={row}>
        <Button variant="pill" onClick={() => setDone((d) => Math.max(0, d - 1))}>One fewer</Button>
        <Button variant="pill" onClick={() => setDone((d) => Math.min(total, d + 1))}>One more</Button>
      </div>
    </div>
  )
}

export function SubmitDockExample() {
  const [state, setState] = useState<DockState>('toFinish')
  const [line, setLine] = useState<string | null>(null)
  return (
    <Bleed>
      <div style={{ padding: 14 }}>
        <SlidingSegmentedControl
          value={state}
          options={[{ value: 'toFinish', label: 'To finish' }, { value: 'ready', label: 'Ready' }, { value: 'submitted', label: 'Submitted' }, { value: 'authorised', label: 'Authorised' }]}
          onSelect={setState}
          variant="surface"
          ariaLabel="Dock state"
          buttonStyle={{ fontSize: 12.5 }}
        />
        <Said line={line} />
      </div>
      <SubmitDockCopy state={state} incomplete={2} onTap={(w) => setLine(w === 'blockers' ? 'Would open the sheet naming what is left.' : 'Would open the confirm sheet.')} />
    </Bleed>
  )
}

export function DockSpacerExample() {
  return (
    <Bleed>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} style={{ padding: '14px 16px', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, fontSize: 14 }}>Item {n}</div>
        ))}
        <div style={{ outline: `1.5px dashed ${accent.base}`, outlineOffset: -1, position: 'relative' }}>
          <DockSpacer height="86px" />
          <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: accent.base }}>DockSpacer (86px)</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, background: 'rgba(246,248,247,0.92)', backdropFilter: 'blur(14px)', borderTop: `1px solid ${neutral.line}` }}>
        <Button block>Frosted dock</Button>
      </div>
    </Bleed>
  )
}

export function StatusChipExample() {
  const choices = useAnaesthetistStatusChoices()
  return (
    <div style={row}>
      {LIST_KINDS.map((k) => <StatusChip key={k} status={k} />)}
      {choices.map((s) => <StatusChip key={s.key} status={s.key} label={s.longLabel} />)}
    </div>
  )
}

export function ProgressPillExample() {
  const all: ListProgress[] = ['toFinish', 'readyToSubmit', 'submitted', 'authorised', 'invoiced']
  return <div style={{ ...row, rowGap: 10 }}>{all.map((p) => <ProgressPill key={p} progress={p} />)}</div>
}

export function OutOfHoursMoonExample() {
  return (
    <div style={{ ...row, gap: 18 }}>
      <OutOfHoursMoon />
      <OutOfHoursMoon color={neutral.mist} size={13} />
      <OutOfHoursMoon color={accent.base} size={20} />
    </div>
  )
}

export function WarningTriangleExample({ picks }: { picks: SeedPicks }) {
  const todayISO = useToday()
  const bookingId = picks.bookingId ?? 'example'
  const base = { bookingId, ruleId: 'prepaymentUnpaid' as const, kind: 'beforeProcedure' as const }
  const mild: Warning = { ...base, key: 'w1', strength: 'mild', text: 'Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent.' }
  const strong: Warning = { ...base, key: 'w2', strength: 'strong', text: 'Prepayment invoice AA-2026-0003 to Annette Riley unpaid. Check with the payer before surgery starts.' }
  const cleared: Warning = { ...mild, key: 'w3', clearance: { key: 'w3', bookingId, ruleId: 'prepaymentUnpaid', strength: 'mild', by: 'Office', role: 'office', atISO: `${todayISO}T09:00:00` } }
  const sets: { label: string; warnings: Warning[] }[] = [
    { label: 'Mild', warnings: [mild] },
    { label: 'Strong', warnings: [strong] },
    { label: 'Two open', warnings: [mild, strong] },
    { label: 'Cleared', warnings: [cleared] },
  ]
  return (
    <div style={col}>
      {sets.map((s) => (
        <div key={s.label} style={{ ...row, flexWrap: 'nowrap' }}>
          <span style={{ width: 80, fontSize: 13, color: neutral.slate }}>{s.label}</span>
          <WarningTriangle warnings={s.warnings} />
          <WarningTriangle warnings={s.warnings} size="sm" />
        </div>
      ))}
    </div>
  )
}

export function AvatarExample() {
  const { initials } = useMobilePersona()
  return (
    <div style={{ ...row, gap: 14 }}>
      <Avatar initials={initials} size={34} />
      <Avatar initials={initials} />
      <Avatar initials={initials} size={30} variant="tint" />
      <Avatar initials={initials} size={36} variant="tint" />
      <Avatar name="Dr Ana Kaur" size={36} variant="neutral" />
      <Avatar name="Dr Ana Kaur" size={36} variant="neutral" muted />
    </div>
  )
}

export function MovedToYouPanelExample() {
  const { anaesthetistId } = useMobilePersona()
  const notices = useMovedToMe(anaesthetistId)
  const bookingNotices = useBookingsMovedToMe(anaesthetistId)
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      <MovedToYouPanel anaesthetistId={anaesthetistId} onOpenList={() => setLine('Would open the List.')} onOpenBooking={() => setLine('Would open the Booking.')} />
      {notices.length === 0 && bookingNotices.length === 0 && (
        <div style={{ fontSize: 13, color: neutral.mist }}>Nothing has been moved to this persona in the last week, so the panel renders nothing. Move a List to her from another persona to see it.</div>
      )}
      <Said line={line} />
    </>
  )
}

export function SeriesListExample() {
  const { actor, anaesthetistId } = useMobilePersona()
  return <SeriesList actor={actor} anaesthetistId={anaesthetistId} shot="catalogue-series" emptyText="No repeating days off. Choose Repeat in Add days off to set one." />
}

export function ColleagueCellsExample() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday()
  const [targets, setTargets] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  return (
    <div style={col}>
      <Button variant="pill" onClick={() => setTargets((t) => !t)}>{targets ? 'Status only' : 'Show as move targets'}</Button>
      <ColleagueCellsCopy dateISO={todayISO} excludeId={anaesthetistId} limit={3} moveTargets={targets} onMoveHere={setLine} />
      <Said line={line} />
    </div>
  )
}

export function HalfBlockExample() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday()
  const days = useAvailabilityMonth(anaesthetistId, monthOf(todayISO))
  // One session per distinct display, plus a series and a flagged example built from a real one.
  const samples = useMemo(() => {
    const seen = new Map<string, CalendarSession>()
    for (const d of days) for (const s of [d.AM, d.PM]) if (s !== undefined && !seen.has(s.displayKey)) seen.set(s.displayKey, s)
    const out = [...seen.values()].slice(0, 4)
    const first = out[0]
    if (first !== undefined) {
      out.push({ ...first, slotId: `${first.slotId}-series`, series: first.series ?? { id: 'example', line: 'Every Friday' } })
      out.push({ ...first, slotId: `${first.slotId}-flag`, conflict: true })
    }
    return out
  }, [days])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {samples.map((s) => (
        <div key={s.slotId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <HalfBlockCopy session={s} />
          <span style={{ fontSize: 10.5, color: neutral.mist }}>{s.conflict ? 'Flagged' : s.series !== undefined ? 'Series' : s.displayKey}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <HalfBlockCopy session={undefined} />
        <span style={{ fontSize: 10.5, color: neutral.mist }}>No session</span>
      </div>
    </div>
  )
}

export function HeroFigureCardExample() {
  const { anaesthetistId } = useMobilePersona()
  return <HeroFigureCardCopy anaesthetistId={anaesthetistId} />
}

export function EmptyStateExample() {
  return (
    <div style={col}>
      <EmptyState>No notes for this day.</EmptyState>
      <EmptyState variant="card">No outstanding invoices. A List's invoices show here once the office authorises it.</EmptyState>
      <EmptyState variant="centred">No free sessions on this day.</EmptyState>
    </div>
  )
}

export function CaptureSectionExample() {
  const [note, setNote] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CaptureSection label="Notes" footer={<Caption>Saved when you leave the field.</Caption>}>
        <TextArea value={note} onChange={setNote} placeholder="Anything the office should know" />
      </CaptureSection>
      {/* A required field (catch-up Phase 21a): "Required" in mist, then the warning pill once validation is on. */}
      <CaptureSection label="Times" required="idle">
        <Caption>Start and finish, asked on an RVG price.</Caption>
      </CaptureSection>
      <CaptureSection label="Times" required="latched">
        <Caption>After Mark complete with the times missing.</Caption>
      </CaptureSection>
      {/* With help (catch-up Phase 43a): the info tip at the label row's end. */}
      <CaptureSection label="Price" help="capture.price">
        <Caption>Tap the info sign for the point-of-need explanation.</Caption>
      </CaptureSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feedback and motion
// ---------------------------------------------------------------------------

export function TickBadgeExample() {
  const [n, setN] = useState(0)
  return (
    <div style={col}>
      <div key={n} style={{ ...row, gap: 16 }}>
        <TickBadge size={24} animate />
        <TickBadge size={28} animate />
        <TickBadge size={40} animate />
        <TickBadge size={28} />
      </div>
      <Button variant="pill" onClick={() => setN((x) => x + 1)}>Replay</Button>
    </div>
  )
}

export function SuccessOverlayExample() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!show) return undefined
    const timer = window.setTimeout(() => setShow(false), 1050)
    return () => window.clearTimeout(timer)
  }, [show])
  return (
    <>
      <Button block onClick={() => setShow(true)}>Mark list completed</Button>
      {show && (
        <SuccessOverlay title="List submitted" onDismiss={() => setShow(false)}>
          <div style={{ fontSize: 14, color: neutral.slate }}>Sent to the office for review</div>
        </SuccessOverlay>
      )}
    </>
  )
}

export function CompleteBarExample() {
  const [completed, setCompleted] = useState(false)
  return <CompleteBar completed={completed} canAmend onComplete={() => setCompleted(true)} onAmend={() => setCompleted(false)} />
}

export function TickingValueExample() {
  const [fee, setFee] = useState(642.5)
  const f = useTickingValue(fee)
  return (
    <div style={col}>
      <div style={{ background: neutral.ink, borderRadius: radius.card, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Booking total</span>
        <span style={{ borderRadius: 8, padding: '0 8px', transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`, background: f.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)' }}>
          <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: neutral.surface }}>{formatCurrency(f.display)}</span>
        </span>
      </div>
      <div style={row}>
        <Button variant="pill" onClick={() => setFee((x) => Math.max(0, x - 32.13))}>Remove a unit</Button>
        <Button variant="pill" onClick={() => setFee((x) => x + 32.13)}>Add a unit</Button>
      </div>
    </div>
  )
}

/** The real MobileBookingLayout fold, with a copy of the Booking screen's masthead handed to it. */
export function CollapsingMastheadExample() {
  const { BookingLayout } = useSurface()
  const contentRef = useRef<HTMLDivElement>(null)
  const name = 'Patient name'
  const header = (collapsed: boolean, history: ReactNode) => {
    const FOLD = `max-height ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}, opacity 180ms ease-out, margin-top ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}`
    const REVEAL = `max-width ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}, opacity 200ms ease-out`
    return (
      <div style={{ flex: 'none', padding: '6px 20px 14px', borderBottom: `1px solid ${neutral.line}`, background: neutral.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', minHeight: 44, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
            List
          </button>
          <span aria-hidden={!collapsed} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: collapsed ? 1 : 0, maxWidth: collapsed ? '100%' : 0, overflow: 'hidden', transition: REVEAL }}>
            <span style={{ fontSize: 17, lineHeight: '24px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            <StatusChip status="private" style={{ flex: 'none', padding: '3px 8px' }} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxHeight: collapsed ? 0 : 62, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: FOLD }}>
          <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: collapsed ? 0 : 8, maxHeight: collapsed ? 0 : 64, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: FOLD }} aria-hidden={collapsed}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <StatusChip status="private" />
            {!collapsed ? history : null}
          </div>
          <span style={{ fontSize: 12, color: neutral.mist }}>Operation · Hospital</span>
        </div>
      </div>
    )
  }
  const cards = ['Patient', 'ASA status', 'RVG code', 'Times', 'Units', 'Notes'].map((label) => (
    <CaptureSection key={label} label={label}>
      <div style={{ height: 48, borderRadius: 10, background: neutral.sunken }} />
    </CaptureSection>
  ))
  return (
    <Bleed style={{ background: neutral.bg }}>
      <BookingLayout
        contentRef={contentRef}
        header={header}
        history={<Button variant="pill">History</Button>}
        banners={null}
        context={<div style={{ fontSize: 13, color: neutral.slate }}>Scroll this column: past 24px the masthead folds to a nav row.</div>}
        capture={<>{cards}</>}
        actions={null}
        summary={null}
        completeBar={null}
        overlay={null}
      />
    </Bleed>
  )
}

// ---------------------------------------------------------------------------
// Capture (real cards on a seeded Booking; taps write to the store)
// ---------------------------------------------------------------------------

function useCaptureSubject(picks: SeedPicks) {
  const { actor } = useMobilePersona()
  const procedure = useAppStore((s) => (picks.procedureId !== null ? s.schedule.procedures[picks.procedureId] : undefined))
  const booking = useAppStore((s) => (picks.bookingId !== null ? s.schedule.bookings[picks.bookingId] : undefined))
  const list = useList(booking?.listId ?? null)
  const canCapture = list !== undefined && booking !== undefined && editRefusal(actor, list) === null && !booking.completed
  return { actor, procedure, booking, list, canCapture }
}

function ErrorLine({ message }: { message: string | null }) {
  return message === null ? null : <div style={{ marginTop: 8 }}><FormError message={message} /></div>
}

export function TimesCardExample({ picks }: { picks: SeedPicks }) {
  const { actor, procedure, canCapture } = useCaptureSubject(picks)
  const [error, setError] = useState<string | null>(null)
  if (procedure === undefined) return <Missing what="procedure" />
  return (
    <>
      <TimesCard procedure={procedure} actor={actor} canCapture={canCapture} failures={[]} onError={setError} />
      <ErrorLine message={error} />
    </>
  )
}

/** The Booking's prepayment panel (catch-up Phase 27): Nair (paid, left off after authorise) and Riley (awaiting approval), read-only as Dr Souter sees them. */
export function PrepaymentPanelExample() {
  const { actor } = useMobilePersona()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PrepaymentPanel bookingId={SEED_PREPAID_BOOKING_ID} actor={actor} />
      <PrepaymentPanel bookingId={SEED_MARKERS.prepaymentBooking!.entityId} actor={actor} />
    </div>
  )
}

export function BookingDetailBodyExample({ picks }: { picks: SeedPicks }) {
  const { actor } = useMobilePersona()
  const [line, setLine] = useState<string | null>(null)
  if (picks.bookingId === null) return <Missing what="Booking" />
  return (
    <Bleed style={{ background: neutral.bg }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
        <BookingDetailBody bookingId={picks.bookingId} actor={actor} onBack={() => setLine('Completed: the screen would pop back to the List.')} />
      </div>
      {line !== null && <div style={{ padding: '0 14px 10px' }}><Said line={line} /></div>}
    </Bleed>
  )
}

// ---------------------------------------------------------------------------
// PWA pieces (recreated: see the rows' notes)
// ---------------------------------------------------------------------------

export function UpdatePromptExample() {
  const [need, setNeed] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  return (
    <Bleed>
      <div style={{ padding: 14 }}>
        <Button variant="secondary" onClick={() => { setNeed(true); setLine(null) }}>Simulate a new build</Button>
        <Said line={line} />
      </div>
      <UpdatePromptCopy needRefresh={need} bottom={24} onReload={() => { setNeed(false); setLine('Would reload into the new service worker.') }} />
    </Bleed>
  )
}

export function InstallCoachExample() {
  const [ios, setIos] = useState<'ios' | 'android'>('ios')
  const [dismissed, setDismissed] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  return (
    <div style={col}>
      <SlidingSegmentedControl value={ios} options={[{ value: 'ios', label: 'iPhone' }, { value: 'android', label: 'Android' }]} onSelect={setIos} variant="surface" ariaLabel="Platform" />
      {dismissed ? (
        <Button variant="pill" onClick={() => setDismissed(false)}>Show the tip again</Button>
      ) : (
        <InstallCoachCopy ios={ios === 'ios'} canInstall onDismiss={() => setDismissed(true)} onInstall={() => setLine('Would replay the browser install prompt.')} />
      )}
      <Said line={line} />
    </div>
  )
}

/** Phase 26: the profile rows, live from the persona's own record (the rate, a locked contact and the masked bank number). */
export function ProfileRowExample({ anaesthetistId }: { anaesthetistId: string }) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const profile = useMemo(() => profileFor({ masters: { anaesthetists } }, anaesthetistId), [anaesthetists, anaesthetistId])
  if (profile === null) return null
  return (
    <DefList gap={4} style={{ width: 340 }}>
      <ProfileRow label="Rate per unit" trailing={<TextAction onClick={() => undefined}>Change</TextAction>}>{formatCurrency(profile.unitValue)}</ProfileRow>
      <ProfileRow label="Email" locked>{profile.email}</ProfileRow>
      <ProfileRow label="HPI CPN" locked>{profile.hpiId}</ProfileRow>
      <ProfileRow label="Bank account" locked>{profile.bankAccountMasked}</ProfileRow>
    </DefList>
  )
}

/** Phase 26: the rate sheet on the persona's own record. Save writes to the demo store. */
export function EditRateSheetExample({ actor, anaesthetistId }: { actor: Actor; anaesthetistId: string }) {
  const unitValue = useAppStore((s) => s.masters.anaesthetists[anaesthetistId]?.unitValue ?? 0)
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(0)
  return (
    <>
      <Button variant="secondary" onClick={() => { setKey((k) => k + 1); setOpen(true) }}>Change rate per unit</Button>
      <EditRateSheet key={key} open={open} actor={actor} anaesthetistId={anaesthetistId} current={unitValue} onClose={() => setOpen(false)} />
    </>
  )
}

export function InfoTipExample() {
  return (
    <CaptureSection label="Times" help="capture.times">
      <Caption>Tap the info sign beside the label.</Caption>
    </CaptureSection>
  )
}

