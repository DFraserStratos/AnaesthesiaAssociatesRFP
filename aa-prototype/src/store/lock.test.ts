/**
 * The pricing snapshot at AUTHORISED (catch-up Phase 25; US-04.3.5, US-07.3.1,
 * US-08.1.1, US-08.4.4, US-15.0.3, DM-08, RV-11): parity with the live price,
 * immunity to every master edit after authorise, one commit with the List's
 * flip, the payer per Procedure (22a), the payee fixed at authorise (DM-42),
 * Regenerate from the recipe, and the Contract's history.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { handoffListCases, runBillingForList } from './billingRun'
import { addPriceRange, disableContract, editContract } from './contractActions'
import { setProcedurePayer } from './payerActions'
import { setProcedurePrice } from './pricingActions'
import { lockedAgainstContract, regenerateInvoiceFromLock, takeLockFor, REGENERATE_PREPAYMENT_REASON, REGENERATE_AA_FEE_REASON } from './locks'
import { bookingsForList, proceduresForBooking } from './selectors'
import { capturePhase25 } from './__parity__/phase25Capture'
import fixture from './__parity__/phase-25-invoices.json'
import { bookingFee } from '../shared/capture/feeContext'
import { heldPricesForBooking } from './selectors'
import { contractHistoryFor, contractFieldChanges } from '../domain/billing/contractHistory'
import { compareInvoice, invoiceDraftsFromLock, lockViewFor, priceBookingFromLock } from '../domain/billing/lock'
import { stageBillingFailure } from './demoStaging'
import { ANAE, CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { Actor } from './mutate'
import type { AssignedList } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const S3_AM = SEED_LIST_IDS.souterMon20Am
const S5 = SEED_LIST_IDS.whitakerFri17

/** Every master a lock could read, changed: the masters after authorise are nothing like the masters at it. */
function scorchMasters(api: BoundAppStore): void {
  const s = api.getState()
  const m = s.masters
  const contracts = Object.fromEntries(
    Object.entries(m.contracts).map(([id, c]) => {
      const pricing =
        c.pricing.kind === 'rvgContractRate'
          ? { ...c.pricing, unitRate: c.pricing.unitRate * 2 }
          : c.pricing.kind === 'rvgDiscount'
            ? { ...c.pricing, discountPct: 50 }
            : c.pricing.kind === 'fixed'
              ? { kind: 'fixed' as const, ranges: [{ startISO: '2026-01-01', price: 9999 }] }
              : c.pricing
      return [id, { ...c, name: `${c.name} (renamed)`, status: 'disabled' as const, billsTo: c.billsTo === 'holder' ? ('payer' as const) : ('holder' as const), holderReference: 'CHANGED', pricing }]
    }),
  )
  const anaesthetists = Object.fromEntries(Object.entries(m.anaesthetists).map(([id, a]) => [id, { ...a, unitValue: 99, name: `${a.name} (renamed)`, gstNumber: '999999999' }]))
  const rvgGroups = Object.fromEntries(Object.entries(m.rvgGroups).map(([id, g]) => [id, { ...g, baseUnits: g.baseUnits + 3 }]))
  const modifiers = Object.fromEntries(Object.entries(m.modifiers).map(([id, x]) => [id, { ...x, units: x.units === null ? null : x.units + 1 }]))
  const parties = Object.fromEntries(Object.entries(m.parties).map(([id, p]) => [id, { ...p, name: `${p.name} (renamed)`, billingName: 'Changed', email: 'changed@example.net' }]))
  const patients = Object.fromEntries(Object.entries(m.patients).map(([id, p]) => [id, { ...p, name: `${p.name} (renamed)`, email: 'moved@example.net', postalAddress: { line1: '1 Elsewhere Road', suburb: 'Sumner', city: 'Christchurch', postcode: '8081' } }]))
  const procedures = Object.fromEntries(
    Object.entries(s.schedule.procedures).map(([id, p]) => [id, { ...p, payer: p.payer.kind === 'other' ? { ...p.payer, name: `${p.payer.name} (renamed)`, email: 'payer-moved@example.net' } : { ...p.payer, email: 'patient-moved@example.net' } }]),
  )
  const surgeons = Object.fromEntries(Object.entries(m.surgeons).map(([id, x]) => [id, { ...x, name: `${x.name} (renamed)` }]))
  api.setState({
    masters: { ...m, contracts, anaesthetists, rvgGroups, modifiers, parties, patients, surgeons, rvgTimeRule: { ...m.rvgTimeRule, tiers: [{ fromMinute: 0, intervalMinutes: 5 }] } },
    schedule: { ...s.schedule, procedures },
  })
}

