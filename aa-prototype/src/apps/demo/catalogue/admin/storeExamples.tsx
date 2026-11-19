import { DRAFT_LIST, DRAFT_LISTS } from '../../../../shared/scheduleTerms'
import { useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { Button, FormError } from '../../../../shared'
import { SelectField } from '../../../../shared/ui'
import { HistorySheet } from '../../../../shared/booking'
import { PricingSheet } from '../../../../shared/flows'
import { SEED_MARKERS } from '../../../../domain/seed'
import { CodePickerSheet } from '../../../../shared/capture/CodePickerSheet'
import { ContractSelect } from '../../../../shared/contracts'
import type { DayNote } from '../../../../domain/types'
import { billingMonitor, OFFICE_ACTOR, useAppStore } from '../../../../store'
import { SideNav, type NavSection } from '../../../admin/components/SideNav'
import { DayNav, type SortMode } from '../../../admin/components/DayNav'
import { DayGrid } from '../../../admin/components/DayGrid'
import { DraftListBand } from '../../../admin/components/DraftListBand'
import { SlotDrawer } from '../../../admin/components/SlotDrawer'
import { DraftListDrawer } from '../../../admin/components/DraftListDrawer'
import { RightRail } from '../../../admin/components/RightRail'
import { WarningsToDo } from '../../../admin/components/WarningsToDo'
import { PrepaymentsRailCard } from '../../../admin/components/PrepaymentsRailCard'
import { PrepaymentApprovalStrip } from '../../../admin/components/PrepaymentApprovalStrip'
import { HoldingAccountPanel } from '../../../admin/components/HoldingAccountPanel'
import { NotificationsCard } from '../../../admin/components/NotificationsCard'
import { ChipMultiSelect } from '../../../admin/components/ChipMultiSelect'
import { ContactFields, EMPTY_CONTACT, type ContactDraft } from '../../../admin/components/ContactFields'
import { ClearConflictSheet } from '../../../admin/components/conflicts/ClearConflictSheet'
import { ConflictCallout, useConflictPreview } from '../../../admin/components/conflicts/ConflictCallout'
import { BookingCount, DraftStateChip, UnassignedPill, WaitingTime } from '../../../admin/components/draftLists/DraftListParts'
import { AnaesthetistCandidates, NotPreferredWarning, SurgeonPicker, useNotPreferredWarning, usePairingEntries, useSuggestionKey } from '../../../admin/components/pairing'
import { DraftListCandidates } from '../../../admin/components/pairing/DraftListCandidates'
import { ContractPanel } from '../../../admin/flows/ContractEditSheet'
import { ContractPriceRanges } from '../../../admin/flows/ContractPriceRanges'
import { SlotStatusSheet } from '../../../admin/flows/SlotStatusSheet'
import { ReviewScreen } from '../../../admin/screens/ReviewScreen'
import { InvoiceDocument } from '../../../admin/screens/InvoiceDocument'
import { STAGE_TONE, useAdminDay, useSeedIds } from './adminData'
import { Echo, Wide } from './basicExamples'
import { UpdateEmailComposer, usePickableChanges } from '../../../admin/flows/UpdateEmailComposer'
import { BookingUpdateEmailButton } from '../../../admin/flows/UpdateEmailActions'

const noop = () => {}

function Missing({ what }: { what: string }) {
  return <div style={{ fontSize: 13, color: neutral.mist }}>The seed has no {what} right now (try Demo reset).</div>
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function SideNavExample() {
  const [active, setActive] = useState<NavSection>('day')
  return (
    <div style={{ display: 'flex', height: 560 }}>
      <SideNav active={active} reviewBadge={5} billingBadge={2} conflictBadge={19} draftListBadge={4} notificationBadge={1} onNavigate={setActive} />
      <div style={{ padding: 14, fontSize: 13, color: neutral.slate }}>
        Section: <strong>{active}</strong>
        <div style={{ marginTop: 6, color: neutral.mist }}>Badge counts are fixed for the example. "Roles in this prototype" opens the real dialog.</div>
      </div>
    </div>
  )
}

export function DayNavExample() {
  const { todayISO } = useSeedIds()
  const { horizonEndISO } = useAdminDay(todayISO)
  const [dateISO, setDateISO] = useState(todayISO)
  const [sort, setSort] = useState<SortMode>('roster')
  const [finds, setFinds] = useState(0)
  return (
    <Wide minWidth={980}>
      <DayNav
        selectedDateISO={dateISO}
        summary={`Local example · ${finds === 0 ? 'Find available not clicked' : `Find available clicked ${finds}x`}`}
        sortMode={sort}
        onSort={setSort}
        onNavigateDate={setDateISO}
        todayISO={todayISO}
        maxDateISO={horizonEndISO}
        onFindAvailable={() => setFinds((n) => n + 1)}
      />
      <Echo>Date {dateISO} · order {sort === 'az' ? 'A to Z' : 'roster'}</Echo>
    </Wide>
  )
}

// ---------------------------------------------------------------------------
// Day canvas
// ---------------------------------------------------------------------------

export function DayGridExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO, 10)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [ooh, setOoh] = useState<string | null>(null)
  return (
    <Wide minWidth={1040}>
      <DayGrid
        anaesthetists={day.anaesthetists}
        viewsByAnaesthetist={day.viewsByAnaesthetist}
        masters={day.masters}
        warningFlags={day.warningFlags}
        onSelectSlot={setSlotId}
        draftLists={day.draftLists}
        bookingCounts={day.bookingCounts}
        onOpenDraftList={setDraftId}
        onOpenOutOfHours={setOoh}
      />
      <Echo>{ooh !== null ? `Open out-of-hours for ${ooh} (stubbed).` : `Click a block for its session drawer, or a ${DRAFT_LIST} in the band.`}</Echo>
      {slotId !== null && <SlotDrawer key={slotId} slotId={slotId} actor={OFFICE_ACTOR} onClose={() => setSlotId(null)} onOpenBooking={noop} />}
      {draftId !== null && <DraftListDrawer key={draftId} listId={draftId} actor={OFFICE_ACTOR} onClose={() => setDraftId(null)} onOpenBooking={noop} onAssigned={() => setDraftId(null)} onOpenList={() => setDraftId(null)} />}
    </Wide>
  )
}

