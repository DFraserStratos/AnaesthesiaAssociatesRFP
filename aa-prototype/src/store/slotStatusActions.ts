/**
 * The availability status master (catch-up Phase 29; US-01.2.2, OQ-64
 * answered): the office adds, edits, retires and restores the statuses
 * anaesthetists set on their sessions, without code. Office only, one audited
 * `mutate()` each, validated by the pure `validateSlotStatusDraft`.
 *
 * IDs are fixed: a seeded status keeps its stored value, an added one gets the
 * next `ST####`, and no action ever changes a key. There is no delete:
 * retiring keeps history, and sessions that carry a retired status keep it.
 * Labels never say "slot" (OQ-64) and never name a List's state (US-01.2.2).
 */

import type { SlotStatus, SlotStatusKey } from '../domain/types'
import {
  activeStatuses,
  statusFor,
  validateRetireSlotStatus,
  validateSlotStatusDraft,
  type SlotStatusDraft,
} from '../domain/slotStatus'
import { activeSeriesUsing } from '../domain/availabilitySeries'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

function cleaned(draft: SlotStatusDraft): SlotStatusDraft {
  return { ...draft, label: draft.label.trim(), longLabel: draft.longLabel.trim(), description: draft.description.trim() }
}

/** The record a draft makes (the default flag only when set). */
function fromDraft(key: SlotStatusKey, draft: SlotStatusDraft, order: number, retiredAtISO?: string): SlotStatus {
  return {
    key,
    label: draft.label,
    longLabel: draft.longLabel,
    description: draft.description,
    colour: draft.colour,
    treatment: draft.treatment,
    bookable: draft.bookable,
    anaesthetistCanSet: draft.anaesthetistCanSet,
    ...(draft.isDefault ? { isDefault: true as const } : {}),
    order,
    ...(retiredAtISO !== undefined ? { retiredAtISO } : {}),
  }
}

/** Making one status the default unsets the old default (exactly one). */
function withDefault(statuses: Record<string, SlotStatus>, key: SlotStatusKey): { statuses: Record<string, SlotStatus>; previous?: SlotStatusKey } {
  const next = { ...statuses }
  let previous: SlotStatusKey | undefined
  for (const s of Object.values(next)) {
    if (s.key !== key && s.isDefault === true) {
      const rest = { ...s }
      delete rest.isDefault
      next[s.key] = rest
      previous = s.key
    }
  }
  return { statuses: next, ...(previous !== undefined ? { previous } : {}) }
}

/** Add a status (US-01.2.2 "an admin adds a status, then it can be used without a code change"). Audited `availabilityStatus.create`. */
export function addSlotStatus(api: AppStoreApi, actor: Actor, draft: SlotStatusDraft): Outcome<{ key: SlotStatusKey }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add an availability status.')
  const state = api.getState()
  const value = cleaned(draft)
  const issues = validateSlotStatusDraft(value, state.masters.slotStatuses)
  if (issues.length > 0) return refuse('invalidStatus', issues.join(' '))
  let key = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'slotStatus')
    key = alloc.id
    const order = Math.max(0, ...Object.values(s.masters.slotStatuses).map((x) => x.order)) + 1
    let statuses: Record<string, SlotStatus> = { ...s.masters.slotStatuses, [key]: fromDraft(key, value, order) }
    if (value.isDefault) statuses = withDefault(statuses, key).statuses
    metas.push({ entityType: 'availabilityStatus', entityId: key, action: 'availabilityStatus.create', after: { ...statuses[key] }, stampBookingId: null })
    return { masters: { ...s.masters, slotStatuses: statuses }, counters: alloc.counters }
  })
  return ok({ key })
}

/**
 * Edit a status's label, long label, description, colour, treatment, the two
 * flags and the default; never its ID. A rename or recolour shows in every view
 * and changes no rule (US-01.2.2 criterion 1). Audited `availabilityStatus.update`
 * with the changed fields only; no change writes nothing.
 */
