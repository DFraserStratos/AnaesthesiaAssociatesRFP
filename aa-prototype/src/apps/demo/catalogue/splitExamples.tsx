/**
 * The Split's parts in the component catalogue (catch-up Phase 22; US-08.2.3):
 * the real `PartyPicker` over fixed options on local state, and the real
 * `PaidByRow` (the Billing card's Paid by, owner review 2026-11-17) over fixed
 * stack views (unsplit, split, and a split that no longer fits), read-only so
 * no Split sheet opens on a made-up Procedure.
 * The `SplitFeeSheet` composes the picker, a $ or % field per party and "Takes
 * the rest". Nothing here writes to the demo data.
 */

import { useState } from 'react'
import type { CounterpartyRef } from '../../../domain/types'
import type { PartyOption } from '../../../domain/billing/partyOptions'
import type { ProcedureStackView } from '../../../domain/billing/procedureStack'
import { PartyPicker } from '../../../shared/booking/PartyPicker'
import { PaidByRow } from '../../../shared/booking/PaidByRow'
import { OFFICE_ACTOR } from '../../../store'

const OPTIONS: PartyOption[] = [
  { ref: { kind: 'patient', id: 'PT-EX' }, name: 'Alan Prentice', hint: 'Payer on the Booking', group: 'booking' },
  { ref: { kind: 'insurer', id: 'I-EX' }, name: 'nib', hint: 'Insurer', group: 'parties' },
  { ref: { kind: 'hospital', id: 'H-EX' }, name: "St George's", hint: 'Hospital', group: 'parties' },
  { ref: { kind: 'party', id: 'PY-EX' }, name: 'Unisports Ortho', hint: 'Surgeon group', group: 'parties' },
]

export function PartyPickerExample() {
  const [value, setValue] = useState<CounterpartyRef | null>(OPTIONS[1]!.ref)
  return (
    <div style={{ maxWidth: 360 }}>
      <PartyPicker options={OPTIONS} value={value} onChange={setValue} label="Party" />
    </div>
  )
}

const CONTRACT: NonNullable<ProcedureStackView['contract']> = {
  id: 'CT-EX',
  name: 'No contract · RVG',
  holderName: 'Anaesthesia Associates',
  invoiced: { name: 'Alan Prentice', kind: 'patient' },
  basis: { kind: 'rvgAnaesthetistRate' },
}
const SPLIT = { ...CONTRACT, split: { text: 'Split: nib $132.50, Alan Prentice $79.50 (the rest)', fits: true, parties: 2 } }
const MISFIT = { ...CONTRACT, split: { text: 'The split no longer fits the fee of $180.00: the typed shares come to $200.00, which leaves nothing for the rest of the fee of $180.00. Open Split to fix it.', fits: false, parties: 2 } }

/** Paid by in the Billing card: the web and Admin line, then the phone's summary row. */
export function PaidByRowExample({ variant }: { variant: 'line' | 'summary' }) {
  const ids = { bookingId: 'BK-EX', procedureId: 'P-EX', actor: OFFICE_ACTOR, canEdit: false, variant }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <PaidByRow contract={CONTRACT} {...ids} />
      <PaidByRow contract={SPLIT} {...ids} />
      <PaidByRow contract={MISFIT} {...ids} />
    </div>
  )
}
