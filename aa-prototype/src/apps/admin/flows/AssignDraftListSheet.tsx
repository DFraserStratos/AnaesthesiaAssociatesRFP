/**
 * Assign a Draft List (catch-up Phase 31; US-01.6.3, US-01.3.5 "every office
 * path", US-01.3.6; D44). The office chooses ONLY the anaesthetist: the session
 * is fixed by the Draft List's day and session (change its date first to use
 * another day). Step 1 shows everybody potentially available, grouped and
 * tier-ordered through Phase 17's helper (tier, then preferred pairing);
 * step 2 confirms, with every soft warning stacked above the button, each
 * naming its cause. A not-preferred pairing never blocks: the button reads
 * "Assign anyway". A colleague marked not available is shown but cannot be
 * picked (US-01.6.3, D59; catch-up Phase 32b). The List becomes ACTIVE in that
 * anaesthetist's session, with its Bookings.
 */

import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { assignDraftList, bookingCountsByList, useAppStore, type Actor } from '../../../store'
import { useDemoTriggerContextWhile } from '../../../shared/demoTriggers'
import { draftClosureWarning, isDraftList } from '../../../domain/draftLists'
import { closureSourcesOf, closuresFor } from '../../../domain/holidays'
import { Button, DefList, DefRow, FormError, SuccessOverlay } from '../../../shared/ui'
import { Notice } from '../../../shared/ui/Notice'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { locationName, pairingLine } from '../../../shared/format'
import { LIST_KIND_LABELS } from '../../../domain/types'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { surnameFirst } from '../util'
import { NotPreferredWarning, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'
import { DraftListCandidates } from '../components/pairing/DraftListCandidates'
import { BookingCount, UnassignedPill } from '../components/draftLists/DraftListParts'
import { sessionText } from '../../../domain/outOfHours'

const SUCCESS_DURATION_MS = 1050

interface AssignDraftListSheetProps {
  open: boolean
  listId: string
  actor: Actor
  /** Open straight on step 2 for this anaesthetist (the drawer's "Available that session"). */
  initialAnaesthetistId?: string
  onClose: () => void
  /** After the success moment: the List is ACTIVE in this session. */
  onAssigned: (listId: string, slotId: string) => void
  /** The drawer's suggestion key, so its short list and this picker share one order; the sheet makes its own otherwise. */
  requestKey?: string
  /** Open the List that already holds an anaesthetist's session. */
  onOpenOccupied: (listId: string) => void
  /** Edit the Draft List's hospital, surgeon or note (the drawer's Edit sheet). */
  onEdit?: () => void
}

export function AssignDraftListSheet({ open, listId, actor, initialAnaesthetistId, onClose, onAssigned, onOpenOccupied, onEdit, requestKey: sharedKey }: AssignDraftListSheetProps) {
  const { Overlay } = useSurface()
  const list = useAppStore((s) => s.schedule.lists[listId])
  const masters = useAppStore((s) => s.masters)
  const bookingCount = useAppStore((s) => bookingCountsByList(s.schedule.bookings).get(listId) ?? 0)
  const today = useAppStore((s) => s.clock.todayISO)
  const [targetId, setTargetId] = useState<string | null>(initialAnaesthetistId ?? null)
  const [error, setError] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<{ slotId: string } | null>(null)
  const ownKey = useSuggestionKey(listId, open)
  const requestKey = sharedKey ?? ownKey
  // The latest callback, so a parent re-render never restarts the success timer.
  const onAssignedRef = useRef(onAssigned)
  onAssignedRef.current = onAssigned
  const pairingWarning = useNotPreferredWarning(targetId ?? undefined, list?.surgeonId)
  // The colleague stand-in on a blocked row acts for this List (catch-up Phase 32b).
  useDemoTriggerContextWhile('adminPicker.listId', listId, open)

  // Every opening starts on step 1, or step 2 when the drawer named the anaesthetist.
  useEffect(() => {
    if (open) {
      setTargetId(initialAnaesthetistId ?? null)
      setError(null)
      setAssigned(null)
    }
  }, [open, initialAnaesthetistId])

  useEffect(() => {
    if (assigned === null) return undefined
    const timer = window.setTimeout(() => onAssignedRef.current(listId, assigned.slotId), SUCCESS_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [assigned, listId])

  // Keep showing the assigned List through the success moment.
  if (list === undefined || (!isDraftList(list) && assigned === null)) return null

  const target = targetId !== null ? masters.anaesthetists[targetId] : undefined
  const passed = list.dateISO < today
  const holiday = list.conflicts.some((c) => c.kind === 'holiday')
  const hospitalName = locationName(list.hospitalId, masters.hospitals)
  const anyWarning = pairingWarning !== null || holiday

  function confirm() {
    if (targetId === null) return
    const out = assignDraftList(useAppStore, actor, listId, { anaesthetistId: targetId })
    if (!out.ok) {
      setError(out.message)
      return
    }
    setAssigned({ slotId: useAppStore.getState().schedule.lists[listId]?.slotId ?? '' })
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-assign-draft-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <OverlayHeader title={<>Assign {DRAFT_LIST}</>} trailing={<UnassignedPill />} />
          <div style={{ fontSize: 13, color: neutral.slate, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{format(parseISO(list.dateISO), 'EEE d MMM')} · {sessionText(list.session)} · {pairingLine(list, masters)}</span>
            <span aria-hidden>·</span>
            <BookingCount count={bookingCount} style={{ fontSize: 12.5 }} noun />
          </div>
        </div>

        {passed ? (
          <Notice tone="warning" live="status">
            <span>This {DRAFT_LIST}'s day has passed. Change its date or remove it.</span>
          </Notice>
        ) : targetId === null ? (
          <>
            <div style={{ fontSize: 13, color: neutral.slate }}>Choose the anaesthetist. To use another day, change the {DRAFT_LIST}'s date first.</div>
            <DraftListCandidates listId={listId} requestKey={requestKey} onPick={(p) => setTargetId(p.anaesthetistId)} onOpenOccupied={onOpenOccupied} />
            <SheetActions primary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>} />
          </>
        ) : (
          <>
            <div data-shot="assign-draft-list-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 8, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
              <DefList>
                <DefRow label="Anaesthetist">{surnameFirst(target?.name ?? targetId)}</DefRow>
                <DefRow label="Session">{format(parseISO(list.dateISO), 'EEE d MMM')} · {sessionText(list.session)}</DefRow>
                <DefRow label="Hospital">{hospitalName}</DefRow>
                <DefRow label="Surgeon">{masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}</DefRow>
                <DefRow label="Kind">{LIST_KIND_LABELS[list.kind].label}</DefRow>
                {list.notes !== undefined && list.notes.trim() !== '' && <DefRow label="Note">{list.notes}</DefRow>}
              </DefList>
              {onEdit !== undefined && (
                <button type="button" onClick={onEdit} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: neutral.slate, textDecoration: 'underline', fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer' }}>
                  Edit hospital, surgeon or note
                </button>
              )}
            </div>
            <div data-shot={pairingWarning !== null ? 'admin-assign-draft-list-not-preferred' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NotPreferredWarning warning={pairingWarning} shot="assign-draft-list-pairing-warning" />
              {holiday && <Notice tone="warning" live="status" shot="assign-draft-list-holiday-warning">{draftClosureWarning(hospitalName, closuresFor(list.dateISO, list.hospitalId, closureSourcesOf(masters)))}</Notice>}
            </div>
            <FormError message={error} />
            <SheetActions
              primary={<Button variant="primary" block onClick={confirm}>{anyWarning ? 'Assign anyway' : `Assign ${DRAFT_LIST}`}</Button>}
              secondary={<Button variant="secondary" block onClick={() => { setTargetId(null); setError(null) }}>Back</Button>}
            />
          </>
        )}
      </div>
      {assigned !== null ? (
        <SuccessOverlay title={`${DRAFT_LIST} assigned`} testId="draft-list-assigned-overlay" onDismiss={() => onAssigned(listId, assigned.slotId)}>
          <div style={{ fontSize: 14, color: neutral.slate }}>Now an active List in {surnameFirst(target?.name ?? '')}'s {sessionText(list.session)} session</div>
        </SuccessOverlay>
      ) : null}
    </Overlay>
  )
}
