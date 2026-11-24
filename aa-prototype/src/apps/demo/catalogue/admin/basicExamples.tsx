import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { accent, neutral } from '../../../../theme/tokens'
import {
  Button,
  FieldLabel,
  FormError,
  Segmented,
  StatusBlock,
  StatusChip,
  StatusLegend,
  SuccessOverlay,
  TextArea,
  TextField,
  TickBadge,
  useLegendKeys,
  useSurface,
  WarningTriangle,
} from '../../../../shared'
import { DRAFT_LISTS, UNASSIGNED } from '../../../../shared/scheduleTerms'
import { LineTab, LineTabs, NameSearchBox, Pill, PopoverPanel, SelectField, SlidingSegmentedControl, TextAction, TickButton, usePopover } from '../../../../shared/ui'
import { VacatedSessionChoice } from '../../../../shared/flows'
import { matchesNameQuery } from '../../../../domain/names'
import { openWarnings, useAppStore, useToday } from '../../../../store'
import { displayStatusLabel } from '../../../../domain/slotStatus'
import { ANATOMY_HEADINGS } from '../../../../domain/billing/rvgGroups'
import { textActionStyle } from '../../../admin/tableChrome'
import type { MastersView } from '../../../admin/screens/masters/view'
import { Pill as MasterPill } from '../../../admin/components/MasterPills'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { ChangedSinceSubmittedPill } from '../../../admin/components/ChangedSinceSubmitted'
import { NotPreferredPill, PreferredPill, TierPill } from '../../../admin/components/pairing'
import { DrawerLink, DrawerSection } from '../../../admin/components/drawerParts'
import { HeaderActions, IdChip, ProfileHeader } from '../../../admin/components/ProfileChrome'
import { MasterPanel, PanelGrid, PanelSection } from '../../../admin/components/MasterPanel'
import { SidePanel } from '../../../../shared/surface/SidePanel'
import { ACTIONS_COLUMN, EditCell, MasterHeader, MasterTable } from '../../../admin/screens/masters/chrome'
import { MASTER_VIEW_GROUPS, MASTER_VIEWS } from '../../../admin/screens/masters/masterViews'
import { Td } from '../../../../shared/table'
import { SessionTimesFields, timesDraftError, type TimesDraft } from '../../../admin/flows/SessionTimesFields'
import { BankAccountFields, HpiCpnField } from '../../../admin/flows/anaesthetistFields'
import { OverlayHeader } from '../../../../shared/surface/OverlayHeader'
import { SheetActions } from '../../../../shared/surface/SheetActions'
import { ConfirmSheet } from '../../../../shared/surface/ConfirmSheet'
import { Card, DefList, DefRow, EmptyState, Notice, ResultLine } from '../../../../shared/ui'

/** A quiet line under an example that reports what the last click did. */
export function Echo({ children }: { children: ReactNode }) {
  return (
    <div role="status" style={{ marginTop: 8, fontSize: 12.5, color: neutral.slate, minHeight: 18 }}>
      {children}
    </div>
  )
}

/** Lets a desktop-width component keep its own width inside the narrow stage (the stage scrolls sideways). */
export function Wide({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons and toggles
// ---------------------------------------------------------------------------

export function ButtonExample() {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Button onClick={() => setLast('Primary, touch (54).')}>Primary</Button>
          <Button variant="secondary" onClick={() => setLast('Secondary, touch (48).')}>Secondary</Button>
          <Button variant="outline" onClick={() => setLast('Outline, touch (48).')}>Outline</Button>
          <Button variant="pill" onClick={() => setLast('Pill (44).')}>Pill</Button>
          <Button variant="danger" onClick={() => setLast('Danger: kept for Cancel booking only.')}>Cancel booking</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Button size="desktop" onClick={() => setLast('Primary, desktop (44, radius 12).')}>Authorise</Button>
          <Button size="desktop" variant="outline" onClick={() => setLast('Outline, desktop (44).')}>Log phone note</Button>
          <Button size="compact" variant="outline" onClick={() => setLast('Outline, compact (36).')}>Today</Button>
          <Button size="compact" variant="secondary" onClick={() => setLast('Secondary, compact (36).')}>+1w</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button size="compact" disabled disabledReason="It holds a List: move the List first.">Close out-of-hours session</Button>
        </div>
      </div>
      <Echo>{last}</Echo>
    </div>
  )
}

export function TickButtonExample() {
  const [done, setDone] = useState(0)
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <TickButton onClick={() => setDone((n) => n + 1)} label="Resolve notice: example">Resolve</TickButton>
        <TickButton compact onClick={() => setDone((n) => n + 1)}>Clear</TickButton>
      </div>
      <Echo>{done === 0 ? 'Not ticked yet.' : `Ticked ${done} time${done === 1 ? '' : 's'}.`}</Echo>
    </div>
  )
}