/** The DayGrid with an empty roster: just its footer, the legend chips and the focus-filter pills, all live. */
export function FocusFiltersExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO)
  return (
    <Wide minWidth={760}>
      <DayGrid anaesthetists={[]} viewsByAnaesthetist={{}} masters={day.masters} warningFlags={day.warningFlags} onSelectSlot={noop} />
    </Wide>
  )
}

export function DraftListBandExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO)
  const [draftId, setDraftId] = useState<string | null>(null)
  if (day.draftLists.length === 0) return <Missing what={`${DRAFT_LISTS} today`} />
  return (
    <Wide minWidth={900}>
      <DraftListBand draftLists={day.draftLists} bookingCounts={day.bookingCounts} onOpen={setDraftId} />
      {draftId !== null && <DraftListDrawer key={draftId} listId={draftId} actor={OFFICE_ACTOR} onClose={() => setDraftId(null)} onOpenBooking={noop} onAssigned={() => setDraftId(null)} onOpenList={() => setDraftId(null)} />}
    </Wide>
  )
}

export function RightRailExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO)
  const [dateISO, setDateISO] = useState(todayISO)
  const [notes, setNotes] = useState<DayNote[]>([])
  return (
    <div>
      <Echo>Selected {dateISO}</Echo>
      <RightRail
        monthDateISO={dateISO}
        selectedDateISO={dateISO}
        todayISO={todayISO}
        onNavigateDate={setDateISO}
        notes={notes}
        onAddNote={(text, flagged) =>
          setNotes((cur) => [...cur, { id: `local-${cur.length + 1}`, text, flagged, by: 'You (local)', initials: 'YL', atISO: `${dateISO}T09:00:00` }])
        }
        reviewRows={[]}
        shellScrollbarWidth={0}
        onReviewList={noop}
        todoRows={day.todoRows}
        actor={OFFICE_ACTOR}
        onOpenBooking={noop}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drawers and sheets
// ---------------------------------------------------------------------------

export function SlotDrawerExample() {
  const { activeSlotId, emptySlotId } = useSeedIds()
  const [slotId, setSlotId] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={activeSlotId === undefined} onClick={() => setSlotId(activeSlotId ?? null)}>Session with a List</Button>
      <Button variant="secondary" disabled={emptySlotId === undefined} onClick={() => setSlotId(emptySlotId ?? null)}>Empty session</Button>
      {slotId !== null && <SlotDrawer key={slotId} slotId={slotId} actor={OFFICE_ACTOR} onClose={() => setSlotId(null)} onOpenBooking={noop} />}
    </div>
  )
}

