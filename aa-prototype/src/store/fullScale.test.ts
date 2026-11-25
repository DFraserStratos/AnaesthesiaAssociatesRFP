/**
 * The full-scale dataset (catch-up Phase 43; US-15.0.4): determinism, the seed
 * kept exactly, the volume claims, and the generated set's integrity against
 * the flat model (AR-58, AR-61, as `domain/billing` encodes it) and the money.
 *
 * Lives in the store folder (domain purity scans every file under `domain/`,
 * tests included, and these tests build the pristine store state).
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { freshAppState, type AppState } from './appStore'
import { buildFullScaleDataset, FULL_SCALE, type FullScaleDataset } from '../domain/seed/fullScale'
import { validateNhi } from '../domain/nhi'
import { contractCandidatesFor, isContractCandidate } from '../domain/billing/contractRail'
import { contractRefusal, isRvgKind } from '../domain/billing/contracts'
import { ensureFallbacks } from '../domain/billing/fallbacks'
import { invoiceDraftsFromLock } from '../domain/billing/lock'
import { ledgerChecks, bctiRecordsOf } from '../domain/billing/ledger'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor } from '../domain/billing/bcti'
import { holdingBalance, holdingEntries } from '../domain/billing/prepayHolding'
import { isMinorOn } from '../domain/billing/whoIsBilled'
import { addDaysISO, horizonFor } from '../domain/clock'
import { SEED_STATUS } from '../domain/slotStatus'
import { billingMonitorView } from './billingMonitorView'
import { previewApplyAllRecurringBookings } from './selectors'
import { initialsOf, surnameOf } from '../shared/format'
import { ENGLISH_NAMES, FULL_SCALE_ANAESTHETISTS, FULL_SCALE_SURGEONS, GUIDE_PATIENT_SURNAMES, poolFor } from '../domain/seed/fullScale/names'
import type { Contract } from '../domain/billing/contracts'

const TODAY = '2026-11-24'
let pristine: AppState
let full: FullScaleDataset<AppState>
let state: AppState
let generatedBookingIds: string[]

function fnv1a(text: string, hash = 0x811c9dc5): number {
  let h = hash
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** Every record, in full: the domain slices serialised (key order is insertion order, itself deterministic). */
function digest(s: AppState): number {
  let h = 0x811c9dc5
  for (const part of [s.masters, s.schedule, s.billing, s.xero, s.audit, s.counters, s.intake, s.settings]) h = fnv1a(JSON.stringify(part), h)
  for (const id of Object.keys(s.schedule.slots).sort()) h = fnv1a(`${id}|${s.schedule.slots[id]!.status}`, h)
  for (const id of Object.keys(s.schedule.lists).sort()) h = fnv1a(`${id}|${s.schedule.lists[id]!.state}|${s.schedule.lists[id]!.dateISO}`, h)
  for (const id of Object.keys(s.schedule.bookings).sort()) h = fnv1a(`${id}|${s.schedule.bookings[id]!.patientId}`, h)
  for (const id of Object.keys(s.schedule.procedures).sort()) h = fnv1a(`${id}|${s.schedule.procedures[id]!.governingContractId ?? ''}`, h)
  for (const id of Object.keys(s.billing.invoices).sort()) {
    const i = s.billing.invoices[id]!
    h = fnv1a(`${id}|${i.invoiceNumber}|${i.total}|${i.raisedAtISO ?? ''}`, h)
  }
  for (const id of Object.keys(s.billing.ledger).sort()) h = fnv1a(`${id}|${s.billing.ledger[id]!.receivable.receivedAmount}`, h)
  for (const id of Object.keys(s.masters.patients).sort()) h = fnv1a(`${id}|${s.masters.patients[id]!.nhi ?? ''}`, h)
  return h
}

beforeAll(() => {
  pristine = freshAppState()
  full = buildFullScaleDataset(freshAppState(), { todayISO: TODAY })
  state = full.state
  generatedBookingIds = Object.keys(state.schedule.bookings).filter((id) => pristine.schedule.bookings[id] === undefined)
}, 120_000)