export function SegmentedExample() {
  const [value, setValue] = useState<'active' | 'retired' | 'all'>('active')
  return (
    <div style={{ maxWidth: 360 }}>
      <Segmented
        label="Status"
        value={value}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'retired', label: 'Retired' },
          { value: 'all', label: 'All' },
        ]}
        onChange={setValue}
      />
      <Echo>Showing: {value}</Echo>
    </div>
  )
}

export function SlidingSegmentedExample() {
  const [session, setSession] = useState<'AM' | 'PM' | 'OOH'>('AM')
  const [variant, setVariant] = useState<'teal' | 'surface'>('teal')
  const [order, setOrder] = useState<'roster' | 'az'>('roster')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
      <SlidingSegmentedControl
        ariaLabel="Session"
        value={session}
        variant={variant}
        options={[
          { value: 'AM', label: 'AM' },
          { value: 'PM', label: 'PM' },
          { value: 'OOH', label: 'Out of hours' },
        ]}
        onSelect={setSession}
      />
      <SlidingSegmentedControl
        ariaLabel="Variant"
        value={variant}
        variant="surface"
        options={[
          { value: 'teal', label: 'teal' },
          { value: 'surface', label: 'surface' },
        ]}
        onSelect={setVariant}
      />
      <div style={{ alignSelf: 'flex-start' }}>
        <SlidingSegmentedControl
          ariaLabel="Row order"
          size="sm"
          layout="wrap"
          value={order}
          options={[
            { value: 'roster', label: 'Roster order' },
            { value: 'az', label: 'A to Z' },
          ]}
          onSelect={setOrder}
        />
      </div>
    </div>
  )
}

export function StatusLegendExample() {
  const keys = useLegendKeys()
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const active = useMemo(() => new Set(keys.filter((k) => !hidden.has(k))), [keys, hidden])
  return (
    <div>
      <StatusLegend
        variant="chips"
        activeStatuses={active}
        onToggleStatus={(k) =>
          setHidden((cur) => {
            const next = new Set(cur)
            if (next.has(k)) next.delete(k)
            else next.add(k)
            return next
          })
        }
      />
      <Echo>{hidden.size === 0 ? 'All statuses shown.' : `Hidden: ${[...hidden].join(', ')}`}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

export function OverlayExample() {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open dialog</Button>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title="Add a note" description="The shared web Overlay: a centred dialog. Escape or the scrim closes it." />
          <TextField label="Note" value={name} onChange={setName} placeholder="e.g. Ring theatre at 7" />
          <SheetActions
            secondary={<Button variant="secondary" block onClick={() => setOpen(false)}>Cancel</Button>}
            primary={
              <Button
                block
                onClick={() => {
                  setSaved(name === '' ? '(empty)' : name)
                  setOpen(false)
                }}
              >
                Save
              </Button>
            }
          />
        </div>
      </Overlay>
      <Echo>{saved === null ? 'Local only: nothing is saved to the store.' : `Saved locally: ${saved}`}</Echo>
    </div>
  )
}

export function OverlayHeaderExample() {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open a titled dialog</Button>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title="A titled dialog" description="The h2 names the dialog for a screen reader, and the corner X appears with it." />
          <Button variant="secondary" block onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Overlay>
      <Echo>Local only: nothing is saved to the store.</Echo>
    </div>
  )
}