export function DraftListDrawerExample() {
  const { draftListId } = useSeedIds()
  const [open, setOpen] = useState(false)
  if (draftListId === undefined) return <Missing what={DRAFT_LISTS} />
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>{`Open ${DRAFT_LIST} drawer`}</Button>
      {open && <DraftListDrawer listId={draftListId} actor={OFFICE_ACTOR} onClose={() => setOpen(false)} onOpenBooking={noop} onAssigned={() => setOpen(false)} onOpenList={() => setOpen(false)} />}
    </div>
  )
}

export function ClearConflictExample() {
  const { conflictedListId } = useSeedIds()
  const conflict = useAppStore((s) => (conflictedListId !== undefined ? s.schedule.lists[conflictedListId]?.conflicts[0] : undefined))
  const [open, setOpen] = useState(false)
  const [cleared, setCleared] = useState(false)
  if (conflictedListId === undefined || conflict === undefined) return <Missing what="conflicted Lists" />
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Clear conflict</Button>
      <ClearConflictSheet open={open} actor={OFFICE_ACTOR} listId={conflictedListId} conflict={conflict} onClose={() => setOpen(false)} onCleared={() => setCleared(true)} />
      <Echo>{cleared ? 'Cleared in the demo store (Demo reset restores it).' : `List ${conflictedListId}`}</Echo>
    </div>
  )
}

export function HistorySheetExample() {
  const { submittedListId } = useSeedIds()
  const slotId = useAppStore((s) => (submittedListId !== undefined ? s.schedule.lists[submittedListId]?.slotId : undefined))
  const [open, setOpen] = useState(false)
  if (submittedListId === undefined) return <Missing what="submitted Lists" />
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>List history</Button>
      <HistorySheet open={open} entityIds={slotId !== undefined ? [submittedListId, slotId] : [submittedListId]} title="List history" onClose={() => setOpen(false)} />
    </div>
  )
}

/** Catch-up Phase 24: the office's Change price on the seeded typed price (BK0179, $1,200.00 beside the computed $265.50). */
export function PricingSheetExample() {
  const procedureId = useAppStore((s) => Object.values(s.schedule.procedures).find((p) => p.bookingId === SEED_MARKERS['typedPriceBooking']?.entityId)?.id)
  const [open, setOpen] = useState(false)
  if (procedureId === undefined) return <Missing what="the typed price Booking" />
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Change price</Button>
      <PricingSheet open={open} procedureId={procedureId} actor={OFFICE_ACTOR} onClose={() => setOpen(false)} />
    </div>
  )
}

export function ContractPanelExample() {
  const { fixedContractId } = useSeedIds()
  const contract = useAppStore((s) => (fixedContractId !== undefined ? s.masters.contracts[fixedContractId] : undefined))
  const [open, setOpen] = useState<'edit' | 'new' | null>(null)
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={contract === undefined} onClick={() => setOpen('edit')}>Edit a fixed-price Contract</Button>
      <Button variant="secondary" onClick={() => setOpen('new')}>New Contract</Button>
      {open !== null && <ContractPanel open actor={OFFICE_ACTOR} {...(open === 'edit' && contract !== undefined ? { contract } : {})} onClose={() => setOpen(null)} />}
    </div>
  )
}

