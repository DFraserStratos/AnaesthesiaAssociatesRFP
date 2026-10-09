/**
 * Assign a Draft List (catch-up Phase 31; US-01.6.3, US-01.3.5 "every office
 * path", US-01.3.6; D44). The office chooses ONLY the anaesthetist: the session
 * is fixed by the Draft List's day and session (change its date first to use
 * another day). Step 1 shows everybody potentially available, grouped and
 * tier-ordered through Phase 17's helper; step 2 confirms, with every soft
 * warning stacked above the button, each naming its cause. A closed session
 * or a not-preferred pairing never blocks: the button reads "Assign anyway".
 * The List becomes ACTIVE in that anaesthetist's session, with its Bookings.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { assignDraftList, bookingCountsByList, slotFor, useAppStore, type Actor } from '../../../store'
import { isClosedKey, statusFor } from '../../../domain/slotStatus'
import { DRAFT_ASSIGN_WARNINGS, isDraftList } from '../../../domain/draftLists'
import { Button, FormError, SuccessOverlay } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { drSurname, locationName, pairingLine } from '../../../shared/format'
import { LIST_KIND_LABELS } from '../../../domain/types'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { surnameFirst } from '../util'
import { NotPreferredWarning, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'
import { DraftListCandidates } from '../components/pairing/DraftListCandidates'
import { BookingCount, UnassignedPill } from '../components/draftLists/DraftListParts'

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
  const targetSlot = useAppStore((s) => (targetId !== null && list !== undefined ? slotFor(s, targetId, list.dateISO, list.session) : undefined))

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

  const closedLabel = useMemo(() => {
    if (targetSlot === undefined || !isClosedKey(masters.slotStatuses, targetSlot.status)) return null
    return statusFor(masters.slotStatuses, targetSlot.status)?.label ?? targetSlot.status
  }, [targetSlot, masters.slotStatuses])

  // Keep showing the assigned List through the success moment.
  if (list === undefined || (!isDraftList(list) && assigned === null)) return null

  const target = targetId !== null ? masters.anaesthetists[targetId] : undefined
  const who = target !== undefined ? drSurname(target.name) : ''
  const passed = list.dateISO < today
  const holiday = list.conflicts.some((c) => c.kind === 'holiday')
  const hospitalName = locationName(list.hospitalId, masters.hospitals)
  const anyWarning = pairingWarning !== null || closedLabel !== null || holiday

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Assign {DRAFT_LIST}</div>
            <UnassignedPill />
          </div>
          <div style={{ fontSize: 13, color: neutral.slate, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{format(parseISO(list.dateISO), 'EEE d MMM')} · {list.session} · {pairingLine(list, masters)}</span>
            <span aria-hidden>·</span>
            <BookingCount count={bookingCount} style={{ fontSize: 12.5 }} noun />
          </div>
        </div>

        {passed ? (
          <div role="status" style={{ background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            This {DRAFT_LIST}'s day has passed. Change its date or remove it.
          </div>
        ) : targetId === null ? (
          <>
            <div style={{ fontSize: 13, color: neutral.slate }}>Choose the anaesthetist. To use another day, change the {DRAFT_LIST}'s date first.</div>
            <DraftListCandidates listId={listId} requestKey={requestKey} onPick={(p) => setTargetId(p.anaesthetistId)} onOpenOccupied={onOpenOccupied} />
            <Button variant="secondary" block onClick={onClose}>Cancel</Button>
          </>
        ) : (
          <>
            <div data-shot="assign-draft-list-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 8, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
              <ConfirmRow label="Anaesthetist">{surnameFirst(target?.name ?? targetId)}</ConfirmRow>
              <ConfirmRow label="Session">{format(parseISO(list.dateISO), 'EEE d MMM')} · {list.session}</ConfirmRow>
              <ConfirmRow label="Hospital">{hospitalName}</ConfirmRow>
              <ConfirmRow label="Surgeon">{masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}</ConfirmRow>
              <ConfirmRow label="Kind">{LIST_KIND_LABELS[list.kind].label}</ConfirmRow>
              {list.notes !== undefined && list.notes.trim() !== '' && <ConfirmRow label="Note">{list.notes}</ConfirmRow>}
              {onEdit !== undefined && (
                <button type="button" onClick={onEdit} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: neutral.slate, textDecoration: 'underline', fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer' }}>
                  Edit hospital, surgeon or note
                </button>
              )}
            </div>
            <div data-shot={pairingWarning !== null ? 'admin-assign-draft-list-not-preferred' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NotPreferredWarning warning={pairingWarning} shot="assign-draft-list-pairing-warning" />
              {closedLabel !== null && (
                <SoftWarning shot="assign-draft-list-closed-warning">
                  {DRAFT_ASSIGN_WARNINGS.closedSession(who, closedLabel)}
                </SoftWarning>
              )}
              {holiday && <SoftWarning shot="assign-draft-list-holiday-warning">{DRAFT_ASSIGN_WARNINGS.hospitalHoliday(hospitalName)}</SoftWarning>}
            </div>
            <FormError message={error} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => { setTargetId(null); setError(null) }}>Back</Button>
              <Button variant="primary" block onClick={confirm}>{anyWarning ? 'Assign anyway' : `Assign ${DRAFT_LIST}`}</Button>
            </div>
          </>
        )}
      </div>
      {assigned !== null ? (
        <SuccessOverlay title={`${DRAFT_LIST} assigned`} testId="draft-list-assigned-overlay" onDismiss={() => onAssigned(listId, assigned.slotId)}>
          <div style={{ fontSize: 14, color: neutral.slate }}>Now an active List in {surnameFirst(target?.name ?? '')}'s {list.session} session</div>
        </SuccessOverlay>
      ) : null}
    </Overlay>
  )
}

function ConfirmRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 14 }}>
      <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist, paddingTop: 2 }}>{label}</span>
      <span style={{ color: neutral.ink }}>{children}</span>
    </div>
  )
}

function SoftWarning({ shot, children }: { shot: string; children: React.ReactNode }) {
  return (
    <div role="status" data-shot={shot} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: '12px 14px', fontSize: 13, lineHeight: '18px' }}>
      <TriangleAlert size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: semantic.warning.solid }} />
      <span>{children}</span>
    </div>
  )
}
