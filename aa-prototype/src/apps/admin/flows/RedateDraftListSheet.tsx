/**
 * Change a Draft List's date (catch-up Phase 31; US-01.6.4: "edits its date
 * ... shows on the new day"). Its Bookings move with it and its waiting time
 * is unchanged. The store refuses a passed day, a day beyond the schedule and
 * the same day and session.
 */

import { useEffect, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { bookingCountsByList, redateDraftList, scheduleHorizon, useAppStore, type Actor } from '../../../store'
import type { Session } from '../../../domain/types'
import { Button, FieldLabel, FormError, Segmented } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { assignSelectStyle } from './AssignListFields'

const SESSION_OPTIONS: { value: Session; label: string }[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

export function RedateDraftListSheet({ open, listId, actor, onClose, onDone }: { open: boolean; listId: string; actor: Actor; onClose: () => void; onDone: () => void }) {
  const { Overlay } = useSurface()
  const list = useAppStore((s) => s.schedule.lists[listId])
  const bookings = useAppStore((s) => bookingCountsByList(s.schedule.bookings).get(listId) ?? 0)
  const today = useAppStore((s) => s.clock.todayISO)
  const horizonEnd = useAppStore((s) => scheduleHorizon(s).endISO)
  const [dateISO, setDateISO] = useState(list?.dateISO ?? today)
  const [session, setSession] = useState<Session>(list?.session ?? 'AM')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && list !== undefined) {
      setDateISO(list.dateISO < today ? today : list.dateISO)
      setSession(list.session)
      setError(null)
    }
    // Reset on opening only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (list === undefined) return null

  function save() {
    const out = redateDraftList(useAppStore, actor, listId, { dateISO, session })
    if (!out.ok) {
      setError(out.message)
      return
    }
    onDone()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-redate-draft-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Change date</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <FieldLabel>Day</FieldLabel>
            <input type="date" value={dateISO} min={today} max={horizonEnd} onChange={(e) => { setDateISO(e.target.value); setError(null) }} style={assignSelectStyle} />
          </label>
          <Segmented label="Session" value={session} options={SESSION_OPTIONS} onChange={(s) => { setSession(s); setError(null) }} />
        </div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          {bookings > 0 ? `Its ${bookings} Booking${bookings === 1 ? '' : 's'} move${bookings === 1 ? 's' : ''} with it. ` : ''}The {DRAFT_LIST} keeps how long it has been waiting.
        </div>
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>Change date</Button>
        </div>
      </div>
    </Overlay>
  )
}
