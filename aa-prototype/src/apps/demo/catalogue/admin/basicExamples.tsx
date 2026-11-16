import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { accent, neutral, radius } from '../../../../theme/tokens'
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
import { NameSearchBox, Pill, SlidingSegmentedControl, TickButton } from '../../../../shared/ui'
import { VacatedSessionChoice } from '../../../../shared/flows'
import { matchesNameQuery } from '../../../../domain/names'
import { openWarnings, useAppStore, useToday } from '../../../../store'
import { displayStatusLabel } from '../../../../domain/slotStatus'
import { ANATOMY_HEADINGS } from '../../../../domain/billing/rvgGroups'
import { selectControlStyle } from '../../../admin/flows/fieldChrome'
import { textActionStyle } from '../../../admin/tableChrome'
import { MASTERS_NAV, type MastersView } from '../../../admin/screens/masters/view'
import { Pill as MasterPill } from '../../../admin/components/MasterPills'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { ChangedSinceSubmittedPill } from '../../../admin/components/ChangedSinceSubmitted'
import { NotPreferredPill, PreferredPill, TierPill } from '../../../admin/components/pairing'
import { ActionBtn, DrawerLink, Row as DrawerRow, Section as DrawerSection } from '../../../admin/components/drawerParts'
import { Fact, HeaderActions, IdChip, ProfileCard, ProfileHeader } from '../../../admin/components/ProfileChrome'
import { MasterPanel, PanelGrid, PanelSection } from '../../../admin/components/MasterPanel'
import { Header, Table, TextAction, EditCell } from '../../../admin/screens/masters/chrome'
import { rowCellStyle } from '../../../admin/screens/masters/tableStyles'
import { SessionTimesFields, timesDraftError, type TimesDraft } from '../../../admin/flows/SessionTimesFields'

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <Button onClick={() => setLast('Primary clicked.')}>Primary</Button>
        <Button variant="secondary" onClick={() => setLast('Secondary clicked.')}>Secondary</Button>
        <Button variant="pill" onClick={() => setLast('Pill clicked.')}>Pill</Button>
        <Button variant="secondary" disabled>Disabled</Button>
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
  const [variant, setVariant] = useState<'teal' | 'surface' | 'ink'>('teal')
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
          { value: 'ink', label: 'ink' },
        ]}
        onSelect={setVariant}
      />
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
          <div style={{ fontSize: 18, fontWeight: 700 }}>Add a note</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>The shared web Overlay: a centred dialog. Escape or the scrim closes it.</div>
          <TextField label="Note" value={name} onChange={setName} placeholder="e.g. Ring theatre at 7" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setSaved(name === '' ? '(empty)' : name)
                setOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Overlay>
      <Echo>{saved === null ? 'Local only: nothing is saved to the store.' : `Saved locally: ${saved}`}</Echo>
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
  const [view, setView] = useState<MastersView>(MASTERS_NAV[0]!.view)
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <nav aria-label="Master data" style={{ width: 190, flex: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Master data</h1>
        {MASTERS_NAV.map((n) => {
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
      </nav>
      <div style={{ fontSize: 13, color: neutral.slate, paddingTop: 36 }}>View: {MASTERS_NAV.find((n) => n.view === view)?.label}</div>
    </div>
  )
}

/** AaFeesScreen's TabLink, rebuilt on buttons: the real one is a router Link that would leave this page. */
export function TabLinkExample() {
  const [tab, setTab] = useState<'invoices' | 'settings'>('invoices')
  const link = (id: 'invoices' | 'settings', label: string) => {
    const active = tab === id
    return (
      <button
        type="button"
        aria-current={active ? 'page' : undefined}
        onClick={() => setTab(id)}
        style={{ border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '10px 14px', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? neutral.ink : neutral.slate, boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none' }}
      >
        {label}
      </button>
    )
  }
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${neutral.line}` }}>
        {link('invoices', 'Fee invoices')}
        {link('settings', 'Fee settings')}
      </div>
      <Echo>Route: /admin/billing/aa-fees{tab === 'settings' ? '/settings' : ''}</Echo>
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

export function DraftListPartsExample({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13 }}>{children}</div>
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

export function NameSearchBoxExample() {
  const names = useAppStore((s) => s.masters.anaesthetists)
  const [query, setQuery] = useState('')
  const [pill, setPill] = useState('')
  const matches = useMemo(() => Object.values(names).filter((a) => matchesNameQuery(a.name, query)).map((a) => a.name), [names, query])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NameSearchBox value={query} onChange={setQuery} label="Search anaesthetists" />
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        {matches.length} match{matches.length === 1 ? '' : 'es'}: {matches.slice(0, 4).join(' · ')}
        {matches.length > 4 ? ' …' : ''}
      </div>
      <NameSearchBox value={pill} onChange={setPill} label="Pill size" size="pill" />
    </div>
  )
}

export function TextFieldExample() {
  const [name, setName] = useState('Labour Day')
  const [code, setCode] = useState('H3')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Labour Day" />
      <TextField label="RVG code" value={code} onChange={setCode} mono hint="Mono variant with a hint line." />
    </div>
  )
}

export function TextAreaExample() {
  const [text, setText] = useState('')
  const [blurred, setBlurred] = useState(0)
  return (
    <div>
      <TextArea label="Internal note" value={text} onChange={setText} placeholder="Visible to the office only" onBlur={() => setBlurred((n) => n + 1)} />
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
      <input
        aria-label="Base units"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ ...selectControlStyle, fontFamily: 'inherit' }}
        placeholder="A whole number above 0"
      />
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
      <SessionTimesFields session="AM" draft={draft} defaults={{ startTime: defaults.startTime, endTime: defaults.endTime }} onChange={setDraft} controlStyle={selectControlStyle} />
      <FormError message={timesDraftError(draft)} />
    </div>
  )
}

/** RvgGroupSheet's anatomy field, rebuilt from its markup: the sheet is not exported. */
export function AnatomyDatalistExample() {
  const [anatomy, setAnatomy] = useState('')
  return (
    <div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Anatomy heading</FieldLabel>
        <input list="catalogue-rvg-anatomy-headings" value={anatomy} onChange={(e) => setAnatomy(e.target.value)} placeholder="e.g. Head" style={selectControlStyle} />
        <datalist id="catalogue-rvg-anatomy-headings">
          {ANATOMY_HEADINGS.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </label>
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
        <DrawerRow label="Times">08:00 to 12:30</DrawerRow>
        <DrawerRow label="Hospital">St George's</DrawerRow>
        <DrawerRow label="Surgeon">
          <DrawerLink onClick={() => setLast('Opened the surgeon (stubbed).')}>Mr Hale</DrawerLink>
        </DrawerRow>
      </DrawerSection>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ActionBtn primary onClick={() => setLast('Primary action.')}>Assign List</ActionBtn>
        <ActionBtn onClick={() => setLast('Secondary action.')}>Edit times</ActionBtn>
        <ActionBtn disabled title="Disabled reason, shown only as a title tooltip" onClick={() => setLast('Never fires.')}>Remove</ActionBtn>
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
      <ProfileCard title="Contact">
        <Fact label="Email" value="example@aa.co.nz" />
        <Fact label="Mobile" value="021 000 0000" mono note="Shown to the office only." />
      </ProfileCard>
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
      <Header title="Specialties" sub="Header, Table, TextAction and EditCell from masters/chrome.tsx." action={<TextAction onClick={() => setLast('Add (stubbed).')}>Add</TextAction>} />
      <Table heads={['Name', 'Id', '']}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td style={rowCellStyle}>{r.name}</td>
            <td className="mono" style={rowCellStyle}>{r.id}</td>
            <EditCell onClick={() => setLast(`Edit ${r.name} (stubbed).`)} label={`Edit ${r.name}`} style={rowCellStyle} />
          </tr>
        ))}
      </Table>
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
      {message !== null && (
        <div role="status" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{message}</span>
          <button type="button" style={textActionStyle} onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}
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
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Status</FieldLabel>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...selectControlStyle, minHeight: 36, fontSize: 13.5 }}>
          {keys.map((k) => (
            <option key={k} value={k}>{label(k)}</option>
          ))}
        </select>
      </label>
      <StatusBlock status={status} title="St George's" detail="Mr Hale · Ortho" style={{ height: 56 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {keys.slice(0, 6).map((k) => (
          <StatusBlock key={k} status={k} title={label(k)} style={{ height: 40 }} />
        ))}
      </div>
    </div>
  )
}
