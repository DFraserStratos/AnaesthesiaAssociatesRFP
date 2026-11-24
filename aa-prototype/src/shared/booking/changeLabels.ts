/**
 * The one way the office's changes are counted and named (catch-up Phase 35;
 * US-02.3.2): the save bar, the leave dialog and the saved strip all read
 * these, so "3 unsaved changes" before Save is "3 changes" after it.
 *
 * A change is one distinct label: "Time", "Notes", "Procedure 2 Contract",
 * "Procedure 3 added". Two fields under one label (the three modifier fields,
 * say) count once. The draft hands in `FieldChange`s; the saved strip hands in
 * the `booking.save` header's `fields`, whose added or removed Procedures read
 * `field: '*'` (added when the Procedure is still there, removed otherwise).
 */

import { fieldLabel } from '../audit/fieldLabels'
import { inDisplayOrder } from '../../domain/billing/multiProcedure'
import type { FieldChange } from '../../domain/changeSets'
import type { Procedure } from '../../domain/types'

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

/** A changed field as the draft (`FieldChange`) or a save's header (`fields`) gives it. */
export type ChangeRef = Pick<FieldChange, 'entityType' | 'entityId' | 'field'> & { kind?: FieldChange['kind'] }

/** "Time · Notes · Procedure 2 Contract": each changed field once, Procedures by their display number. */
export function changedFieldLabels(changes: readonly ChangeRef[], procedures: readonly Procedure[]): string[] {
  const order = new Map(inDisplayOrder(procedures).map((p, i) => [p.id, i + 1]))
  const out: string[] = []
  for (const c of changes) {
    let text: string
    if (c.entityType === 'procedure') {
      const n = order.get(c.entityId)
      const name = n !== undefined ? `Procedure ${n}` : 'Procedure'
      const kind = c.kind ?? (c.field === '*' ? (n !== undefined ? 'create' : 'remove') : 'update')
      text = kind === 'create' ? `${name} added` : kind === 'remove' ? 'Procedure removed' : `${name} ${label(c.field)}`
    } else {
      text = label(c.field)
    }
    if (!out.includes(text)) out.push(text)
  }
  return out
}

/** How many changes: the distinct labels. */
export function changeCount(changes: readonly ChangeRef[], procedures: readonly Procedure[]): number {
  return changedFieldLabels(changes, procedures).length
}
