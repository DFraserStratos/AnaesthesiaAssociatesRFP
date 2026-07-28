/**
 * Rich, deterministic audit history for the pristine demo seed.
 *
 * Seed state still represents the current truth, but every Card now carries a
 * useful journey that can be opened without first staging live edits:
 * booking, scheduling context, Procedure setup, capture where present, fee
 * lines where present, and the final completion or cancellation fact.
 *
 * Existing lifecycle entries from `cards.ts` remain authoritative. This
 * builder fills the earlier story around them, adds missing completion facts
 * for generic and historical Cards, orders the combined log chronologically,
 * and allocates one sequential audit-id space for runtime writes to continue.
 */

import { addDays, addMinutes, format, parseISO } from 'date-fns'
import type {
  Anaesthetist,
  AuditEntry,
  BillingLine,
  Card,
  List,
  Procedure,
} from '../types'
import { DEMO_TODAY } from '../clock'

interface SeedAuditInput {
  existing: readonly AuditEntry[]
  anaesthetists: Record<string, Anaesthetist>
  lists: Record<string, List>
  cards: Record<string, Card>
  procedures: Record<string, Procedure>
  billingLines: Record<string, BillingLine>
}

type AuditDraft = Omit<AuditEntry, 'id'>

interface StagedAudit {
  entry: AuditDraft
  insertion: number
}

const OFFICE_NAME = 'Kirsty W.'

function shiftISO(atISO: string, minutes: number): string {
  return format(addMinutes(parseISO(atISO), minutes), "yyyy-MM-dd'T'HH:mm:ss")
}

function bookingISO(listDateISO: string, cardIndex: number): string {
  const leadDays = 6 + (cardIndex % 9)
  const minuteOfDay = 8 * 60 + 20 + ((cardIndex * 23) % (7 * 60))
  const candidateDateISO = format(addDays(parseISO(listDateISO), -leadDays), 'yyyy-MM-dd')
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  const candidateISO = `${candidateDateISO}T${time}`
  // Future Lists are already booked when the demo opens. If their ordinary
  // lead time would place the generated booking after the pinned reset clock,
  // move it into the preceding five days instead of inventing future history.
  const dateISO =
    candidateISO >= `${DEMO_TODAY}T08:00:00`
      ? format(addDays(parseISO(DEMO_TODAY), -(1 + (cardIndex % 5))), 'yyyy-MM-dd')
      : candidateDateISO
  return `${dateISO}T${time}`
}

function anaesthetistName(input: SeedAuditInput, list: List): string {
  return input.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId
}

function existingDraft(entry: AuditEntry): AuditDraft {
  const draft: AuditDraft = {
    entityType: entry.entityType,
    entityId: entry.entityId,
    who: entry.who,
    role: entry.role,
    source: entry.source,
    action: entry.action,
    atISO: entry.atISO,
  }
  if (entry.before !== undefined) draft.before = entry.before
  if (entry.after !== undefined) draft.after = entry.after
  return draft
}

function procedureSetup(procedure: Procedure): Record<string, unknown> {
  const after: Record<string, unknown> = {
    billingRoute: procedure.billingRoute,
    governingContractId: procedure.governingContractId,
    insurerId: procedure.insurerId,
    billablePartyId: procedure.billablePartyId,
    patientPaymentCategory: procedure.patientPaymentCategory,
    prepaymentDetail: procedure.prepaymentDetail,
    accRelated: procedure.accRelated,
    billingReference: procedure.billingReference,
    isAdditional: procedure.isAdditional,
    rvgBaseCode: procedure.rvgBaseCode,
    baseUnitsSelected: procedure.baseUnitsSelected,
    selectedModifierCodes: procedure.selectedModifierCodes,
    priceOverride: procedure.priceOverride,
  }
  return Object.fromEntries(Object.entries(after).filter(([, value]) => value !== undefined))
}

function procedureCapture(procedure: Procedure): Record<string, unknown> {
  const after: Record<string, unknown> = {
    asaClass: procedure.asaClass,
    baseUnitsCaptured: procedure.baseUnitsCaptured,
    timeUnitsCaptured: procedure.timeUnitsCaptured,
    modifierUnitsCaptured: procedure.modifierUnitsCaptured,
    anaestheticStartISO: procedure.anaestheticStartISO,
    handoverISO: procedure.handoverISO,
    intNotes: procedure.intNotes,
    opNotes: procedure.opNotes,
  }
  return Object.fromEntries(Object.entries(after).filter(([, value]) => value !== undefined))
}

function cardContext(card: Card): Record<string, unknown> {
  const after: Record<string, unknown> = {
    scheduledTime: card.scheduledTime,
    copiedFromCardId: card.copiedFromCardId,
    cardType: card.cardType,
    addendumOfCardId: card.addendumOfCardId,
    notes: card.notes,
    attachments: card.attachments.length > 0 ? card.attachments : undefined,
  }
  return Object.fromEntries(Object.entries(after).filter(([, value]) => value !== undefined))
}

function billingLineSnapshot(line: BillingLine): Record<string, unknown> {
  const after: Record<string, unknown> = {
    procedureId: line.procedureId,
    chargeBasis: line.chargeBasis,
    units: line.units,
    rate: line.rate,
    hours: line.hours,
    amount: line.amount,
    description: line.description,
    funderOverride: line.funderOverride,
  }
  return Object.fromEntries(Object.entries(after).filter(([, value]) => value !== undefined))
}