describe('parity: the lock prices exactly as the live engine', () => {
  it('for every seeded Booking on an assigned List that locks, the lock price equals the live Booking price to the cent', () => {
    const state = freshAppState()
    let checked = 0
    for (const list of Object.values(state.schedule.lists)) {
      if (list.anaesthetistId === undefined || list.state === 'AUTHORISED') continue
      for (const booking of bookingsForList(state, list.id)) {
        if (booking.cancellation !== undefined) continue
        const lock = takeLockFor(state, booking, 'test', '2026-07-21T09:00:00')
        if (lock === undefined || lock.state !== 'locked') continue
        const live = bookingFee({ procedures: proceduresForBooking(state, booking.id), list: list as AssignedList, masters: state.masters, billingLines: state.schedule.billingLines, patientId: booking.patientId, held: heldPricesForBooking(state, booking.id) })
        expect(priceBookingFromLock(lock).total, booking.id).toBe(live.total)
        expect(priceBookingFromLock(lock).units, booking.id).toBe(live.units)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})

describe('immunity: after authorise, no master edit moves an invoice (US-08.4.4, US-15.0.3)', () => {
  it('every Contract, range, unit value, RVG group, modifier, time tier, Party, payer, patient, surgeon and supplier changed: the run raises the fixture exactly', () => {
    expect(JSON.parse(JSON.stringify(capturePhase25(scorchMasters)))).toEqual(fixture)
  })

  it('the lock itself is untouched by the edits, and Regenerate says identical for every invoice raised', () => {
    const api = createAppStore()
    for (const listId of [S3_AM, SEED_LIST_IDS.souterMon20Pm, S5]) {
      expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
      runBillingForList(api, listId)
    }
    const locks = JSON.stringify(api.getState().billing.locks)
    scorchMasters(api)
    expect(JSON.stringify(api.getState().billing.locks)).toBe(locks)
    const raised = Object.values(api.getState().billing.invoices).filter((i) => i.kind === 'standard' && [S3_AM, SEED_LIST_IDS.souterMon20Pm, S5].includes(api.getState().schedule.bookings[i.bookingId]!.listId))
    expect(raised).toHaveLength(12)
    for (const invoice of raised) {
      const result = regenerateInvoiceFromLock(api.getState(), invoice.id)
      expect(result.ok && result.comparison.identical, invoice.invoiceNumber).toBe(true)
    }
  })
})

describe('authorise writes the lock in the same commit (US-07.3.1)', () => {
  it('one commit: the List flips and every non-cancelled Booking locks, audited list.authorise then one booking.lock each; the event fires after', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    let seenAtEmit: { state?: string; locks: number } | undefined
    const unsub = api.subscribe((s) => {
      if (seenAtEmit === undefined) seenAtEmit = { state: s.schedule.lists[S3_AM]?.state, locks: bookingsForList(s, S3_AM).filter((b) => s.billing.locks[b.id] !== undefined).length }
    })
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    unsub()
    const bookings = bookingsForList(api.getState(), S3_AM).filter((b) => b.cancellation === undefined)
    expect(seenAtEmit).toEqual({ state: 'AUTHORISED', locks: bookings.length })
    const written = api.getState().audit.slice(before).map((a) => a.action)
    expect(written[0]).toBe('list.authorise')
    expect(written.filter((a) => a === 'booking.lock')).toHaveLength(bookings.length)
    const lockRow = api.getState().audit.find((a) => a.action === 'booking.lock')!
    expect(lockRow.after).toMatchObject({ payee: 'Dr Melanie Souter', pricingDateISO: '2026-07-20' })
  })

  it('a Procedure that needs a price refuses the whole authorise and writes nothing; typing a price clears it', () => {
    const api = createAppStore()
    const booking = bookingsForList(api.getState(), S3_AM)[0]!
    const p = proceduresForBooking(api.getState(), booking.id)[0]!
    const open = Object.values(api.getState().masters.contracts).find((c) => c.systemRole === 'openPriceFallback' && c.billsTo === 'payer')!
    api.setState({ schedule: { ...api.getState().schedule, procedures: { ...api.getState().schedule.procedures, [p.id]: { ...p, governingContractId: open.id } } } })
    const audit = api.getState().audit.length
    expect(authoriseList(api, OFFICE, S3_AM)).toMatchObject({ ok: false, code: 'needsPrice' })
    expect(api.getState().audit).toHaveLength(audit)
    expect(api.getState().schedule.lists[S3_AM]!.state).toBe('SUBMITTED')
    expect(Object.keys(api.getState().billing.locks).filter((id) => bookingsForList(api.getState(), S3_AM).some((b) => b.id === id))).toEqual([])
    expect(setProcedurePrice(api, OFFICE, p.id, 400).ok).toBe(true)
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    expect(api.getState().billing.locks[booking.id]!.procedures.find((s) => s.procedureId === p.id)).toMatchObject({ price: 400, typed: true })
  })

  it('warnings never block: an out-of-guide base value locks as entered, recorded on the snapshot', () => {
    const api = createAppStore()
    const booking = bookingsForList(api.getState(), S3_AM)[0]!
    const p = proceduresForBooking(api.getState(), booking.id).find((x) => x.isPrimary)!
    api.setState({ schedule: { ...api.getState().schedule, procedures: { ...api.getState().schedule.procedures, [p.id]: { ...p, baseUnitsCaptured: { units: 40, source: 'overridden' } } } } })
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    const view = lockViewFor(api.getState().billing.locks[booking.id]!, p.id)
    expect(view.procedure?.outOfGuideRange).toBe(true)
  })
})

describe('who is billed: each Procedure\'s own payer, copied with its BP id (22a, D85)', () => {
  it('the two-payer Booking locks two parties and raises two invoices; a payer email edited after authorise moves nothing', () => {
    const api = createAppStore()
    const bookingId = SEED_MARKERS['twoPayerBooking']!.entityId
    const listId = api.getState().schedule.bookings[bookingId]!.listId
    if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const lock = api.getState().billing.locks[bookingId]!
    const drafts = invoiceDraftsFromLock(lock)
    expect(drafts.kind === 'invoices' && drafts.invoices.map((d) => d.counterparty.kind)).toEqual(['payer', 'payer'])
    const p = proceduresForBooking(api.getState(), bookingId)[0]!
    if (p.payer.kind === 'other') setProcedurePayer(api, OFFICE, p.id, { kind: 'other', id: p.payer.id, name: p.payer.name, email: 'new@example.net' } as never)
    runBillingForList(api, listId)
    const invoices = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === bookingId)
    expect(invoices).toHaveLength(2)
    expect(invoices.every((i) => i.billedTo?.email !== 'new@example.net')).toBe(true)
  })
})

describe('the payee is fixed at authorise (DM-42)', () => {
  it("with the List's anaesthetist changed after authorise, the case, supplier, ACCPAY and BCTI all name the locked payee", () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    const list = api.getState().schedule.lists[S3_AM]!
    api.setState({ schedule: { ...api.getState().schedule, lists: { ...api.getState().schedule.lists, [S3_AM]: { ...list, anaesthetistId: ANAE.whitaker } as typeof list } } })
    runBillingForList(api, S3_AM)
    handoffListCases(api, S3_AM)
    const s = api.getState()
    const ids = new Set(bookingsForList(s, S3_AM).map((b) => b.id))
    const cases = Object.values(s.billing.cases).filter((c) => ids.has(c.bookingId))
    expect(cases.length).toBeGreaterThan(0)
    for (const c of cases) {
      expect(c.payeeAnaesthetistId).toBe('34821')
      expect(s.billing.invoices[c.invoiceId!]!.supplier?.name).toBe('Dr Melanie Souter')
      const pay = s.xero.accPays[c.accPayId!]!
      expect(pay.anaesthetistId).toBe('34821')
      expect(pay.taxInvoice?.supplierName).toBe('Dr Melanie Souter')
    }
  })
})

describe('Regenerate from locked data (US-08.4.4)', () => {
  it('reports exactly a hand-corrupted line or supplier, and refuses pre-payment and AA fee invoices with their reasons', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    runBillingForList(api, S3_AM)
    const invoice = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'standard' && api.getState().schedule.bookings[i.bookingId]!.listId === S3_AM)!
    const line = Object.values(api.getState().billing.invoiceLines).find((l) => l.invoiceId === invoice.id)!
    api.setState({
      billing: {
        ...api.getState().billing,
        invoiceLines: { ...api.getState().billing.invoiceLines, [line.id]: { ...line, amount: line.amount + 1 } },
        invoices: { ...api.getState().billing.invoices, [invoice.id]: { ...invoice, supplier: { ...invoice.supplier!, name: 'Someone else' } } },
      },
    })
    const result = regenerateInvoiceFromLock(api.getState(), invoice.id)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.comparison.differences.map((d) => d.field)).toEqual(['Supplier', 'Line 1'])
    const prepayment = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'prePayment')!
    expect(regenerateInvoiceFromLock(api.getState(), prepayment.id)).toEqual({ ok: false, reason: REGENERATE_PREPAYMENT_REASON })
    const aaFee = Object.keys(api.getState().billing.aaFeeInvoices)[0]!
    expect(regenerateInvoiceFromLock(api.getState(), aaFee)).toEqual({ ok: false, reason: REGENERATE_AA_FEE_REASON })
  })
})

