/**
 * The procedure text and the invoice description (catch-up Phase 20a;
 * US-02.5.7, US-08.4.6, DM-51; D37, D73).
 *
 * - `replaceProcedureText`: the one write path for the procedure text after
 *   create. The hospital's download and feed, the PDF ingest and the demo
 *   action call it now; Phase 33's matching screen calls it by this name. The
 *   replaced text is written to the Booking's change history as the audit
 *   entry `procedure.procedureText.replace` (US-02.5.5: append-only; never a
 *   second field on the Procedure). Stored exactly as given.
 * - `setInvoiceDescription` and `applyDefaultInvoiceDescription`: the
 *   office's only edits of the invoice description; the procedure text and
 *   its history never change.
 *
 * Every write is one audited `mutate()` commit (PROGRESS convention 7).
 */

import type { ProcedureTextSource } from '../domain/types'
import {
  defaultInvoiceDescriptionFor,
  isBlankText,
  procedureTextOf,
  refreshedInvoiceDescriptionFor,
  replacesProcedureText,
} from '../domain/billing/procedureStack'
import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

export const PROCEDURE_TEXT_BLANK_MESSAGE = 'The procedure text cannot be blank.'
export const INVOICE_DESCRIPTION_BLANK_MESSAGE = 'The invoice needs a description.'
const INVOICE_DESCRIPTION_OFFICE_ONLY_MESSAGE = 'Only the AA office changes the invoice description.'

/**
 * Put a later text in place of the held one (US-02.5.7): when
 * `replacesProcedureText` says so (a different text; never a rooms' text over
 * a hospital's; never an identical one), stamped with the demo clock, the
 * replaced text written to the change history, and the invoice description
 * refreshed in the same commit (`refreshInvoiceDescription`: the hospital's
 * text becomes the default unless the Contract's description or an office
 * edit holds). A blank text is refused; a text that does not replace returns
 * `ok` with `replaced: false` and changes nothing. Rights follow
 * `editRefusal` (as `editProcedure`); no screen offers it to a person.
 */
export function replaceProcedureText(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  incoming: { text: string; source: ProcedureTextSource; from?: string },
): Outcome<{ replaced: boolean }> {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights
  if (isBlankText(incoming.text)) return refuse('procedureTextBlank', PROCEDURE_TEXT_BLANK_MESSAGE)
  if (!replacesProcedureText(procedure.procedureText, incoming)) return ok({ replaced: false })

  const atISO = clockISO(state.clock)
  const nextText = procedureTextOf(incoming.text, incoming.source, atISO, incoming.from)
  const withText = { ...procedure, procedureText: nextText }
  const next = { ...withText, invoiceDescription: refreshedInvoiceDescriptionFor(withText, state.masters.contracts) }
  const held = procedure.procedureText
  const descriptionChanged = procedure.invoiceDescription?.text !== next.invoiceDescription?.text

  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.procedureText.replace',
      before: {
        bookingId: procedure.bookingId,
        procedureText: held,
        ...(descriptionChanged ? { invoiceDescription: procedure.invoiceDescription?.text ?? null } : {}),
      },
      after: {
        bookingId: procedure.bookingId,
        procedureText: { text: nextText.text, source: nextText.source, ...(nextText.from !== undefined ? { from: nextText.from } : {}) },
        ...(descriptionChanged ? { invoiceDescription: next.invoiceDescription?.text ?? null } : {}),
      },
    },
    (s) => ({
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } },
    }),
  )
  return ok({ replaced: true })
}

/** The office's edit gate: office only, the usual window (until AUTHORISED, D63). */
function invoiceDescriptionRefusal(api: AppStoreApi, actor: Actor, procedureId: string): Outcome<never> | null {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  if (actor.role !== 'office') return refuse('officeOnly', INVOICE_DESCRIPTION_OFFICE_ONLY_MESSAGE)
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  return editRefusal(actor, found.list)
}

/**
 * The office's free-text edit of the invoice description (US-08.4.6 "Admin
 * edit"; D73): it always wins, over a late hospital text and over a Contract
 * chosen or changed. Records the default's text at the moment of the edit
 * (`editedOver`), so a newer default shows as a cue. A blank text is refused;
 * the procedure text is never touched.
 */
export function setInvoiceDescription(api: AppStoreApi, actor: Actor, procedureId: string, text: string): Outcome {
  const refused = invoiceDescriptionRefusal(api, actor, procedureId)
  if (refused !== null) return refused
  if (isBlankText(text)) return refuse('invoiceDescriptionBlank', INVOICE_DESCRIPTION_BLANK_MESSAGE)
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]!
  const current = procedure.invoiceDescription
  // Saving the wording unchanged is no edit: the description keeps following its defaults.
  if (current !== null && current.text === text) return ok(undefined)
  const fallback = defaultInvoiceDescriptionFor(procedure, state.masters.contracts)
  const next = { text, origin: 'edited' as const, editedOver: fallback?.text ?? '' }
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.invoiceDescription.set',
      before: { bookingId: procedure.bookingId, invoiceDescription: current?.text ?? null },
      after: { bookingId: procedure.bookingId, invoiceDescription: text },
    },
    (s) => ({
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: { ...procedure, invoiceDescription: next } } },
    }),
  )
  return ok(undefined)
}

/**
 * The "newer description" cue's "Use it": the invoice description goes back
 * to the current default (the order of defaults), with its origin. Office
 * only, the same window as the edit.
 */
export function applyDefaultInvoiceDescription(api: AppStoreApi, actor: Actor, procedureId: string): Outcome {
  const refused = invoiceDescriptionRefusal(api, actor, procedureId)
  if (refused !== null) return refused
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]!
  const fallback = defaultInvoiceDescriptionFor(procedure, state.masters.contracts)
  if (fallback === null) return refuse('noDefault', 'There is no description to use yet.')
  const current = procedure.invoiceDescription
  if (current !== null && current.origin === fallback.origin && current.text === fallback.text) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.invoiceDescription.applyDefault',
      before: { bookingId: procedure.bookingId, invoiceDescription: current?.text ?? null },
      after: { bookingId: procedure.bookingId, invoiceDescription: fallback.text },
    },
    (s) => ({
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: { ...procedure, invoiceDescription: fallback } } },
    }),
  )
  return ok(undefined)
}