export function SheetActionsExample() {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open a sheet with a footer</Button>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title="Add a comment" />
          <TextField label="Comment" value={note} onChange={setNote} placeholder="e.g. Ring theatre at 7" />
          <SheetActions
            secondary={<Button variant="secondary" block onClick={() => setOpen(false)}>Cancel</Button>}
            primary={<Button block onClick={() => setOpen(false)}>Save</Button>}
          />
        </div>
      </Overlay>
      <Echo>Local only: the footer is one row on web, stacked on the phone.</Echo>
    </div>
  )
}

export function ConfirmSheetExample() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open a confirm</Button>
      <ConfirmSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Remove this example?"
        description="Focus opens on Keep it. A double click on Remove runs it once."
        confirmLabel="Remove"
        cancelLabel="Keep it"
        onConfirm={() => {
          setResult('Removed (locally)')
          setOpen(false)
        }}
      />
      <Echo>{result ?? 'Local only: nothing is saved to the store.'}</Echo>
    </div>
  )
}

export function MasterPanelExample() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Example record')
  const [code, setCode] = useState('EX-01')
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open side panel</Button>
      <MasterPanel
        open={open}
        onClose={() => setOpen(false)}
        title={name === '' ? 'New record' : name}
        meta={<Pill tone="success">Active</Pill>}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <PanelSection title="Details">
          <PanelGrid>
            <TextField label="Name" value={name} onChange={setName} />
            <TextField label="Code" value={code} onChange={setCode} mono />
          </PanelGrid>
        </PanelSection>
        <PanelSection title="Notes">
          <div style={{ fontSize: 13, color: neutral.slate }}>Local fields only. Escape closes the panel and returns focus.</div>
        </PanelSection>
      </MasterPanel>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** The Master data sub-nav, rebuilt from MasterData.tsx's markup and the real `MASTERS_NAV` (the nav is inline there). */
export function MastersSubNavExample() {
  const [view, setView] = useState<MastersView>(MASTER_VIEWS[0]!.view)
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <nav aria-label="Master data" style={{ width: 190, flex: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Master data</h1>
        {MASTER_VIEW_GROUPS.map((group) => (
          <div key={group} role="group" aria-label={group} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist, padding: '4px 10px' }}>{group}</div>
            {MASTER_VIEWS.filter((n) => n.group === group).map((n) => {
              const active = n.view === view
              return (
                <button
                  key={n.view}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setView(n.view)}
                  style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? accent.tint : 'transparent', color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer' }}
                >
                  {n.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div style={{ fontSize: 13, color: neutral.slate, paddingTop: 36 }}>View: {MASTER_VIEWS.find((n) => n.view === view)?.label}</div>
    </div>
  )
}

/** LineTabs with LineTab examples (U5); the route strips (LineTabLink) would leave this page. */
export function LineTabsExample() {
  const [tab, setTab] = useState<'details' | 'history'>('details')
  const [page, setPage] = useState<'unassigned' | 'history'>('unassigned')
  const count = (n: number, on: boolean) => <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: on ? neutral.ink : neutral.mist }}>{n}</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <LineTabs label={`${DRAFT_LISTS} (example)`} kind="group">
        <LineTab active={page === 'unassigned'} onClick={() => setPage('unassigned')} badge={count(16, page === 'unassigned')}>{UNASSIGNED}</LineTab>
        <LineTab active={page === 'history'} onClick={() => setPage('history')} badge={count(4, page === 'history')}>History</LineTab>
      </LineTabs>
      <LineTabs label="Contract panel (example)" kind="group">
        <LineTab active={tab === 'details'} onClick={() => setTab('details')}>Details</LineTab>
        <LineTab active={tab === 'history'} onClick={() => setTab('history')}>History</LineTab>
      </LineTabs>
      <Echo>Route strips (AA fees, {DRAFT_LISTS}, the Availability page switch) use LineTabLink: the same look as links with aria-current. Shown here as LineTab so nothing leaves the page.</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badges and pills
// ---------------------------------------------------------------------------

export function StatusChipExample() {
  const keys = useLegendKeys()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {keys.map((k) => (
        <StatusChip key={k} status={k} />
      ))}
    </div>
  )
}

export function PillExample() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {(['neutral', 'success', 'warning', 'error'] as const).map((tone) => (
        <span key={tone} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Pill tone={tone} size="sm">{tone} sm</Pill>
          <Pill tone={tone}>{tone} md</Pill>
          <Pill tone={tone} size="lg">{tone} lg</Pill>
          <Pill tone={tone} variant="outline">{tone} outline</Pill>
        </span>
      ))}
    </div>
  )
}

export function MasterPillsExample() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <MasterPill>Insurer</MasterPill>
      <MasterPill>Hospital</MasterPill>
      <MasterPill tone="success">Active</MasterPill>
      <MasterPill>ACC</MasterPill>
      <MasterPill>Head</MasterPill>
    </div>
  )
}

