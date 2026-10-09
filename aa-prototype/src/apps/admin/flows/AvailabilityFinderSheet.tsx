/**
 * Find available (catch-up Phase 28; US-01.4.2 for the office, US-01.3.5 and
 * US-01.3.6 on Phase 17's helper). For a day and session, every anaesthetist
 * whose session is open (free and holding no List, `isOpenSlot`), listed by
 * Phase 17's `AnaesthetistCandidates`: priority tier order, shuffled within a
 * tier from the request key (date, session and `suggestionSeq`), with the
 * tier filter, Preferred pills and, once a surgeon is chosen, the
 * not-preferred pairings in their own group, still selectable. No ordering or
 * grouping logic lives here: one rule, one place. Picking a row opens that
 * session's drawer on Assign List with the surgeon already chosen.
 *
 * Admin only: the anaesthetists' own finders (mobile Availability, the web
 * grid, "Who's free") stay name-ordered and show no tier or preference.
 */

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral } from '../../../theme/tokens'
import type { Session } from '../../../domain/types'
import { slotIdFor } from '../../../domain/slots'
import { openSlotViews, useAppStore } from '../../../store'
import { Button, FieldLabel, Segmented } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { AnaesthetistCandidates, useSuggestionKey } from '../components/pairing'
import { assignSelectStyle } from './AssignListFields'

interface AvailabilityFinderSheetProps {
  open: boolean
  dateISO: string
  initialSession: Session
  onClose: () => void
  /** A row picked: the session to open, and the surgeon chosen here, if any. */
  onPick: (slotId: string, surgeonId: string | undefined) => void
}

export function AvailabilityFinderSheet({ open, dateISO, initialSession, onClose, onPick }: AvailabilityFinderSheetProps) {
  const { Overlay } = useSurface()
  const slots = useAppStore((s) => s.schedule.slots)
  const lists = useAppStore((s) => s.schedule.lists)
  const appSettings = useAppStore((s) => s.appSettings)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [session, setSession] = useState<Session>(initialSession)
  const [surgeonId, setSurgeonId] = useState('')

  useEffect(() => {
    if (open) {
      setSession(initialSession)
      setSurgeonId('')
    }
  }, [open, initialSession])

  // One shuffle per opening (Phase 17's counter), keyed by the day and session.
  const requestKey = useSuggestionKey(`${dateISO}:${session}`, open)

  const candidates = useMemo(
    () =>
      openSlotViews({ schedule: { slots, lists }, appSettings }, dateISO, session).map((v) => v.slot.anaesthetistId),
    [slots, lists, appSettings, dateISO, session],
  )
  const surgeonOptions = useMemo(() => Object.values(surgeons).sort((a, b) => a.name.localeCompare(b.name)), [surgeons])
  const count = candidates.length

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-availability-finder" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Find available</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(dateISO), 'EEEE d MMMM')}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ width: 160, flex: 'none' }}>
            <Segmented label="Session" value={session} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} onChange={setSession} />
          </div>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Surgeon for the List (optional)</FieldLabel>
            <select data-shot="finder-surgeon" value={surgeonId} onChange={(e) => setSurgeonId(e.target.value)} style={assignSelectStyle}>
              <option value="">Any surgeon</option>
              {surgeonOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.specialty !== undefined ? ` (${s.specialty})` : ''}</option>
              ))}
            </select>
          </label>
        </div>

        <div data-shot="finder-count" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>
          {count === 0 ? `No one is free this ${session}.` : `${count} ${count === 1 ? 'anaesthetist' : 'anaesthetists'} free this ${session}`}
        </div>

        {count > 0 && (
          <AnaesthetistCandidates
            candidates={candidates}
            surgeonId={surgeonId !== '' ? surgeonId : undefined}
            requestKey={requestKey}
            onPick={(anaesthetistId) => onPick(slotIdFor(anaesthetistId, dateISO, session), surgeonId !== '' ? surgeonId : undefined)}
            emptyText={`No one is free this ${session}.`}
            trailing={() => <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {session}</span>}
          />
        )}

        <Button variant="secondary" block onClick={onClose}>Close</Button>
      </div>
    </Overlay>
  )
}