export function SlotStatusSheetExample() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>New availability status</Button>
      {open && <SlotStatusSheet actor={OFFICE_ACTOR} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pickers and fields
// ---------------------------------------------------------------------------

export function ContractSelectExample() {
  const [value, setValue] = useState('')
  return (
    <div>
      <ContractSelect value={value} onChange={setValue} />
      <Echo>Value: {value === '' ? '(none)' : value}</Echo>
    </div>
  )
}

/** The first active not-preferred pairing in the seed, so the pairing rows open on a case that shows it. */
function useNotPreferredPair(): { anaesthetistId: string; surgeonId: string } | undefined {
  const entries = usePairingEntries()
  return useMemo(() => {
    const e = Object.values(entries).find((x) => x.kind === 'NOT_PREFERRED' && x.endedAtISO === undefined)
    return e !== undefined ? { anaesthetistId: e.anaesthetistId, surgeonId: e.surgeonId } : undefined
  }, [entries])
}

export function SurgeonPickerExample() {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const pair = useNotPreferredPair()
  const options = useMemo(() => Object.values(anaesthetists).sort((a, b) => a.name.localeCompare(b.name)), [anaesthetists])
  const [anaesthetistId, setAnaesthetistId] = useState(pair?.anaesthetistId ?? options[0]?.registrationNumber ?? '')
  const [surgeonId, setSurgeonId] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SelectField label="Anaesthetist" value={anaesthetistId} onChange={setAnaesthetistId}>
        {options.map((a) => (
          <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
        ))}
      </SelectField>
      <SurgeonPicker anaesthetistId={anaesthetistId} value={surgeonId} onChange={setSurgeonId} emptyLabel="Choose a surgeon" label="Surgeon" />
      <Echo>{surgeonId === '' ? 'No surgeon chosen.' : `Surgeon ${surgeonId}`}</Echo>
    </div>
  )
}

export function NotPreferredWarningExample() {
  const pair = useNotPreferredPair()
  const [on, setOn] = useState(true)
  const warning = useNotPreferredWarning(pair?.anaesthetistId, on ? pair?.surgeonId : undefined)
  if (pair === undefined) return <Missing what="not-preferred pairings" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      <Button variant="pill" onClick={() => setOn((v) => !v)}>{on ? 'Choose another surgeon' : 'Choose the not-preferred surgeon'}</Button>
      <NotPreferredWarning warning={warning} />
      {!on && <div style={{ fontSize: 12.5, color: neutral.mist }}>No warning: the pairing is fine.</div>}
    </div>
  )
}

export function ChipMultiSelectExample() {
  const specialties = useAppStore((s) => s.masters.specialties)
  const options = useMemo(() => Object.values(specialties).sort((a, b) => a.name.localeCompare(b.name)), [specialties])
  const [value, setValue] = useState<string[]>([])
  return <ChipMultiSelect label="Specialties" options={options} value={value} onChange={setValue} addLabel="Add a specialty" empty="Any specialty" hint="Local state only." />
}

/** Catch-up Phase 17b (US-13.6.5): one office contact set, with the minus an extra set carries. */
export function ContactFieldsExample() {
  const [value, setValue] = useState<ContactDraft>({ ...EMPTY_CONTACT, name: 'Bev', email: 'bev@avonheadent.example' })
  return (
    <div style={{ maxWidth: 640 }}>
      <ContactFields legend="Office contact 2" index={2} value={value} onChange={setValue} onRemove={() => setValue(EMPTY_CONTACT)} />
    </div>
  )
}

export function CodePickerExample() {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<string | undefined>(undefined)
  const label = current !== undefined ? rvgGroups[current] : undefined
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>{label !== undefined ? `RVG ${label.code}` : 'Choose an RVG code'}</Button>
      <CodePickerSheet
        open={open}
        {...(current !== undefined ? { currentId: current } : {})}
        rvgGroups={rvgGroups}
        onPick={(id) => {
          setCurrent(id)
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
      <Echo>{label !== undefined ? `${label.code} · ${label.description}` : 'Nothing picked yet.'}</Echo>
    </div>
  )
}

export function AnaesthetistCandidatesExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO, 8)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const surgeonId = useMemo(() => Object.keys(surgeons).sort()[0], [surgeons])
  const requestKey = useSuggestionKey('catalogue-candidates', true)
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <div>
      <AnaesthetistCandidates
        candidates={day.anaesthetists.map((a) => a.registrationNumber)}
        surgeonId={surgeonId}
        requestKey={requestKey}
        onPick={setPicked}
        emptyText="No one is free."
        trailing={() => <span style={{ fontSize: 12, color: neutral.slate }}>Today</span>}
      />
      <Echo>{picked === null ? 'Pick a candidate.' : `Picked ${picked}`}</Echo>
    </div>
  )
}

