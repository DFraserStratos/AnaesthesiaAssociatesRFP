/**
 * The payer's parts in the component catalogue (catch-up Phase 21; per
 * Procedure since 22a): the payer form's parts (`DifferentPayerTick`,
 * `OtherPayerFields` with `PostalAddressFields`) on local state, and the
 * Booking's insurer or funder. The `PaidBySheet` composes the form parts in
 * a bottom sheet on the phone and a dialog on web and Admin. Nothing here
 * writes to the demo data.
 */

import { useState } from 'react'
import { FunderDetailsView } from '../../../shared/booking/FunderDetailsView'
import { DifferentPayerTick, EMPTY_OTHER_PAYER, OtherPayerFields, type OtherPayerDraft } from '../../../shared/flows/PayerFields'

export function PayerFieldsExample() {
  const [different, setDifferent] = useState(true)
  const [draft, setDraft] = useState<OtherPayerDraft>({ ...EMPTY_OTHER_PAYER, name: 'Whitcombe Family Trust', relationship: 'Family trust' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <DifferentPayerTick checked={different} onChange={setDifferent} />
      {different && <OtherPayerFields draft={draft} onChange={setDraft} />}
    </div>
  )
}

export function FunderDetailsExample() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      <FunderDetailsView funder={undefined} approvalNumber={undefined} approvalMissing={false} />
      <FunderDetailsView funder={{ name: 'nib', kind: 'insurer' }} approvalNumber="NIB-AP-0074" approvalMissing={false} />
      <FunderDetailsView funder={{ name: 'nib', kind: 'insurer' }} approvalNumber={undefined} approvalMissing />
      <FunderDetailsView funder={{ name: 'Health NZ', kind: 'funder' }} approvalNumber={undefined} approvalMissing={false} />
    </div>
  )
}