export function editSlotStatus(api: AppStoreApi, actor: Actor, key: SlotStatusKey, draft: SlotStatusDraft): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit an availability status.')
  const state = api.getState()
  const existing = statusFor(state.masters.slotStatuses, key)
  if (existing === undefined) return refuse('notFound', 'Status not found.')
  const value = cleaned(draft)
  const issues = validateSlotStatusDraft(value, state.masters.slotStatuses, { key })
  if (issues.length > 0) return refuse('invalidStatus', issues.join(' '))
  const next = fromDraft(key, value, existing.order, existing.retiredAtISO)
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  for (const field of ['label', 'longLabel', 'description', 'colour', 'treatment', 'bookable', 'anaesthetistCanSet'] as const) {
    if (next[field] !== existing[field]) {
      before[field] = existing[field]
      after[field] = next[field]
    }
  }
  if ((next.isDefault === true) !== (existing.isDefault === true)) {
    before.defaultStatus = existing.isDefault === true
    after.defaultStatus = next.isDefault === true
  }
  if (Object.keys(after).length === 0) return ok(undefined)
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let statuses: Record<string, SlotStatus> = { ...s.masters.slotStatuses, [key]: next }
    if (next.isDefault === true && existing.isDefault !== true) {
      const moved = withDefault(statuses, key)
      statuses = moved.statuses
      if (moved.previous !== undefined) after.previousDefault = moved.previous
    }
    metas.push({ entityType: 'availabilityStatus', entityId: key, action: 'availabilityStatus.update', before, after, stampBookingId: null })
    return { masters: { ...s.masters, slotStatuses: statuses } }
  })
  return ok(undefined)
}

/** How many sessions from today on carry a status (the retire confirm says so). */
export function futureSessionsWithStatus(state: ReturnType<AppStoreApi['getState']>, key: SlotStatusKey): number {
  const today = state.clock.todayISO
  return Object.values(state.schedule.slots).filter((s) => s.status === key && s.dateISO >= today).length
}

/**
 * Retire a status: it leaves the choices and legends, and sessions already
 * carrying it keep it until changed. Never the default; never one an active
 * series uses. Audited `availabilityStatus.retire`.
 */
export function retireSlotStatus(api: AppStoreApi, actor: Actor, key: SlotStatusKey): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can retire an availability status.')
  const state = api.getState()
  const issues = validateRetireSlotStatus(state.masters.slotStatuses, key, {
    activeSeriesUsing: activeSeriesUsing(state.schedule.availabilitySeries, key, state.clock.todayISO),
  })
  if (issues.length > 0) return refuse('cannotRetire', issues.join(' '))
  const existing = statusFor(state.masters.slotStatuses, key)
  if (existing === undefined) return refuse('notFound', 'Status not found.')
  mutate(
    api,
    actor,
    { entityType: 'availabilityStatus', entityId: key, action: 'availabilityStatus.retire', after: { sessionsCarrying: futureSessionsWithStatus(state, key) }, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, slotStatuses: { ...s.masters.slotStatuses, [key]: { ...existing, retiredAtISO: clockISO(s.clock) } } } }),
  )
  return ok(undefined)
}

/** Bring a retired status back into use. Audited `availabilityStatus.restore`. */
export function restoreSlotStatus(api: AppStoreApi, actor: Actor, key: SlotStatusKey): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can restore an availability status.')
  const state = api.getState()
  const existing = statusFor(state.masters.slotStatuses, key)
  if (existing === undefined) return refuse('notFound', 'Status not found.')
  if (existing.retiredAtISO === undefined) return refuse('notRetired', 'That status is already in use.')
  const clash = activeStatuses(state.masters.slotStatuses).find((s) => s.label.trim().toLowerCase() === existing.label.trim().toLowerCase())
  if (clash !== undefined) return refuse('duplicateLabel', `Another status is already called ${clash.label}. Rename one first.`)
  const restored = { ...existing }
  delete restored.retiredAtISO
  mutate(
    api,
    actor,
    { entityType: 'availabilityStatus', entityId: key, action: 'availabilityStatus.restore', before: { retiredAtISO: existing.retiredAtISO }, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, slotStatuses: { ...s.masters.slotStatuses, [key]: restored } } }),
  )
  return ok(undefined)
}

/**
 * Move a status up or down the list (its `order`, which the choices and
 * legends follow). Swaps with its neighbour among the statuses in use.
 * Audited `availabilityStatus.update` (order).
 */
export function reorderSlotStatus(api: AppStoreApi, actor: Actor, key: SlotStatusKey, direction: 'up' | 'down'): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can reorder the availability statuses.')
  const state = api.getState()
  const list = activeStatuses(state.masters.slotStatuses)
  const i = list.findIndex((s) => s.key === key)
  if (i === -1) return refuse('notFound', 'Status not found, or retired.')
  const j = direction === 'up' ? i - 1 : i + 1
  const a = list[i]
  const b = list[j]
  if (a === undefined || b === undefined) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'availabilityStatus', entityId: key, action: 'availabilityStatus.update', before: { order: a.order }, after: { order: b.order }, stampBookingId: null },
    (s) => ({
      masters: {
        ...s.masters,
        slotStatuses: { ...s.masters.slotStatuses, [a.key]: { ...a, order: b.order }, [b.key]: { ...b, order: a.order } },
      },
    }),
  )
  return ok(undefined)
}
