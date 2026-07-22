import { useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { BillingValidationFailure } from '../../../domain/billing'
import { completionBlockersFor, submitList, useAppStore, type Actor } from '../../../store'
import { BottomSheet, MobileButton } from '../components'

interface SubmitListSheetProps {
  open: boolean
  listId: string
  actor: Actor
  /**
   * 'blockers': the explanatory sheet behind the greyed submit bar — names
   * every not-yet-complete card and its outstanding validation failures
   * verbatim (or the ready-but-not-completed nudge).
   * 'confirm': the pre-submit confirmation explaining what SUBMITTED means.
   */
  mode: 'blockers' | 'confirm'
  onClose: () => void
  onSubmitted: () => void
}

interface BlockerRow {
  cardId: string
  patientName: string
  time: string
  /** Empty = validation passes; the card just needs Mark complete. */
  messages: string[]
}

export function SubmitListSheet({ open, listId, actor, mode, onClose, onSubmitted }: SubmitListSheetProps) {
  const state = useAppStore()
  const [error, setError] = useState<string | null>(null)

  const rows: BlockerRow[] = useMemo(() => {
    if (!open || mode !== 'blockers') return []
    return Object.values(state.schedule.cards)
      .filter((c) => c.listId === listId && c.cancellation === undefined && !c.completed)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((card) => {
        const blockers = completionBlockersFor(state, card)
        const messages = blockers.flatMap((b) =>
          b.code === 'validationFailed'
            ? (b.details as BillingValidationFailure[]).map((f) => f.message)
            : [b.message],
        )
        return {
          cardId: card.id,
          patientName: state.masters.patients[card.patientId]?.name ?? 'Unknown patient',
          time: card.scheduledTime ?? '·',
          messages,
        }
      })
  }, [open, mode, state, listId])

  function confirmSubmit() {
    setError(null)
    const outcome = submitList(useAppStore, actor, listId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onSubmitted()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {mode === 'blockers' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Cards still to finish</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>
            Every card must be marked complete before the list can be submitted to the office.
            Cancelled cards do not count.
          </div>
          {rows.map((row) => (
            <div
              key={row.cardId}
              style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl + 2, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: neutral.mist, flex: 'none' }}>
                  {row.time}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{row.patientName}</span>
              </div>
              {row.messages.length > 0 ? (
                row.messages.map((message, i) => (
                  <div key={i} style={{ fontSize: 12, lineHeight: '17px', color: semantic.error.onTint }}>
                    {message}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>
                  Ready to complete. Open the card and tap Mark complete.
                </div>
              )}
            </div>
          ))}
          <MobileButton variant="secondary" block onClick={onClose}>
            Close
          </MobileButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Submit this list to the office?</div>
          <div style={{ fontSize: 14, lineHeight: '21px', color: neutral.slate }}>
            Submitting sends every card on this list to the office for review and billing. You will
            not be able to change these cards afterwards; the office makes any corrections from
            here.
          </div>
          {error !== null && (
            <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
          <MobileButton variant="primary" block onClick={confirmSubmit}>
            Submit to office
          </MobileButton>
          <MobileButton variant="secondary" block onClick={onClose}>
            Not yet
          </MobileButton>
        </div>
      )}
    </BottomSheet>
  )
}