describe('determinism and the seed', () => {
  it('two builds give identical counts and an identical digest', () => {
    const again = buildFullScaleDataset(freshAppState(), { todayISO: TODAY })
    expect(again.counts).toEqual(full.counts)
    expect(digest(again.state)).toBe(digest(state))
  }, 120_000)

  it('keeps every seeded record exactly', () => {
    const maps: [string, Record<string, unknown>, Record<string, unknown>][] = [
      ['anaesthetists', pristine.masters.anaesthetists, state.masters.anaesthetists],
      ['surgeons', pristine.masters.surgeons, state.masters.surgeons],
      ['parties', pristine.masters.parties, state.masters.parties],
      ['contracts', pristine.masters.contracts, state.masters.contracts],
      ['patients', pristine.masters.patients, state.masters.patients],
      ['slots', pristine.schedule.slots, state.schedule.slots],
      ['lists', pristine.schedule.lists, state.schedule.lists],
      ['bookings', pristine.schedule.bookings, state.schedule.bookings],
      ['procedures', pristine.schedule.procedures, state.schedule.procedures],
      ['invoices', pristine.billing.invoices, state.billing.invoices],
      ['ledger', pristine.billing.ledger, state.billing.ledger],
      ['locks', pristine.billing.locks, state.billing.locks],
      ['contacts', pristine.xero.contacts, state.xero.contacts],
      ['accRecs', pristine.xero.accRecs, state.xero.accRecs],
      ['accPays', pristine.xero.accPays, state.xero.accPays],
    ]
    for (const [name, before, after] of maps) {
      for (const [id, record] of Object.entries(before)) expect(JSON.stringify(after[id]), `${name} ${id}`).toBe(JSON.stringify(record))
    }
    expect(JSON.stringify(state.audit.slice(0, pristine.audit.length))).toBe(JSON.stringify(pristine.audit))
  })

  it('collides with no seeded id, and the next id of each kind is unused', () => {
    for (const kind of ['booking', 'procedure', 'patient', 'invoice', 'invoiceLine', 'ledgerPair', 'audit', 'xeroContact']) {
      expect(state.counters[kind]!).toBeGreaterThanOrEqual(pristine.counters[kind] ?? 1)
    }
    const nextBooking = `BK${String(state.counters['booking']).padStart(4, '0')}`
    expect(state.schedule.bookings[nextBooking]).toBeUndefined()
    const nextInvoice = `INV${String(state.counters['invoice']).padStart(4, '0')}`
    expect(state.billing.invoices[nextInvoice]).toBeUndefined()
    const nextPatient = `PT${String(state.counters['patient']).padStart(4, '0')}`
    expect(state.masters.patients[nextPatient]).toBeUndefined()
    // The live invoice number counter is untouched (S3's AA-2026-0002 holds); generated numbers use the reserved series.
    expect(state.counters['invoiceNumber']).toBe(pristine.counters['invoiceNumber'])
    for (const inv of Object.values(state.billing.invoices)) {
      if (pristine.billing.invoices[inv.id] === undefined) expect(inv.invoiceNumber.startsWith(FULL_SCALE.invoiceNumberPrefix)).toBe(true)
    }
  })
})

describe('the claims (US-15.0.4)', () => {
  it('85 anaesthetists, two sessions each a day to the horizon edge, at least 20,000 sessions from today', () => {
    expect(full.counts.anaesthetists).toBe(85)
    expect(full.counts.slotsInHorizon).toBeGreaterThanOrEqual(20000)
    const horizon = horizonFor(TODAY, state.appSettings.schedule.horizonMonths)
    const perDay = new Map<string, number>()
    for (const s of Object.values(state.schedule.slots)) {
      expect(s.dateISO <= horizon.endISO).toBe(true)
      const key = `${s.anaesthetistId}|${s.dateISO}`
      perDay.set(key, (perDay.get(key) ?? 0) + 1)
    }
    for (const n of perDay.values()) expect(n).toBe(2)
  })

  it('a shorter horizon setting gives proportionally fewer sessions and none past its edge', () => {
    const base = freshAppState()
    const short = { ...base, appSettings: { ...base.appSettings, schedule: { ...base.appSettings.schedule, horizonMonths: 2 } } }
    const built = buildFullScaleDataset(short, { todayISO: TODAY })
    const edge = horizonFor(TODAY, 2).endISO
    const generatedPast = Object.values(built.state.schedule.slots).filter((s) => base.schedule.slots[s.id] === undefined && s.dateISO > edge)
    expect(generatedPast).toEqual([])
    expect(built.counts.slotsInHorizon).toBeLessThan(full.counts.slotsInHorizon * 0.6)
  }, 120_000)

  it('raises 27,500 to 28,500 invoices in the last 12 months', () => {
    expect(full.counts.invoicesLast12Months).toBeGreaterThanOrEqual(27500)
    expect(full.counts.invoicesLast12Months).toBeLessThanOrEqual(28500)
  })

  it('one AA fee invoice per generated anaesthetist per month since joining, its per-BCTI line by 16\'s one count', () => {
    const generated = Object.keys(state.masters.anaesthetists).filter((id) => pristine.masters.anaesthetists[id] === undefined)
    const fees = Object.values(state.billing.aaFeeInvoices).filter((f) => generated.includes(f.anaesthetistId))
    const perMonth = new Map<string, number>()
    for (const f of fees) perMonth.set(`${f.anaesthetistId}|${f.monthISO}`, (perMonth.get(`${f.anaesthetistId}|${f.monthISO}`) ?? 0) + 1)
    for (const n of perMonth.values()) expect(n).toBe(1)
    // Twelve months each for the established; none for a new starter, who joins after today.
    const starters = generated.filter((id) => state.masters.anaesthetists[id]!.startDateISO > TODAY)
    expect(starters.length).toBe(2)
    expect(perMonth.size).toBe((generated.length - starters.length) * 12)
    for (const f of fees) expect(starters.includes(f.anaesthetistId)).toBe(false)
    const sample = fees.filter((f) => f.anaesthetistId === generated[3])
    const records = bctiRecordsOf(Object.values(state.billing.ledger)).filter((r) => r.anaesthetistId === generated[3])
    const earlier: typeof sample = []
    for (const f of [...sample].sort((a, b) => a.monthISO.localeCompare(b.monthISO))) {
      const counted = bctisFor(records, f.anaesthetistId, f.monthISO, BCTI_COUNT_RULE, bctiFeeHistory(earlier, f.anaesthetistId))
      expect(f.bctis.length).toBe(counted.length)
      earlier.push(f)
    }
  })

  it('Problems only on the processing monitor returns exactly the generated problem Lists', () => {
    const view = billingMonitorView(state, { problemsOnly: true })
    const listIds = view.groups.flatMap((g) => g.authorised.map((r) => r.listId)).filter((id) => pristine.schedule.lists[id] === undefined).sort()
    expect(listIds).toEqual([...full.problemListIds].sort())
    expect(full.problemListIds.length).toBeGreaterThan(0)
  }, 60_000)
})

