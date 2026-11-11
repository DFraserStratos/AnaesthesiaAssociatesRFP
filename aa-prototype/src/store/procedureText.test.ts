/**
 * The procedure text and the invoice description in the store (catch-up
 * Phase 20a; US-02.5.7 "Verbatim", "Hospital's replaces the rooms'",
 * "Original in the history", "Entered by hand"; US-08.4.6's ACs; D37, D73).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { applyDefaultInvoiceDescription, replaceProcedureText, setInvoiceDescription } from './procedureTextActions'
import { setProcedureContract } from './contractSelectionActions'
import { editContract } from './contractActions'
import { editProcedure } from './lifecycle'
import { createBooking, PROCEDURE_OR_CODE_REQUIRED_MESSAGE } from './bookingActions'
import { bookingsForList, invoiceLinesFor, proceduresForBooking } from './selectors'
import { invoiceLineGroups } from '../domain/billing/procedureStack'
import type { Actor } from './mutate'
import { RTK_BOOKING_ID, SEED_LIST_IDS } from '../domain/seed'
import { RVG_GROUP } from '../domain/seed/rvgGroups'
import type { ProcedurePatch } from './lifecycle'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const COLLEAGUE: Actor = { who: 'Dr Mark Delaney', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '27731' }
const FEED: Actor = { who: 'Hospital booking feed', role: 'system', source: 'integration' }

/** Wiremu Tane's lap chole (Dr Souter, Tue 21 PM, Southern Cross SXAP): the rooms' "lap chole +/- IOC". */
const TANE_PROC = 'P0006'
/** Doyle's bariatric primary, on Doyle's Gastric bypass (its invoice description "Gastric bypass, laparoscopic"). */
const DOYLE_PROC = 'P0029'
const SOUTER_PM = 'L-34821-2026-07-21-PM'

const store = (): BoundAppStore => createAppStore()
const proc = (api: BoundAppStore, id: string) => api.getState().schedule.procedures[id]!
const lastAudit = (api: BoundAppStore) => api.getState().audit.at(-1)!

describe('the seeded texts', () => {
  it('Tane starts with the rooms\' text and its invoice description; Doyle\'s is the Contract\'s', () => {
    const api = store()
    expect(proc(api, TANE_PROC).procedureText).toMatchObject({ text: 'lap chole +/- IOC', source: 'surgeonPdf' })
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'lap chole +/- IOC', origin: 'rooms' })
    expect(proc(api, DOYLE_PROC).invoiceDescription).toEqual({ text: 'Gastric bypass, laparoscopic', origin: 'contract' })
  })
})

