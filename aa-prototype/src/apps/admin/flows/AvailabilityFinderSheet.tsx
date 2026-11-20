/**
 * Find available (catch-up Phase 28; US-01.4.2 for the office, US-01.3.5 and
 * US-01.3.6 on Phase 17's helper). For a day and session, every anaesthetist
 * whose session is open (free and holding no List, `isOpenSlot`), listed by
 * Phase 17's `AnaesthetistCandidates`: priority tier order, then preferred
 * pairing within a tier (catch-up Phase 32b), shuffled within that from the request key (date, session and `suggestionSeq`), with the
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
import { activeSurgeons, openSlotViews, useAppStore } from '../../../store'
import { Button, Segmented, SelectField } from '../../../shared/ui'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { AnaesthetistCandidates, useSuggestionKey } from '../components/pairing'
import { surgeonSpecialtyLabel, withSpecialties } from '../../../domain/specialties'

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
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const [session, setSession] = useState<Session>(initialSession)
  const [surgeonId, setSurgeonId] = useState('')

  useEffect(() => {
    if (open) {
      setSession(initialSession)
      setSurgeonId('')
    }
  }, [open, initialSession])

  // One shuffle per opening (Phase 17's counter), keyed by the day and session.
  // "this AM", "this PM", or "out of hours" for the evening session (catch-up Phase 32c).
  const when = session === 'OOH' ? 'out of hours' : `this ${session}`
  const requestKey = useSuggestionKey(`${dateISO}:${session}`, open)

  const candidates = useMemo(
    () =>
      openSlotViews({ schedule: { slots, lists }, appSettings, masters: { slotStatuses } }, dateISO, session).map((v) => v.slot.anaesthetistId),
    [slots, lists, appSettings, slotStatuses, dateISO, session],
  )
  // Active surgeons only (catch-up Phase 42).
  const surgeonOptions = useMemo(() => activeSurgeons({ masters: { surgeons } }).sort((a, b) => a.name.localeCompare(b.name)), [surgeons])
  const count = candidates.length

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-availability-finder" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <OverlayHeader title="Find available" />
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(dateISO), 'EEEE d MMMM')}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ width: 260, flex: 'none' }}>
            {/* `wrap` sizes each segment to its word, so "Out-of-hours" keeps one line and the row its 48px (U5). */}
            <Segmented label="Session" layout="wrap" value={session} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }, { value: 'OOH', label: 'Out-of-hours' }]} onChange={setSession} />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField label="Surgeon for the List (optional)" value={surgeonId} onChange={setSurgeonId} shot="finder-surgeon">
              <option value="">Any surgeon</option>
              {surgeonOptions.map((s) => (
                <option key={s.id} value={s.id}>{withSpecialties(s.name, surgeonSpecialtyLabel({ specialties }, s))}</option>
              ))}
            </SelectField>
          </div>
        </div>

        <div data-shot="finder-count" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>
          {count === 0 ? `No one is free ${when}.` : `${count} ${count === 1 ? 'anaesthetist' : 'anaesthetists'} free ${when}`}
        </div>

        {count > 0 && (
          <AnaesthetistCandidates
            candidates={candidates}
            surgeonId={surgeonId !== '' ? surgeonId : undefined}
            requestKey={requestKey}
            onPick={(anaesthetistId) => onPick(slotIdFor(anaesthetistId, dateISO, session), surgeonId !== '' ? surgeonId : undefined)}
            emptyText={`No one is free ${when}.`}
            trailing={() => <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {session === 'OOH' ? 'out of hours' : session}</span>}
          />
        )}

        <SheetActions primary={<Button variant="secondary" block onClick={onClose}>Close</Button>} />
      </div>
    </Overlay>
  )
}