export function PairingPillsExample() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <TierPill tier={1} />
      <TierPill tier={2} />
      <TierPill tier={3} />
      <TierPill tier={4} />
      <PreferredPill />
      <PreferredPill count={2} />
      <NotPreferredPill />
    </div>
  )
}

export function ChangedSinceSubmittedExample() {
  const [count, setCount] = useState(2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      <ChangedSinceSubmittedPill cue={{ count, bookingIds: [], lastAtISO: '2026-07-21T10:42:00' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="pill" onClick={() => setCount((n) => n + 1)}>One more change</Button>
        <Button variant="pill" onClick={() => setCount(1)}>Reset</Button>
      </div>
    </div>
  )
}

export function AttentionDotExample() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, color: neutral.slate }}>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AttentionDot /> 13 (the Admin Day disc)</span>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AttentionDot size={9} /> 9 (legend)</span>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AttentionDot size={14} tone="muted" /> Muted (cleared)</span>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AttentionDot glyph="triangle" tone="error" label="Strong warning" /> Triangle, labelled</span>
    </div>
  )
}

export function WarningTriangleExample() {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const masters = useAppStore((s) => s.masters)
  const warnings = useMemo(
    () => openWarnings({ schedule, billing, appSettings, clock, masters }).map((r) => r.warning),
    [schedule, billing, appSettings, clock, masters],
  )
  if (warnings.length === 0) return <div style={{ fontSize: 13, color: neutral.mist }}>No open warnings in the seed right now.</div>
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, color: neutral.slate }}>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><WarningTriangle warnings={warnings} /> md</span>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><WarningTriangle warnings={warnings} size="sm" /> sm</span>
      <span>{warnings.length} open warning{warnings.length === 1 ? '' : 's'} from the seed</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

export function NameSearchBoxExample() {
  const names = useAppStore((s) => s.masters.anaesthetists)
  const [query, setQuery] = useState('')
  const [pill, setPill] = useState('')
  const [lists, setLists] = useState('')
  const matches = useMemo(() => Object.values(names).filter((a) => matchesNameQuery(a.name, query)).map((a) => a.name), [names, query])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NameSearchBox value={query} onChange={setQuery} label="Search anaesthetists" fill="well" />
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        {matches.length} match{matches.length === 1 ? '' : 'es'}: {matches.slice(0, 4).join(' · ')}
        {matches.length > 4 ? ' …' : ''}
      </div>
      <div style={{ background: neutral.bg, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11.5, color: neutral.mist }}>On the page: surface fill (the default)</span>
        <NameSearchBox value={pill} onChange={setPill} label="Pill size, 36px" size="pill" />
        <NameSearchBox value={lists} onChange={setLists} label="Search your Bookings" placeholder="Search patient name or NHI" size="pill" height={38} width={280} clearLabel="Clear the search field" />
      </div>
    </div>
  )
}

