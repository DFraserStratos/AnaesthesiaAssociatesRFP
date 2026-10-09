import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { List } from '../../../domain/types'
import { reassignBooking, useAppStore, type Actor } from '../../../store'
import { LIST_STATE_LABELS, locationName } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'
import { Button } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { surnameOf } from '../util'
import { CONFLICT_REASONS } from '../../../domain/conflicts'

interface MoveBookingFlowProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
  onMoved: () => void
}

/**
 * Move a single Booking to another List (3rd review #3; the RFP's routine case).
 * The office picks a target day, then a candidate List (any anaesthetist, either
 * session); each candidate shows its surgeon/hospital and an advisory pairing
 * mismatch flag before confirm (5th review #5 — no hard guard on pairing). The
 * store's `reassignBooking` blocks AUTHORISED source/target.
 */
export function MoveBookingFlow({ open, bookingId, actor, onClose, onMoved }: MoveBookingFlowProps) {
  const { Overlay } = useSurface()
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)

  const sourceList = booking !== undefined ? lists[booking.listId] : undefined
  const [targetDate, setTargetDate] = useState(sourceList?.dateISO ?? '')
  const [error, setError] = useState<string | null>(null)

  const sourceId = sourceList?.id
  const candidates = useMemo(() => {
    if (sourceId === undefined || targetDate === '') return []
    return Object.values(lists)
      // The office may move a Booking onto a Draft List too (catch-up Phase 31); a removed one is gone.
      .filter((l) => l.dateISO === targetDate && l.id !== sourceId && l.state !== 'AUTHORISED' && l.removedAtISO === undefined)
      .sort((a, b) => ((a.anaesthetistId ?? '') === (b.anaesthetistId ?? '') ? a.session.localeCompare(b.session) : (a.anaesthetistId ?? '').localeCompare(b.anaesthetistId ?? '')))
  }, [sourceId, targetDate, lists])

  function mismatch(target: List): string | null {
    if (sourceList === undefined) return null
    const reasons: string[] = []
    if (sourceList.hospitalId !== target.hospitalId) reasons.push('different hospital')
    if (sourceList.surgeonId !== target.surgeonId) reasons.push('different surgeon')
    return reasons.length > 0 ? reasons.join(', ') : null
  }

  function move(target: List) {
    setError(null)
    const outcome = reassignBooking(useAppStore, actor, bookingId, target.id)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onMoved()
  }

  if (sourceList === undefined) return null

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Move booking to another list</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          The Booking moves alone. Both lists' other bookings and their status are untouched, and the move is recorded in the Booking's audit trail.
        </div>
        <div style={{ fontSize: 13, color: neutral.slate }}>To move into a free session, assign a List to it first.</div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Target day</span>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }} />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflow: 'auto' }}>
          {candidates.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No candidate lists on {targetDate !== '' ? format(parseISO(targetDate), 'd MMM') : 'that day'}.</div>}
          {candidates.map((l) => {
            const anae = l.anaesthetistId !== undefined ? masters.anaesthetists[l.anaesthetistId] : undefined
            const hosp = locationName(l.hospitalId, masters.hospitals)
            const surg = masters.surgeons[l.surgeonId]?.name ?? l.surgeonId
            const flag = mismatch(l)
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => move(l)}
                style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'stretch', textAlign: 'left', padding: '10px 12px', borderRadius: radius.card, border: `1px solid ${neutral.line}`, background: neutral.surface, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{anae !== undefined ? surnameOf(anae.name) : (l.anaesthetistId ?? UNASSIGNED)} · {l.session} · {LIST_STATE_LABELS[l.state]}</span>
                <span style={{ fontSize: 12, color: neutral.slate }}>{hosp} · {surg}</span>
                {flag !== null && (
                  <span style={{ fontSize: 11, color: semantic.warning.onTint, fontWeight: 600 }}>Advisory: {flag}. Pairing is not enforced.</span>
                )}
                {/* A conflicted target warns before the tap and never blocks (catch-up Phase 30, OQ-09). */}
                {l.conflicts.length > 0 && (
                  <span data-shot="move-booking-conflict-warning" style={{ fontSize: 11, color: semantic.warning.onTint, fontWeight: 600 }}>
                    ! {l.conflicts.map((c) => CONFLICT_REASONS[c.kind]).join(' · ')}. The Booking is accepted and the List stays flagged.
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="secondary" block onClick={onClose}>Cancel</Button>
        <div style={{ fontSize: 11, color: accent.pressed }}>Select a target list to move the booking immediately.</div>
      </div>
    </Overlay>
  )
}