describe('integrity: the flat model', () => {
  it('every Booking has a patient with a valid, unique NHI and exactly one primary Procedure; every Procedure a payer', () => {
    const nhis = new Set<string>()
    for (const p of Object.values(state.masters.patients)) {
      if (p.nhi === undefined) continue
      expect(nhis.has(p.nhi), p.nhi).toBe(false)
      nhis.add(p.nhi)
    }
    const procsByBooking = new Map<string, typeof state.schedule.procedures[string][]>()
    for (const p of Object.values(state.schedule.procedures)) {
      const bucket = procsByBooking.get(p.bookingId)
      if (bucket === undefined) procsByBooking.set(p.bookingId, [p])
      else bucket.push(p)
    }
    for (const id of generatedBookingIds) {
      const b = state.schedule.bookings[id]!
      const patient = state.masters.patients[b.patientId]!
      expect(validateNhi(patient.nhi ?? '').valid, id).toBe(true)
      const procs = procsByBooking.get(id) ?? []
      expect(procs.filter((p) => p.isPrimary)).toHaveLength(1)
      for (const p of procs) {
        expect(p.payer).toBeDefined()
        if (p.payer.kind === 'other') expect(p.payer.email ?? p.payer.postalAddress).toBeDefined()
        else expect(patient.email ?? patient.postalAddress).toBeDefined()
        const list = state.schedule.lists[b.listId]!
        // A child's payer is a guardian, so history raises no child-payer warning.
        if (isMinorOn(patient.dobISO, list.dateISO) && p.isPrimary) expect(p.payer.kind).toBe('other')
      }
    }
  }, 60_000)

  it('a copied payer keeps its BP id; a few Bookings bill two payers', () => {
    let copied = 0
    let twoPayers = 0
    const byBooking = new Map<string, typeof state.schedule.procedures[string][]>()
    const generated = new Set(generatedBookingIds)
    for (const p of Object.values(state.schedule.procedures)) {
      if (!generated.has(p.bookingId)) continue
      byBooking.set(p.bookingId, [...(byBooking.get(p.bookingId) ?? []), p])
    }
    for (const procs of byBooking.values()) {
      if (procs.length < 2) continue
      const [a, b] = procs as [typeof procs[0], typeof procs[0]]
      if (a.payer.kind === 'other' && b.payer.kind === 'other' && a.payer.id === b.payer.id) copied += 1
      if (JSON.stringify(a.payer) !== JSON.stringify(b.payer)) twoPayers += 1
    }
    expect(twoPayers).toBeGreaterThan(0)
    expect(copied + twoPayers).toBeGreaterThan(0)
  }, 60_000)

  it('each Procedure has its text as received, an RVG code in the master (required on RVG kinds), and one Contract the rail offers', () => {
    const masters = { contracts: state.masters.contracts, parties: state.masters.parties, fundingTags: state.masters.fundingTags, rvgGroups: state.masters.rvgGroups, surgeons: state.masters.surgeons }
    const generated = new Set(generatedBookingIds)
    let checked = 0
    for (const p of Object.values(state.schedule.procedures)) {
      if (!generated.has(p.bookingId)) continue
      expect(p.procedureText?.text).toBeTruthy()
      const contract = state.masters.contracts[p.governingContractId ?? '']
      expect(contract, p.id).toBeDefined()
      if (p.rvgGroupId !== undefined) expect(state.masters.rvgGroups[p.rvgGroupId]).toBeDefined()
      if (isRvgKind(contract!.pricing.kind)) expect(p.rvgGroupId).toBeDefined()
      expect('hospitalReference' in p || 'billingReference' in p).toBe(false)
      if (checked < 3000 && contract!.systemRole !== 'noContractRvg') {
        const b = state.schedule.bookings[p.bookingId]!
        const list = state.schedule.lists[b.listId]!
        const ctx = { listDateISO: list.dateISO, hospitalId: list.hospitalId, surgeonId: list.surgeonId, ...(list.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}) }
        // A Contract disabled since (none is) would still fit by its other rules.
        expect(isContractCandidate(masters, ctx, contract!, { anyStatus: true }), p.id).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(0)
    void contractCandidatesFor
  }, 60_000)

  it('every generated Contract passes 18\'s guards, and every destination has its two backstops', () => {
    const ctx = {
      parties: state.masters.parties,
      contracts: state.masters.contracts,
      surgeonIds: new Set(Object.keys(state.masters.surgeons)),
      anaesthetistIds: new Set(Object.keys(state.masters.anaesthetists)),
      specialtyIds: new Set(Object.keys(state.masters.specialties)),
      fundingTagIds: new Set(Object.keys(state.masters.fundingTags)),
      rvgGroups: state.masters.rvgGroups,
    }
    for (const c of Object.values(state.masters.contracts) as Contract[]) {
      if (pristine.masters.contracts[c.id] !== undefined || c.systemRole !== undefined) continue
      expect(contractRefusal(c, { ...ctx, prev: c }), c.id).toBeNull()
      if (c.anaesthetistMayOverridePrice) expect(isRvgKind(c.pricing.kind)).toBe(true)
      expect(Object.keys(c).some((k) => ['lines', 'versions', 'staged', 'kind', 'holder', 'isDefault'].includes(k))).toBe(false)
    }
    const again = ensureFallbacks(state.masters.contracts, state.masters.parties, state.masters.fundingTags, () => 'NEW')
    expect(again.created).toEqual([])
    expect(Object.values(state.masters.parties).some((p) => (p as { kind: string }).kind === 'insurerMaster')).toBe(false)
  })

  it('Lists: no DRAFT with an anaesthetist, every List an origin, no public kind; Public sessions are bookless', () => {
    const bookedLists = new Set(Object.values(state.schedule.bookings).map((b) => b.listId))
    for (const l of Object.values(state.schedule.lists)) {
      if (l.state === 'DRAFT') expect(l.anaesthetistId).toBeUndefined()
      expect(l.origin, l.id).toBeDefined()
      expect((l.kind as string) === 'public').toBe(false)
    }
    const slotsWithList = new Set(Object.values(state.schedule.lists).flatMap((l) => (l.slotId !== undefined ? [l.slotId] : [])))
    const publicSlots = Object.values(state.schedule.slots).filter((s) => s.status === SEED_STATUS.publicHospital && pristine.schedule.slots[s.id] === undefined)
    expect(publicSlots.length).toBeGreaterThan(0)
    for (const s of publicSlots) {
      expect(s.note).toBe('CPH')
      expect(slotsWithList.has(s.id)).toBe(false)
    }
    expect(full.counts.draftLists).toBeGreaterThan(0)
    void bookedLists
  })

  it('surgeons have a practice name and contacts; CPNs are unique and some surgeons hold none', () => {
    const cpns = new Set<string>()
    let without = 0
    for (const s of Object.values(state.masters.surgeons)) {
      if (pristine.masters.surgeons[s.id] !== undefined) continue
      expect(s.practiceName).toBeTruthy()
      expect(s.officeContacts.length + (s.personalContact.email !== undefined ? 1 : 0)).toBeGreaterThan(0)
      expect('roomIds' in s).toBe(false)
      if (s.hpiId === undefined) without += 1
      else {
        expect(cpns.has(s.hpiId)).toBe(false)
        cpns.add(s.hpiId)
      }
    }
    expect(without).toBeGreaterThan(0)
  })

  it('stubs sit outside the Bookings table on unbilled Lists, each linked to its waiting intake row', () => {
    const generatedStubs = Object.values(state.intake.stubs).filter((s) => pristine.intake.stubs[s.id] === undefined)
    expect(generatedStubs.length).toBe(FULL_SCALE.stubs)
    for (const stub of generatedStubs) {
      expect(state.schedule.bookings[stub.id]).toBeUndefined()
      const row = state.intake.rows[stub.importRowId]!
      expect(row.status).toBe('open')
      expect(row.incoming.patient.nhi).toBeUndefined()
      expect(state.schedule.lists[stub.listId]!.state).toBe('ACTIVE')
    }
  })
})

describe('integrity: the rest of the model (review additions)', () => {
  it('every insured Booking has an approval number, and some are insured', () => {
    const insured = generatedBookingIds.map((id) => state.schedule.bookings[id]!).filter((b) => b.funderPartyId !== undefined)
    expect(insured.length).toBeGreaterThan(100)
    for (const b of insured) expect(b.insuranceApprovalNumber, b.id).toBeTruthy()
  })

  it('every Procedure with text has its invoice description from 20a\'s chain; a typed price is kept as typed', () => {
    let typed = 0
    for (const p of Object.values(state.schedule.procedures)) {
      if (pristine.schedule.procedures[p.id] !== undefined) continue
      if (p.procedureText !== null) expect(p.invoiceDescription, p.id).not.toBeNull()
      if (p.enteredPrice === undefined) continue
      typed += 1
      const lock = state.billing.locks[p.bookingId]
      if (lock === undefined) continue
      const snap = lock.procedures.find((x) => x.procedureId === p.id)
      expect(snap?.price, p.id).toBe(p.enteredPrice)
    }
    expect(typed).toBeGreaterThan(0)
  })

  it('no generated record carries a removed field; every recurring booking projects', () => {
    const removed = ['paymentCategory', 'billingRoute', 'funderOverride', 'hospitalReference', 'billingReference', 'roomIds', 'bookingType', 'addendumOfBookingId', 'estimate', 'deposit']
    for (const id of generatedBookingIds.slice(0, 2000)) {
      const b = state.schedule.bookings[id]!
      for (const k of removed) expect(k in b, `${id}.${k}`).toBe(false)
    }
    const generatedRecurring = Object.values(state.masters.recurringBookings).filter((r) => pristine.masters.recurringBookings[r.id] === undefined)
    expect(generatedRecurring.length).toBeGreaterThan(200)
    for (const r of generatedRecurring) {
      const projected = Object.values(state.schedule.lists).some((l) => l.recurringBookingId === r.id)
      expect(projected, r.id).toBe(true)
    }
  })

  it('the newest audit entry is the load, and no generated entry is after it', () => {
    const last = state.audit.at(-1)!
    expect(last.action).toBe('demo.fullScaleLoaded')
    for (const e of state.audit) expect(e.atISO <= last.atISO).toBe(true)
  })
})

describe('integrity: the money', () => {
  it('every AUTHORISED generated Booking has its lock, and its invoices price only from it (parity)', () => {
    const invoicesByBooking = new Map<string, typeof state.billing.invoices[string][]>()
    for (const i of Object.values(state.billing.invoices)) {
      if (i.kind !== 'standard') continue
      invoicesByBooking.set(i.bookingId, [...(invoicesByBooking.get(i.bookingId) ?? []), i])
    }
    const failed = new Set(Object.values(state.billing.exceptions).map((x) => x.bookingId))
    let checked = 0
    for (const id of generatedBookingIds) {
      const b = state.schedule.bookings[id]!
      if (state.schedule.lists[b.listId]!.state !== 'AUTHORISED' || failed.has(id)) continue
      const lock = state.billing.locks[id]
      expect(lock, id).toBeDefined()
      const drafts = invoiceDraftsFromLock(lock!)
      expect(drafts.kind).toBe('invoices')
      if (drafts.kind !== 'invoices') continue
      const stored = invoicesByBooking.get(id) ?? []
      expect(stored.map((i) => i.total).sort()).toEqual(drafts.invoices.map((d) => d.total).sort())
      checked += 1
    }
    expect(checked).toBeGreaterThan(20000)
  }, 60_000)

  it('every ledger pair balances and the AA Holding account is in balance, nothing leaving before authorise', () => {
    expect(ledgerChecks(Object.values(state.billing.ledger), state.billing.transfers, [])).toEqual([])
    const entries = holdingEntries({ ledger: state.billing.ledger, receipts: state.billing.receipts, transfers: state.billing.transfers, invoices: state.billing.invoices })
    expect(holdingBalance(entries)).toBeGreaterThanOrEqual(0)
    for (const t of Object.values(state.billing.transfers)) {
      if (pristine.billing.transfers[t.id] !== undefined) continue
      expect(state.schedule.lists[t.listId]!.state).toBe('AUTHORISED')
    }
  })

  it('prepaid Bookings sit on prepaid Contracts with a person as payer, and their Procedures are left off the final invoice', () => {
    expect(full.counts.prepaidBookings).toBeGreaterThan(0)
    const linesByInvoice = new Map<string, typeof state.billing.invoiceLines[string][]>()
    for (const l of Object.values(state.billing.invoiceLines)) linesByInvoice.set(l.invoiceId, [...(linesByInvoice.get(l.invoiceId) ?? []), l])
    for (const p of Object.values(state.schedule.procedures)) {
      const c = state.masters.contracts[p.governingContractId ?? '']
      if (c?.prepaid !== true || pristine.schedule.procedures[p.id] !== undefined) continue
      expect(p.payer.kind).toBe('patient')
      for (const inv of Object.values(state.billing.invoices)) {
        if (inv.bookingId !== p.bookingId || inv.kind !== 'standard') continue
        expect((linesByInvoice.get(inv.id) ?? []).some((l) => l.procedureId === p.id)).toBe(false)
      }
    }
  }, 60_000)

  it('the Xero mirror holds no NHI and no patient name', () => {
    const names = new Set(Object.values(state.masters.patients).map((p) => p.name.toLowerCase()))
    const nhis = new Set(Object.values(state.masters.patients).flatMap((p) => (p.nhi !== undefined ? [p.nhi] : [])))
    for (const c of Object.values(state.xero.contacts)) {
      expect(nhis.has(c.contactNumber)).toBe(false)
      expect(names.has(c.name.toLowerCase()), c.name).toBe(false)
    }
    expect(full.counts.activeContacts).toBe(Object.values(state.xero.contacts).filter((c) => !c.archived).length)
    expect(state.settings.volumeStory.activeContacts).toBe(full.counts.activeContacts)
  })

  it('history before the backlog is billed; the last two working days wait in Review', () => {
    const backlog = Object.values(state.schedule.lists).filter((l) => l.state === 'SUBMITTED' && pristine.schedule.lists[l.id] === undefined)
    expect(backlog.length).toBeGreaterThan(80)
    expect(backlog.length).toBeLessThan(250)
    for (const l of backlog) expect(l.dateISO >= addDaysISO(TODAY, -5)).toBe(true)
  })
})

describe('one billing module', () => {
  const SOURCES = import.meta.glob('../domain/seed/fullScale/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

  it('declares no Party, Contract, RVG group or Procedure shape and no pricing, candidate, snapshot or prepayment rule of its own', () => {
    const files = Object.keys(SOURCES)
    expect(files.length).toBeGreaterThan(1)
    for (const [file, source] of Object.entries(SOURCES)) {
      expect(/\b(interface|type)\s+(Party|Contract|RvgGroup|Procedure|BookingProcedure|PriceRange|ContractPricing)\b/.test(source), `${file} declares a model shape`).toBe(false)
      expect(/function\s+\w*(price|Price|candidate|Candidate|snapshot|Snapshot|lock|Lock|prepay|Prepay)\w*\s*\(/.test(source), `${file} declares a billing rule`).toBe(false)
      // Billing logic comes from domain/billing (and the seed's builders), never another module.
      for (const m of source.matchAll(/from '([^']+)'/g)) {
        const path = m[1]!
        expect(path.startsWith('../../billing/') || path.startsWith('../') || path.startsWith('./') || path === 'date-fns', `${file} imports ${path}`).toBe(true)
      }
    }
  })
})

describe('payment runs at full scale (catch-up Phase 39a)', () => {
  it('every payout names a paid run, one week run per ISO week, and every generated payment has its bank line', () => {
    const runs = state.billing.payablesRuns
    for (const d of Object.values(state.billing.disbursements)) expect(runs[d.payablesRunId]?.status, d.id).toBe('paid')
    const weeks = Object.values(runs).filter((r) => r.kind === 'week' && r.status !== 'superseded').map((r) => r.cycleId)
    expect(new Set(weeks).size).toBe(weeks.length)
    const lined = new Set(Object.values(state.billing.bankLines).map((b) => b.xeroPaymentId))
    for (const p of Object.values(state.xero.payments)) {
      if (p.source === 'aaFee' || state.xero.accRecs[p.accRecId]?.kind === 'aaFee') continue
      expect(lined.has(p.id), p.id).toBe(true)
    }
  })
})

describe('the practice: the 71 as people (names, working lives, the office\'s view)', () => {
  const generatedIds = (): string[] => Object.keys(state.masters.anaesthetists).filter((id) => pristine.masters.anaesthetists[id] === undefined)

  it('the roster: 71 hand-picked names, 36 women and 35 men, about the New Zealand mix', () => {
    expect(FULL_SCALE_ANAESTHETISTS.length).toBe(71)
    expect(FULL_SCALE_ANAESTHETISTS.filter((r) => r.sex === 'F').length).toBe(36)
    const groups: Record<string, number> = {}
    for (const r of FULL_SCALE_ANAESTHETISTS) groups[r.group] = (groups[r.group] ?? 0) + 1
    expect(groups).toEqual({ European: 39, Māori: 12, Asian: 13, Pacific: 5, MELAA: 2 })
    const profiles: Record<string, number> = {}
    for (const r of FULL_SCALE_ANAESTHETISTS) profiles[r.profile] = (profiles[r.profile] ?? 0) + 1
    expect(profiles).toEqual({ full: 32, part: 28, light: 11 })
    // The prepaid price lists sit on the first six: none of them a new starter.
    for (const r of FULL_SCALE_ANAESTHETISTS.slice(0, FULL_SCALE.prepaidPriceListAnaesthetists)) expect(r.startsISO).toBeUndefined()
    const generated = generatedIds().map((id) => state.masters.anaesthetists[id]!.name)
    expect(generated).toEqual(FULL_SCALE_ANAESTHETISTS.map((r) => `Dr ${r.first} ${r.last}`))
  })

  it('every one of the 85 has a unique surname, initials, email and HPI CPN; no surname is a surgeon\'s or a guide patient\'s', () => {
    const all = Object.values(state.masters.anaesthetists)
    expect(all.length).toBe(85)
    expect(new Set(all.map((a) => surnameOf(a.name))).size).toBe(85)
    expect(new Set(all.map((a) => a.email)).size).toBe(85)
    expect(new Set(all.map((a) => a.hpiId)).size).toBe(85)
    // No two avatars alike (the shared Avatar shows initials only).
    expect(new Set(all.map((a) => initialsOf(a.name))).size).toBe(85)
    const surgeonSurnames = new Set(Object.values(state.masters.surgeons).map((s) => surnameOf(s.name)))
    for (const id of generatedIds()) {
      const surname = surnameOf(state.masters.anaesthetists[id]!.name)
      expect(surgeonSurnames.has(surname), surname).toBe(false)
      expect(GUIDE_PATIENT_SURNAMES.has(surname), surname).toBe(false)
    }
  })

  it('the 24 generated surgeons come from their roster, with surnames no other surgeon or anaesthetist has', () => {
    const generated = Object.values(state.masters.surgeons).filter((s) => pristine.masters.surgeons[s.id] === undefined)
    expect(generated.map((s) => s.name)).toEqual(FULL_SCALE_SURGEONS.slice(0, FULL_SCALE.surgeons).map((r) => `${r.title} ${r.first.charAt(0)}. ${r.last}`))
    const others = new Set([
      ...Object.values(pristine.masters.surgeons).map((s) => surnameOf(s.name)),
      ...Object.values(state.masters.anaesthetists).map((a) => surnameOf(a.name)),
    ])
    for (const s of generated) expect(others.has(surnameOf(s.name)), s.name).toBe(false)
    expect(new Set(generated.map((s) => surnameOf(s.name))).size).toBe(generated.length)
  })

  it('every generated patient\'s name comes from the pool of their ethnicity code, and no guide patient\'s surname is reused', () => {
    const english = new Set<string>([...ENGLISH_NAMES.female, ...ENGLISH_NAMES.male])
    const englishSurnames = new Set<string>(ENGLISH_NAMES.surnames)
    const generated = Object.values(state.masters.patients).filter((p) => pristine.masters.patients[p.hiddenInternalId] === undefined)
    expect(generated.length).toBeGreaterThan(20000)
    const codes = new Set<string>()
    for (const p of generated) {
      const pool = poolFor(p.ethnicityCode)
      expect(pool.code, p.hiddenInternalId).toBe(p.ethnicityCode)
      codes.add(pool.code)
      const [first, surname] = p.name.split(' ') as [string, string]
      expect(p.name.split(' ').length, p.name).toBe(2)
      const firstOk = pool.female.includes(first) || pool.male.includes(first) || (pool.englishFirstShare !== undefined && english.has(first))
      const surnameOk = pool.surnames.includes(surname) || (pool.englishSurnameShare !== undefined && englishSurnames.has(surname))
      expect(firstOk && surnameOk, `${p.name} (${p.ethnicityCode})`).toBe(true)
      expect(GUIDE_PATIENT_SURNAMES.has(surname), p.name).toBe(false)
    }
    expect(codes.size).toBe(12)
  })

  it('work profiles: days off are one weekly Unavailable series (weekdays off for part time and light, the weekend for most), with no recurring session on them', () => {
    const roster = new Map(generatedIds().map((id, i) => [id, FULL_SCALE_ANAESTHETISTS[i]!]))
    const seriesByAnaesthetist = new Map<string, typeof state.schedule.availabilitySeries[string][]>()
    for (const s of Object.values(state.schedule.availabilitySeries)) {
      if (pristine.schedule.availabilitySeries[s.id] !== undefined) continue
      seriesByAnaesthetist.set(s.anaesthetistId, [...(seriesByAnaesthetist.get(s.anaesthetistId) ?? []), s])
    }
    const recurring = Object.values(state.masters.recurringBookings).filter((r) => pristine.masters.recurringBookings[r.id] === undefined)
    let weekendsOff = 0
    for (const [id, row] of roster) {
      const profile = FULL_SCALE.workProfiles[row.profile]
      const mine = recurring.filter((r) => r.anaesthetistId === id)
      expect(mine.length, id).toBeGreaterThanOrEqual(profile.sessionsPerWeek.min)
      expect(mine.length, id).toBeLessThanOrEqual(profile.sessionsPerWeek.max)
      const series = seriesByAnaesthetist.get(id) ?? []
      expect(series.length, id).toBeLessThanOrEqual(1)
      const weekdays = (series[0]?.weekdays ?? []) as number[]
      const off = weekdays.filter((d) => d <= 5)
      expect(off.length, id).toBeGreaterThanOrEqual(profile.weekdaysOff.min)
      expect(off.length, id).toBeLessThanOrEqual(profile.weekdaysOff.max)
      if (series[0] !== undefined) expect(series[0].statusKey).toBe(SEED_STATUS.unavailable)
      for (const r of mine) expect(weekdays.includes(r.dayOfWeek), r.id).toBe(false)
      if (weekdays.includes(6)) weekendsOff += 1
    }
    expect(weekendsOff).toBeGreaterThan(40)
    // The series painted the canvas: their Slots carry the series id.
    const painted = Object.values(state.schedule.slots).filter((sl) => sl.seriesId !== undefined && seriesByAnaesthetist.has(sl.anaesthetistId))
    expect(painted.length).toBeGreaterThan(1000)
  })

  it('a new starter has no Slot, List or Booking before joining; everyone established has Lists in the next four weeks', () => {
    const listsByAnaesthetist = new Map<string, string[]>()
    for (const l of Object.values(state.schedule.lists)) {
      if (l.anaesthetistId === undefined) continue
      listsByAnaesthetist.set(l.anaesthetistId, [...(listsByAnaesthetist.get(l.anaesthetistId) ?? []), l.dateISO])
    }
    for (const id of generatedIds()) {
      const start = state.masters.anaesthetists[id]!.startDateISO
      const dates = listsByAnaesthetist.get(id) ?? []
      if (start > TODAY) {
        for (const d of dates) expect(d >= start, `${id} ${d}`).toBe(true)
        for (const s of Object.values(state.schedule.slots)) if (s.anaesthetistId === id) expect(s.dateISO >= start).toBe(true)
        continue
      }
      // The one colleague who has left (Phase 52, Dr Reeves): nothing after the last day instead.
      const lastDay = state.masters.anaesthetists[id]!.lastDayISO
      if (lastDay !== null && lastDay < TODAY) {
        expect(dates.every((d) => d <= lastDay), id).toBe(true)
        continue
      }
      expect(dates.some((d) => d >= TODAY && d <= addDaysISO(TODAY, 28)), id).toBe(true)
    }
  })

  it('the canvas is settled: applying every recurring booking now would change nothing for the 71 (covered days stay answered)', () => {
    const plan = previewApplyAllRecurringBookings(state)
    const mentionsGenerated = (rows: readonly unknown[]): unknown[] => rows.filter((r) => JSON.stringify(r).includes('RB-FS-'))
    expect(mentionsGenerated(plan.create)).toEqual([])
    expect(mentionsGenerated(plan.update)).toEqual([])
    expect(mentionsGenerated(plan.remove)).toEqual([])
    expect(mentionsGenerated(plan.skipped)).toEqual([])
    expect(mentionsGenerated(plan.draftUpdate)).toEqual([])
    expect(mentionsGenerated(plan.draftRemove)).toEqual([])
    // Some recurring days under leave were covered by a colleague: they keep their draft trail.
    const covered = Object.values(state.schedule.lists).filter((l) => l.state === 'ACTIVE' && l.draft?.projectedFor !== undefined && pristine.schedule.lists[l.id] === undefined)
    expect(covered.length).toBeGreaterThan(50)
  }, 120_000)

  it('no Slot holds two Lists, and every assigned List ahead sits on an open Slot', () => {
    const seen = new Set<string>()
    for (const l of Object.values(state.schedule.lists)) {
      if (l.slotId === undefined) continue
      expect(seen.has(l.slotId), l.id).toBe(false)
      seen.add(l.slotId)
      if (pristine.schedule.lists[l.id] !== undefined || l.dateISO < TODAY || l.state !== 'ACTIVE') continue
      expect(state.schedule.slots[l.slotId]?.status, l.id).toBe(SEED_STATUS.free)
    }
  })

  it('the office\'s view: the cast\'s tiers and preferences stay as seeded; the new ones are among the generated people only', () => {
    for (const [id, tier] of Object.entries(pristine.officePrivate.priorityTiers)) expect(state.officePrivate.priorityTiers[id]).toBe(tier)
    for (const [id, pref] of Object.entries(pristine.officePrivate.pairingPreferences)) expect(state.officePrivate.pairingPreferences[id]).toEqual(pref)
    const generated = new Set(generatedIds())
    const tiers = Object.entries(state.officePrivate.priorityTiers).filter(([id]) => generated.has(id))
    expect(tiers.length).toBeGreaterThan(15)
    for (const [, tier] of tiers) expect([2, 3]).toContain(tier)
    const prefs = Object.values(state.officePrivate.pairingPreferences).filter((p) => pristine.officePrivate.pairingPreferences[p.id] === undefined)
    expect(prefs.length).toBe(FULL_SCALE.pairingPreferences)
    for (const p of prefs) {
      expect(generated.has(p.anaesthetistId), p.id).toBe(true)
      expect(pristine.masters.surgeons[p.surgeonId], p.id).toBeUndefined()
      expect(state.masters.surgeons[p.surgeonId], p.id).toBeDefined()
      expect(p.addedAtISO < `${TODAY}T00:00:00`).toBe(true)
    }
    expect(new Set(prefs.map((p) => `${p.anaesthetistId}|${p.surgeonId}`)).size).toBe(prefs.length)
  })
})
