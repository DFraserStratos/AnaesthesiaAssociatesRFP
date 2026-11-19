/**
 * A Booking as it was at an earlier point of its history (catch-up Phase 35;
 * US-02.3.2, DM-35): the snapshot now, with the audit undone newest first
 * back to a cut (an entry, or a time).
 *
 * Every action code that touches a Booking, its Procedures or the patient
 * is named in `REVERSE` below, with how it is undone.
 * The audit was written for people to read, so some entries carry a display
 * view rather than the field (a payer's name, a modifier's printed code, an
 * invoice description's text). Those are mapped back explicitly where the
 * view is enough; where it is not, the walk stops and reports `incompleteAt`
 * rather than guessing.
 *
 * Pure: no React, no store imports.
 */

import type { BookingSnapshot } from './changeSets'
import type { AuditEntry, Booking, Patient, Procedure } from './types'

/** Where to stop: just after one entry, or after the last entry at or before a time. */
export type AsAtCut = { afterEntryId: string } | { atISO: string }

export interface BookingAsAtResult {
  snapshot: BookingSnapshot
  /** The entry the walk could not undo (the snapshot is the state just after it). */
  incompleteAt?: { entryId: string; action: string }
}

/** The modifier master, for the entries that name a modifier by its printed code. */
export interface BookingAsAtContext {
  modifiers?: Readonly<Record<string, { id: string; code: string; factor: string }>>
}

type Obj = Record<string, unknown>

interface Work {
  booking: Obj
  procedures: Record<string, Obj>
  patient: Obj | undefined
}

/** One undo step's result: applied, nothing to undo, the earliest state reached, or not undoable. */
type Step = 'ok' | 'skip' | 'stop' | 'incomplete'

interface Ctx {
  context: BookingAsAtContext
  entries: readonly AuditEntry[]
  /** This entry's position in `entries`. */
  index: number
  /** Every modifier claim seen on the Booking during the walk, by modifier id (for units a view leaves out). */
  knownClaims: Map<string, Obj>
  /** `procedure.setPrimary`: the modifiers-step answer the new primary carried, handed back to the old one. */
  carriedConfirmed?: unknown
}

type Reverser = (w: Work, e: AuditEntry, ctx: Ctx) => Step

const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v)
const objOf = (v: unknown): Obj => (isObj(v) ? v : {})

/** Procedure fields where null is a real value (no text received, no description yet). */
const NULLABLE_PROCEDURE_FIELDS: ReadonlySet<string> = new Set(['procedureText', 'invoiceDescription'])

function setOrDelete(target: Obj, key: string, value: unknown, nullable: boolean): void {
  if (value === undefined || (value === null && !nullable)) delete target[key]
  else target[key] = value
}

// ---------------------------------------------------------------------------
// Modifier views (`CODE · factor`, `CODE: explanation`) back to ids
// ---------------------------------------------------------------------------

function modifierIdForLabel(label: unknown, ctx: Ctx): string | undefined {
  if (typeof label !== 'string') return undefined
  const master = ctx.context.modifiers
  if (master === undefined) return undefined
  if (master[label] !== undefined) return label
  const at = label.indexOf(' · ')
  const code = at >= 0 ? label.slice(0, at) : label
  const factor = at >= 0 ? label.slice(at + 3) : undefined
  const rows = Object.values(master).filter((m) => m.code === code && (factor === undefined || m.factor === factor))
  return (rows.find((m) => ctx.knownClaims.has(m.id)) ?? rows[0])?.id
}

/** A modifier id for a printed code, preferring one already on the Booking (codes are not unique). */
function modifierIdForCode(code: string, ctx: Ctx, preferred: ReadonlySet<string>): string | undefined {
  const master = ctx.context.modifiers
  if (master === undefined) return undefined
  if (master[code] !== undefined) return code
  const rows = Object.values(master).filter((m) => m.code === code)
  return (rows.find((m) => preferred.has(m.id)) ?? rows.find((m) => ctx.knownClaims.has(m.id)) ?? rows[0])?.id
}

function claimFrom(modifierId: string, explanation: unknown, units: unknown): Obj {
  return { modifierId, ...(typeof units === 'number' ? { units } : {}), explanation: typeof explanation === 'string' ? explanation : '' }
}

