/**
 * Read helpers over the app state. Plain functions (guards, tests and the
 * inspector share them) plus a few primitive-returning hooks. Components that
 * need derived arrays select the stable record objects and derive with
 * useMemo — deriving inside a zustand selector would return fresh references
 * every snapshot.
 */

import type { Card, List, Procedure, Session } from '../domain/types'
import type { CardBillingContext } from '../domain/billing/validateCardForBilling'
import { listIdForSlot } from '../domain/seed'
import { useAppStore, type AppState } from './appStore'
import { clockISO } from './mutate'

// ---------------------------------------------------------------------------
// Plain selectors
// ---------------------------------------------------------------------------

export function listForSlot(
  state: AppState,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
): List | undefined {
  // Slot-derived ids cover generated Lists; reassignment can move a List (or
  // regenerate one) whose id no longer encodes its slot, so fall back to scan.
  const direct = state.schedule.lists[listIdForSlot(anaesthetistId, dateISO, session)]
  if (
    direct !== undefined &&
    direct.anaesthetistId === anaesthetistId &&
    direct.dateISO === dateISO &&
    direct.session === session
  ) {
    return direct
  }
  return Object.values(state.schedule.lists).find(
    (l) => l.anaesthetistId === anaesthetistId && l.dateISO === dateISO && l.session === session,
  )
}

export function listsForDate(state: AppState, dateISO: string): List[] {
  return Object.values(state.schedule.lists)
    .filter((l) => l.dateISO === dateISO)
    .sort((a, b) =>
      a.anaesthetistId === b.anaesthetistId
        ? a.session.localeCompare(b.session)
        : a.anaesthetistId.localeCompare(b.anaesthetistId),
    )
}

export function cardsForList(state: AppState, listId: string): Card[] {
  return Object.values(state.schedule.cards)
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** Procedures in Card order (creation order — the billing ordinal). */
export function proceduresForCard(state: AppState, cardId: string): Procedure[] {
  return Object.values(state.schedule.procedures)
    .filter((p) => p.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function auditForEntity(state: AppState, entityId: string) {
  return state.audit.filter((a) => a.entityId === entityId)
}

/**
 * True once the List's billing run has stamped it (Phase 08 drives the stamp).
 * Lists vanish from the anaesthetist's forward views at INVOICE GENERATION,
 * not at AUTHORISED (3rd review #12) — an authorised list is still unbilled
 * and keeps showing under Done with the unbilled cluster (M10).
 */
export function isListBilled(list: List): boolean {
  return list.billedAtISO !== undefined
}

/** Assemble the validator context for a Card from store state. */
export function billingContextForCard(state: AppState, card: Card): CardBillingContext | undefined {
  const list = state.schedule.lists[card.listId]
  if (list === undefined) return undefined
  const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) return undefined
  const ctx: CardBillingContext = {
    anaesthetist,
    rvgCodes: state.masters.rvgCodes,
    contracts: state.masters.contracts,
    contractPrices: Object.values(state.masters.contractPrices),
    insurers: state.masters.insurers,
    billableParties: state.masters.billableParties,
    billingLines: Object.values(state.schedule.billingLines),
  }
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  return ctx
}

export interface EntityCounts {
  anaesthetists: number
  surgeons: number
  hospitals: number
  insurers: number
  contracts: number
  rvgCodes: number
  modifierCodes: number
  permanentLists: number
  availability: number
  patients: number
  billableParties: number
  lists: number
  cards: number
  procedures: number
  billingLines: number
  audit: number
}

export function entityCounts(state: AppState): EntityCounts {
  return {
    anaesthetists: Object.keys(state.masters.anaesthetists).length,
    surgeons: Object.keys(state.masters.surgeons).length,
    hospitals: Object.keys(state.masters.hospitals).length,
    insurers: Object.keys(state.masters.insurers).length,
    contracts: Object.keys(state.masters.contracts).length,
    rvgCodes: Object.keys(state.masters.rvgCodes).length,
    modifierCodes: Object.keys(state.masters.modifierCodes).length,
    permanentLists: Object.keys(state.masters.permanentLists).length,
    availability: Object.keys(state.masters.availability).length,
    patients: Object.keys(state.masters.patients).length,
    billableParties: Object.keys(state.masters.billableParties).length,
    lists: Object.keys(state.schedule.lists).length,
    cards: Object.keys(state.schedule.cards).length,
    procedures: Object.keys(state.schedule.procedures).length,
    billingLines: Object.keys(state.schedule.billingLines).length,
    audit: state.audit.length,
  }
}

/** The clock's time of day as `h:mm` (the phone status bar format). */
export function clockTimeLabel(state: Pick<AppState, 'clock'>): string {
  const h = Math.floor(state.clock.minutesSinceMidnight / 60)
  const m = state.clock.minutesSinceMidnight % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export { clockISO }

// ---------------------------------------------------------------------------
// Primitive-returning hooks (safe to use directly in components)
// ---------------------------------------------------------------------------

export function useToday(): string {
  return useAppStore((s) => s.clock.todayISO)
}

export function useClockTimeLabel(): string {
  return useAppStore((s) => clockTimeLabel(s))
}
