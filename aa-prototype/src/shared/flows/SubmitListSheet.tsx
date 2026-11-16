import { useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { CompletionFailure } from '../../domain/billing/completion'
import { completionBlockersFor, submitList, useAppStore, type Actor } from '../../store'
import { Button, FormError } from '../ui'
import { useSurface } from '../surface'
import { ConfirmSheet } from '../surface/ConfirmSheet'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'

interface SubmitListSheetProps {
  open: boolean
  listId: string
  actor: Actor
  /**
   * 'blockers': the explanatory sheet behind the greyed submit bar — names
   * every not-yet-complete booking and its outstanding validation failures
   * verbatim (or the ready-but-not-completed nudge).
   * 'confirm': the pre-submit confirmation explaining what SUBMITTED means.
   */
  mode: 'blockers' | 'confirm'
  onClose: () => void
  onSubmitted: () => void
}

interface BlockerRow {
  bookingId: string
  patientName: string
  time: string
  /** Empty = validation passes; the booking just needs Mark complete. */
  messages: string[]
}

export function SubmitListSheet({ open, listId, actor, mode, onClose, onSubmitted }: SubmitListSheetProps) {
  const { Overlay } = useSurface()
  const state = useAppStore()
  const [error, setError] = useState<string | null>(null)

  const rows: BlockerRow[] = useMemo(() => {
    if (!open || mode !== 'blockers') return []
    return Object.values(state.schedule.bookings)
      .filter((c) => c.listId === listId && c.cancellation === undefined && !c.completed)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        const blockers = completionBlockersFor(state, booking)
        // The completion rule's own failures (catch-up Phase 21a), one line each; the blocker summary otherwise.
        const detailed = blockers.find((b) => b.code === 'validationFailed')
        // The destination summary repeats the rule's own "needs an invoice destination" line, so it is dropped beside the details; any other blocker keeps its line.
        const messages = detailed !== undefined
          ? [...(detailed.details as CompletionFailure[]).map((f) => f.message), ...blockers.filter((x) => x !== detailed && x.code !== 'needsInvoiceDestination').map((x) => x.message)]
          : blockers.map((x) => x.message)
        return {
          bookingId: booking.id,
          patientName: state.masters.patients[booking.patientId]?.name ?? 'Unknown patient',
          time: booking.scheduledTime ?? '·',
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

  if (mode === 'confirm') {
    return (
      <ConfirmSheet
        open={open}
        onClose={onClose}
        title="Submit this list to the office?"
        confirmLabel="Submit to office"
        onConfirm={confirmSubmit}
        cancelLabel="Not yet"
      >
          <div style={{ fontSize: 14, lineHeight: '21px', color: neutral.slate }}>
            Submitting tells the office this list is ready for review and billing. You can still
            change these bookings until the office authorises the list; the office sees any change
            at review.
          </div>
          {/* The doer rule (catch-up Phase 32a, US-01.4.6): one sentence, no extra step. */}
          <div data-shot="submit-doer-note" style={{ fontSize: 14, lineHeight: '21px', color: neutral.ink }}>
            Submitting says you did every procedure on this List. If a colleague is doing one, move it to them first.
          </div>
          <FormError message={error} />
      </ConfirmSheet>
    )
  }

  return (
    <Overlay open={open} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader
            title="Bookings still to finish"
            description="Every booking must be marked complete before the list can be submitted to the office. Cancelled bookings do not count."
          />
          {rows.map((row) => (
            <div
              key={row.bookingId}
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
                  Ready to complete. Open the booking and tap Mark complete.
                </div>
              )}
            </div>
          ))}
          <SheetActions
            primary={
              <Button variant="secondary" block onClick={onClose}>
                Close
              </Button>
            }
          />
        </div>
    </Overlay>
  )
}