describe('replaceProcedureText', () => {
  it('the hospital\'s text replaces the rooms\'; the history entry holds the rooms\' text with its source and time; the invoice description follows', () => {
    const api = store()
    const held = proc(api, TANE_PROC).procedureText!
    const out = replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole', source: 'hospitalDownload', from: 'Southern Cross' })
    expect(out).toEqual({ ok: true, value: { replaced: true } })
    expect(proc(api, TANE_PROC).procedureText).toMatchObject({ text: 'lap chole', source: 'hospitalDownload', from: 'Southern Cross' })
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'lap chole', origin: 'hospital' })
    expect(lastAudit(api)).toMatchObject({
      action: 'procedure.procedureText.replace',
      entityId: TANE_PROC,
      before: { procedureText: { text: 'lap chole +/- IOC', source: 'surgeonPdf', receivedAtISO: held.receivedAtISO } },
      after: { procedureText: { text: 'lap chole', source: 'hospitalDownload' } },
    })
    // Never a second field on the Procedure.
    expect(Object.keys(proc(api, TANE_PROC)).filter((k) => /text|description/i.test(k)).sort()).toEqual(['invoiceDescription', 'procedureText'])
  })

  it('a second different hospital text replaces again; an identical one changes nothing', () => {
    const api = store()
    replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole', source: 'hospitalFeed' })
    expect(replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole + IOC', source: 'hospitalFeed' })).toEqual({ ok: true, value: { replaced: true } })
    const audits = api.getState().audit.length
    expect(replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole + IOC', source: 'hospitalFeed' })).toEqual({ ok: true, value: { replaced: false } })
    expect(api.getState().audit.length).toBe(audits)
  })

  it('a rooms\' text never replaces a hospital\'s', () => {
    const api = store()
    replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole', source: 'hospitalFeed' })
    expect(replaceProcedureText(api, OFFICE, TANE_PROC, { text: 'lap chole, revised', source: 'surgeonPdf' })).toEqual({ ok: true, value: { replaced: false } })
    expect(proc(api, TANE_PROC).procedureText?.text).toBe('lap chole')
  })

  it('stores the text exactly: leading spaces, "?conv", "+/-" and a misspelling survive', () => {
    const api = store()
    const text = '  lap chloe ?conv +/- IOC '
    replaceProcedureText(api, FEED, TANE_PROC, { text, source: 'hospitalFeed' })
    expect(proc(api, TANE_PROC).procedureText?.text).toBe(text)
  })

  it('refuses a blank or whitespace-only text', () => {
    const api = store()
    expect(replaceProcedureText(api, FEED, TANE_PROC, { text: '   ', source: 'hospitalFeed' })).toMatchObject({ ok: false, code: 'procedureTextBlank' })
  })

  it('follows editRefusal: another anaesthetist is refused; an integration is refused on a SUBMITTED List', () => {
    const api = store()
    expect(replaceProcedureText(api, COLLEAGUE, TANE_PROC, { text: 'lap chole', source: 'anaesthetist' })).toMatchObject({ ok: false, code: 'notOwnList' })
    const submitted = SEED_LIST_IDS.morrisonMon20
    expect(api.getState().schedule.lists[submitted]!.state).toBe('SUBMITTED')
    const turp = proceduresForBooking(api.getState(), bookingsForList(api.getState(), submitted)[0]!.id)[0]!
    expect(replaceProcedureText(api, FEED, turp.id, { text: 'TURP, bipolar', source: 'hospitalFeed' })).toMatchObject({ ok: false, code: 'integrationImmutable' })
  })

  it('leaves a Contract\'s invoice description in place, with the newer cue only for an edit', () => {
    const api = store()
    replaceProcedureText(api, FEED, DOYLE_PROC, { text: 'lap RYGB', source: 'hospitalFeed' })
    expect(proc(api, DOYLE_PROC).invoiceDescription).toEqual({ text: 'Gastric bypass, laparoscopic', origin: 'contract' })
  })

  it('the seeded "RTK" Booking holds the hospital\'s text, and its history the rooms\' "RTK", earlier', () => {
    const api = store()
    const p = proceduresForBooking(api.getState(), RTK_BOOKING_ID)[0]!
    expect(p.procedureText).toMatchObject({ text: 'right total knee', source: 'hospitalDownload' })
    expect(p.invoiceDescription).toEqual({ text: 'right total knee', origin: 'hospital' })
    const replace = api.getState().audit.find((a) => a.action === 'procedure.procedureText.replace' && a.entityId === p.id)!
    expect(replace.before).toMatchObject({ procedureText: { text: 'RTK', source: 'surgeonPdf' } })
    const create = api.getState().audit.find((a) => a.action === 'procedure.create' && a.entityId === p.id)!
    expect(create.after).toMatchObject({ procedureText: { text: 'RTK' } })
    expect(create.atISO < replace.atISO).toBe(true)
  })
})

describe('editProcedure never touches either text', () => {
  it('refuses a procedureText or invoiceDescription patch at run time', () => {
    const api = store()
    const textPatch = { procedureText: null } as unknown as ProcedurePatch
    const descPatch = { invoiceDescription: { text: 'x', origin: 'edited' } } as unknown as ProcedurePatch
    expect(editProcedure(api, SOUTER, TANE_PROC, textPatch)).toMatchObject({ ok: false, code: 'procedureTextNotEditable' })
    expect(editProcedure(api, OFFICE, TANE_PROC, descPatch)).toMatchObject({ ok: false, code: 'procedureTextNotEditable' })
  })

  it('an RVG code edit leaves the text and the invoice description', () => {
    const api = store()
    const before = proc(api, TANE_PROC)
    expect(editProcedure(api, SOUTER, TANE_PROC, { rvgGroupId: RVG_GROUP.ll4! }).ok).toBe(true)
    expect(proc(api, TANE_PROC).procedureText).toEqual(before.procedureText)
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual(before.invoiceDescription)
  })
})

