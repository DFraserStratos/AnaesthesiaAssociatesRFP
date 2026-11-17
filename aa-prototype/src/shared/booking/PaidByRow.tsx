/**
 * "Paid by" in the Billing card (catch-up Phase 22, owner review 2026-11-17,
 * idea 6; the payer moved in by catch-up Phase 22a; US-11.2.2, US-08.2.3):
 * who the Procedure's fee is invoiced to.
 *
 * - The Contract bills the payer: the payer's name and relationship
 *   ("Patient", "Mother"), with "Email or postal address needed" and
 *   "Under 18" where they apply.
 * - The Contract bills its holder: the holder, as before; no payer.
 * - Split: the split's parties and amounts.
 * - No Contract yet: "Payer: not billed yet", with no Change.
 *
 * On the phone it is the Billing summary's last row, its own tap target; on
 * web and Admin it is one line at the foot of the Billing card with Change or
 * Split. Both open the one Paid by sheet. The words come from 20a's stack
 * view (`contract.invoiced`, `contract.split`) and the payer's details from
 * `whoIsBilled.ts`, passed in; this row decides nothing.
 */

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { neutral, semantic } from '../../theme/tokens'
import { PAYER_CONTACT_NEEDED, PAYER_NOT_BILLED_YET } from '../../domain/billing/whoIsBilled'
import type { ProcedureStackView } from '../../domain/billing/procedureStack'
import type { Actor } from '../../store'
import { Pill } from '../ui'
import { TextAction } from '../ui/TextAction'
import { PaidBySheet } from '../flows/PaidBySheet'

export interface PaidByRowProps {
  /** The stack view's Contract part; null while the Procedure has no Contract. */
  contract: NonNullable<ProcedureStackView['contract']> | null
  procedureId: string
  actor: Actor
  /** Inside the edit window, on a Booking that is not cancelled. */
  canEdit: boolean
  /** `summary`: the phone's Billing summary row; `line`: the web and Admin card's foot. */
  variant: 'summary' | 'line'
  /** The payer, where the Contract bills the payer (name, and "Patient" or the relationship). */
  payer?: { name: string; relationship?: string }
  /** A person billed here has neither an email nor a postal address (US-11.2.3). */
  contactMissing?: boolean
  /** The patient, a child, is billed here (US-11.2.4). */
  child?: boolean
}

/** "Split: nib $132.50, Alan Prentice $79.50 (the rest)" reads without its lead-in in the row. */
function splitParties(text: string): string {
  return text.replace(/^Split: /, '')
}

const GRID = { display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'baseline' } as const

export function PaidByRow({ contract, procedureId, actor, canEdit, variant, payer, contactMissing = false, child = false }: PaidByRowProps) {
  const [open, setOpen] = useState(false)
  const label = <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>Paid by</span>

  // No Contract yet: who is invoiced is not known, so there is nothing to change (US-11.2.2 "Not billed yet").
  if (contract === null) {
    return (
      <div
        data-shot="procedure-split-row"
        data-split="none"
        style={{ ...GRID, paddingTop: 12, borderTop: `1px solid ${neutral.line}` }}
      >
        {label}
        <span data-shot="payer-not-billed" data-procedure-id={procedureId} style={{ fontSize: variant === 'summary' ? 15 : 14, lineHeight: '20px', color: neutral.mist }}>
          {PAYER_NOT_BILLED_YET}
        </span>
      </div>
    )
  }

  const split = contract.split
  const misfit = split !== undefined && !split.fits
  const showsPayer = split === undefined && payer !== undefined
  const value = split !== undefined ? (split.fits ? splitParties(split.text) : split.text) : (payer?.name ?? contract.invoiced?.name ?? 'Not known yet')
  const holderOnly = split === undefined && payer === undefined
  const valueColour = misfit ? semantic.warning.onTint : neutral.ink
  const size = variant === 'summary' ? 15 : 14
  const sub =
    split !== undefined && split.fits
      ? `Split ${split.parties} ways`
      : showsPayer
        ? payer.relationship
        : holderOnly && canEdit && variant === 'summary'
          ? 'Tap to split the fee'
          : undefined
  const pills = (contactMissing || child) && (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {contactMissing && (
        <Pill tone="warning" shot="payer-contact-missing" data-procedure-id={procedureId}>
          {PAYER_CONTACT_NEEDED}
        </Pill>
      )}
      {child && (
        <Pill tone="warning" shot="payer-under-18" data-procedure-id={procedureId}>
          Under 18
        </Pill>
      )}
    </span>
  )
  const valueBlock = (
    <span data-shot="procedure-split-summary" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span
        {...(showsPayer ? { 'data-shot': 'paid-by-payer', 'data-procedure-id': procedureId } : {})}
        style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8, fontSize: size, lineHeight: '20px', fontWeight: 600, color: valueColour }}
      >
        <span data-aa-selectable>{value}</span>
        {variant === 'line' && showsPayer && sub !== undefined && <span style={{ fontSize: 13, fontWeight: 400, color: neutral.slate }}>{sub}</span>}
      </span>
      {variant === 'summary' && sub !== undefined && <span style={{ fontSize: 13, color: neutral.slate }}>{sub}</span>}
      {pills}
    </span>
  )
  const sheet = <PaidBySheet open={open} procedureId={procedureId} actor={actor} onClose={() => setOpen(false)} startSplit={holderOnly} />
  const splitState = split !== undefined ? (split.fits ? 'fits' : 'doesNotFit') : 'none'

  if (variant === 'summary') {
    return (
      <>
        <button
          type="button"
          data-shot="procedure-split-button"
          data-split={splitState}
          aria-label={[
            `Paid by: ${value}`,
            showsPayer && payer.relationship !== undefined ? payer.relationship : undefined,
            contactMissing ? PAYER_CONTACT_NEEDED : undefined,
            child ? 'Under 18' : undefined,
            canEdit ? (holderOnly ? 'Split the fee' : 'Change who pays') : undefined,
          ]
            .filter((part): part is string => part !== undefined)
            .join('. ')}
          disabled={!canEdit}
          onClick={() => setOpen(true)}
          className="aa-rail-focus"
          style={{ ...GRID, width: '100%', padding: '12px 0 0', border: 'none', borderTop: `1px solid ${neutral.line}`, background: 'none', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', cursor: canEdit ? 'pointer' : 'default' }}
        >
          {label}
          {valueBlock}
          {canEdit && <ChevronRight size={18} color={neutral.mist} aria-hidden style={{ alignSelf: 'center' }} />}
        </button>
        {sheet}
      </>
    )
  }

  return (
    <div data-shot="procedure-split-row" data-split={splitState} style={{ ...GRID, paddingTop: 12, borderTop: `1px solid ${neutral.line}` }}>
      {label}
      {valueBlock}
      {canEdit && (
        <TextAction shot="procedure-split-button" onClick={() => setOpen(true)} label={holderOnly ? 'Split the fee' : 'Change who pays'}>
          {holderOnly ? 'Split' : 'Change'}
        </TextAction>
      )}
      {sheet}
    </div>
  )
}
