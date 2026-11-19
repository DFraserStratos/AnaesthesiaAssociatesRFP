/**
 * The Wave 4 join (Lane A's 38b and 39 with Lane B's 42 and 43): the cross-lane
 * paths no single lane could test. A full-scale dataset still holds 38b's seeded
 * event and takes a 39 credit-and-rebill on a generated invoice; a Party edited
 * in Master data (42) still bills a credit and its rebill (39).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type AppState, type BoundAppStore } from './appStore'
import { installDomainState, type Actor } from './mutate'
import { wireBillingRun } from './billingRun'
import { buildFullScaleDataset } from '../domain/seed/fullScale'
import { approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { creditRefusalFor, invoiceStanding, rebillOriginFor, submitCredit } from './creditActions'
import { editParty, type PartyFields } from './partyActions'
import { pairForInvoice } from './ledgerSelectors'
import type { Invoice } from '../domain/types'
import { scanForNhiLeaks } from './privacyScan'
import { validateNhi } from '../domain/nhi'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const rebill = (unitAmount: number) => ({ occurredOnISO: '2026-07-15', party: { sameAs: true as const }, lines: [{ description: 'Anaesthesia, corrected', quantity: 1, unitAmount }] })

let unwire: (() => void) | undefined
afterEach(() => {
  unwire?.()
  unwire = undefined
})

/** Submit, approve and run a credit with one rebill: the credit note and the rebill. */
function creditAndRebill(api: BoundAppStore, original: Invoice, unitAmount: number) {
  const sub = submitCredit(api, OFFICE, { invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(unitAmount)] })
  if (!sub.ok) throw new Error(sub.message)
  const appr = approveProcedureEvent(api, OFFICE, sub.value.creditEventId)
  if (!appr.ok) throw new Error(appr.message)
  const run = runEventInvoicing(api, OFFICE)
  if (!run.ok) throw new Error(run.message)
  const s = api.getState()
  const note = s.billing.creditNotes[run.value.creditNoteIds[0]!]!
  const replacement = Object.values(s.billing.invoices).find((i) => rebillOriginFor(s, i.id)?.id === original.id)
  return { note, replacement }
}

describe('Wave 4 join: full-scale data with 38b events and 39 credits', () => {
  let full: AppState
  beforeAll(() => {
    full = buildFullScaleDataset(freshAppState(), { todayISO: '2026-07-21' }).state
  }, 120_000)

  it('keeps the seeded event and empty credit slices, and credits and rebills a generated invoice', () => {
    expect(Object.keys(full.schedule.procedureEvents)).toContain('EV0001')
    expect([full.billing.creditNotes, full.billing.negativeInvoices, full.xero.creditNotes]).toEqual([{}, {}, {}])

    const api = createAppStore()
    installDomainState(api, full)
    unwire = wireBillingRun(api)
    const s = api.getState()
    const original = Object.values(s.billing.invoices).find(
      (i) => i.kind === 'standard' && i.invoiceNumber.startsWith('AA-S-') && i.total > 0 && creditRefusalFor(s, { role: 'office' }, i.id) === null,
    )
    expect(original, 'a creditable generated invoice').toBeDefined()

    const { note, replacement } = creditAndRebill(api, original!, 200)
    expect(note.originalInvoiceId).toBe(original!.id)
    expect(invoiceStanding(api.getState(), original!.id)).toBe('credited')
    expect(replacement?.total).toBe(230) // $200 plus GST
    expect(pairForInvoice(api.getState(), replacement!.id)).toBeDefined()
    // The generated original is never rewritten.
    expect(api.getState().billing.invoices[original!.id]).toEqual(original)
  }, 120_000)
})

describe('Wave 4 join: a Party edited in Master data still bills a credit and its rebill', () => {
  it('renames the original\'s billable Party, then credits and rebills to it under the new name', () => {
    const api = createAppStore()
    unwire = wireBillingRun(api)
    const s = api.getState()
    // The Party an invoice bills: its own id, or the Party whose billing identity it carries.
    const partyOf = (i: Invoice) =>
      Object.values(s.masters.parties).find(
        (p) => (i.counterparty.kind === 'party' && p.id === i.counterparty.id) || (p.billingIdentity?.kind === i.counterparty.kind && p.billingIdentity.id === i.counterparty.id),
      )
    const original = Object.values(s.billing.invoices).find(
      (i) => i.kind === 'standard' && partyOf(i) !== undefined && creditRefusalFor(s, { role: 'office' }, i.id) === null,
    )
    expect(original, 'a creditable seeded invoice billed to a Party').toBeDefined()
    const partyId = partyOf(original!)!.id
    const { id: _id, billingIdentity: _b, ...fields } = s.masters.parties[partyId]!
    const renamed = `${fields.name} (renamed)`
    const edit = editParty(api, OFFICE, partyId, { ...fields, name: renamed } as PartyFields)
    expect(edit.ok).toBe(true)
    expect(api.getState().masters.parties[partyId]!.name).toBe(renamed)

    const { note, replacement } = creditAndRebill(api, original!, 150)
    expect(note.originalInvoiceId).toBe(original!.id)
    expect(replacement?.counterparty).toEqual(original!.counterparty)
    expect(replacement?.total).toBe(172.5) // $150 plus GST
    expect(invoiceStanding(api.getState(), original!.id)).toBe('credited')
  })
})

describe('Wave 4 join: the leak scan covers 39\'s credit records', () => {
  it('walks the Xero credit notes and never reports a credit record id that happens to pass the NHI check digit', () => {
    const api = createAppStore()
    unwire = wireBillingRun(api)
    const s = api.getState()
    const original = Object.values(s.billing.invoices).find((i) => i.kind === 'standard' && creditRefusalFor(s, { role: 'office' }, i.id) === null)!
    creditAndRebill(api, original, 100)
    const after = api.getState()
    expect(Object.keys(after.xero.creditNotes).length).toBeGreaterThan(0)
    const before = scanForNhiLeaks(after).areas.find((a) => a.key === 'xero')!
    // Pin ids of the NHI shape that validate (CRN0005, NEG0009, XCN0005) onto the credit records, as the fifth credit would carry.
    const rekey = <T extends { id: string }>(map: Record<string, T>, id: string) => Object.fromEntries(Object.values(map).map((r) => [id, { ...r, id }]))
    const pinned = {
      ...after,
      billing: { ...after.billing, creditNotes: rekey(after.billing.creditNotes, 'CRN0005'), negativeInvoices: rekey(after.billing.negativeInvoices, 'NEG0009') },
      xero: { ...after.xero, creditNotes: rekey(after.xero.creditNotes, 'XCN0005') },
    }
    expect(['CRN0005', 'XCN0005', 'NEG0009'].map((id) => validateNhi(id).valid)).toEqual([true, true, true])
    const xero = scanForNhiLeaks(pinned).areas.find((a) => a.key === 'xero')!
    expect(xero.scanned).toContain('credit notes')
    expect(xero.items).toBe(before.items)
    expect(xero.hits).toEqual([])
  })
})
