/**
 * Billable Party (guardian / non-patient payer) creation (Phase 06). The
 * office's billing-setup guardian flow calls this, then `editProcedure` with
 * the returned `billablePartyId`. A BillableParty is a typed identity of its
 * own (3rd review #6) — never a Patient row, holds no NHI.
 */

import type { BillableParty } from '../domain/types'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

export interface BillablePartyDetails {
  name: string
  relationshipToPatient: string
  phone?: string
  email?: string
  address?: string
}

/** Allocate a `BP####` id, write the master row, audit `billableParty.create`. */
export function createBillableParty(
  api: AppStoreApi,
  actor: Actor,
  details: BillablePartyDetails,
): Outcome<{ billablePartyId: string }> {
  if (details.name.trim() === '') return refuse('nameRequired', 'A guardian or payer name is required.')
  if (details.relationshipToPatient.trim() === '') {
    return refuse('relationshipRequired', 'Enter the relationship to the patient.')
  }

  let billablePartyId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'billableParty')
    billablePartyId = alloc.id
    const party: BillableParty = {
      hiddenInternalId: billablePartyId,
      name: details.name.trim(),
      relationshipToPatient: details.relationshipToPatient.trim(),
    }
    if (details.phone !== undefined && details.phone.trim() !== '') party.phone = details.phone.trim()
    if (details.email !== undefined && details.email.trim() !== '') party.email = details.email.trim()
    if (details.address !== undefined && details.address.trim() !== '') party.address = details.address.trim()

    metas.push({
      entityType: 'billableParty',
      entityId: billablePartyId,
      action: 'billableParty.create',
      after: { name: party.name, relationshipToPatient: party.relationshipToPatient },
      stampCardId: null,
    })
    return {
      masters: { ...s.masters, billableParties: { ...s.masters.billableParties, [billablePartyId]: party } },
      counters: alloc.counters,
    }
  })
  return ok({ billablePartyId })
}
