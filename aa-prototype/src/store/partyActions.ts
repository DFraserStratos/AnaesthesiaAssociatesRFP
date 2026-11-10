/**
 * The Party master's write paths (catch-up Phase 18; US-04.1.5, DM-48).
 * Office only, one audited `mutate()` commit each (`party.create`,
 * `party.update`, with the values before and after), refusals as data from the
 * one rule source, `partyRefusal`. The Anaesthesia Associates Party is
 * read-only; nothing is deleted. Creating a Party creates no Contract.
 */

import type { DeliveryMethod, Party, PartyKind } from '../domain/types'
import { partyRefusal } from '../domain/billing/parties'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

/** What the office types for a Party. Blank optional fields are cleared. */
export interface PartyFields {
  kind: Exclude<PartyKind, 'aa'>
  name: string
  codePrefix: string
  billingName?: string
  email?: string
  postalAddress?: string
  deliveryMethod?: DeliveryMethod
  hospitalId?: string
}

/** Whether any Contract holds the Party, and whether any bills it as its holder. */
export function partyContractFacts(
  state: Pick<AppState, 'masters'>,
  partyId: string,
): { holdsContracts: boolean; billedByAContract: boolean } {
  let holdsContracts = false
  let billedByAContract = false
  for (const c of Object.values(state.masters.contracts)) {
    if (c.holderId !== partyId) continue
    holdsContracts = true
    if (c.billsTo === 'holder') billedByAContract = true
  }
  return { holdsContracts, billedByAContract }
}

function cleanParty(id: string, fields: PartyFields): Party {
  const opt = (v: string | undefined): string | undefined => {
    const t = v?.trim() ?? ''
    return t === '' ? undefined : t
  }
  const billingName = opt(fields.billingName)
  const email = opt(fields.email)
  const postalAddress = opt(fields.postalAddress)
  const hospitalId = fields.kind === 'hospital' ? opt(fields.hospitalId) : undefined
  return {
    id,
    kind: fields.kind,
    name: fields.name.trim(),
    codePrefix: fields.codePrefix.trim().toUpperCase(),
    ...(billingName !== undefined ? { billingName } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(postalAddress !== undefined ? { postalAddress } : {}),
    ...(fields.deliveryMethod !== undefined ? { deliveryMethod: fields.deliveryMethod } : {}),
    ...(hospitalId !== undefined ? { hospitalId } : {}),
  }
}

/** Add a Party. Audited `party.create`. It holds nothing, so it needs no billing details yet (A43). */
export function createParty(api: AppStoreApi, actor: Actor, fields: PartyFields): Outcome<{ party: Party }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a Party.')
  const state = api.getState()
  const draft = cleanParty('', fields)
  const refused = partyRefusal(draft, {
    parties: state.masters.parties,
    hospitals: state.masters.hospitals,
    holdsContracts: false,
    billedByAContract: false,
  })
  if (refused !== null) return refuse(refused.code, refused.message)

  let created: Party | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'party')
    const party: Party = { ...draft, id: alloc.id }
    created = party
    metas.push({ entityType: 'party', entityId: party.id, action: 'party.create', after: { ...party }, stampBookingId: null })
    return { masters: { ...s.masters, parties: { ...s.masters.parties, [party.id]: party } }, counters: alloc.counters }
  })
  if (created === undefined) return refuse('createFailed', 'The Party could not be created.')
  return ok({ party: created })
}

/** Edit a Party in place. Audited `party.update` with the changed fields before and after. */
export function editParty(api: AppStoreApi, actor: Actor, partyId: string, fields: PartyFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a Party.')
  const state = api.getState()
  const prev = state.masters.parties[partyId]
  if (prev === undefined) return refuse('notFound', 'Party not found.')
  const next = cleanParty(partyId, fields)
  const refused = partyRefusal(next, {
    prev,
    parties: state.masters.parties,
    hospitals: state.masters.hospitals,
    ...partyContractFacts(state, partyId),
  })
  if (refused !== null) return refuse(refused.code, refused.message)

  const keys = new Set<keyof Party>([...(Object.keys(prev) as (keyof Party)[]), ...(Object.keys(next) as (keyof Party)[])])
  const changed = [...keys].filter((k) => k !== 'legacyCounterparty' && prev[k] !== next[k])
  if (changed.length === 0) return ok(undefined)
  // The interim counterparty is the system's, never the office's: carried over unchanged.
  const stored: Party = prev.legacyCounterparty !== undefined ? { ...next, legacyCounterparty: prev.legacyCounterparty } : next
  mutate(
    api,
    actor,
    {
      entityType: 'party',
      entityId: partyId,
      action: 'party.update',
      before: Object.fromEntries(changed.map((k) => [k, prev[k] ?? ''])),
      after: Object.fromEntries(changed.map((k) => [k, next[k] ?? ''])),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, parties: { ...s.masters.parties, [partyId]: stored } } }),
  )
  return ok(undefined)
}