describe('Contract history (US-04.1.3)', () => {
  it('each edit kind is a row with before and after, newest first; a Disabled Contract keeps every row and its locked Procedures', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, S5).ok).toBe(true)
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { name: 'Health NZ agreed rate 2026' }).ok).toBe(true)
    const locked = lockedAgainstContract(api.getState(), CONTRACT.healthNz)
    expect(locked.map((l) => l.bookingId).sort()).toEqual(bookingsForList(api.getState(), S5).map((b) => b.id).sort())
    expect(disableContract(api, OFFICE, CONTRACT.healthNz).ok).toBe(true)
    const rows = contractHistoryFor(api.getState().audit, CONTRACT.healthNz)
    expect(rows.slice(0, 2).map((r) => r.action)).toEqual(['contract.disable', 'contract.update'])
    expect(contractFieldChanges(rows[1]!)).toEqual([{ field: 'name', before: 'Health NZ agreed rate', after: 'Health NZ agreed rate 2026' }])
    expect(lockedAgainstContract(api.getState(), CONTRACT.healthNz)).toHaveLength(locked.length)
  })

  it('a price range added and corrected each show, the earlier value kept', () => {
    const api = createAppStore()
    const fixed = Object.values(api.getState().masters.contracts).find((c) => c.pricing.kind === 'fixed' && c.systemRole === undefined)!
    expect(addPriceRange(api, OFFICE, fixed.id, { startISO: '2026-07-01', price: 1234 }).ok).toBe(true)
    const rows = contractHistoryFor(api.getState().audit, fixed.id)
    expect(rows[0]!.action).toBe('contract.priceRange.add')
    expect(contractFieldChanges(rows[0]!).find((c) => c.field === 'priceRange')?.after).toContain('$1,234.00')
  })
})