export function TextFieldExample() {
  const [name, setName] = useState('Labour Day')
  const [code, setCode] = useState('H3')
  const [price, setPrice] = useState('1,250.00')
  const [time, setTime] = useState('07:30')
  const priceInvalid = price.trim() !== '' && !/^\$?[\d,]+(\.\d{1,2})?$/.test(price.trim())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Labour Day" />
      <TextField label="RVG code" value={code} onChange={setCode} mono hint="Mono variant with a hint line." />
      <div style={{ display: 'flex', gap: 12 }}>
        <TextField label="Price, ex GST" value={price} onChange={setPrice} mono inputMode="decimal" align="right" invalid={priceInvalid} hint={priceInvalid ? 'Type the amount in dollars and cents.' : 'Decimal keypad, right-aligned.'} />
        <TextField label="Start" type="time" value={time} onChange={setTime} mono />
      </div>
      <div style={{ background: neutral.bg, borderRadius: 8, padding: 12 }}>
        <TextField label="Compact, surface fill, hidden label" hideLabel size="compact" fill="surface" width={200} value={name} onChange={setName} />
      </div>
    </div>
  )
}

export function TextAreaExample() {
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [blurred, setBlurred] = useState(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextArea label="Internal note" value={text} onChange={setText} placeholder="Visible to the office only" maxLength={140} hint="A counter under the field; the text stops at 140." onBlur={() => setBlurred((n) => n + 1)} />
      <TextArea size="compact" ariaLabel="Internal note for this day" value={note} onChange={setNote} placeholder="compact, no visible label (the rail's day note)" />
      <Echo>{text.length} characters · blurred {blurred} time{blurred === 1 ? '' : 's'}</Echo>
    </div>
  )
}

export function FormErrorExample() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <FieldLabel>Base units (FieldLabel)</FieldLabel>
      <TextField label="Base units" hideLabel mono value={value} onChange={setValue} placeholder="A whole number above 0" invalid={error !== null} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="pill"
          onClick={() => setError(/^[1-9]\d*$/.test(value.trim()) ? null : 'Base units must be a whole number above 0.')}
        >
          Validate
        </Button>
      </div>
      <FormError message={error} />
    </div>
  )
}

export function DateFieldExample() {
  const todayISO = useToday()
  const [dateISO, setDateISO] = useState(todayISO)
  return (
    <div>
      <TextField label="Date" type="date" value={dateISO} onChange={setDateISO} mono hint="TextField with type=date: the browser's own picker." />
      <Echo>Value: {dateISO === '' ? '(none)' : dateISO}</Echo>
    </div>
  )
}

export function SessionTimesExample() {
  const defaults = useAppStore((s) => s.appSettings.schedule.defaultTimes.AM)
  const [draft, setDraft] = useState<TimesDraft>({ startTime: defaults.startTime, endTime: defaults.endTime })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SessionTimesFields session="AM" draft={draft} defaults={{ startTime: defaults.startTime, endTime: defaults.endTime }} onChange={setDraft} />
      <FormError message={timesDraftError(draft)} />
    </div>
  )
}

/** Phase 26: the anaesthetist's mandatory HPI CPN and bank fields, with an invalid number to show the inline check. Local state only. */
export function AnaesthetistFieldsExample() {
  const [hpiId, setHpiId] = useState('10SOUM')
  const [accountName, setAccountName] = useState('Melanie Souter')
  const [accountNumber, setAccountNumber] = useState('99-0101-00348')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 360 }}>
      <HpiCpnField value={hpiId} onChange={setHpiId} />
      <BankAccountFields accountName={accountName} accountNumber={accountNumber} onAccountName={setAccountName} onAccountNumber={setAccountNumber} />
    </div>
  )
}

