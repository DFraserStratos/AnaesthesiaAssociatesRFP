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
 */

import { useState } from 'react'
import { Button, Notice, TextAction } from '../../../shared/ui'
import { elevation, neutral } from '../../../theme/tokens'
import { fieldLabel } from '../../../shared/audit/fieldLabels'
import { inDisplayOrder } from '../../../domain/billing/multiProcedure'
import type { FieldChange } from '../../../domain/changeSets'
import type { Procedure } from '../../../domain/types'
import type { ChangeSetSummary } from '../../../store'

/** The office's words for a changed field (the bar's list). */
const BAR_FIELD_LABELS: Record<string, string> = {
  scheduledTime: 'Time',
  notes: 'Notes',
  governingContractId: 'Contract',
  invoiceDescription: 'invoice description',
  rvgGroupId: 'RVG code',
  enteredPrice: 'price',
  payer: 'payer',
  split: 'split',
  isPrimary: 'primary',
  railAnswers: 'Contract steps',
  modifierClaims: 'modifiers',
  removedModifierIds: 'modifiers',
  modifiersConfirmed: 'modifiers',
  funderPartyId: 'Insurance',
  insuranceApprovalNumber: 'Insurance',
  nhi: 'NHI',
  name: 'Patient name',
  dobISO: 'Date of birth',
}

function label(field: string): string {
  return BAR_FIELD_LABELS[field] ?? fieldLabel(field)
}

/** "Time · Notes · Procedure 2 Contract": each changed field once, Procedures by their display number. */
export function changedFieldLabels(changes: readonly FieldChange[], procedures: readonly Procedure[]): string[] {
  const order = new Map(inDisplayOrder(procedures).map((p, i) => [p.id, i + 1]))
  const out: string[] = []
  for (const c of changes) {
    let text: string
    if (c.entityType === 'procedure') {
      const n = order.get(c.entityId)
      const name = n !== undefined ? `Procedure ${n}` : 'Procedure'
      text = c.kind === 'create' ? `${name} added` : c.kind === 'remove' ? 'Procedure removed' : `${name} ${label(c.field)}`
    } else if (c.entityType === 'billingLine') {
      text = 'Billing line'
    } else {
      text = label(c.field)
    }
    if (!out.includes(text)) out.push(text)
  }
  return out
}

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
    <div data-shot="booking-save-bar" style={{ position: 'sticky', top: 8, zIndex: 5, borderRadius: 14, boxShadow: elevation.e2 }}>
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
              shot="booking-discard"
              onClick={() => {
                setError(null)
                onDiscard()
              }}
            >
              Discard
            </Button>
            <Button variant="primary" shot="booking-save" onClick={() => setError(onSave())}>
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

export function BookingSavedStrip({ summary, onDismiss }: { summary: ChangeSetSummary; onDismiss: () => void }) {
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
        Saved · {plural(summary.count, 'change')} · <span className="mono">{summary.atISO.slice(11, 16)}</span> · {summary.who}{' '}
        <span className="mono" style={{ color: neutral.slate, marginLeft: 6 }}>
          {summary.changeSetId}
        </span>
      </span>
    </Notice>
  )
}
