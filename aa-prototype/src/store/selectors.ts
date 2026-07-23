/**
 * Read helpers over the app state. Plain functions (guards, tests and the
 * inspector share them) plus a few primitive-returning hooks. Components that
 * need derived arrays select the stable record objects and derive with
 * useMemo — deriving inside a zustand selector would return fresh references
 * every snapshot.
 */

import type {
  BillingCase,
  BillingPipelineStatus,
  Card,
  CounterpartyRef,
  DayNote,
  Invoice,
  InvoiceLine,
  List,
  Procedure,
  ProcedureId,
  Session,
} from '../domain/types'
import type { CardBillingContext } from '../domain/billing/validateCardForBilling'
import { listIdForSlot, deriveDashboardFigures, type DashboardFigures } from '../domain/seed'
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

export function cardsForList(state: Pick<AppState, 'schedule'>, listId: string): Card[] {
  return Object.values(state.schedule.cards)
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** Procedures in Card order (creation order — the billing ordinal). */
export function proceduresForCard(state: Pick<AppState, 'schedule'>, cardId: string): Procedure[] {
  return Object.values(state.schedule.procedures)
    .filter((p) => p.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function auditForEntity(state: AppState, entityId: string) {
  return state.audit.filter((a) => a.entityId === entityId)
}

/** Per-day internal office notes for a date, in insertion order (Phase 06). */
export function dayNotesFor(state: AppState, dateISO: string): DayNote[] {
  return state.dayNotes[dateISO] ?? []
}

/**
 * Every SUBMITTED List awaiting authorisation — the review queue (Phase 07).
 * The admin review-queue badge count derives from this rather than a hardcoded
 * figure, so a live submit grows it. Ordered by date then anaesthetist.
 */
export function submittedLists(state: AppState): List[] {
  return Object.values(state.schedule.lists)
    .filter((l) => l.state === 'SUBMITTED')
    .sort((a, b) =>
      a.dateISO === b.dateISO
        ? a.anaesthetistId.localeCompare(b.anaesthetistId)
        : a.dateISO.localeCompare(b.dateISO),
    )
}

export function submittedListCount(state: AppState): number {
  return submittedLists(state).length
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

/**
 * The seeded dashboard figures for an anaesthetist, aged against the demo
 * clock's today (Phase 05; W1/W4). Returns undefined when no figures are seeded
 * for that anaesthetist (honest-empty). Phase 10 replaces the receivables /
 * overdue portion with billing-mirror derivation.
 */
export function dashboardFiguresFor(state: AppState, anaesthetistId: string): DashboardFigures | undefined {
  const seed = state.dashboards[anaesthetistId]
  if (seed === undefined) return undefined
  return deriveDashboardFigures(seed, state.clock.todayISO)
}

/** Every billed List, most recently billed first (Phase 08). */
export function billedLists(state: Pick<AppState, 'schedule'>): List[] {
  return Object.values(state.schedule.lists)
    .filter((l) => l.billedAtISO !== undefined)
    .sort((a, b) => (b.billedAtISO ?? '').localeCompare(a.billedAtISO ?? ''))
}

/** A List's invoices (via its Cards), in raise order (Phase 08). */
export function invoicesForList(state: Pick<AppState, 'schedule' | 'billing'>, listId: string): Invoice[] {
  const cardIds = new Set(cardsForList(state, listId).map((c) => c.id))
  return Object.values(state.billing.invoices)
    .filter((i) => cardIds.has(i.cardId))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** An invoice's lines, in emit order (Phase 08). */
export function invoiceLinesFor(state: Pick<AppState, 'billing'>, invoiceId: string): InvoiceLine[] {
  return Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Invoice count per List id — the "recently billed" panels' shared derivation
 * (Phase 08). Counts only STANDARD (billing-run) invoices; a pre-payment
 * invoice is raised separately and is not part of the run's output (Phase 09).
 */
export function invoiceCountsByList(state: Pick<AppState, 'schedule' | 'billing'>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const invoice of Object.values(state.billing.invoices)) {
    if (invoice.kind !== 'standard') continue
    const listId = state.schedule.cards[invoice.cardId]?.listId
    if (listId !== undefined) counts[listId] = (counts[listId] ?? 0) + 1
  }
  return counts
}

// ---------------------------------------------------------------------------
// Billing cases (Phase 08 record; Phase 09 monitor + retry)
// ---------------------------------------------------------------------------

/** Every BillingCase for a Card, in id order. */
export function casesForCard(state: Pick<AppState, 'billing'>, cardId: string): BillingCase[] {
  return Object.values(state.billing.cases)
    .filter((c) => c.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** Every BillingCase for the Cards on a List, in id order. */
export function casesForList(state: Pick<AppState, 'schedule' | 'billing'>, listId: string): BillingCase[] {
  const cardIds = new Set(cardsForList(state, listId).map((c) => c.id))
  return Object.values(state.billing.cases)
    .filter((c) => cardIds.has(c.cardId))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** Every failed BillingCase (the monitor's exceptions), in id order. */
export function failedCases(state: Pick<AppState, 'billing'>): BillingCase[] {
  return Object.values(state.billing.cases)
    .filter((c) => c.status === 'failed')
    .sort((a, b) => a.id.localeCompare(b.id))
}

// ---------------------------------------------------------------------------
// Pre-payment (Phase 09; B7) — apps read the billing MIRROR, never Xero
// (convention 9). "Paid" is a case->invoice join: a BillingCase whose invoice
// is a `prePayment` invoice and whose status is 'paid'. Phase 10's webhook
// flips the case live; Phase 09 seeds a paid case so the cleared path demos now.
// ---------------------------------------------------------------------------

/** True when a non-cancelled procedure requires pre-payment (derived, never stored). */
export function cardRequiresPrepayment(state: Pick<AppState, 'schedule'>, cardId: string): boolean {
  const card = state.schedule.cards[cardId]
  if (card === undefined || card.cancellation !== undefined) return false
  return proceduresForCard(state, cardId).some(
    (p) => p.billingRoute === 'billableParty' && p.patientPaymentCategory === 'selfFundedPrepayment',
  )
}

/** The `prePayment`-kind invoices raised for a Card, in id order. */
export function prePaymentInvoicesForCard(state: Pick<AppState, 'billing'>, cardId: string): Invoice[] {
  return Object.values(state.billing.invoices)
    .filter((i) => i.cardId === cardId && i.kind === 'prePayment')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** A paid pre-payment case for a Card (case -> prePayment invoice, status 'paid'), if any. */
export function paidPrePaymentCaseForCard(state: Pick<AppState, 'billing'>, cardId: string): BillingCase | undefined {
  const prePaymentInvoiceIds = new Set(prePaymentInvoicesForCard(state, cardId).map((i) => i.id))
  return Object.values(state.billing.cases).find(
    (c) => c.cardId === cardId && c.status === 'paid' && c.invoiceId !== undefined && prePaymentInvoiceIds.has(c.invoiceId),
  )
}

/**
 * The EX-GST amount already invoiced per procedure via a Card's pre-payment
 * invoices (deposit for split, full fee for full), WITH the counterparty the
 * pre-invoice was raised against. The balance run threads this into the invoice
 * builder so the post-procedure invoice bills only the remaining balance, and
 * the builder fails the Card if the payer changed since the deposit was raised.
 */
export function prePaidByProcedure(
  state: Pick<AppState, 'billing'>,
  cardId: string,
): Record<ProcedureId, { amount: number; counterparty: CounterpartyRef }> {
  const out: Record<ProcedureId, { amount: number; counterparty: CounterpartyRef }> = {}
  for (const invoice of prePaymentInvoicesForCard(state, cardId)) {
    for (const line of Object.values(state.billing.invoiceLines)) {
      if (line.invoiceId !== invoice.id || line.procedureId === undefined) continue
      const existing = out[line.procedureId]
      out[line.procedureId] = {
        amount: (existing?.amount ?? 0) + line.amount,
        counterparty: invoice.counterparty,
      }
    }
  }
  return out
}

export type PrepaymentStatus = 'none' | 'required' | 'outstanding' | 'paid' | 'overridden'

/**
 * The ONE derived pre-payment status for a Card — the single source the
 * completion gate, the three flag surfaces (mobile card, admin day view,
 * review) and the review flag all read. `required` = prepayment needed, no
 * invoice raised yet; `outstanding` = invoice raised, unpaid, not overridden;
 * `paid` = the pre-invoice cleared; `overridden` = the office lifted the gate.
 */
export function prepaymentStatusFor(state: Pick<AppState, 'schedule' | 'billing'>, cardId: string): PrepaymentStatus {
  if (!cardRequiresPrepayment(state, cardId)) return 'none'
  if (paidPrePaymentCaseForCard(state, cardId) !== undefined) return 'paid'
  if (state.schedule.cards[cardId]?.prepaymentOverride !== undefined) return 'overridden'
  if (prePaymentInvoicesForCard(state, cardId).length > 0) return 'outstanding'
  return 'required'
}

// ---------------------------------------------------------------------------
// Billing monitor pipeline (Phase 09; A5) — per authorised/billed List
// ---------------------------------------------------------------------------

export type MonitorStageState = 'done' | 'pending' | 'partial' | 'failed'
export interface MonitorStage {
  key: 'authorised' | 'run' | 'invoices' | 'emailed' | 'xero'
  label: string
  state: MonitorStageState
  detail: string
}
export interface MonitorCardRow {
  cardId: string
  patientName: string
  status: BillingPipelineStatus | 'cancelled'
  caseId?: string
  invoiceIds: string[]
  failure?: { code: string; message: string; procedureId?: ProcedureId }
}
export interface MonitorListRow {
  listId: string
  list: List
  anaesthetistName: string
  hospitalName?: string
  invoiceCount: number
  emailedCount: number
  failedCount: number
  stages: MonitorStage[]
  cardRows: MonitorCardRow[]
}

/**
 * Derive the billing-flow monitor: one row per AUTHORISED List (billed first),
 * each with its pipeline stage statuses and per-Card rows. Reuses the Phase 08
 * selectors so the monitor and the Invoices screen never diverge. The Xero
 * stage is a Phase-10 stub. Pure over AppState (tested + inspector-shareable).
 */
export function billingMonitor(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>): MonitorListRow[] {
  // Billed lists first (most recently billed first), then any authorised-unbilled
  // list, then by id — a plain comparator (the previous nested ternary read backwards).
  const lists = Object.values(state.schedule.lists)
    .filter((l) => l.state === 'AUTHORISED')
    .sort((a, b) => {
      const aBilled = a.billedAtISO !== undefined
      const bBilled = b.billedAtISO !== undefined
      if (aBilled && bBilled) return b.billedAtISO!.localeCompare(a.billedAtISO!)
      if (aBilled !== bBilled) return aBilled ? -1 : 1
      return a.id.localeCompare(b.id)
    })

  const isPrePaymentCase = (c: BillingCase): boolean =>
    c.invoiceId !== undefined && state.billing.invoices[c.invoiceId]?.kind === 'prePayment'

  return lists.map((list) => {
    const cards = cardsForList(state, list.id)
    // The monitor tracks the billing RUN, so it counts only standard (run)
    // invoices and cases — never the pre-payment pre-invoice, which is raised
    // separately (else a card with a paid deposit would read 'paid' and mask
    // its unpaid run invoice, and its list would overcount).
    const stdInvoices = invoicesForList(state, list.id).filter((i) => i.kind === 'standard')
    const cases = casesForList(state, list.id)
    const caseByCard = new Map<string, BillingCase[]>()
    for (const c of cases) caseByCard.set(c.cardId, [...(caseByCard.get(c.cardId) ?? []), c])

    const cardRows: MonitorCardRow[] = cards.map((card) => {
      if (card.cancellation !== undefined) {
        return { cardId: card.id, patientName: patientNameFor(state, card.patientId), status: 'cancelled', invoiceIds: [] }
      }
      const runCases = (caseByCard.get(card.id) ?? []).filter((c) => !isPrePaymentCase(c))
      const failed = runCases.find((c) => c.status === 'failed')
      const invoiceIds = runCases.filter((c) => c.invoiceId !== undefined).map((c) => c.invoiceId as string)
      const row: MonitorCardRow = {
        cardId: card.id,
        patientName: patientNameFor(state, card.patientId),
        status: failed !== undefined ? 'failed' : runCases[0]?.status ?? 'pending',
        invoiceIds,
      }
      // Prefer the failed case for the retry action.
      const primary = failed ?? runCases[0]
      if (primary !== undefined) row.caseId = primary.id
      if (failed?.failure !== undefined) row.failure = failed.failure
      return row
    })

    const failedCount = cardRows.filter((r) => r.status === 'failed').length
    const emailedCount = stdInvoices.filter((i) => i.emailedAtISO !== undefined).length
    const billed = list.billedAtISO !== undefined

    const stages: MonitorStage[] = [
      { key: 'authorised', label: 'List authorised', state: 'done', detail: 'Ready for the billing run.' },
      {
        key: 'run',
        label: 'Billing run',
        state: billed ? (failedCount > 0 ? 'partial' : 'done') : 'pending',
        detail: billed
          ? failedCount > 0
            ? `${failedCount} card${failedCount === 1 ? '' : 's'} need attention; the rest billed.`
            : 'Completed.'
          : 'Not run yet.',
      },
      {
        key: 'invoices',
        label: 'Invoices generated',
        state: !billed ? 'pending' : failedCount > 0 ? 'partial' : 'done',
        detail: `${stdInvoices.length} invoice${stdInvoices.length === 1 ? '' : 's'}.`,
      },
      {
        key: 'emailed',
        label: 'Emailed / presented',
        state: stdInvoices.length === 0 ? 'pending' : emailedCount === 0 ? 'pending' : emailedCount === stdInvoices.length ? 'done' : 'partial',
        detail: `${emailedCount} of ${stdInvoices.length} sent.`,
      },
      { key: 'xero', label: 'Xero handoff', state: 'pending', detail: 'Simulated in Phase 10.' },
    ]

    const monitorRow: MonitorListRow = {
      listId: list.id,
      list,
      anaesthetistName: state.masters.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId,
      invoiceCount: stdInvoices.length,
      emailedCount,
      failedCount,
      stages,
      cardRows,
    }
    const hospitalName = list.hospitalId !== undefined ? state.masters.hospitals[list.hospitalId]?.name : undefined
    if (hospitalName !== undefined) monitorRow.hospitalName = hospitalName
    return monitorRow
  })
}

function patientNameFor(state: Pick<AppState, 'masters'>, patientId: string): string {
  return state.masters.patients[patientId]?.name ?? patientId
}

/** Display name for a billing counterparty (any kind), falling back to its id. */
export function counterpartyName(state: Pick<AppState, 'masters'>, ref: CounterpartyRef): string {
  switch (ref.kind) {
    case 'hospital':
      return state.masters.hospitals[ref.id]?.name ?? ref.id
    case 'insurer':
      return state.masters.insurers[ref.id]?.name ?? ref.id
    case 'surgeon':
      return state.masters.surgeons[ref.id]?.name ?? ref.id
    case 'organisation':
      return state.masters.organisations[ref.id]?.name ?? ref.id
    case 'patient':
      return state.masters.patients[ref.id]?.name ?? ref.id
    case 'billableParty':
      return state.masters.billableParties[ref.id]?.name ?? ref.id
  }
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
