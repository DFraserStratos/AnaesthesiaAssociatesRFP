/**
 * The mutation wrapper — the ONLY module that raw-writes domain slices
 * (PROGRESS convention 7; mechanically enforced by `storeDiscipline`).
 *
 * Every domain write goes through `mutate()`, which in ONE commit:
 *   - applies the recipe's patch,
 *   - appends the append-only AuditEntry per meta (timestamp from the demo
 *     clock state, id from the persisted counter),
 *   - stamps `lastModifiedBy/AtISO` on the touched Card — procedure and
 *     billing-line edits stamp the PARENT Card (7th review A8: the summary
 *     fields and the log can never drift apart).
 *
 * Refusals are data, not exceptions: guards return `Outcome` so Phase 11's
 * monitor can surface integration refusals as manual-intervention items.
 */

import type { ActorRole, AuditEntry, AuditSource, CardId } from '../domain/types'
import { buildSeed } from '../domain/seed'
import { INITIAL_CLOCK, type DemoClockState } from '../domain/clock'
import {
  emptyBillingSlice,
  emptyIntegrationsSlice,
  emptyXeroSlice,
  type AppState,
  type AppStoreApi,
} from './appStore'

// ---------------------------------------------------------------------------
// Actors & outcomes
// ---------------------------------------------------------------------------

export interface Actor {
  who: string
  role: ActorRole
  source: AuditSource
  /** Set for anaesthetist actors — ownership checks (own Lists only). */
  anaesthetistId?: string
}

/** Guard results as data. `ok: false` outcomes render verbatim in UI. */
export type Outcome<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string; details?: unknown }

export function ok<T>(value: T): Outcome<T> {
  return { ok: true, value }
}

export function refuse<T = undefined>(code: string, message: string, details?: unknown): Outcome<T> {
  const outcome: Outcome<T> = { ok: false, code, message }
  if (details !== undefined) outcome.details = details
  return outcome
}

// ---------------------------------------------------------------------------
// Clock & id helpers
// ---------------------------------------------------------------------------

/** The demo clock as a local-naive ISO datetime (`2026-07-21T08:00:00`). */
export function clockISO(clock: DemoClockState): string {
  const h = Math.floor(clock.minutesSinceMidnight / 60)
  const m = clock.minutesSinceMidnight % 60
  return `${clock.todayISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** Runtime id prefixes per counter kind (seed ids share the formats). */
const ID_FORMATS: Record<string, { prefix: string; pad: number }> = {
  audit: { prefix: 'A', pad: 4 },
  card: { prefix: 'C', pad: 4 },
  procedure: { prefix: 'P', pad: 4 },
  billingLine: { prefix: 'BL', pad: 4 },
  patient: { prefix: 'PT', pad: 4 },
  billableParty: { prefix: 'BP', pad: 4 },
  availability: { prefix: 'AV', pad: 4 },
  list: { prefix: 'LG', pad: 4 },
  hospital: { prefix: 'HN', pad: 3 },
  contract: { prefix: 'CTN', pad: 3 },
}

/** Allocate the next deterministic id of a kind from the counters record. */
export function allocateId(
  counters: Record<string, number>,
  kind: string,
): { id: string; counters: Record<string, number> } {
  const format = ID_FORMATS[kind] ?? { prefix: kind.toUpperCase(), pad: 4 }
  const n = counters[kind] ?? 1
  return {
    id: `${format.prefix}${String(n).padStart(format.pad, '0')}`,
    counters: { ...counters, [kind]: n + 1 },
  }
}

// ---------------------------------------------------------------------------
// mutate
// ---------------------------------------------------------------------------

export interface MutationMeta {
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  /**
   * Card whose `lastModifiedBy/AtISO` this mutation stamps. Omit to derive
   * from the entity (card → itself; procedure/billingLine → parent card);
   * pass null to stamp nothing (List/master mutations).
   */
  stampCardId?: CardId | null
}

/** What a recipe may replace. Audit is the wrapper's job — never the recipe's. */
export type DomainPatch = Partial<
  Pick<AppState, 'masters' | 'schedule' | 'settings' | 'counters' | 'billing' | 'xero' | 'integrations'>
>

function deriveStampCardId(meta: MutationMeta, schedule: AppState['schedule']): CardId | null {
  if (meta.stampCardId !== undefined) return meta.stampCardId
  if (meta.entityType === 'card') return schedule.cards[meta.entityId] !== undefined ? meta.entityId : null
  if (meta.entityType === 'procedure') return schedule.procedures[meta.entityId]?.cardId ?? null
  if (meta.entityType === 'billingLine') {
    const procedureId = schedule.billingLines[meta.entityId]?.procedureId
    return procedureId !== undefined ? (schedule.procedures[procedureId]?.cardId ?? null) : null
  }
  return null
}

/**
 * Apply a domain mutation: recipe patch + audit append + Card stamp, one
 * `setState` commit. `metas` may be a single entry or several (e.g. List
 * reassignment audits the move, the absorb and the regenerate together).
 */
export function mutate(
  api: AppStoreApi,
  actor: Actor,
  metas: MutationMeta | readonly MutationMeta[],
  recipe: (state: AppState) => DomainPatch,
): void {
  const state = api.getState()
  const patch = recipe(state)
  const atISO = clockISO(state.clock)
  const metaList = Array.isArray(metas) ? (metas as readonly MutationMeta[]) : [metas as MutationMeta]

  let counters = patch.counters ?? state.counters
  const entries: AuditEntry[] = []
  for (const meta of metaList) {
    const allocated = allocateId(counters, 'audit')
    counters = allocated.counters
    const entry: AuditEntry = {
      id: allocated.id,
      entityType: meta.entityType,
      entityId: meta.entityId,
      who: actor.who,
      role: actor.role,
      source: actor.source,
      action: meta.action,
      atISO,
    }
    if (meta.before !== undefined) entry.before = meta.before
    if (meta.after !== undefined) entry.after = meta.after
    entries.push(entry)
  }

  // Stamp the touched Cards in the same commit as their audit entries.
  let schedule = patch.schedule ?? state.schedule
  for (const meta of metaList) {
    const cardId = deriveStampCardId(meta, schedule)
    if (cardId === null) continue
    const card = schedule.cards[cardId]
    if (card === undefined) continue
    schedule = {
      ...schedule,
      cards: {
        ...schedule.cards,
        [cardId]: { ...card, lastModifiedBy: actor.who, lastModifiedAtISO: atISO },
      },
    }
  }

  api.setState({
    ...patch,
    schedule,
    counters,
    audit: [...state.audit, ...entries],
  })
}

/**
 * Restore the pristine seed (the demo Reset). Domain slices, clock and the
 * empty Phase 08 to 11 scaffolds reset; the shell slice is preserved. Lives
 * here because mutate.ts is the one permitted raw writer of domain slices —
 * a reset is a wholesale replace, not an audited mutation.
 */
export function resetDomainState(api: AppStoreApi): void {
  const seed = buildSeed()
  api.setState({
    clock: INITIAL_CLOCK,
    masters: seed.masters,
    schedule: seed.schedule,
    audit: seed.audit,
    settings: seed.settings,
    counters: seed.counters,
    billing: emptyBillingSlice(),
    xero: emptyXeroSlice(),
    integrations: emptyIntegrationsSlice(),
  })
}