describe('review-pass fixes (catch-up Phase 25)', () => {
  it("a Resend that emails an invoice the run raised with no address is the office's send, not a difference", () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    runBillingForList(api, S3_AM)
    const invoice = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'standard' && api.getState().schedule.bookings[i.bookingId]!.listId === S3_AM)!
    const lock = api.getState().billing.locks[invoice.bookingId]!
    const drafts = invoiceDraftsFromLock({ ...lock, parties: lock.parties.map((p) => ({ ...p, delivery: { method: 'none' as const } })) })
    const draft = drafts.kind === 'invoices' ? drafts.invoices.find((d) => d.counterparty.id === invoice.counterparty.id)! : undefined
    const lines = Object.values(api.getState().billing.invoiceLines).filter((l) => l.invoiceId === invoice.id).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    const resent = { ...invoice, delivery: { method: 'email' as const, status: 'sent' as const, sends: [{ atISO: '2026-07-21T09:00:00', to: 'typed@example.net', by: 'Kirsty W.' }] } }
    expect(compareInvoice(resent, lines, draft!, lock.payee).identical).toBe(true)
    expect(compareInvoice({ ...invoice, crossMatch: { procedureDateISO: '2026-01-01' } }, lines, draft!, lock.payee).differences.map((d) => d.field)).toEqual(['Cross-match'])
  })

  it("a locked Booking's extra billing lines still list beside its locked fee", () => {
    const api = createAppStore()
    const booking = bookingsForList(api.getState(), S3_AM)[0]!
    const p = proceduresForBooking(api.getState(), booking.id)[0]!
    api.setState({ schedule: { ...api.getState().schedule, billingLines: { ...api.getState().schedule.billingLines, BLX1: { id: 'BLX1', procedureId: p.id, chargeBasis: 'fixed', description: 'Nerve block', amount: 80 } as never } } })
    expect(authoriseList(api, OFFICE, S3_AM).ok).toBe(true)
    const s = api.getState()
    const lock = s.billing.locks[booking.id]!
    const totals = bookingFee({ procedures: proceduresForBooking(s, booking.id), list: s.schedule.lists[S3_AM] as AssignedList, masters: s.masters, billingLines: s.schedule.billingLines, patientId: booking.patientId, lock })
    expect(totals.views[p.id]!.nonRvgLines.map((l) => l.id)).toEqual(['BLX1'])
    expect(totals.total).toBe(lock.bookingPrice)
  })

  it('the staged billing failure refuses without arming the hand-off fault when authorise would be refused', () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.billingFailure
    const losa = SEED_MARKERS['billingFailureBooking']!.entityId
    const p = proceduresForBooking(api.getState(), losa)[0]!
    const open = Object.values(api.getState().masters.contracts).find((c) => c.systemRole === 'openPriceFallback' && c.billsTo === 'payer')!
    api.setState({ schedule: { ...api.getState().schedule, procedures: { ...api.getState().schedule.procedures, [p.id]: { ...p, governingContractId: open.id } } } })
    expect(stageBillingFailure(api).ok).toBe(false)
    expect(api.getState().settings.failNextHandoff).not.toBe(true)
    expect(api.getState().schedule.lists[listId]!.state).not.toBe('AUTHORISED')
  })
})
