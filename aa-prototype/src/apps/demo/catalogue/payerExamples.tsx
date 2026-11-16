/**
 * The payer's parts in the component catalogue (catch-up Phase 21): the real
 * `PayerDetailsView` over fixed details (the patient paying, a guardian, a
 * family trust by post, and a child with no contact), and the payer form's
 * parts (`DifferentPayerTick`, `OtherPayerFields` with `PostalAddressFields`)
 * on local state. The `PayerSheet` composes them in a bottom sheet on the
 * phone and a dialog on web and Admin. Nothing here writes to the demo data.
 */

import { useState } from 'react'
import { PayerDetailsView } from '../../../shared/booking/PayerDetailsView'
import { FunderDetailsView } from '../../../shared/booking/FunderDetailsView'
import { DifferentPayerTick, EMPTY_OTHER_PAYER, OtherPayerFields, type OtherPayerDraft } from '../../../shared/flows/PayerFields'
import type { PayerDetails } from '../../../domain/billing'

const PATIENT: PayerDetails = {
  isPatient: true,
  name: 'Sarah Mitchell',
  relationship: 'Patient',
  email: 'sarah.mitchell5@example.net',
  postalAddress: { line1: '67 Clyde Road', suburb: 'Sumner', city: 'Christchurch', postcode: '8081' },
}
const GUARDIAN: PayerDetails = {
  isPatient: false,
  name: 'Hana Park',
  relationship: 'Mother',
  email: 'hana.park@example.net',
  postalAddress: { line1: '18 Clifford Avenue', suburb: 'Fendalton', city: 'Christchurch', postcode: '8052' },
}
const TRUST: PayerDetails = {
  isPatient: false,
  name: 'Whitcombe Family Trust',
  relationship: 'Family trust',
  postalAddress: { line1: 'PO Box 13245', city: 'Christchurch', postcode: '8141' },
}
const CHILD: PayerDetails = { isPatient: true, name: 'Ella Moana', relationship: 'Patient' }

export function PayerDetailsExample() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      <PayerDetailsView details={PATIENT} holdersOnly={false} contactMissing={false} child={false} />
      <PayerDetailsView details={GUARDIAN} holdersOnly={false} contactMissing={false} child={false} />
      <PayerDetailsView details={TRUST} holdersOnly={false} contactMissing={false} child={false} />
      <PayerDetailsView details={CHILD} holdersOnly={false} contactMissing child />
    </div>
  )
}

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