/** `claimsAuditView`'s `CODE: explanation` strings back to claims; units from a claim seen on the Booking. */
function claimsFromView(view: readonly string[], ctx: Ctx): Obj[] | undefined {
  const out: Obj[] = []
  for (const row of view) {
    const at = row.indexOf(': ')
    if (at < 0) return undefined
    const id = modifierIdForCode(row.slice(0, at), ctx, new Set())
    if (id === undefined) return undefined
    out.push(claimFrom(id, row.slice(at + 2), ctx.knownClaims.get(id)?.units))
  }
  return out
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObjArray = (v: unknown): v is Obj[] => Array.isArray(v) && v.every(isObj)

/** True when an entry's modifier keys are `claimsAuditView`'s display view, not the stored fields. */
function hasModifierView(side: Obj): boolean {
  const claims = side.modifierClaims
  return Array.isArray(claims) && claims.length > 0 && isStringArray(claims)
}

// ---------------------------------------------------------------------------
// The generic field restore
// ---------------------------------------------------------------------------

/**
 * Put an update's `before` back: each key in `before` is restored, a key only
 * in `after` is deleted. A procedure entry's `bookingId` is routing, not a
 * change. Display views of a field are mapped back, or the step is refused.
 * With `firstSet`, an entry with no `before` at all (the seed's narrative of
 * how a Booking was filled in) means every key in `after` was not yet set.
 */
function restoreFields(
  entityType: 'booking' | 'procedure' | 'patient',
  target: Obj,
  e: AuditEntry,
  ctx: Ctx,
  firstSet = false,
): Step {
  if (e.before === undefined && !firstSet) return 'incomplete'
  if (e.before !== undefined && !isObj(e.before)) return 'incomplete'
  const before = objOf(e.before)
  const after = objOf(e.after)
  const view = entityType === 'procedure' && (hasModifierView(before) || hasModifierView(after))
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  // Checked in full before anything is written, so a refused step leaves the entity as it was.
  const writes: Array<[string, unknown, boolean]> = []
  for (const key of keys) {
    if (entityType === 'procedure' && key === 'bookingId') {
      const routed = key in before ? before[key] : after[key]
      if (routed === target.bookingId) continue
    }
    const has = key in before
    let value = has ? before[key] : undefined
    if (entityType === 'procedure') {
      if (key === 'payer' && has && !isObj(value)) return 'incomplete'
      if (key === 'invoiceDescription' && typeof value === 'string') {
        // The audit records the description's text; its origin is kept from the current value.
        const current = target.invoiceDescription
        value = isObj(current) ? (current.text === value ? current : { ...current, text: value }) : { text: value, origin: 'edited' }
      }
      if (key === 'modifierClaims' && has && isStringArray(value) && value.length > 0) {
        const claims = claimsFromView(value, ctx)
        if (claims === undefined) return 'incomplete'
        value = claims
      } else if (key === 'modifierClaims' && has && !isObjArray(value)) {
        return 'incomplete'
      }
      if (key === 'removedModifierIds' && has && isStringArray(value) && value.length > 0 && view) {
        const preferred = new Set(Array.isArray(target.removedModifierIds) ? (target.removedModifierIds as string[]) : [])
        const ids = value.map((code) => modifierIdForCode(code, ctx, preferred))
        if (ids.some((id) => id === undefined)) return 'incomplete'
        value = ids
      }
    }
    if (entityType === 'patient' && key === 'postalAddress' && has && value !== undefined && value !== null && !isObj(value)) {
      return 'incomplete'
    }
    writes.push([key, value, entityType === 'procedure' && NULLABLE_PROCEDURE_FIELDS.has(key)])
  }
  for (const [key, value, nullable] of writes) setOrDelete(target, key, value, nullable)
  return 'ok'
}

// ---------------------------------------------------------------------------
// The reverse table: one entry per action code
// ---------------------------------------------------------------------------

const skip: Reverser = () => 'skip'

const bookingFields: Reverser = (w, e, ctx) => restoreFields('booking', w.booking, e, ctx)

function onProcedure(fn: (p: Obj, w: Work, e: AuditEntry, ctx: Ctx) => Step): Reverser {
  return (w, e, ctx) => {
    const p = w.procedures[e.entityId]
    return p === undefined ? 'incomplete' : fn(p, w, e, ctx)
  }
}

const procedureFields: Reverser = onProcedure((p, _w, e, ctx) => restoreFields('procedure', p, e, ctx))

/** Whether a modifier entry carries the stored fields (a save) rather than the display view. */
const rawModifierEntry = (e: AuditEntry): boolean => {
  const b = objOf(e.before)
  return 'modifierClaims' in b && isObjArray(b.modifierClaims)
}

function claimsOf(p: Obj): Obj[] {
  return isObjArray(p.modifierClaims) ? p.modifierClaims : []
}

function removedOf(p: Obj): string[] {
  return isStringArray(p.removedModifierIds) ? p.removedModifierIds : []
}

const REVERSE: Readonly<Record<string, Reverser>> = {
  // --- the Booking ---
  /** createBooking, the seed: the earliest state; the walk ends here. */
  'booking.create': () => 'stop',
  /** editBooking (before/after), the seed's narrative (after only: first set), a save. */
  'booking.update': (w, e, ctx) => restoreFields('booking', w.booking, e, ctx, true),
  /** completeBooking: before `{ completed: false }`; the seed writes after only. */
  'booking.complete': (w) => {
    w.booking.completed = false
    delete w.booking.completedAtISO
    return 'ok'
  },
  /** uncompleteBooking, a Contract change that re-opens: the completion time is the last `booking.complete` entry's. */
  'booking.uncomplete': (w, e, ctx) => {
    for (let i = ctx.index - 1; i >= 0; i--) {
      const prior = ctx.entries[i]!
      if (prior.entityId === e.entityId && prior.action === 'booking.complete') {
        w.booking.completed = true
        w.booking.completedAtISO = prior.atISO
        return 'ok'
      }
    }
    return 'incomplete'
  },
  /** cancelBooking: after `{ cancelled, reason }`; the cancellation record goes. */
  'booking.cancel': (w) => {
    delete w.booking.cancellation
    return 'ok'
  },
  /** reassignBooking: before `{ listId }`. */
  'booking.reassign': bookingFields,
  /** moveBookingToAnaesthetist: before `{ listId, anaesthetistId }` (the anaesthetist is the List's, not the Booking's). */
  'booking.movedToAnaesthetist': (w, e) => {
    const listId = objOf(e.before).listId
    if (typeof listId !== 'string') return 'incomplete'
    w.booking.listId = listId
    return 'ok'
  },
  /** setBookingInsurance: the approval number as stored; the funder only as its name, so a funder change is not undoable. */
  'booking.insurance': (w, e, ctx) => {
    const before = objOf(e.before)
    const after = objOf(e.after)
    if ('funderPartyId' in before || 'funderPartyId' in after) return restoreFields('booking', w.booking, e, ctx)
    if ('insurerOrFunder' in before && before.insurerOrFunder !== after.insurerOrFunder) return 'incomplete'
    if ('insuranceApprovalNumber' in before) setOrDelete(w.booking, 'insuranceApprovalNumber', before.insuranceApprovalNumber, false)
    return 'ok'
  },
  // Headers and records that change nothing on the snapshot.
  /** The office save's header (its changes are their own entries). */
  'booking.save': skip,
  'booking.warningCleared': skip,
  'booking.warningSampleUnstaged': skip,
  /** authoriseList's lock summary (the lock lives beside the Booking, not on it). */
  'booking.lock': skip,
  'booking.billed': skip,
  'booking.billingException': skip,
  'booking.prepaidSettled': skip,
  /** The matching screen's row record (the applied fields are their own entries). */
  'booking.fromHospitalRow': skip,
  'prepayment.transfer': skip,
  'updateEmail.drafted': skip,

  // --- its Procedures ---
  /** createBooking, addProcedure, the seed, a save: the Procedure goes. */
  'procedure.create': (w, e) => {
    delete w.procedures[e.entityId]
    return 'ok'
  },
  /** removeProcedure, a save: the whole Procedure is in `before`. */
  'procedure.remove': (w, e) => {
    const before = e.before
    if (!isObj(before) || before.id !== e.entityId || typeof before.bookingId !== 'string') return 'incomplete'
    w.procedures[e.entityId] = { ...before }
    return 'ok'
  },
  /** editProcedure, setRvgGroup, the warning samples (before/after), the seed's narrative (after only), a save. */
  'procedure.update': onProcedure((p, _w, e, ctx) => restoreFields('procedure', p, e, ctx, true)),
  /** setProcedureContract, clearing it: the Contract fields, the description's text and any modifier view. */
  'procedure.contract': procedureFields,
  /** setRailAnswers: before `{ railAnswers }`. */
  'procedure.railAnswers': procedureFields,
  /** setProcedureSplit: before `{ split }`, null for none. */
  'procedure.split': procedureFields,
  /** setProcedurePrice: before `{ enteredPrice }`, null for none. */
  'procedure.price': procedureFields,
  /** replaceProcedureText: before `{ bookingId, procedureText, invoiceDescription? (text) }`. */
  'procedure.procedureText.replace': procedureFields,
  /** setInvoiceDescription: before `{ bookingId, invoiceDescription }` as text. */
  'procedure.invoiceDescription.set': procedureFields,
  /** applyDefaultInvoiceDescription: as `.set`. */
  'procedure.invoiceDescription.applyDefault': procedureFields,
  /** setProcedurePayer: a save writes the payer itself; the action writes its name only, which is not undoable. */
  'procedure.payer': procedureFields,
  /** confirmNoModifiers: before `{ modifiersConfirmed: false }`. */
  'procedure.modifiersConfirm': procedureFields,
  /** approveContractSelection, authoriseList: before `{ contractApproved: false }`; the approval stamp goes. */
  'procedure.contractApprove': onProcedure((p, _w, e, ctx) => {
    if ('contractApproval' in objOf(e.before)) return restoreFields('procedure', p, e, ctx)
    delete p.contractApproval
    return 'ok'
  }),
  /** claimModifier: after is the claim's view; the claim goes (the modifiers-step answer it set is kept). */
  'procedure.modifierClaim': onProcedure((p, _w, e, ctx) => {
    if (rawModifierEntry(e)) return restoreFields('procedure', p, e, ctx)
    const id = modifierIdForLabel(objOf(e.after).modifier, ctx)
    if (id === undefined) return 'incomplete'
    p.modifierClaims = claimsOf(p).filter((c) => c.modifierId !== id)
    return 'ok'
  }),
  /** removeModifier (a claim): before is the claim's view; the claim comes back, last. */
  'procedure.modifierUnclaim': onProcedure((p, _w, e, ctx) => {
    if (rawModifierEntry(e)) return restoreFields('procedure', p, e, ctx)
    const before = objOf(e.before)
    const id = modifierIdForLabel(before.modifier, ctx)
    if (id === undefined) return 'incomplete'
    p.modifierClaims = [...claimsOf(p).filter((c) => c.modifierId !== id), claimFrom(id, before.explanation, before.units)]
    return 'ok'
  }),
  /** editModifierExplanation: before is the claim's view; its explanation and units come back. */
  'procedure.modifierExplanation': onProcedure((p, _w, e, ctx) => {
    if (rawModifierEntry(e)) return restoreFields('procedure', p, e, ctx)
    const before = objOf(e.before)
    const id = modifierIdForLabel(before.modifier, ctx)
    if (id === undefined || !claimsOf(p).some((c) => c.modifierId === id)) return 'incomplete'
    p.modifierClaims = claimsOf(p).map((c) => (c.modifierId === id ? claimFrom(id, before.explanation, before.units) : c))
    return 'ok'
  }),
  /** removeModifier (pre-applied): before names the modifier; it leaves `removedModifierIds`. */
  'procedure.modifierRemove': onProcedure((p, _w, e, ctx) => {
    if ('removedModifierIds' in objOf(e.before)) return restoreFields('procedure', p, e, ctx)
    const id = modifierIdForLabel(objOf(e.before).modifier, ctx)
    if (id === undefined) return 'incomplete'
    p.removedModifierIds = removedOf(p).filter((m) => m !== id)
    return 'ok'
  }),
  /** restoreModifier: after names the modifier; it is removed again, and a dropped hand claim comes back. */
  'procedure.modifierRestore': onProcedure((p, _w, e, ctx) => {
    if (rawModifierEntry(e)) return restoreFields('procedure', p, e, ctx)
    const before = objOf(e.before)
    const id = modifierIdForLabel(objOf(e.after).modifier, ctx)
    if (id === undefined) return 'incomplete'
    p.removedModifierIds = [...removedOf(p).filter((m) => m !== id), id]
    if (isStringArray(before.modifierClaims)) {
      const claims = claimsFromView(before.modifierClaims, ctx)
      if (claims === undefined) return 'incomplete'
      p.modifierClaims = claims
    }
    return 'ok'
  }),
  /**
   * setPrimaryProcedure: two entries, the old primary's then the new one's,
   * each with the flag and the modifier view. Undone newest first, the new
   * primary hands its modifiers-step answer (not in the view) back to the old.
   */
  'procedure.setPrimary': onProcedure((p, _w, e, ctx) => {
    const wasPrimary = objOf(e.before).isPrimary === true
    const confirmed = p.modifiersConfirmed
    const step = restoreFields('procedure', p, e, ctx)
    if (step === 'ok' && !wasPrimary) {
      ctx.carriedConfirmed = confirmed
      delete p.modifiersConfirmed
    }
    if (step === 'ok' && wasPrimary && ctx.carriedConfirmed !== undefined) {
      p.modifiersConfirmed = ctx.carriedConfirmed
      ctx.carriedConfirmed = undefined
    }
    return step
  }),

  // --- the patient ---
  /** The intake's new patient row: there was no patient record before. */
  'patient.create': (w) => {
    w.patient = undefined
    return 'ok'
  },
  /** editPatient, a save: before/after (a postal address as text is not undoable). */
  'patient.update': (w, e, ctx) => (w.patient === undefined ? 'incomplete' : restoreFields('patient', w.patient, e, ctx)),
  /** The intake matched an existing patient by NHI: nothing changed. */
  'patient.reuse': skip,
  // 'patient.ethnicity.correct' is not in the table: its `before` keeps only the code received,
  // not the code held before or the pending reason, so it stops the walk.
}

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

function auditSeq(id: string): number {
  const m = /(\d+)$/.exec(id)
  return m === null ? Number.NaN : Number(m[1])
}

/** The position of the last entry to keep (-1: undo them all). */
function cutIndex(entries: readonly AuditEntry[], cut: AsAtCut): number {
  if ('afterEntryId' in cut) {
    const at = entries.findIndex((e) => e.id === cut.afterEntryId)
    if (at >= 0) return at
    // An entry outside this Booking's history: keep everything up to it, by audit order.
    const seq = auditSeq(cut.afterEntryId)
    if (Number.isNaN(seq)) return entries.length - 1
    let last = -1
    entries.forEach((e, i) => {
      if (auditSeq(e.id) <= seq) last = i
    })
    return last
  }
  let last = -1
  entries.forEach((e, i) => {
    if (e.atISO <= cut.atISO) last = i
  })
  return last
}

/** Whether an entry is about this Booking as the walk now holds it. */
function belongs(w: Work, bookingId: string, patientIds: ReadonlySet<string>, e: AuditEntry): boolean {
  const before = objOf(e.before)
  const after = objOf(e.after)
  switch (e.entityType) {
    case 'booking':
      return e.entityId === bookingId
    case 'procedure':
      return w.procedures[e.entityId] !== undefined || before.bookingId === bookingId || after.bookingId === bookingId
    case 'patient':
      return patientIds.has(e.entityId)
    default:
      return false
  }
}

function harvestClaims(w: Work, known: Map<string, Obj>): void {
  for (const p of Object.values(w.procedures)) for (const c of claimsOf(p)) if (typeof c.modifierId === 'string') known.set(c.modifierId, c)
}

function toSnapshot(w: Work): BookingSnapshot {
  return {
    booking: w.booking as unknown as Booking,
    procedures: w.procedures as unknown as Record<string, Procedure>,
    ...(w.patient !== undefined ? { patient: w.patient as unknown as Patient } : {}),
  }
}

/**
 * The Booking as it was at `cut`: `now` with every entry after the cut undone,
 * newest first. `entries` is the audit in audit order (filtered to this
 * Booking's entities, though others are ignored). Stops at the Booking's
 * creation (the earliest state), or at an entry it cannot undo
 * (`incompleteAt`, the snapshot then being the state just after that entry).
 */
export function bookingAsAt(
  now: BookingSnapshot,
  entries: readonly AuditEntry[],
  cut: AsAtCut,
  context: BookingAsAtContext = {},
): BookingAsAtResult {
  const w: Work = {
    booking: { ...(now.booking as unknown as Obj) },
    procedures: Object.fromEntries(Object.entries(now.procedures).map(([id, p]) => [id, { ...(p as unknown as Obj) }])),
    patient: now.patient !== undefined ? { ...(now.patient as unknown as Obj) } : undefined,
  }
  const bookingId = now.booking.id
  const patientIds = new Set([now.booking.patientId, ...(now.patient !== undefined ? [now.patient.hiddenInternalId] : [])])
  const ctx: Ctx = { context, entries, index: 0, knownClaims: new Map() }
  const keep = cutIndex(entries, cut)

  for (let i = entries.length - 1; i > keep; i--) {
    const e = entries[i]!
    if (!belongs(w, bookingId, patientIds, e)) continue
    harvestClaims(w, ctx.knownClaims)
    ctx.index = i
    const reverser = REVERSE[e.action]
    let step: Step
    if (reverser !== undefined) step = reverser(w, e, ctx)
    else step = e.before === undefined && e.after === undefined ? 'skip' : 'incomplete'
    if (step === 'stop') break
    if (step === 'incomplete') return { snapshot: toSnapshot(w), incompleteAt: { entryId: e.id, action: e.action } }
    if (e.entityType === 'booking' && typeof w.booking.patientId === 'string') patientIds.add(w.booking.patientId)
  }
  return { snapshot: toSnapshot(w) }
}
