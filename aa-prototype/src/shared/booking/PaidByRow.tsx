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
 * On the phone it is the Billing summary's last row; on web and Admin one line
 * at the foot of the Billing card. Change, beside the payer's name where the
 * Contract bills the payer, opens the one Paid by sheet at who pays; Split, on
 * the right, opens it with the split started (owner, 2026-11-17). The words come from 20a's stack
 * view (`contract.invoiced`, `contract.split`) and the payer's details from
 * `whoIsBilled.ts`, passed in; this row decides nothing.
 */

import { useState } from 'react'
import { neutral, semantic } from '../../theme/tokens'
import { PAYER_CONTACT_NEEDED, PAYER_NOT_BILLED_YET } from '../../domain/billing/whoIsBilled'
import type { ProcedureStackView } from '../../domain/billing/procedureStack'
import type { Actor } from '../../store'
import { DefList, DefRow, Pill } from '../ui'
import { TextAction } from '../ui/TextAction'
import { PaidBySheet } from '../flows/PaidBySheet'
import { AdditionalInvoiceButton } from './AdditionalInvoiceButton'

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

/** The row on the shared `DefRow` (UI unification U6): the 80px label column, 12px apart, under a rule. */
const ROW = { gap: 12, paddingTop: 12, borderTop: `1px solid ${neutral.line}` } as const

export function PaidByRow({ contract, procedureId, actor, canEdit, variant, payer, contactMissing = false, child = false }: PaidByRowProps) {
  // Which part of the Paid by sheet opened it: who pays (Change) or the split (Split); null while closed.
  const [open, setOpen] = useState<'payer' | 'split' | null>(null)
  // The prepayment re-check after a save (catch-up Phase 27, US-06.3.5).
  const [recheck, setRecheck] = useState<string | null>(null)
  const label = <span style={{ fontSize: 13, fontWeight: 600 }}>Paid by</span>

  // No Contract yet: who is invoiced is not known, so there is nothing to change (US-11.2.2 "Not billed yet").
  if (contract === null) {
    return (
      <DefList>
        <DefRow label={label} labelTone="slate" shot="procedure-split-row" data-split="none" style={ROW}>
          <span data-shot="payer-not-billed" data-procedure-id={procedureId} style={{ fontSize: variant === 'summary' ? 15 : 14, lineHeight: '20px', color: neutral.mist }}>
            {PAYER_NOT_BILLED_YET}
          </span>
        </DefRow>
      </DefList>
    )
  }

  const split = contract.split
  const misfit = split !== undefined && !split.fits
  const showsPayer = split === undefined && payer !== undefined
  const value = split !== undefined ? (split.fits ? splitParties(split.text) : split.text) : (payer?.name ?? contract.invoiced?.name ?? 'Not known yet')
  const valueColour = misfit ? semantic.warning.onTint : neutral.ink
  const size = variant === 'summary' ? 15 : 14
  // Change (who pays) sits beside the payer's name where the Contract bills the payer; Split stays on the right.
  const canChange = canEdit && payer !== undefined
  const sub = split !== undefined && split.fits ? `Split ${split.parties} ways` : showsPayer ? payer.relationship : undefined
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
  const change = canChange && (
    <TextAction shot="paid-by-change" onClick={() => setOpen('payer')} label="Change who pays">
      Change
    </TextAction>
  )
  const valueBlock = (
    <span data-shot="procedure-split-summary" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10 }}>
        <span
          {...(showsPayer ? { 'data-shot': 'paid-by-payer', 'data-procedure-id': procedureId } : {})}
          style={{ display: 'inline-flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8, fontSize: size, lineHeight: '20px', fontWeight: 600, color: valueColour }}
        >
          <span data-aa-selectable>{value}</span>
          {variant === 'line' && showsPayer && sub !== undefined && <span style={{ fontSize: 13, fontWeight: 400, color: neutral.slate }}>{sub}</span>}
        </span>
        {/* Beside the payer's name; on the phone a split's Change follows its "Split n ways" line instead. */}
        {!(variant === 'summary' && split !== undefined) && change}
      </span>
      {variant === 'summary' && sub !== undefined && (
        <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10 }}>
          <span style={{ fontSize: 13, color: neutral.slate }}>{sub}</span>
          {split !== undefined && change}
        </span>
      )}
      {variant === 'summary' && sub === undefined && split !== undefined && change}
      {pills}
      {recheck !== null && (
        <span data-shot="prepayment-recheck" role="status" style={{ fontSize: 12.5, fontWeight: 400, color: neutral.slate }}>
          {recheck}
        </span>
      )}
    </span>
  )
  const sheet = <PaidBySheet open={open !== null} procedureId={procedureId} actor={actor} onClose={() => setOpen(null)} focus={open ?? 'payer'} onSaved={setRecheck} />
  const splitState = split !== undefined ? (split.fits ? 'fits' : 'doesNotFit') : 'none'

  return (
    <DefList>
      <DefRow
        label={label}
        labelTone="slate"
        shot="procedure-split-row"
        data-split={splitState}
        style={ROW}
        trailing={
          <>
            {canEdit && (
              <TextAction shot="procedure-split-button" onClick={() => setOpen('split')} label={split === undefined ? 'Split the fee' : 'Change the split'}>
                Split
              </TextAction>
            )}
            {/* On an invoiced Procedure (catch-up Phase 38b): Create (Admin) or Raise (anaesthetist, own Procedure) additional invoice. */}
            <AdditionalInvoiceButton procedureId={procedureId} actor={actor} />
            {sheet}
          </>
        }
      >
        {valueBlock}
      </DefRow>
    </DefList>
  )
}
