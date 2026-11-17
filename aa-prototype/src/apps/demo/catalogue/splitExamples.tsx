/**
 * Paid by's parts in the component catalogue (catch-up Phases 22 and 22a;
 * US-08.2.3, US-11.2.2): the real `PartyPicker` over fixed options on local
 * state (with "Another person"), the real `PaidByRow` over fixed stack views
 * (a payer with both pills, a holder, a split, a split that no longer fits,
 * and no Contract yet), read-only so no sheet opens on a made-up Procedure,
 * and the real `PaidBySheet` on Grace Park's first seeded Procedure (who
 * pays, the offer, the split section). Only the sheet's Save writes to the
 * demo data.
 */

import { useState } from 'react'
import type { CounterpartyRef } from '../../../domain/types'
import { PaidBySheet } from '../../../shared/flows/PaidBySheet'
import { Button } from '../../../shared/ui'
import { SEED_MARKERS } from '../../../domain/seed'
import { proceduresForBooking, useAppStore } from '../../../store'
import type { PartyOption } from '../../../domain/billing/partyOptions'
import type { ProcedureStackView } from '../../../domain/billing/procedureStack'
import { PartyPicker } from '../../../shared/booking/PartyPicker'
import { PaidByRow } from '../../../shared/booking/PaidByRow'
import { OFFICE_ACTOR } from '../../../store'

const OPTIONS: PartyOption[] = [
  { ref: { kind: 'patient', id: 'PT-EX' }, name: 'Alan Prentice', hint: 'Payer', group: 'booking' },
  { ref: { kind: 'insurer', id: 'I-EX' }, name: 'nib', hint: 'Insurer', group: 'parties' },
  { ref: { kind: 'hospital', id: 'H-EX' }, name: "St George's", hint: 'Hospital', group: 'parties' },
  { ref: { kind: 'party', id: 'PY-EX' }, name: 'Unisports Ortho', hint: 'Surgeon group', group: 'parties' },
]

export function PartyPickerExample() {
  const [value, setValue] = useState<CounterpartyRef | null>(OPTIONS[1]!.ref)
  return (
    <div style={{ maxWidth: 360 }}>
      <PartyPicker options={OPTIONS} value={value} onChange={setValue} label="Party" onAnotherPerson={() => setValue(null)} />
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

const HOLDER: NonNullable<ProcedureStackView['contract']> = { ...CONTRACT, name: 'nib · RVG', holderName: 'nib', invoiced: { name: 'nib', kind: 'holder' } }

/** Paid by in the Billing card: the web and Admin line, or the phone's summary row. */
export function PaidByRowExample({ variant }: { variant: 'line' | 'summary' }) {
  const ids = { procedureId: 'P-EX', actor: OFFICE_ACTOR, canEdit: false, variant }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <PaidByRow contract={CONTRACT} payer={{ name: 'Hana Park', relationship: 'Mother' }} contactMissing child {...ids} />
      <PaidByRow contract={HOLDER} {...ids} />
      <PaidByRow contract={SPLIT} {...ids} />
      <PaidByRow contract={MISFIT} {...ids} />
      <PaidByRow contract={null} {...ids} />
    </div>
  )
}

/** The one Paid by sheet, on Grace Park's first seeded Procedure (the offer lists her second). */
export function PaidBySheetExample() {
  const [open, setOpen] = useState(false)
  const procedureId = useAppStore((s) => proceduresForBooking(s, SEED_MARKERS.guardianMinorBooking!.entityId)[0]?.id)
  if (procedureId === undefined) return null
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open the Paid by sheet
      </Button>
      <PaidBySheet open={open} procedureId={procedureId} actor={OFFICE_ACTOR} onClose={() => setOpen(false)} />
    </div>
  )
}
