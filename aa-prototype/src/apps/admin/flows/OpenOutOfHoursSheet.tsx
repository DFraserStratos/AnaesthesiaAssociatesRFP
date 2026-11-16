/**
 * Open out-of-hours session (catch-up Phase 32c; US-01.1.6). From an
 * anaesthetist's row on Admin Day, for today or a later day. It opens the
 * evening session only, at its default times or the office's own; the List
 * comes next, from the session's drawer (Assign List, or a Draft List waiting
 * for that evening), as for any session. Every rule is the store's
 * (`openOutOfHoursSession`): the sheet shows its plain refusal.
 */

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { openOutOfHoursSession, useAppStore, type Actor } from '../../../store'
import { Button, FormError } from '../../../shared/ui'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { OPEN_OUT_OF_HOURS } from '../../../shared/outOfHoursTerms'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { surnameFirst } from '../util'
import { SessionTimesFields, timesDraftError, type TimesDraft } from './SessionTimesFields'

interface OpenOutOfHoursSheetProps {
  open: boolean
  anaesthetistId: string
  dateISO: string
  actor: Actor
  onClose: () => void
  /** The new session's id: the caller opens its drawer to put a List in it. */
  onOpened: (slotId: string) => void
}

export function OpenOutOfHoursSheet({ open, anaesthetistId, dateISO, actor, onClose, onOpened }: OpenOutOfHoursSheetProps) {
  const { Overlay } = useSurface()
  const anaesthetistName = useAppStore((s) => s.masters.anaesthetists[anaesthetistId]?.name)
  const defaults = useAppStore((s) => s.appSettings.schedule.defaultTimes.OOH)
  const [times, setTimes] = useState<TimesDraft>({ startTime: defaults.startTime, endTime: defaults.endTime })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTimes({ startTime: defaults.startTime, endTime: defaults.endTime })
      setError(null)
    }
  }, [open, anaesthetistId, dateISO, defaults])

  function save() {
    const invalid = timesDraftError(times)
    if (invalid !== null) {
      setError(invalid)
      return
    }
    const out = openOutOfHoursSession(useAppStore, actor, anaesthetistId, dateISO, times)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onOpened(out.value.slotId)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="out-of-hours-open-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <OverlayHeader title={OPEN_OUT_OF_HOURS} />
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>
            {surnameFirst(anaesthetistName ?? anaesthetistId)} · {format(parseISO(dateISO), 'EEE d MMM')}
          </div>
        </div>
        <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
          An evening session after PM, for an emergency or late case. Once it is open, put a new List or a waiting {DRAFT_LIST} in it.
        </div>
        <SessionTimesFields session="OOH" draft={times} defaults={defaults} onChange={(next) => { setTimes(next); setError(null) }} />
        <FormError message={error} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save}>{OPEN_OUT_OF_HOURS}</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}