describe('createBooking: hand entry kept as typed (US-02.4.1)', () => {
  const patient = { name: 'Test Patient', dobISO: '1980-01-01' }

  it('stores the text verbatim with its source and sender, and starts the invoice description from it', () => {
    const api = store()
    const made = createBooking(api, SOUTER, SOUTER_PM, { patient, sourceText: { text: ' L TKJR ', source: 'anaesthetist', from: SOUTER.who } })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const p = proceduresForBooking(api.getState(), made.value.bookingId)[0]!
    expect(p.procedureText).toMatchObject({ text: ' L TKJR ', source: 'anaesthetist', from: 'Dr Melanie Souter' })
    expect(p.invoiceDescription).toEqual({ text: ' L TKJR ', origin: 'entered' })
  })

  it('saves with only an RVG code (no invoice description, never the code\'s wording), with both, and refuses neither', () => {
    const api = store()
    const codeOnly = createBooking(api, OFFICE, SOUTER_PM, { patient, rvgGroupId: RVG_GROUP.ll4! })
    expect(codeOnly.ok).toBe(true)
    if (codeOnly.ok) {
      const p = proceduresForBooking(api.getState(), codeOnly.value.bookingId)[0]!
      expect(p.procedureText).toBeNull()
      expect(p.invoiceDescription).toBeNull()
    }
    expect(createBooking(api, OFFICE, SOUTER_PM, { patient, rvgGroupId: RVG_GROUP.ll4!, sourceText: { text: 'RTK', source: 'email' } }).ok).toBe(true)
    expect(createBooking(api, OFFICE, SOUTER_PM, { patient })).toMatchObject({ ok: false, message: PROCEDURE_OR_CODE_REQUIRED_MESSAGE })
    expect(createBooking(api, OFFICE, SOUTER_PM, { patient, sourceText: { text: '   ', source: 'phone' } })).toMatchObject({ ok: false, code: 'procedureOrCodeRequired' })
  })

  it('an integration message with no text creates a Procedure with none (no invented wording)', () => {
    const api = store()
    const made = createBooking(api, FEED, SOUTER_PM, { patient })
    expect(made.ok).toBe(true)
    if (made.ok) expect(proceduresForBooking(api.getState(), made.value.bookingId)[0]!.procedureText).toBeNull()
  })
})

describe('the invoice description: the office edits, the edit wins (D73)', () => {
  it('the office edits as free text; the procedure text and its history do not change; the anaesthetist and a blank are refused', () => {
    const api = store()
    const text = proc(api, TANE_PROC).procedureText
    const replaces = api.getState().audit.filter((a) => a.action === 'procedure.procedureText.replace').length
    expect(setInvoiceDescription(api, SOUTER, TANE_PROC, 'Laparoscopic cholecystectomy')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(setInvoiceDescription(api, OFFICE, TANE_PROC, '  ')).toMatchObject({ ok: false, code: 'invoiceDescriptionBlank' })
    expect(setInvoiceDescription(api, OFFICE, TANE_PROC, 'Laparoscopic cholecystectomy').ok).toBe(true)
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'Laparoscopic cholecystectomy', origin: 'edited', editedOver: 'lap chole +/- IOC' })
    expect(proc(api, TANE_PROC).procedureText).toEqual(text)
    expect(api.getState().audit.filter((a) => a.action === 'procedure.procedureText.replace').length).toBe(replaces)
    expect(lastAudit(api)).toMatchObject({ action: 'procedure.invoiceDescription.set', before: { invoiceDescription: 'lap chole +/- IOC' }, after: { invoiceDescription: 'Laparoscopic cholecystectomy' } })
  })

  it('"Edit wins over a late description" and "over a Contract change"; "Use it" applies the newer default', () => {
    const api = store()
    setInvoiceDescription(api, OFFICE, TANE_PROC, 'Laparoscopic cholecystectomy')
    replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole', source: 'hospitalFeed' })
    expect(proc(api, TANE_PROC).invoiceDescription?.text).toBe('Laparoscopic cholecystectomy')
    // A Contract with its own invoice description, chosen after the edit.
    const s = api.getState()
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, 'CT-NO-CONTRACT': { ...s.masters.contracts['CT-NO-CONTRACT']!, invoiceDescription: 'Anaesthesia, general surgery' } } } })
    expect(setProcedureContract(api, OFFICE, TANE_PROC, 'CT-NO-CONTRACT').ok).toBe(true)
    expect(proc(api, TANE_PROC).invoiceDescription?.text).toBe('Laparoscopic cholecystectomy')
    expect(applyDefaultInvoiceDescription(api, SOUTER, TANE_PROC)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(applyDefaultInvoiceDescription(api, OFFICE, TANE_PROC).ok).toBe(true)
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'Anaesthesia, general surgery', origin: 'contract' })
    expect(lastAudit(api)).toMatchObject({ action: 'procedure.invoiceDescription.applyDefault' })
  })

  it('with no edit, a Contract with a description takes over and a blank one falls back to the text', () => {
    const api = store()
    const s = api.getState()
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, 'CT-NO-CONTRACT': { ...s.masters.contracts['CT-NO-CONTRACT']!, invoiceDescription: 'Anaesthesia, general surgery' } } } })
    expect(setProcedureContract(api, OFFICE, TANE_PROC, 'CT-NO-CONTRACT').ok).toBe(true)
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'Anaesthesia, general surgery', origin: 'contract' })
    expect(setProcedureContract(api, OFFICE, TANE_PROC, 'CT-SXAP').ok).toBe(true)
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'lap chole +/- IOC', origin: 'rooms' })
  })
})