export function buildSeedAudit(input: SeedAuditInput): AuditEntry[] {
  const staged: StagedAudit[] = []
  let insertion = 0
  const push = (entry: AuditDraft): void => {
    insertion += 1
    staged.push({ entry, insertion })
  }

  for (const entry of input.existing) push(existingDraft(entry))

  const existingActions = new Set(
    input.existing.map((entry) => `${entry.entityType}|${entry.entityId}|${entry.action}`),
  )
  const proceduresByCard = new Map<string, Procedure[]>()
  for (const procedure of Object.values(input.procedures)) {
    const rows = proceduresByCard.get(procedure.cardId) ?? []
    rows.push(procedure)
    proceduresByCard.set(procedure.cardId, rows)
  }
  for (const rows of proceduresByCard.values()) rows.sort((a, b) => a.id.localeCompare(b.id))

  const linesByProcedure = new Map<string, BillingLine[]>()
  for (const line of Object.values(input.billingLines)) {
    const rows = linesByProcedure.get(line.procedureId) ?? []
    rows.push(line)
    linesByProcedure.set(line.procedureId, rows)
  }
  for (const rows of linesByProcedure.values()) rows.sort((a, b) => a.id.localeCompare(b.id))

  const cards = Object.values(input.cards).sort((a, b) => a.id.localeCompare(b.id))
  cards.forEach((card, cardIndex) => {
    const list = input.lists[card.listId]
    if (list === undefined) throw new Error(`seed audit Card ${card.id} references missing List ${card.listId}`)

    const bookedAtISO = bookingISO(list.dateISO, cardIndex)
    const anaesthetist = anaesthetistName(input, list)
    const integrationOrigin = card.correlationRef !== undefined
    const bookingWho = integrationOrigin ? 'Hospital booking feed' : OFFICE_NAME
    const bookingRole = integrationOrigin ? 'system' : 'office'
    const bookingSource = integrationOrigin ? 'integration' : 'office'

    const createdAfter: Record<string, unknown> = {
      patientId: card.patientId,
      listId: card.listId,
    }
    if (card.correlationRef !== undefined) createdAfter.correlationRef = card.correlationRef
    push({
      entityType: 'card',
      entityId: card.id,
      who: bookingWho,
      role: bookingRole,
      source: bookingSource,
      action: 'card.create',
      after: createdAfter,
      atISO: bookedAtISO,
    })

    const context = cardContext(card)
    if (Object.keys(context).length > 0) {
      push({
        entityType: 'card',
        entityId: card.id,
        who: bookingWho,
        role: bookingRole,
        source: bookingSource,
        action: 'card.update',
        after: context,
        atISO: shiftISO(bookedAtISO, 2),
      })
    }

    const procedures = proceduresByCard.get(card.id) ?? []
    procedures.forEach((procedure, procedureIndex) => {
      const procedureBaseISO = shiftISO(bookedAtISO, 4 + procedureIndex * 4)
      push({
        entityType: 'procedure',
        entityId: procedure.id,
        who: bookingWho,
        role: bookingRole,
        source: bookingSource,
        action: 'procedure.create',
        after: { cardId: card.id, description: procedure.description },
        atISO: procedureBaseISO,
      })

      const setup = procedureSetup(procedure)
      if (Object.keys(setup).length > 0) {
        push({
          entityType: 'procedure',
          entityId: procedure.id,
          who: OFFICE_NAME,
          role: 'office',
          source: 'office',
          action: 'procedure.update',
          after: setup,
          atISO: shiftISO(procedureBaseISO, 1),
        })
      }

      const lines = linesByProcedure.get(procedure.id) ?? []
      lines.forEach((line, lineIndex) => {
        push({
          entityType: 'billingLine',
          entityId: line.id,
          who: OFFICE_NAME,
          role: 'office',
          source: 'office',
          action: 'billingLine.add',
          after: billingLineSnapshot(line),
          atISO: shiftISO(procedureBaseISO, 2 + lineIndex),
        })
      })

      const capture = procedureCapture(procedure)
      if (Object.keys(capture).length > 0) {
        const capturedAtISO =
          card.completedAtISO !== undefined
            ? shiftISO(card.completedAtISO, -2 - procedureIndex)
            : card.lastModifiedAtISO
        push({
          entityType: 'procedure',
          entityId: procedure.id,
          who: anaesthetist,
          role: 'anaesthetist',
          source: 'anaesthetist',
          action: 'procedure.update',
          after: capture,
          atISO: capturedAtISO,
        })
      }
    })

    const completedKey = `card|${card.id}|card.complete`
    if (card.completed && !existingActions.has(completedKey)) {
      push({
        entityType: 'card',
        entityId: card.id,
        who: anaesthetist,
        role: 'anaesthetist',
        source: 'anaesthetist',
        action: 'card.complete',
        after: { completed: true },
        atISO: card.completedAtISO ?? card.lastModifiedAtISO,
      })
    }

    const cancelledKey = `card|${card.id}|card.cancel`
    if (card.cancellation !== undefined && !existingActions.has(cancelledKey)) {
      push({
        entityType: 'card',
        entityId: card.id,
        who: card.cancellation.by,
        role: card.cancellation.role,
        source: card.cancellation.source,
        action: 'card.cancel',
        after: { cancelled: true, reason: card.cancellation.reason },
        atISO: card.cancellation.atISO,
      })
    }
  })

  staged.sort((a, b) => {
    if (a.entry.atISO !== b.entry.atISO) return a.entry.atISO.localeCompare(b.entry.atISO)
    return a.insertion - b.insertion
  })

  return staged.map(({ entry }, index) => ({
    ...entry,
    id: `A${String(index + 1).padStart(4, '0')}`,
  }))
}