/** RvgGroupSheet's anatomy field, rebuilt from its markup (TextField with `list`): the sheet is not exported. */
export function AnatomyDatalistExample() {
  const [anatomy, setAnatomy] = useState('')
  return (
    <div>
      <TextField label="Anatomy heading" list="catalogue-rvg-anatomy-headings" value={anatomy} onChange={setAnatomy} placeholder="e.g. Head" />
      <datalist id="catalogue-rvg-anatomy-headings">
        {ANATOMY_HEADINGS.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>
      <Echo>{anatomy === '' ? 'Type or pick a heading.' : ANATOMY_HEADINGS.includes(anatomy) ? `Existing heading: ${anatomy}` : `New heading: ${anatomy}`}</Echo>
    </div>
  )
}

export function VacatedChoiceExample() {
  const [value, setValue] = useState('free')
  return (
    <div>
      <VacatedSessionChoice label="Dr Strand's session after the move" value={value} onChange={setValue} />
      <Echo>Chosen: {value}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cards, drawer parts, profile chrome
// ---------------------------------------------------------------------------

export function DrawerPartsExample() {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DrawerSection label="Session">
        <DefList>
          <DefRow label="Times">08:00 to 12:30</DefRow>
          <DefRow label="Hospital">St George's</DefRow>
          <DefRow label="Surgeon">
            <DrawerLink onClick={() => setLast('Opened the surgeon (stubbed).')}>Mr Hale</DrawerLink>
          </DefRow>
        </DefList>
      </DrawerSection>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button size="compact" style={{ flex: '1 1 auto' }} onClick={() => setLast('Primary action.')}>Assign List</Button>
        <Button size="compact" variant="secondary" onClick={() => setLast('Secondary action.')}>Edit times</Button>
        <Button size="compact" variant="secondary" disabled disabledReason="Move its List first." onClick={() => setLast('Never fires.')}>Close session</Button>
      </div>
      <Echo>{last}</Echo>
    </div>
  )
}

export function ProfileChromeExample() {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProfileHeader
        name="Dr Example Anaesthetist"
        chip={<IdChip label="Reg" value="12345" />}
        sub="Anaesthetist · since Jan 2020"
        action={<HeaderActions onHistory={() => setLast('History (stubbed).')} onEdit={() => setLast('Edit details (stubbed).')} />}
      />
      <Card title="Contact">
        <DefList gap={12}>
          <DefRow layout="stacked" label="Email">example@aa.co.nz</DefRow>
          <DefRow layout="stacked" label="Mobile" mono note="Shown to the office only.">021 000 0000</DefRow>
        </DefList>
      </Card>
      <Echo>{last}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function MasterTableExample() {
  const specialties = useAppStore((s) => s.masters.specialties)
  const rows = useMemo(() => Object.values(specialties).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6), [specialties])
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MasterTable columns={['Name', 'Id', ACTIONS_COLUMN]} label="Specialties">
        {rows.map((r) => (
          <tr key={r.id}>
            <Td bold>{r.name}</Td>
            <Td mono>{r.id}</Td>
            <EditCell onClick={() => setLast(`Edit ${r.name} (stubbed).`)} label={`Edit ${r.name}`} />
          </tr>
        ))}
      </MasterTable>
      <Echo>{last}</Echo>
    </div>
  )
}

/** MasterHeader: a seeded view's header (its subtitle ends with the seeded line) and a section header inside a view. */
export function MasterHeaderExample() {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MasterHeader title="Specialties" sub="The specialties a surgeon and a Contract name." view="specialties" add={{ label: 'Add specialty', onClick: () => setLast('Add specialty (stubbed).') }} />
      <MasterHeader
        title="Price ranges"
        sub="A section header: no seeded line and no waiting-load banner."
        section
        actions={<TextAction size="sm" flush onClick={() => setLast('Add price range (stubbed).')}>Add price range</TextAction>}
      />
      <Echo>{last}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

/** The inline success banner (Conflicts, Draft Lists, Holiday, AaFees): inline JSX in each screen, rebuilt here. */
export function InlineBannerExample() {
  const [message, setMessage] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <Button variant="pill" onClick={() => setMessage('Conflict cleared. It shows again under "Show cleared", where "Flag again" restores it.')}>
          Clear a conflict (simulated)
        </Button>
      </div>
      <ResultLine
        line={message}
        actions={
          <button type="button" style={textActionStyle} onClick={() => setMessage(null)}>
            Dismiss
          </button>
        }
      />
    </div>
  )
}

export function NoticeExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Notice tone="warning" title="Southern Cross is closed: Theatre maintenance closure.">The List will be accepted and flagged as a conflict. You can still go ahead.</Notice>
      <Notice tone="error" icon={false} title="Booking cancelled.">It stays visible but is excluded from billing.</Notice>
      <Notice tone="success" title="The office has dealt with this">Your note was read.</Notice>
      <Notice tone="neutral">Moved here by Dr Chen, an anaesthetist's own move.</Notice>
    </div>
  )
}

