import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import type { DisplayKey, Session } from '../../../domain/types'
import type { SlotStatusRecords } from '../../../domain/slotStatus'
import { isOpenSlotView, rosterForDate, slotViewsForDate, useAppStore, useToday, type SlotView } from '../../../store'
import { ChevronRight } from 'lucide-react'
import { MobileHeader } from '../components'
import { Avatar, blockFill, DockSpacer, resolveDisplayStatus, StatusChip, useDefaultStatus } from '../../../shared'
import { SlidingSegmentedControl } from '../../../shared/ui/SlidingSegmentedControl'
import { locationName, shortDay } from '../../../shared/format'
import { MovedToYouPanel, useMovableSessions, useMoveListPrompt } from '../../../shared/flows'
import { useNavigate } from 'react-router-dom'
import { sessionText } from '../../../domain/outOfHours'
import { OutOfHoursMoon } from '../../../shared/schedule'
import { STATUS_ON_FILL } from '../../../theme/statusColours'
import { EmptyState } from '../../../shared/ui/EmptyState'

interface AvailabilityScreenProps {
  anaesthetistId: string
  initials: string
  /** Open the selected day's bottom sheet (its sessions, then the form). */
  onChangeDay: (dateISO: string) => void
  /** Slide in My calendar. */
  onOpenCalendar: () => void
}

/** Cell visual per status, from the status master (colleague cells show status only, never patient detail, A8). */
function cellStyle(key: DisplayKey, statuses: SlotStatusRecords): { bg: string; border: string; color: string } {
  const c = resolveDisplayStatus(key, statuses).visual
  // The fill through the one rule (UI unification U6, U23); the cell keeps its own 1px outline.
  const fill = blockFill(c)
  const bg = typeof fill.background === 'string' ? fill.background : c.blockBackground
  if (typeof fill.border === 'string') return { bg, border: fill.border, color: c.onTint }
  if (c.treatment === 'hatched') return { bg, border: `1px solid ${neutral.line}`, color: c.onTint }
  return { bg, border: '1px solid transparent', color: c.onTint }
}