describe('the invoice prints the invoice description (catch-up Phase 20a; US-08.4.6)', () => {
  it('every seeded invoice heads each Procedure\'s lines with its invoice description; never an RVG group name; amounts untouched', () => {
    const api = store()
    const s = api.getState()
    const groupNames = new Set(Object.values(s.masters.rvgGroups).map((g) => g.description))
    let headings = 0
    for (const invoice of Object.values(s.billing.invoices)) {
      const lines = invoiceLinesFor(s, invoice.id)
      const groups = invoiceLineGroups(lines, s.schedule.procedures)
      expect(groups.flatMap((g) => g.lines)).toHaveLength(lines.length)
      expect(groups.flatMap((g) => g.lines).reduce((t, l) => t + l.amount, 0)).toBeCloseTo(lines.reduce((t, l) => t + l.amount, 0), 6)
      for (const g of groups) {
        if (g.procedureId === undefined) continue
        expect(g.heading, invoice.id).toBe(s.schedule.procedures[g.procedureId]?.invoiceDescription?.text)
        if (g.heading !== undefined) {
          headings += 1
          expect(groupNames.has(g.heading) && s.schedule.procedures[g.procedureId]?.procedureText?.text !== g.heading, g.heading).toBe(false)
        }
      }
    }
    expect(headings).toBeGreaterThan(0)
  })

  it('an office edit changes the heading and not the procedure text', () => {
    // Seeded invoices sit on AUTHORISED Lists, where the edit is refused (D63): the edit is made
    // on an ACTIVE List's Procedure, then that Procedure's lines are printed through the same grouping.
    const api = store()
    expect(setInvoiceDescription(api, OFFICE, TANE_PROC, 'Anaesthesia for laparoscopic cholecystectomy').ok).toBe(true)
    const text = proc(api, TANE_PROC).procedureText
    const lines = [
      { id: 'L1', procedureId: TANE_PROC, amount: 318 },
      { id: 'L2', procedureId: DOYLE_PROC, amount: 100 },
    ]
    const groups = invoiceLineGroups(lines, api.getState().schedule.procedures)
    expect(groups.map((g) => g.heading)).toEqual(['Anaesthesia for laparoscopic cholecystectomy', 'Gastric bypass, laparoscopic'])
    expect(proc(api, TANE_PROC).procedureText).toEqual(text)
    // Locked once authorised (D63).
    const authorised = Object.values(api.getState().schedule.lists).find((l) => l.state === 'AUTHORISED')!
    const lockedProc = Object.values(api.getState().schedule.procedures).find((p) => api.getState().schedule.bookings[p.bookingId]?.listId === authorised.id)!
    expect(setInvoiceDescription(api, OFFICE, lockedProc.id, 'x')).toMatchObject({ ok: false, code: 'listAuthorised' })
  })

})

describe('review fixes (catch-up Phase 20a)', () => {
  it('saving the invoice description unchanged is no edit: it keeps following its defaults', () => {
    const api = store()
    const audits = api.getState().audit.length
    expect(setInvoiceDescription(api, OFFICE, TANE_PROC, 'lap chole +/- IOC').ok).toBe(true)
    expect(api.getState().audit.length).toBe(audits)
    expect(proc(api, TANE_PROC).invoiceDescription?.origin).toBe('rooms')
    replaceProcedureText(api, FEED, TANE_PROC, { text: 'lap chole', source: 'hospitalFeed' })
    expect(proc(api, TANE_PROC).invoiceDescription).toEqual({ text: 'lap chole', origin: 'hospital' })
  })

  it("editing a Contract's invoice description reaches its open Procedures, not an office edit or an authorised List", () => {
    const api = store()
    expect(editContract(api, OFFICE, 'CT-DOYLE-BAR', { invoiceDescription: 'Laparoscopic gastric bypass' }).ok).toBe(true)
    expect(proc(api, DOYLE_PROC).invoiceDescription).toEqual({ text: 'Laparoscopic gastric bypass', origin: 'contract' })
    setInvoiceDescription(api, OFFICE, DOYLE_PROC, 'Bypass, as agreed')
    expect(editContract(api, OFFICE, 'CT-DOYLE-BAR', { invoiceDescription: '' }).ok).toBe(true)
    expect(proc(api, DOYLE_PROC).invoiceDescription?.text).toBe('Bypass, as agreed')
  })

  it('a blank Contract invoice description falls back to the procedure text', () => {
    const api = store()
    expect(editContract(api, OFFICE, 'CT-DOYLE-BAR', { invoiceDescription: '' }).ok).toBe(true)
    expect(proc(api, DOYLE_PROC).invoiceDescription?.origin).not.toBe('contract')
  })
})
