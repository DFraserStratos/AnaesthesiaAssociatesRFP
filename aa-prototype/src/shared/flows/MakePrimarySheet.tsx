import { useBookingApi, useBookingStore } from '../booking/draft'
import { useEffect, useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { proceduresForBooking, setPrimaryProcedure, type Actor } from '../../store'
import { modifierFactsFor } from '../../store/modifierFacts'
import { FormError } from '../ui'
import { ConfirmSheet } from '../surface/ConfirmSheet'
import { procedureLabel } from '../../domain/billing/procedureStack'
import { inDisplayOrder } from '../../domain/billing/multiProcedure'
import { reconcileClaims } from '../../domain/billing/modifiers'

interface MakePrimarySheetProps {
  open: boolean
  /** The additional Procedure to make primary. */
  procedureId: string
  actor: Actor
  onClose: () => void
  onDone: () => void
}

/**
 * Confirms "Make primary" (catch-up Phase 23; US-03.2.2): a bottom sheet on the
 * phone and a dialog on desktop, through the shared `ConfirmSheet`. It names
 * what moves (base units, the Booking's modifiers, the order) and, only when
 * they apply, the recorded base cleared from the old primary and a claim the
 * new primary's group already includes. Units only, never a fee. A refusal
 * shows in the sheet.
 */
export function MakePrimarySheet({ open, procedureId, actor, onClose, onDone }: MakePrimarySheetProps) {
  const bookingApi = useBookingApi()
  const schedule = useBookingStore((s) => s.schedule)
  const masters = useBookingStore((s) => s.masters)
  const procedure = schedule.procedures[procedureId]
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const facts = useMemo(() => {
    if (procedure === undefined) return undefined
    const state = { schedule, masters }
    const ordered = inDisplayOrder(proceduresForBooking(state, procedure.bookingId))
    const old = ordered.find((p) => p.isPrimary)
    const nameOf = (id: string) => {
      const p = ordered.find((x) => x.id === id)
      return p === undefined ? '' : procedureLabel(p, state.masters.rvgGroups, ordered.indexOf(p) + 1)
    }
    const kept = old !== undefined ? reconcileClaims(old.modifierClaims, old.removedModifierIds, modifierFactsFor(state, procedure)).modifierClaims : []
    const dropped = (old?.modifierClaims ?? []).filter((c) => !kept.some((k) => k.modifierId === c.modifierId))
    return {
      name: nameOf(procedure.id),
      oldName: old !== undefined ? nameOf(old.id) : '',
      baseCleared: old !== undefined && (old.baseUnitsSelected !== undefined || old.baseUnitsCaptured !== undefined),
      droppedCodes: dropped.map((c) => state.masters.modifiers[c.modifierId]?.code ?? c.modifierId),
    }
  }, [schedule, masters, procedure])

  if (procedure === undefined || facts === undefined) return null

  function submit() {
    setError(null)
    const outcome = setPrimaryProcedure(bookingApi, actor, procedureId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onDone()
    onClose()
  }

  const strong = (text: string) => <strong style={{ color: neutral.ink }}>{text}</strong>
  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title="Make this the primary procedure?"
      description={
        <>
          Base units will come from {strong(facts.name)}. The Booking's modifiers move to this procedure, and it moves to
          the top. {strong(facts.oldName)} becomes an additional procedure and stops carrying base units.
        </>
      }
      confirmLabel="Make primary"
      confirmShot="make-primary-confirm"
      shot="make-primary-sheet"
      onConfirm={submit}
      cancelLabel={`Keep ${facts.oldName}`}
    >
      {(facts.baseCleared || facts.droppedCodes.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: neutral.slate }}>
          {facts.baseCleared && <span>Its recorded base units are cleared.</span>}
          {facts.droppedCodes.map((code) => (
            <span key={code}>
              {code} is already included in {facts.name}'s base units, so it is removed.
            </span>
          ))}
        </div>
      )}
      <FormError message={error} />
    </ConfirmSheet>
  )
}
