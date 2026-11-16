/**
 * The NZ Post address fields (catch-up Phase 21; US-11.2.3): the address line
 * (a street address, PO Box or Private Bag), an optional second line (unit,
 * building or RD), the suburb, then the town or city beside the postcode.
 * One component for the payer sheet, the patient sheet and the add form; the
 * rules are `postalAddressProblem` in `domain/billing/payer.ts`.
 */

import type { PostalAddress } from '../../domain/types'
import { TextField } from '../ui'

export type PostalAddressDraft = { line1: string; line2: string; suburb: string; city: string; postcode: string }

export const EMPTY_ADDRESS: PostalAddressDraft = { line1: '', line2: '', suburb: '', city: '', postcode: '' }

/** A stored address as the fields' draft (blank parts as empty strings). */
export function addressDraftOf(address: PostalAddress | undefined): PostalAddressDraft {
  if (address === undefined) return EMPTY_ADDRESS
  return { line1: address.line1, line2: address.line2 ?? '', suburb: address.suburb ?? '', city: address.city, postcode: address.postcode }
}

export function PostalAddressFields({
  value,
  onChange,
  shot,
}: {
  value: PostalAddressDraft
  onChange: (next: PostalAddressDraft) => void
  shot?: string
}) {
  const set = (key: keyof PostalAddressDraft) => (v: string) => onChange({ ...value, [key]: v })
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TextField label="Address" value={value.line1} onChange={set('line1')} placeholder="Street address, PO Box or Private Bag" />
      <TextField label="Unit, building or RD (optional)" value={value.line2} onChange={set('line2')} />
      <TextField label="Suburb (optional)" value={value.suburb} onChange={set('suburb')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 112px', gap: 10 }}>
        <TextField label="Town or city" value={value.city} onChange={set('city')} />
        <TextField label="Postcode" value={value.postcode} onChange={set('postcode')} mono />
      </div>
    </div>
  )
}
