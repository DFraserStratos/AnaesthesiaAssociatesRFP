import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { List, SlotStatusKey } from '../../../domain/types'
import { defaultSlotStatus } from '../../../domain/slotStatus'
import { openSlotViews, reassignList, useAppStore, type Actor } from '../../../store'
import { Button } from '../../../shared/ui'
import { useSlotStatuses } from '../../../shared/status/useSlotStatuses'
import { SuccessOverlay } from '../../../shared/ui/SuccessOverlay'
import { useSurface } from '../../../shared/surface'
import { surnameFirst } from '../util'
import { AnaesthetistCandidates, NotPreferredWarning, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'

interface ReassignListFlowProps {
  open: boolean
  list: List
  actor: Actor
  onClose: () => void
  onReassigned: () => void
}

const SUCCESS_DURATION_MS = 1050

/**
 * List reassignment (illness cover; US-01.4.1, catch-up Phase 28). The List
 * moves into a colleague's open session on the same day and session (free,
 * holding no List: `isOpenSlot`), keeping its id, Bookings and history. The
 * vacated session returns to the default status (Free) unless the office marks
 * it with another status in use (OQ-84's recommendation, provisional in the
 * Decisions log; catch-up Phase 29 reads the choices from the status master). Nothing
 * about billing is recalculated (US-06.3.5: an honour system).
 *
 * Catch-up Phase 17 (US-01.3.5, US-01.3.6, the office's move): the free
 * candidates come through `AnaesthetistCandidates`, grouped (not preferred
 * with the List's surgeon apart), tier-ordered and shuffled within a tier,
 * with a tier filter; a not-preferred target warns on the confirm step and
 * never blocks ("Confirm reassignment anyway").
 */
export function ReassignListFlow({ open, list, actor, onClose, onReassigned }: ReassignListFlowProps) {
  const { Overlay } = useSurface()
  const state = useAppStore()
  const anaesthetists = state.masters.anaesthetists

  const [targetId, setTargetId] = useState<string | null>(null)
  const statusOptions = useSlotStatuses()
  const defaultStatus = defaultSlotStatus(state.masters.slotStatuses)
  const [vacatedStatus, setVacatedStatus] = useState<SlotStatusKey>(defaultStatus.key)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const requestKey = useSuggestionKey(list.id, open)

  // Every opening starts on the picker (a reopened picker reshuffles within a tier).
  useEffect(() => {
    if (open) {
      setTargetId(null)
      setVacatedStatus(defaultStatus.key)
      setError(null)
    }
  }, [open, defaultStatus.key])

  useEffect(() => {
    if (!showSuccess) return undefined
    const timer = window.setTimeout(onReassigned, SUCCESS_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [onReassigned, showSuccess])

  // Colleagues whose same-day, same-session session is open: the same Slot
  // views every finder reads, so a session holding a List is never offered.
  const candidateIds = useMemo(
    () =>
      openSlotViews(state, list.dateISO, list.session)
        .filter((v) => v.slot.anaesthetistId !== list.anaesthetistId)
        .map((v) => v.slot.anaesthetistId),
    [state, list.anaesthetistId, list.dateISO, list.session],
  )
  const target = targetId !== null ? anaesthetists[targetId] : undefined
  const pairingWarning = useNotPreferredWarning(target?.registrationNumber, list.surgeonId)
  const sourceName = anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId

  function confirm() {
    if (target === undefined) return
    setError(null)
    const outcome = reassignList(useAppStore, actor, list.id, target.registrationNumber, vacatedStatus)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setShowSuccess(true)
  }

  return (
    <Overlay open={open} onClose={showSuccess ? () => {} : onClose}>
      <div aria-hidden={showSuccess} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Reassign list (cover)</div>

        {targetId === null ? (
          <>
            <div style={{ fontSize: 13, color: neutral.slate }}>
              Choose an anaesthetist whose {list.session} session is free, listed in tier order. The List moves into their session.
            </div>
            <AnaesthetistCandidates
              candidates={candidateIds}
              surgeonId={list.surgeonId}
              requestKey={requestKey}
              onPick={setTargetId}
              emptyText={`No anaesthetist has a free ${list.session} session on this day.`}
              trailing={() => <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {list.session} →</span>}
            />
            <Button variant="secondary" block onClick={onClose}>Cancel</Button>
          </>
        ) : (
          <>
            <div style={{ background: accent.tint, borderRadius: radius.card, padding: 12, fontSize: 13, color: accent.pressed }}>
              The List moves with its Bookings and history to {surnameFirst(target?.name ?? '')}'s {list.session} session.
              {' '}{surnameFirst(sourceName)}'s session returns to {defaultStatus.label} unless you mark it otherwise.
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Vacated session becomes</span>
              <select data-shot="reassign-vacated" value={vacatedStatus} onChange={(e) => setVacatedStatus(e.target.value)} style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}>
                {statusOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.isDefault === true ? `${o.longLabel} (default)` : o.longLabel}</option>
                ))}
              </select>
            </label>
            <NotPreferredWarning warning={pairingWarning} shot="reassign-pairing-warning" />
            {error !== null && (
              <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setTargetId(null)}>Back</Button>
              <Button variant="primary" block onClick={confirm}>{pairingWarning !== null ? 'Confirm reassignment anyway' : 'Confirm reassignment'}</Button>
            </div>
          </>
        )}
      </div>
      {showSuccess ? (
        // `onDismiss` runs exactly what the SUCCESS_DURATION_MS timer runs, so a
        // tap closes the flood if that timer is ever lost to an unmount race.
        <SuccessOverlay title="List reassigned" testId="list-reassignment-overlay" onDismiss={onReassigned}>
          <div style={{ fontSize: 14, color: neutral.slate }}>
            Moved to {surnameFirst(target?.name ?? '')}
          </div>
        </SuccessOverlay>
      ) : null}
    </Overlay>
  )
}
