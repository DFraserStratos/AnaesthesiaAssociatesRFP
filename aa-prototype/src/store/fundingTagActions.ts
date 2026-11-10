/**
 * AA's funding tags (catch-up Phase 18a; US-13.4.5, DM-64): add, edit the code
 * and funder, move up or down (the step rail's order), remove. Office only,
 * one audited `mutate()` commit each, refusals as data from the model module
 * (`domain/billing/fundingTags.ts`).
 *
 * A tag is never removed while any Contract carries it, its fallbacks
 * included: a used tag is renamed instead, and a hospital tag's fallback is
 * permanent (logged). Renaming a tag does not rename an existing fallback;
 * the office renames that itself.
 */

import type { FundingTag } from '../domain/types'
import { fundingTagRefusal, fundingTagsInOrder, fundingTagUsage, moveFundingTag, normaliseTagCode } from '../domain/billing/fundingTags'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

export interface FundingTagFields {
  code: string
  /** An insurer or funder Party; empty or undefined names none. */
  funderPartyId?: string
}

const OFFICE_ONLY = 'Only the office can change the funding tags.'

/** A tag's audit values: the funder by name, "No funder named" when none. */
function auditValues(tag: Pick<FundingTag, 'code' | 'funderPartyId'>, state: Pick<AppState, 'masters'>): Record<string, unknown> {
  const funder = tag.funderPartyId !== undefined ? state.masters.parties[tag.funderPartyId]?.name ?? tag.funderPartyId : 'No funder named'
  return { code: tag.code, funder }
}

function funderOf(fields: FundingTagFields): string | undefined {
  return fields.funderPartyId !== undefined && fields.funderPartyId !== '' ? fields.funderPartyId : undefined
}

/** Add a tag at the end of the list. Audited `fundingTag.create`. */
export function createFundingTag(api: AppStoreApi, actor: Actor, fields: FundingTagFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const funderPartyId = funderOf(fields)
  const draft = { id: '', code: normaliseTagCode(fields.code), ...(funderPartyId !== undefined ? { funderPartyId } : {}) }
  const refused = fundingTagRefusal(draft, { tags: state.masters.fundingTags, parties: state.masters.parties })
  if (refused !== null) return refuse(refused.code, refused.message)
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'fundingTag')
    id = alloc.id
    const order = fundingTagsInOrder(s.masters.fundingTags).length + 1
    const tag: FundingTag = { ...draft, id, order }
    metas.push({ entityType: 'fundingTag', entityId: id, action: 'fundingTag.create', after: { ...auditValues(tag, s), order }, stampBookingId: null })
    return { masters: { ...s.masters, fundingTags: { ...s.masters.fundingTags, [id]: tag } }, counters: alloc.counters }
  })
  return ok({ id })
}

/** Edit a tag's code and funder. Audited `fundingTag.update`, before and after. */
export function editFundingTag(api: AppStoreApi, actor: Actor, id: string, fields: FundingTagFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const existing = state.masters.fundingTags[id]
  if (existing === undefined) return refuse('notFound', 'Funding tag not found.')
  const funderPartyId = funderOf(fields)
  const next: FundingTag = { id, order: existing.order, code: normaliseTagCode(fields.code), ...(funderPartyId !== undefined ? { funderPartyId } : {}) }
  const refused = fundingTagRefusal(next, { tags: state.masters.fundingTags, parties: state.masters.parties })
  if (refused !== null) return refuse(refused.code, refused.message)
  if (next.code === existing.code && next.funderPartyId === existing.funderPartyId) return ok(undefined)
  const before = auditValues(existing, state)
  const after = auditValues(next, state)
  for (const k of Object.keys(after)) {
    if (before[k] === after[k]) {
      delete before[k]
      delete after[k]
    }
  }
  mutate(
    api,
    actor,
    { entityType: 'fundingTag', entityId: id, action: 'fundingTag.update', before, after, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, fundingTags: { ...s.masters.fundingTags, [id]: next } } }),
  )
  return ok(undefined)
}

/** Move a tag one place up or down; the orders are renumbered. Audited `fundingTag.move`. */
export function moveFundingTagInList(api: AppStoreApi, actor: Actor, id: string, direction: 'up' | 'down'): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const existing = state.masters.fundingTags[id]
  if (existing === undefined) return refuse('notFound', 'Funding tag not found.')
  const moved = moveFundingTag(state.masters.fundingTags, id, direction)
  const nextOrder = moved[id]!.order
  if (nextOrder === existing.order) {
    return refuse('cannotMove', direction === 'up' ? `${existing.code} is already first.` : `${existing.code} is already last.`)
  }
  mutate(
    api,
    actor,
    {
      entityType: 'fundingTag',
      entityId: id,
      action: 'fundingTag.move',
      before: { code: existing.code, order: existing.order },
      after: { code: existing.code, order: nextOrder },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, fundingTags: moveFundingTag(s.masters.fundingTags, id, direction) } }),
  )
  return ok(undefined)
}

/** Remove a tag no Contract carries; the others close up. Audited `fundingTag.remove`. */
export function removeFundingTag(api: AppStoreApi, actor: Actor, id: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const existing = state.masters.fundingTags[id]
  if (existing === undefined) return refuse('notFound', 'Funding tag not found.')
  const used = fundingTagUsage(state.masters.contracts, id)
  if (used > 0) {
    return refuse(
      'fundingTagHeld',
      `${existing.code} is carried by ${used} ${used === 1 ? 'Contract' : 'Contracts'}, its system Fixed price Contracts included, so it cannot be removed. Edit its code instead.`,
      { used },
    )
  }
  mutate(
    api,
    actor,
    { entityType: 'fundingTag', entityId: id, action: 'fundingTag.remove', before: auditValues(existing, state), stampBookingId: null },
    (s) => {
      const { [id]: _removed, ...rest } = s.masters.fundingTags
      const closed = Object.fromEntries(fundingTagsInOrder(rest).map((t, i) => [t.id, t.order === i + 1 ? t : { ...t, order: i + 1 }]))
      return { masters: { ...s.masters, fundingTags: closed } }
    },
  )
  return ok(undefined)
}