export function DraftListCandidatesExample() {
  const { draftListId } = useSeedIds()
  const requestKey = useSuggestionKey(draftListId ?? 'none', draftListId !== undefined)
  const [picked, setPicked] = useState<string | null>(null)
  if (draftListId === undefined) return <Missing what={DRAFT_LISTS} />
  return (
    <div>
      <DraftListCandidates listId={draftListId} requestKey={requestKey} onPick={(p) => setPicked(`${p.anaesthetistId} (${p.group})`)} onOpenOccupied={(id) => setPicked(`Open occupied List ${id} (stubbed)`)} />
      <Echo>{picked === null ? 'Pick a candidate.' : `Picked ${picked}`}</Echo>
    </div>
  )
}

export function ContractPriceRangesExample() {
  const { fixedContractId } = useSeedIds()
  const contract = useAppStore((s) => (fixedContractId !== undefined ? s.masters.contracts[fixedContractId] : undefined))
  const [error, setError] = useState<string | null>(null)
  if (contract === undefined) return <Missing what="fixed-price Contracts" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{contract.name}</div>
      <ContractPriceRanges contract={contract} actor={OFFICE_ACTOR} onError={setError} />
      <FormError message={error} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feedback and cards
// ---------------------------------------------------------------------------

export function ConflictCalloutExample() {
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const { holidayId } = useSeedIds()
  const holiday = useAppStore((s) => (holidayId !== undefined ? s.masters.holidays[holidayId] : undefined))
  const [hospitalId, setHospitalId] = useState(holiday?.hospitalId ?? '')
  const target = useMemo(() => (holiday !== undefined ? { dateISO: holiday.dateISO, hospitalId } : null), [holiday, hospitalId])
  const conflicts = useConflictPreview(target)
  if (holiday === undefined) return <Missing what="hospital holidays" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SelectField label={`Hospital on ${holiday.dateISO}`} hideLabel size="compact" value={hospitalId} onChange={setHospitalId}>
        {Object.values(hospitals).map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </SelectField>
      <div style={{ fontSize: 12.5, color: neutral.slate }}>A List on {holiday.dateISO} at this hospital:</div>
      <ConflictCallout conflicts={conflicts} hospitalId={hospitalId} />
      {conflicts.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>Open that day: no callout. Pick a closed hospital.</div>}
    </div>
  )
}

/** The rail's Pre-payments card on the live seed: Riley awaiting approval, Nair paid (catch-up Phase 27). */
export function PrepaymentsRailCardExample() {
  const [last, setLast] = useState('')
  return (
    <div style={{ maxWidth: 320 }}>
      <PrepaymentsRailCard onOpenBooking={(d, b) => setLast(`Open booking ${b} on ${d} (stubbed).`)} onOpenInvoices={() => setLast('Open Invoices, Awaiting approval (stubbed).')} />
      <Echo>{last}</Echo>
    </div>
  )
}

/** The Billing monitor's AA Holding account card on the live seed (catch-up Phase 27a): Nair's prepayment held. Read-only. */
export function HoldingAccountPanelExample() {
  return <HoldingAccountPanel />
}

/** The Invoices screen's Awaiting approval strip with its approval switch, on the live seed (catch-up Phase 27). Approve and send writes to the demo store. */
export function PrepaymentApprovalStripExample() {
  return <PrepaymentApprovalStrip actor={OFFICE_ACTOR} />
}

export function WarningsToDoExample() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO)
  const [last, setLast] = useState('')
  return (
    <div>
      <WarningsToDo rows={day.todoRows} actor={OFFICE_ACTOR} onOpenBooking={(d, b) => setLast(`Open booking ${b} on ${d} (stubbed).`)} onOpenConflicts={() => setLast('Open Conflicts (stubbed).')} />
      <Echo>{last}</Echo>
    </div>
  )
}

export function NotificationsCardExample() {
  const [last, setLast] = useState('')
  return (
    <div>
      <NotificationsCard actor={OFFICE_ACTOR} onOpen={(t) => setLast(`Open ${t.kind} (stubbed).`)} onSeeAll={() => setLast('See all (stubbed).')} onShowResolved={() => setLast('Show resolved (stubbed).')} />
      <Echo>{last}</Echo>
    </div>
  )
}

export function DraftListPartsLive() {
  const { draftListId } = useSeedIds()
  const list = useAppStore((s) => (draftListId !== undefined ? s.schedule.lists[draftListId] : undefined))
  const [count, setCount] = useState(3)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13 }}>
      <UnassignedPill />
      <DraftStateChip />
      {list !== undefined && list.state === 'DRAFT' && <WaitingTime list={list} />}
      <BookingCount count={count} noun />
      <Button variant="pill" onClick={() => setCount((n) => (n + 1) % 6)}>Change count</Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom
