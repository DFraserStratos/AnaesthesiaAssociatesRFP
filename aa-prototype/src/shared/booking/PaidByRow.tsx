/**
 * "Paid by" in the Billing card (catch-up Phase 22, owner review 2026-11-17,
 * idea 6; US-08.2.3): who the Procedure's fee is invoiced to, or its split.
 * On the phone it is the Billing summary's fourth row, its own tap target
 * that opens the Split sheet; on web and Admin it is one line at the foot of
 * the Billing card with Split or Change. The words come from 20a's stack view
 * (`contract.invoiced`, `contract.split`), so the stack module stays the one
 * place that decides them. No provisional pill (the owner's decision).
 */

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { neutral, semantic } from '../../theme/tokens'
import { TextAction } from '../ui/TextAction'
import type { ProcedureStackView } from '../../domain/billing/procedureStack'
import type { Actor } from '../../store'
import { SplitFeeSheet } from '../flows/SplitFeeSheet'

export interface PaidByRowProps {
  contract: NonNullable<ProcedureStackView['contract']>
  bookingId: string
  procedureId: string
  actor: Actor
  /** Inside the edit window, on a Booking that is not cancelled. */
  canEdit: boolean
  /** `summary`: the phone's Billing summary row; `line`: the web and Admin card's foot. */
  variant: 'summary' | 'line'
}

/** "Split: nib $132.50, Alan Prentice $79.50 (the rest)" reads without its lead-in in the row. */
function splitParties(text: string): string {
  return text.replace(/^Split: /, '')
}

export function PaidByRow({ contract, bookingId, procedureId, actor, canEdit, variant }: PaidByRowProps) {
  const [open, setOpen] = useState(false)
  const split = contract.split
  const misfit = split !== undefined && !split.fits
  const value = split === undefined ? (contract.invoiced?.name ?? 'Not known yet') : split.fits ? splitParties(split.text) : split.text
  const sub = split !== undefined && split.fits ? `Split ${split.parties} ways` : split === undefined && canEdit && variant === 'summary' ? 'Tap to split the fee' : undefined
  const valueColour = misfit ? semantic.warning.onTint : neutral.ink
  const sheet = <SplitFeeSheet open={open} bookingId={bookingId} procedureId={procedureId} actor={actor} onClose={() => setOpen(false)} />

  if (variant === 'summary') {
    return (
      <>
        <button
          type="button"
          data-shot="procedure-split-button"
          data-split={split !== undefined ? (split.fits ? 'fits' : 'doesNotFit') : 'none'}
          aria-label={`Paid by: ${value}.${canEdit ? ' Split the fee' : ''}`}
          disabled={!canEdit}
          onClick={() => setOpen(true)}
          className="aa-rail-focus"
          style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'baseline', width: '100%', padding: '12px 0 0', border: 'none', borderTop: `1px solid ${neutral.line}`, background: 'none', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', cursor: canEdit ? 'pointer' : 'default' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>Paid by</span>
          <span data-shot="procedure-split-summary" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: valueColour }}>{value}</span>
            {sub !== undefined && <span style={{ fontSize: 13, color: neutral.slate }}>{sub}</span>}
          </span>
          {canEdit && <ChevronRight size={18} color={neutral.mist} aria-hidden style={{ alignSelf: 'center' }} />}
        </button>
        {sheet}
      </>
    )
  }

  return (
    <div
      data-shot="procedure-split-row"
      data-split={split !== undefined ? (split.fits ? 'fits' : 'doesNotFit') : 'none'}
      style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'baseline', paddingTop: 12, borderTop: `1px solid ${neutral.line}` }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>Paid by</span>
      <span data-shot="procedure-split-summary" style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: valueColour, minWidth: 0 }}>
        {value}
      </span>
      {canEdit && (
        <TextAction shot="procedure-split-button" onClick={() => setOpen(true)} label={split === undefined ? 'Split the fee' : 'Change the split'}>
          {split === undefined ? 'Split' : 'Change'}
        </TextAction>
      )}
      {sheet}
    </div>
  )
}
