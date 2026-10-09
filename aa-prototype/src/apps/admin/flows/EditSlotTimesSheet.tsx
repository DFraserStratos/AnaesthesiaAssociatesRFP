/**
 * Edit times on an empty session (catch-up Phase 28; US-01.1.4 "each Slot can
 * override"). The same fields as Edit list's times, saved through
 * `setSlotTimes`; "Use default" returns the session to the settings default.
 */

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { effectiveSlotTimes } from '../../../domain/slots'
import { setSlotTimes, useAppStore, type Actor } from '../../../store'
import { Button, FormError } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { SessionTimesFields, timesDraftError, timesPatch, type TimesDraft } from './SessionTimesFields'

export function EditSlotTimesSheet({ open, slotId, actor, onClose }: { open: boolean; slotId: string; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const slot = useAppStore((s) => s.schedule.slots[slotId])
  const settings = useAppStore((s) => s.appSettings.schedule)
  const current = useMemo<TimesDraft | undefined>(() => {
    if (slot === undefined) return undefined
    const t = effectiveSlotTimes(slot, settings)
    return { startTime: t.startTime, endTime: t.endTime }
  }, [slot, settings])
  const [draft, setDraft] = useState<TimesDraft>(current ?? { startTime: '', endTime: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && current !== undefined) {
      setDraft(current)
      setError(null)
    }
  }, [open, current])

  if (slot === undefined || current === undefined) return null
  const defaults = settings.defaultTimes[slot.session]

  function save() {
    if (slot === undefined) return
    const invalid = timesDraftError(draft)
    if (invalid !== null) {
      setError(invalid)
      return
    }
    const outcome = setSlotTimes(useAppStore, actor, slot.id, timesPatch(draft, defaults))
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-edit-session-times" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Edit times</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(slot.dateISO), 'EEE d MMM')} · {slot.session} session</div>
        </div>
        <SessionTimesFields session={slot.session} draft={draft} defaults={defaults} onChange={setDraft} />
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>Save times</Button>
        </div>
      </div>
    </Overlay>
  )
}
