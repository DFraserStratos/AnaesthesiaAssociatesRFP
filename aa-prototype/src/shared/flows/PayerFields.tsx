/**
 * The payer's form parts (catch-up Phase 21; US-11.2.2): Greg's "different
 * payer" tick and the other payer's details (name, relationship, email, NZ
 * Post postal address, phone). One copy for the payer sheet and the add
 * forms (manual entry and phone advice), so the two never drift.
 */

import { accent, neutral, radius } from '../../theme/tokens'
import type { PayerInput } from '../../store'
import { FieldLabel, TextField } from '../ui'
import { EMPTY_ADDRESS, PostalAddressFields, type PostalAddressDraft } from './PostalAddressFields'

const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Benefactor', 'Family trust'] as const

export interface OtherPayerDraft {
  name: string
  relationship: string
  email: string
  phone: string
  address: PostalAddressDraft
}

export const EMPTY_OTHER_PAYER: OtherPayerDraft = { name: '', relationship: '', email: '', phone: '', address: EMPTY_ADDRESS }

/** The other payer as the store takes it; `id` keeps an existing payer's `BP####`. */
export function otherPayerInput(draft: OtherPayerDraft, id?: string): PayerInput {
  return {
    kind: 'other',
    ...(id !== undefined ? { id } : {}),
    name: draft.name,
    relationship: draft.relationship,
    email: draft.email,
    phone: draft.phone,
    postalAddress: draft.address,
  }
}

export function DifferentPayerTick({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label
      data-shot="payer-different-tick"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        borderRadius: radius.card,
        border: `1px solid ${checked ? accent.base : neutral.line}`,
        background: checked ? accent.tint : neutral.surface,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 20, height: 20, margin: '1px 0 0', accentColor: accent.base, flex: 'none', cursor: 'pointer' }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>Different payer</span>
        <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>
          Someone other than the patient pays: a parent, a guardian, a benefactor or a family trust.
        </span>
      </span>
    </label>
  )
}

export function OtherPayerFields({ draft, onChange }: { draft: OtherPayerDraft; onChange: (next: OtherPayerDraft) => void }) {
  const set = <K extends keyof OtherPayerDraft>(key: K) => (v: OtherPayerDraft[K]) => onChange({ ...draft, [key]: v })
  return (
    <div data-shot="payer-other-fields" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TextField label="Name" value={draft.name} onChange={set('name')} placeholder="A person, or a party such as a family trust" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FieldLabel>Relationship (optional)</FieldLabel>
        <div role="group" aria-label="Relationship" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RELATIONSHIPS.map((r) => {
            const on = draft.relationship === r
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => set('relationship')(on ? '' : r)}
                style={{
                  minHeight: 36,
                  padding: '0 12px',
                  borderRadius: radius.pill,
                  border: `1px solid ${on ? accent.base : neutral.line}`,
                  background: on ? accent.tint : neutral.surface,
                  color: on ? accent.pressed : neutral.ink,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {r}
              </button>
            )
          })}
        </div>
        {/* Anything the chips do not name, typed (a chip's own value stays out of the field). */}
        <TextField
          label="Other relationship"
          value={(RELATIONSHIPS as readonly string[]).includes(draft.relationship) ? '' : draft.relationship}
          onChange={set('relationship')}
          placeholder="For example Grandparent or Employer"
        />
      </div>
      <TextField label="Email" value={draft.email} onChange={set('email')} type="email" />
      <PostalAddressFields value={draft.address} onChange={set('address')} shot="payer-postal-address" />
      <TextField label="Phone (optional)" value={draft.phone} onChange={set('phone')} type="tel" />
    </div>
  )
}
