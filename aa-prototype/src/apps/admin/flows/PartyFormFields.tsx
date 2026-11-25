/**
 * A Party's fields (catch-up Phase 18; build plan Phase 48; US-04.1.5), in
 * one place: the New party panel and a Party page's Details card both render
 * them. Controlled: the caller holds the draft (`partyDraftFrom`) and sends
 * `partyFieldsOf(draft)` to `createParty` or `editParty`; the store's
 * `partyRefusal` is the rule source, so no rule is checked here. The kind (and
 * a hospital Party's hospital) is locked while the Party holds Contracts or
 * stands behind Bookings, with the store's sentence.
 */

import { useMemo } from 'react'
import type { DeliveryMethod, Party, PartyKind } from '../../../domain/types'
import { CREATABLE_PARTY_KINDS, PARTY_REFUSAL_MESSAGES, suggestCodePrefix } from '../../../domain/billing/parties'
import { retiredLabel } from '../../../domain/masterLifecycle'
import { activeHospitals, useAppStore, type PartyFields } from '../../../store'
import { Segmented, TextField } from '../../../shared'
import { SelectField } from '../../../shared/ui'
import { DELIVERY_LABEL, PARTY_KIND_LABEL } from '../../../shared/contracts'
import { neutral } from '../../../theme/tokens'
import { PanelGrid, PanelSection } from '../components/MasterPanel'

export type DeliveryChoice = DeliveryMethod | 'none'

/** The form's working copy of a Party. `prefixTouched` false: a new Party's prefix follows its name. */
export interface PartyDraft {
  kind: Exclude<PartyKind, 'aa'>
  name: string
  codePrefix: string
  prefixTouched: boolean
  hospitalId: string
  billingName: string
  email: string
  postalAddress: string
  delivery: DeliveryChoice
}

/** A draft from a Party (to edit it), or a blank one for a new Party (an insurer). */
export function partyDraftFrom(party?: Party): PartyDraft {
  return {
    kind: party === undefined || party.kind === 'aa' ? 'insurer' : party.kind,
    name: party?.name ?? '',
    codePrefix: party?.codePrefix ?? '',
    prefixTouched: party !== undefined,
    hospitalId: party?.hospitalId ?? '',
    billingName: party?.billingName ?? '',
    email: party?.email ?? '',
    postalAddress: party?.postalAddress ?? '',
    delivery: party?.deliveryMethod ?? 'none',
  }
}

/** The code prefix a draft shows and saves: typed, or suggested from the name for a new Party. */
export function shownCodePrefix(draft: PartyDraft, takenPrefixes: ReadonlySet<string>): string {
  if (draft.prefixTouched) return draft.codePrefix
  return draft.name.trim() === '' ? '' : suggestCodePrefix(draft.name, takenPrefixes)
}

/** The fields the store's `createParty` and `editParty` take. */
export function partyFieldsOf(draft: PartyDraft, codePrefix: string): PartyFields {
  return {
    kind: draft.kind,
    name: draft.name,
    codePrefix,
    billingName: draft.billingName,
    email: draft.email,
    postalAddress: draft.postalAddress,
    ...(draft.delivery !== 'none' ? { deliveryMethod: draft.delivery } : {}),
    ...(draft.kind === 'hospital' ? { hospitalId: draft.hospitalId } : {}),
  }
}

/** The other Parties' code prefixes (a new prefix must not repeat one). */
export function useTakenPrefixes(partyId?: string): ReadonlySet<string> {
  const parties = useAppStore((s) => s.masters.parties)
  return useMemo(() => new Set(Object.values(parties).filter((p) => p.id !== partyId).map((p) => p.codePrefix)), [parties, partyId])
}

export function PartyFormFields({
  draft,
  onChange,
  party,
  holdsContracts,
  billedByAContract,
  codePrefix,
}: {
  draft: PartyDraft
  onChange: (next: PartyDraft) => void
  /** The Party being edited; absent for a new one. */
  party?: Party
  holdsContracts: boolean
  billedByAContract: boolean
  /** What the prefix field shows (`shownCodePrefix`). */
  codePrefix: string
}) {
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const set = <K extends keyof PartyDraft>(key: K, value: PartyDraft[K]) => onChange({ ...draft, [key]: value })
  // The store's rule (partyRefusal): the kind is fixed while it holds Contracts or stands behind Bookings.
  const kindFixed = party !== undefined && (holdsContracts || party.billingIdentity !== undefined)
  // Active hospitals only, plus the Party's own when retired (catch-up Phase 42); AA rooms stays excluded on top.
  const hospitalOptions = useMemo(
    () =>
      activeHospitals({ masters: { hospitals } }, party?.hospitalId ?? null)
        .filter((h) => h.locationType === 'hospital')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [hospitals, party?.hospitalId],
  )

  return (
    <>
      <PanelSection title="Who it is">
        <TextField label="Name" value={draft.name} onChange={(v) => set('name', v)} hint="The short name lists and the Contract picker show." />
        <PanelGrid>
          <SelectField label="Kind" value={draft.kind} onChange={(v) => set('kind', v as Exclude<PartyKind, 'aa'>)} disabled={kindFixed}>
            {CREATABLE_PARTY_KINDS.map((k) => (
              <option key={k} value={k}>{PARTY_KIND_LABEL[k]}</option>
            ))}
          </SelectField>
          <TextField
            label="Code prefix"
            value={codePrefix}
            onChange={(v) => onChange({ ...draft, prefixTouched: true, codePrefix: v.toUpperCase() })}
            mono
            hint="Starts each of its Contracts' AA codes."
          />
        </PanelGrid>
        {kindFixed && <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: -6 }}>{PARTY_REFUSAL_MESSAGES.kindFixedWhileHolding}</div>}
        {draft.kind === 'hospital' && (
          <SelectField label="Hospital" value={draft.hospitalId} onChange={(v) => set('hospitalId', v)} disabled={party !== undefined && holdsContracts}>
            <option value="">Select its hospital</option>
            {hospitalOptions.map((h) => (
              <option key={h.id} value={h.id}>{retiredLabel(h.name, h)}</option>
            ))}
          </SelectField>
        )}
      </PanelSection>

      <PanelSection title="Billing">
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: -6 }}>
          {billedByAContract ? 'A Contract bills this Party, so it needs a billing name and a delivery method.' : 'Needed once a Contract bills this Party.'}
        </div>
        <TextField label="Billing name" value={draft.billingName} onChange={(v) => set('billingName', v)} hint="Printed on its invoices." />
        <Segmented
          label="Invoices delivered by"
          value={draft.delivery}
          options={[
            { value: 'none', label: 'Not set' },
            { value: 'email', label: DELIVERY_LABEL.email },
            { value: 'post', label: DELIVERY_LABEL.post },
          ]}
          onChange={(v) => set('delivery', v)}
        />
        <PanelGrid>
          <TextField label="Email" value={draft.email} onChange={(v) => set('email', v)} type="email" />
          <TextField label="Postal address" value={draft.postalAddress} onChange={(v) => set('postalAddress', v)} />
        </PanelGrid>
      </PanelSection>
    </>
  )
}