export function EmptyStateExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EmptyState>No notes for this day.</EmptyState>
      <EmptyState variant="card" title="No RVG groups match.">Check the code or a word of the description.</EmptyState>
      <EmptyState variant="centred">No free sessions on this day.</EmptyState>
    </div>
  )
}

export function SuccessOverlayExample() {
  const [shown, setShown] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])
  function show() {
    setShown(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    // The owners' timing: the overlay holds for 1050ms, then the flow moves on.
    timer.current = window.setTimeout(() => setShown(false), 1050)
  }
  return (
    <div style={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Button variant="secondary" onClick={show}>Confirm reassignment</Button>
      {shown && (
        <SuccessOverlay title="Moved to Sharma, Priya" onDismiss={() => setShown(false)}>
          <span style={{ fontSize: 13, color: neutral.slate }}>The List is in her PM session.</span>
        </SuccessOverlay>
      )}
    </div>
  )
}

export function TickBadgeExample() {
  const [run, setRun] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <TickBadge key={run} size={36} animate />
      <TickBadge size={24} />
      <Button variant="pill" onClick={() => setRun((n) => n + 1)}>Replay</Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom
// ---------------------------------------------------------------------------

export function StatusBlockExample() {
  const keys = useLegendKeys()
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const label = (k: string) => displayStatusLabel(k, statuses)
  const [status, setStatus] = useState<string>(keys[0] ?? 'free')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SelectField label="Status" size="compact" value={status} onChange={setStatus}>
        {keys.map((k) => (
          <option key={k} value={k}>{label(k)}</option>
        ))}
      </SelectField>
      <StatusBlock status={status} title="St George's" detail="Mr Hale · Ortho" style={{ height: 56 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {keys.slice(0, 6).map((k) => (
          <StatusBlock key={k} status={k} title={label(k)} style={{ height: 40 }} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UI unification U2: the one side panel and the one popover panel.

export function SidePanelExample() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open drawer</Button>
      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        width="list"
        title="Example drawer"
        meta={<div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Tue 21 Jul · PM</div>}
        footer={
          <>
            <Button size="compact" style={{ flex: '1 1 auto' }} onClick={() => setOpen(false)}>Done</Button>
            <Button size="compact" variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          </>
        }
      >
        <DrawerSection label="Session">
          <DefList>
            <DefRow label="Times">13:00 to 17:30</DefRow>
          </DefList>
        </DrawerSection>
        <div style={{ fontSize: 13, color: neutral.slate }}>Escape closes it and focus returns to the button. The record width (600px) is MasterPanel.</div>
      </SidePanel>
    </div>
  )
}

export function PopoverPanelExample() {
  const { open, toggle, rootRef, panelId, triggerProps } = usePopover()
  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" {...triggerProps} onClick={toggle} style={textActionStyle}>Open popover</button>
      {open && (
        <PopoverPanel id={panelId} placement="end" width={260}>
          <div style={{ fontSize: 13, color: neutral.slate }}>An outside click closes it; Escape closes it and puts focus back on the button.</div>
        </PopoverPanel>
      )}
    </div>
  )
}