// ---------------------------------------------------------------------------

export function ReviewScreenExample() {
  const { submittedListId } = useSeedIds()
  const [last, setLast] = useState('')
  if (submittedListId === undefined) return <Missing what="submitted Lists" />
  return (
    <Wide minWidth={1100}>
      <Echo>{last === '' ? `Reviewing ${submittedListId}` : last}</Echo>
      <ReviewScreen listId={submittedListId} actor={OFFICE_ACTOR} onBack={() => setLast('Back (stubbed).')} onOpen={(id) => setLast(`Open ${id} (stubbed).`)} onViewInvoices={() => setLast('View invoices (stubbed).')} />
    </Wide>
  )
}

/** The billing monitor's per-List pipeline stepper (`PipelineCard` / `StageChip`, not exported), fed by the real `billingMonitor` selector. */
export function PipelineStepperExample() {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const rows = useMemo(() => billingMonitor({ schedule, billing, masters }), [schedule, billing, masters])
  const sample: { key: string; label: string; state: keyof typeof STAGE_TONE; detail: string }[] = [
    { key: 'authorised', label: 'Authorised', state: 'done', detail: 'Authorised by the office' },
    { key: 'run', label: 'Billing run', state: 'done', detail: 'Run complete' },
    { key: 'invoices', label: '3 invoices', state: 'partial', detail: '1 failed' },
    { key: 'emailed', label: 'Emailed', state: 'pending', detail: 'Waiting' },
    { key: 'xero', label: 'Xero', state: 'pending', detail: 'Waiting' },
  ]
  const live = rows[0]
  const [index, setIndex] = useState(0)
  const stages = live !== undefined ? live.stages : sample
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate }}>{live !== undefined ? `${live.anaesthetistName} · live from the billing monitor` : 'No List has been billed yet: sample stages (authorise a List to see live ones).'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {stages.map((stage, i) => (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              title={stage.detail}
              onClick={() => setIndex(i)}
              style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap', ...STAGE_TONE[stage.state] }}
            >
              {stage.label}
            </button>
            {i < stages.length - 1 && <span aria-hidden style={{ color: neutral.lineStrong, fontSize: 13 }}>→</span>}
          </div>
        ))}
      </div>
      <Echo>{stages[index]?.detail}</Echo>
    </div>
  )
}

export function InvoiceDocumentExample() {
  const { invoiceId } = useSeedIds()
  if (invoiceId === undefined) return <Missing what="invoices" />
  return (
    <div style={{ zoom: 0.5 }}>
      <div style={{ width: 1180 }}>
        <InvoiceDocument invoiceId={invoiceId} actor={OFFICE_ACTOR} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Update email (catch-up Phase 35)
// ---------------------------------------------------------------------------

/** The composer on a seeded Booking, opened with its newest emailable change ticked. Open in mail client records the draft in the demo store. */
export function UpdateEmailComposerExample() {
  const bookingId = SEED_MARKERS.pendingCaptureBooking?.entityId
  const [open, setOpen] = useState(false)
  const subject = useMemo(() => (bookingId !== undefined ? { kind: 'booking' as const, bookingId } : undefined), [bookingId])
  if (subject === undefined) return <Missing what="Booking to email about" />
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open the composer</Button>
      {open && <UpdateEmailComposerOpen subject={subject} onClose={() => setOpen(false)} />}
    </div>
  )
}

function UpdateEmailComposerOpen({ subject, onClose }: { subject: { kind: 'booking'; bookingId: string }; onClose: () => void }) {
  const rows = usePickableChanges(subject)
  const newest = rows.find((r) => r.emailable)
  return <UpdateEmailComposer open onClose={onClose} actor={OFFICE_ACTOR} subject={subject} initialPickedKeys={newest !== undefined ? [newest.key] : []} />
}

/** The Admin Booking detail's on-demand button, outside a draft (so never dirty here). */
export function BookingUpdateEmailButtonExample() {
  const bookingId = SEED_MARKERS.pendingCaptureBooking?.entityId
  if (bookingId === undefined) return <Missing what="Booking to email about" />
  return <BookingUpdateEmailButton bookingId={bookingId} actor={OFFICE_ACTOR} />
}
