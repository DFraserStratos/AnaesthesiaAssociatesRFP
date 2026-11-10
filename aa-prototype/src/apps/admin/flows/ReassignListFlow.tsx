import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { AssignedList, SlotStatusKey } from '../../../domain/types'
import { defaultVacated } from '../../../domain/listMoves'
import { closedEmptyColleagueSlots, openSlotViews, reassignList, useAppStore, type Actor } from '../../../store'
import { Button } from '../../../shared/ui'
import { SuccessOverlay } from '../../../shared/ui/SuccessOverlay'
import { useSurface } from '../../../shared/surface'
import { VacatedSessionChoice } from '../../../shared/flows/VacatedSessionChoice'
import { useDemoTriggerContextWhile } from '../../../shared/demoTriggers'
import { surnameFirst } from '../util'
import { AnaesthetistCandidates, NotPreferredWarning, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'
import { NotAvailableColleagues } from '../components/pairing/AnaesthetistCandidates'

interface ReassignListFlowProps {
  open: boolean
  list: AssignedList
  actor: Actor
  onClose: () => void
  onReassigned: () => void
}

const SUCCESS_DURATION_MS = 1050

/**
 * List reassignment (illness cover; US-01.4.1, catch-up Phase 28). The List
 * moves into a colleague's open session on the same day and session (free,
 * holding no List: `isOpenSlot`), keeping its id, Bookings and history. The
 * office chooses what the vacated session becomes, Free or Unavailable, in the
 * one shared control (D60, OQ-84 answered; catch-up Phase 32b: no "keep as is",
 * since a List never sits on a closed session now). Nothing about billing is
 * recalculated (US-06.3.5: an honour system).
 *
 * Catch-up Phase 17 (US-01.3.5, US-01.3.6, US-13.6.4): the free candidates come
 * through `AnaesthetistCandidates`, ordered by tier, then preferred pairing,
 * then shuffled within that, with not-preferred pairings apart and a tier
 * filter; a not-preferred target warns on the confirm step and never blocks
 * ("Confirm reassignment anyway").
 *
 * Catch-up Phase 32b (US-01.6.3, D59): colleagues whose session is marked not
 * available sit in a collapsed, read-only "Not available" group; the office
 * never moves a List onto one. The colleague stand-in on each row plays the
 * anaesthetist making it available.
 */
export function ReassignListFlow({ open, list, actor, onClose, onReassigned }: ReassignListFlowProps) {
  const { Overlay } = useSurface()
  const state = useAppStore()
  const anaesthetists = state.masters.anaesthetists

  const [targetId, setTargetId] = useState<string | null>(null)
  // The shared type-ahead's text (Phase 32a): it narrows the candidates and the Not available group alike.
  const [query, setQuery] = useState('')
  const [vacatedStatus, setVacatedStatus] = useState<SlotStatusKey>(defaultVacated())
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const requestKey = useSuggestionKey(list.id, open)
  useDemoTriggerContextWhile('adminPicker.listId', list.id, open && !showSuccess)

  // Every opening starts on the picker (a reopened picker reshuffles within a tier).
  useEffect(() => {
    if (open) {
      setTargetId(null)
      setVacatedStatus(defaultVacated())
      setError(null)
    }
  }, [open])

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
  // Colleagues whose session is closed and empty: shown apart, read only.
  const unavailableSlots = useMemo(() => closedEmptyColleagueSlots(state, list.dateISO, list.session, list.anaesthetistId), [state, list.anaesthetistId, list.dateISO, list.session])
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
              Choose an anaesthetist whose {list.session} session is free, listed by tier, then preferred pairing. The List moves into their session.
            </div>
            <AnaesthetistCandidates
              candidates={candidateIds}
              surgeonId={list.surgeonId}
              requestKey={requestKey}
              onPick={setTargetId}
              query={query}
              onQueryChange={setQuery}
              emptyText={`No anaesthetist has a free ${list.session} session on this day.`}
              trailing={() => <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {list.session}</span>}
            />
            <NotAvailableColleagues slots={unavailableSlots} session={list.session} query={query} shot="reassign-not-available" />
            <Button variant="secondary" block onClick={onClose}>Cancel</Button>
          </>
        ) : (
          <>
            <div style={{ background: accent.tint, borderRadius: radius.card, padding: 12, fontSize: 13, color: accent.pressed }}>
              The List moves with its Bookings and history to {surnameFirst(target?.name ?? '')}'s {list.session} session.
            </div>
            <VacatedSessionChoice label={`${surnameFirst(sourceName)}'s session after the move`} value={vacatedStatus} onChange={setVacatedStatus} shot="reassign-vacated" />
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
