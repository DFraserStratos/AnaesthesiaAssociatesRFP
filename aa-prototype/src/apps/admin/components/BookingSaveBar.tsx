/**
 * The Admin Booking detail's save bar and saved strip (catch-up Phase 35;
 * US-02.3.2 "Explicit save", RV-28).
 *
 * - Unsaved (warning tint, sticky, e-2): "3 unsaved changes", the changed
 *   fields, Discard and Save changes. A refused save shows its reason here.
 * - Saved (success tint): "Saved · 3 changes · 09:14 · Kirsty W." and the
 *   change-set id, read from the audit (`lastChangeSetFor`), so it is still
 *   there after leaving and coming back, until the next save or Dismiss.
 *   No email prompt: the update email is on demand (OQ-69).
 *
 * The bar, the leave dialog and the strip count changes one way
 * (`changedFieldLabels` / `changeCount` in `shared/booking/changeLabels.ts`).
 */

import { useState } from 'react'
import { Button, Notice, TextAction } from '../../../shared/ui'
import { elevation, neutral } from '../../../theme/tokens'
import { changeCount, changedFieldLabels } from '../../../shared/booking/changeLabels'
import type { FieldChange } from '../../../domain/changeSets'
import type { Procedure } from '../../../domain/types'
import type { ChangeSetSummary } from '../../../store'

export { changedFieldLabels } from '../../../shared/booking/changeLabels'

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

export function BookingSaveBar({
  changes,
  procedures,
  onSave,
  onDiscard,
}: {
  changes: readonly FieldChange[]
  procedures: readonly Procedure[]
  onSave: () => string | null
  onDiscard: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const labels = changedFieldLabels(changes, procedures)
  return (
    <div data-shot="booking-save-bar" style={{ position: 'sticky', top: 8, zIndex: 6 /* above the web layout's sticky commit rail (5), so Save changes is never covered */, borderRadius: 14, boxShadow: elevation.e2 }}>
      <Notice
        tone="warning"
        live="status"
        title={
          <>
            <span className="mono" data-testid="unsaved-count">
              {labels.length}
            </span>{' '}
            unsaved {labels.length === 1 ? 'change' : 'changes'}
          </>
        }
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              size="compact"
              shot="booking-discard"
              onClick={() => {
                setError(null)
                onDiscard()
              }}
            >
              Discard
            </Button>
            <Button variant="primary" size="compact" shot="booking-save" onClick={() => setError(onSave())}>
              Save changes
            </Button>
          </div>
        }
      >
        <span>{labels.join(' · ')}</span>
        {error !== null && (
          <span role="alert" data-shot="booking-save-refused" style={{ fontWeight: 600 }}>
            {error}
          </span>
        )}
      </Notice>
    </div>
  )
}

export function BookingSavedStrip({ summary, procedures, onDismiss }: { summary: ChangeSetSummary; procedures: readonly Procedure[]; onDismiss: () => void }) {
  // Counted by label, as the save bar counted them before Save.
  const count = summary.fields.length > 0 ? changeCount(summary.fields, procedures) : summary.count
  return (
    <Notice
      tone="success"
      shot="booking-saved-strip"
      action={
        <TextAction size="sm" flush onClick={onDismiss}>
          Dismiss
        </TextAction>
      }
    >
      <span>
        Saved · <span data-testid="saved-count">{plural(count, 'change')}</span> · <span className="mono">{summary.atISO.slice(11, 16)}</span> · {summary.who}{' '}
        <span className="mono" style={{ color: neutral.slate, marginLeft: 6 }}>
          {summary.changeSetId}
        </span>
      </span>
    </Notice>
  )
}