export function AvailabilityScreen({ anaesthetistId, initials, onChangeDay, onOpenCalendar }: AvailabilityScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const { visual: openVisual, label: openLabel } = useDefaultStatus()
  const todayISO = useToday()

  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [mode, setMode] = useState<'everyone' | 'free'>('everyone')
  // Catch-up Phase 32: her movable Lists that day, and the colleagues' sessions each could move into.
  const movable = useMovableSessions(anaesthetistId, selectedDate)
  const movePrompt = useMoveListPrompt()
  const navigate = useNavigate()

  // The same Slot views every app and finder reads (catch-up Phase 28,
  // US-01.4.2): "free" is an open session (free, holding no List), so a
  // session the office has assigned is never offered here. Name order, no
  // tiers (the office's ranking is Admin only, US-01.3.6).
  const slotState = useMemo(
    () => ({ schedule: { slots: slotsRecord, lists: listsRecord }, appSettings, masters: { slotStatuses } }),
    [slotsRecord, listsRecord, appSettings, slotStatuses],
  )

  const days = useMemo(() => {
    const out: { dateISO: string; dow: string; date: string; hasFree: boolean }[] = []
    for (let i = 0; i < 6; i++) {
      const d = format(addDays(parseISO(todayISO), i), 'yyyy-MM-dd')
      const hasFree = slotViewsForDate(slotState, d).some(isOpenSlotView)
      out.push({ dateISO: d, dow: format(parseISO(d), 'EEE').toUpperCase(), date: format(parseISO(d), 'd'), hasFree })
    }
    return out
  }, [todayISO, slotState])

  const model = useMemo(() => {
    const views = slotViewsForDate(slotState, selectedDate)
    function slot(aid: string, session: Session): SlotView | undefined {
      return views.find((v) => v.slot.anaesthetistId === aid && v.slot.session === session)
    }
    const rows = rosterForDate({ schedule: slotState.schedule, masters: { anaesthetists } }, selectedDate)
      .filter((a) => a.registrationNumber !== anaesthetistId)
      .map((a) => ({ anaesthetist: a, am: slot(a.registrationNumber, 'AM'), pm: slot(a.registrationNumber, 'PM'), ooh: slot(a.registrationNumber, 'OOH') }))
      .sort((x, y) => x.anaesthetist.name.localeCompare(y.anaesthetist.name))
    const freeCount = views.filter(isOpenSlotView).length
    const mine = { am: slot(anaesthetistId, 'AM'), pm: slot(anaesthetistId, 'PM'), ooh: slot(anaesthetistId, 'OOH') }
    return { rows, freeCount, mine }
  }, [slotState, anaesthetists, selectedDate, anaesthetistId])

  const selLong = shortDay(selectedDate)

  function cellSubtitle(view: SlotView | undefined): string {
    if (view === undefined) return ''
    const list = view.list
    if (list === undefined) return view.open ? 'Open for bookings' : (view.slot.note ?? resolveDisplayStatus(view.slot.status, slotStatuses).longLabel)
    const hospital = locationName(list.hospitalId, hospitals)
    const surgeon = surgeons[list.surgeonId]?.name ?? ''
    return [hospital, surgeon].filter(Boolean).join(' · ')
  }

  function cellTitle(view: SlotView | undefined): string {
    if (view === undefined) return 'No session'
    const list = view.list
    if (list === undefined) return resolveDisplayStatus(view.slot.status, slotStatuses).label
    return list.kind === 'preop' ? 'Pre-op' : locationName(list.hospitalId, hospitals)
  }

  const isFreeView = (v: SlotView | undefined) => v !== undefined && isOpenSlotView(v)
  const rowsToShow = mode === 'free' ? model.rows.filter((r) => isFreeView(r.am) || isFreeView(r.pm) || isFreeView(r.ooh)) : model.rows

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(var(--aa-inset-top, 54px) + 10px) 20px 0', flex: 'none' }}>
        <MobileHeader eyebrow="Find cover" title="Availability" initials={initials} />
      </div>

      {/* Date strip */}
      <div style={{ padding: '14px 20px 4px', flex: 'none' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {days.map((d) => {
            const active = d.dateISO === selectedDate
            return (
              <button
                key={d.dateISO}
                data-date={d.dateISO}
                aria-pressed={active}
                onClick={() => setSelectedDate(d.dateISO)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '9px 0',
                  borderRadius: radius.md,
                  border: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: active ? accent.base : neutral.surface,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: active ? 'rgba(255,255,255,0.7)' : neutral.mist }}>{d.dow}</span>
                <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: active ? neutral.surface : neutral.ink }}>{d.date}</span>
                <span style={{ width: 5, height: 5, borderRadius: radius.pill, background: d.hasFree ? (active ? STATUS_ON_FILL.free : openVisual.solid) : 'transparent' }} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Segmented */}
      <div style={{ padding: '12px 20px 6px', flex: 'none' }}>
        <SlidingSegmentedControl
          value={mode}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'free', label: 'Free only' },
          ]}
          onSelect={setMode}
          variant="surface"
          ariaLabel="Availability view"
        />
      </div>

      {/* Summary */}
      <div style={{ padding: '6px 20px 2px', display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <span style={{ width: 8, height: 8, borderRadius: radius.pill, background: openVisual.solid }} />
        <span style={{ fontSize: 13, color: neutral.slate }}>
          <span style={{ fontWeight: 700, color: openVisual.onTint }}>{model.freeCount} free sessions</span> on {selLong}
        </span>
      </div>

      {/* Tab bar clearance is the `DockSpacer` at the tail, not padding here. */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MovedToYouPanel
          anaesthetistId={anaesthetistId}
          onOpenList={(id) => navigate(`/mobile/lists/${id}`)}
          onOpenBooking={(listId, bookingId) => navigate(`/mobile/lists/${listId}/bookings/${bookingId}`)}
        />
        {/* My availability */}
        <div data-shot="availability-mine" style={{ background: neutral.surface, border: `1px solid ${accent.base}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar initials={initials} size={34} />
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>My availability</span>
          </div>
          {/* Her out-of-hours session shows only on a day the office opened one (catch-up Phase 32c). */}
          {(model.mine.ooh !== undefined ? (['AM', 'PM', 'OOH'] as const) : (['AM', 'PM'] as const)).map((session) => {
            const view = session === 'AM' ? model.mine.am : session === 'PM' ? model.mine.pm : model.mine.ooh
            return (
              <div key={session} data-shot={`availability-mine-${session.toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
                {session === 'OOH' ? (
                  <span aria-label={sessionText(session)} style={{ width: 28, flex: 'none' }}><OutOfHoursMoon color={neutral.mist} size={13} /></span>
                ) : (
                  <span className="mono" style={{ width: 28, fontSize: 11, fontWeight: 600, color: neutral.mist, flex: 'none' }}>{sessionText(session)}</span>
                )}
                {view === undefined ? (
                  <span style={{ fontSize: 12.5, color: neutral.mist }}>No session</span>
                ) : (
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusChip status={view.displayKey} style={{ flex: 'none' }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: neutral.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {view.list !== undefined ? cellTitle(view) : (view.slot.note ?? '')}
                    </span>
                    {movable[session] !== undefined && movePrompt !== null && (
                      <button
                        type="button"
                        data-shot={`availability-move-${session.toLowerCase()}`}
                        onClick={() => movePrompt.openMove(movable[session]!.list.id)}
                        style={{ ...miniBtn(accent.base), flex: 'none' }}
                      >
                        Move
                      </button>
                    )}
                  </span>
                )}
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-shot="availability-change" onClick={() => onChangeDay(selectedDate)} disabled={model.mine.am === undefined && model.mine.pm === undefined} style={{ ...miniBtn(accent.base), flex: 1, minHeight: 40 }}>
              Change {selLong}
            </button>
            <button type="button" data-shot="availability-open-calendar" onClick={onOpenCalendar} style={{ ...miniBtn(accent.base), flex: 1, minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              My calendar <ChevronRight size={15} strokeWidth={2.4} aria-hidden />
            </button>
          </div>
        </div>

        {rowsToShow.map((r) => {
          const anyFree = isFreeView(r.am) || isFreeView(r.pm) || isFreeView(r.ooh)
          return (
            <div key={r.anaesthetist.registrationNumber} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 2px rgba(23,35,32,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={r.anaesthetist.name} size={34} variant="tint" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.anaesthetist.name}</span>
                {anyFree && <span style={{ fontSize: 11, fontWeight: 600, color: openVisual.onTint, background: openVisual.tint, borderRadius: radius.pill, padding: '3px 9px' }}>{openLabel}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(r.ooh !== undefined ? (['AM', 'PM', 'OOH'] as const) : (['AM', 'PM'] as const)).map((session) => {
                  const view = session === 'AM' ? r.am : session === 'PM' ? r.pm : r.ooh
                  const cs = view !== undefined ? cellStyle(view.displayKey, slotStatuses) : { bg: neutral.sunken, border: `1px solid ${neutral.line}`, color: neutral.mist }
                  // The mockup's gesture, kept where it means something: her List that session can move into this free session.
                  const mine = movable[session]
                  const canReceive = view !== undefined && mine !== undefined && mine.targetSlotIds.has(view.slot.id) && movePrompt !== null
                  const Tag = canReceive ? 'button' : 'div'
                  return (
                    <Tag
                      key={session}
                      {...(canReceive ? { type: 'button' as const, onClick: () => movePrompt.openMove(mine.list.id, { toSlotId: view.slot.id }), 'data-shot': `availability-move-to-${view.slot.anaesthetistId}-${session.toLowerCase()}` } : {})}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, minHeight: 52, borderRadius: radius.ctl, padding: '8px 10px', textAlign: 'left', fontFamily: 'inherit', cursor: canReceive ? 'pointer' : 'default', background: cs.bg, border: cs.border, ...(session === 'OOH' ? { gridColumn: '1 / -1' } : {}) }}
                    >
                      {session === 'OOH' ? (
                        <span aria-label={sessionText(session)} style={{ flex: 'none', opacity: 0.7 }}><OutOfHoursMoon color={cs.color} size={12} /></span>
                      ) : (
                        <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: cs.color, opacity: 0.7, flex: 'none' }}>{sessionText(session)}</span>
                      )}
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: cs.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cellTitle(view)}</span>
                        <span style={{ fontSize: 10.5, color: cs.color, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{canReceive ? 'Tap to move your List here' : cellSubtitle(view)}</span>
                      </span>
                    </Tag>
                  )
                })}
              </div>
            </div>
          )
        })}
        {rowsToShow.length === 0 && (
          <EmptyState variant="centred">No free sessions on this day.</EmptyState>
        )}
        {/* 82 - 8 for the column gap, so the reserved space is unchanged. */}
        <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 74px)" />
      </div>
    </div>
  )
}

function miniBtn(color: string): React.CSSProperties {
  return {
    minHeight: 32,
    padding: '0 10px',
    borderRadius: radius.pill,
    border: `1px solid ${color}55`,
    background: neutral.surface,
    color,
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 'none',
  }
}
