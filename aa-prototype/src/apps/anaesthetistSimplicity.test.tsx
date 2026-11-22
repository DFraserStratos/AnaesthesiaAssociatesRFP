/**
 * The anaesthetist's world stays simple (catch-up Phase 43a; US-15.0.1), checked in
 * BOTH directions, as the one enforcement point of `shared/viewer.ts`:
 *
 * - **Forbidden.** For Dr Souter, in the mobile and the web surface, the Booking
 *   detail of a set of Bookings covering every Contract and price case shows no
 *   office-only detail: the Contract catalogue's override pill, the office's
 *   Change price, the old rate labels, the multi-procedure rule's wording, internal
 *   words, route or category words, preferences or tiers, and no provisional label.
 * - **Kept.** The same renders still show what the Confirmed catalogue gives her:
 *   the stack (Contract name, holder, who is invoiced, pricing basis, the RVG code on
 *   RVG kinds), the Price section with its state, the Booking total, the prepaid
 *   amount, each Procedure's Paid by line and the approval number where held. So the
 *   sweep cannot pass by stripping what the catalogue requires.
 * - **Positive control.** The office's render of the same Bookings shows Change
 *   price, the old rate label and the rule's wording, and the Contract catalogue
 *   shows its override pill, so the forbidden scan cannot pass by rendering nothing.
 * - **Source scan.** No mobile or web file imports the office's billing set-up,
 *   Change price or the Contract catalogue.
 *
 * Cases are built over a test-local copy of the seed (never the seed itself).
 * Preferences and tiers are 17's `officePrivacy.test.ts`; this re-checks their
 * words on these renders only.
 */

import { cleanup, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import {
  bookingsForList,
  freshAppState,
  OFFICE_ACTOR,
  procedureStackViewFor,
  proceduresForBooking,
  SOUTER_ACTOR,
  useAppStore,
  type Actor,
  type AppState,
} from '../store'
import { SurfaceProvider } from '../shared/surface'
import { BookingDetailBody } from '../shared/booking/BookingDetailBody'
import { AddBillingEventSheet, AddPrePostOpEventSheet } from '../shared/booking/EventSheets'
import { ListDetailScreen } from './mobile/screens/ListDetailScreen'
import { OVERRIDE_PILL_LABEL } from '../shared/contracts'
import { CONTRACT, HOSP, SEED_LIST_IDS } from '../domain/seed'
import { MULTI_PROCEDURE_DEMO } from '../domain/seed/multiProcedureDemo'
import type { Procedure } from '../domain/types'

afterEach(cleanup)

/** The office-only words, from where their owners keep them plus the short literal list. */
const FORBIDDEN: readonly (string | RegExp)[] = [
  OVERRIDE_PILL_LABEL.may,
  OVERRIDE_PILL_LABEL.fixed,
  'Anaesthetist can change pricing',
  'Fixed for the anaesthetist',
  'Change price',
  'first-party',
  'third-party',
  /adjustable/i,
  'Method 3',
  'individually arranged',
  /hourly/i,
  /direct claim/i,
  /\bRoute\b/,
  /\bType [123]\b/,
  /Price override/i,
  'FIXED CONTRACT PRICE',
  '/UNIT',
  'Not preferred',
  /\bTier [1-4]\b/,
  /billable party/i,
  /provisional/i,
  // 23's multi-procedure rule wording (the anaesthetist reads one neutral line).
  'Base units are charged on the primary',
  'Base units are on the primary',
  'Base not charged on an additional',
  /split \d+ · \d+/,
  /(Primary · B \+ T|Additional · T)/,
  'Not shared',
  // Hospital or claim references (D82, 25a).
  /hospital reference/i,
  /claim reference/i,
  /purchase order/i,
]

/** Everything a person could read: text, accessible names and tooltips. */
function readable(root: ParentNode): string {
  const parts: string[] = [root.textContent ?? '']
  for (const el of Array.from(root.querySelectorAll('[aria-label],[title]'))) {
    parts.push(el.getAttribute('aria-label') ?? '', el.getAttribute('title') ?? '')
  }
  return parts.join('\n')
}

function leaks(text: string): string[] {
  return FORBIDDEN.filter((f) => (typeof f === 'string' ? text.includes(f) : f.test(text))).map(String)
}

// ── Cases ────────────────────────────────────────────────────────────────────

interface Case {
  name: string
  state: AppState
  bookingId: string
  /** The Price section state(s) expected for the anaesthetist on an ACTIVE List. */
  priceStates?: readonly string[]
  expectPrepaid?: boolean
  expectPayerName?: string
  expectApproval?: string
  /** Seeded on a List already submitted; rendered as it is. */
  fixedList?: boolean
}

const base = freshAppState()
const ACTIVE_LIST = SEED_LIST_IDS.souterAm21
const host = bookingsForList(base, ACTIVE_LIST)[0]!
const hostProcedure = proceduresForBooking(base, host.id)[0]!
const contracts = base.masters.contracts
const openFallback = Object.values(contracts).find((c) => c.systemRole === 'openPriceFallback' && c.billsTo === 'payer' && !c.prepaid)!
const insurer = Object.values(base.masters.parties).find((p) => p.kind === 'insurer')!
/** Forte Health's Contracts are offered on a Forte List. */
const AT_FORTE = { hospitalId: HOSP.forte }

/** A copy of the seed with the host Booking's Procedures replaced. */
function withProcedures(patches: readonly Partial<Procedure>[], bookingPatch: Record<string, unknown> = {}, listPatch: Record<string, unknown> = {}): AppState {
  const s = structuredClone(base) as AppState
  for (const p of proceduresForBooking(base, host.id)) delete s.schedule.procedures[p.id]
  patches.forEach((patch, i) => {
    const id = i === 0 ? hostProcedure.id : `${hostProcedure.id}-T${i}`
    s.schedule.procedures[id] = { ...hostProcedure, id, isPrimary: i === 0, enteredPrice: undefined, split: undefined, ...patch } as Procedure
  })
  // Not yet completed, so the capture cards and the Price section are live.
  s.schedule.bookings[host.id] = { ...s.schedule.bookings[host.id]!, completed: false, ...bookingPatch }
  const list = s.schedule.lists[ACTIVE_LIST]!
  s.schedule.lists[ACTIVE_LIST] = { ...list, ...listPatch } as typeof list
  return s
}

const rvgGroupId = hostProcedure.rvgGroupId
const GUARDIAN = { kind: 'other' as const, id: 'PY-T-1', name: 'Hana Rewi', relationship: 'Mother', email: 'hana.rewi@example.com' }

const CASES: Case[] = [
  { name: 'No contract (RVG), the patient pays', state: withProcedures([{ governingContractId: CONTRACT.noContractRvg, payer: { kind: 'patient' } }]), bookingId: host.id, priceStates: ['override'] },
  { name: 'No contract (RVG), a guardian pays', state: withProcedures([{ governingContractId: CONTRACT.noContractRvg, payer: GUARDIAN }]), bookingId: host.id, expectPayerName: GUARDIAN.name },
  {
    name: 'Two Procedures with different payers',
    state: withProcedures([
      { governingContractId: CONTRACT.noContractRvg, payer: { kind: 'patient' } },
      { governingContractId: CONTRACT.noContractRvg, payer: GUARDIAN, rvgGroupId },
    ]),
    bookingId: host.id,
    expectPayerName: GUARDIAN.name,
  },
  { name: 'A fixed-price Contract (read-only)', state: withProcedures([{ governingContractId: CONTRACT.doyleBariatric }]), bookingId: host.id, priceStates: ['read-only'] },
  { name: 'An RVG Contract whose override setting allows it', state: withProcedures([{ governingContractId: CONTRACT.forteRvg }], {}, AT_FORTE), bookingId: host.id, priceStates: ['override'] },
  { name: 'No contract · Fixed price, the typed amount', state: withProcedures([{ governingContractId: openFallback.id, enteredPrice: 2000 }]), bookingId: host.id, priceStates: ['amount'] },
  { name: "A Contract's own rate (not editable)", state: withProcedures([{ governingContractId: CONTRACT.sxap }]), bookingId: host.id, priceStates: ['read-only'] },
  { name: "A Contract's own discount (not editable)", state: withProcedures([{ governingContractId: CONTRACT.forteDiscount }], {}, AT_FORTE), bookingId: host.id, priceStates: ['read-only'] },
  { name: 'An editable Contract with her typed price', state: withProcedures([{ governingContractId: CONTRACT.forteRvg, enteredPrice: 480 }], {}, AT_FORTE), bookingId: host.id, priceStates: ['override'] },
  { name: 'ACC as the holder', state: withProcedures([{ governingContractId: CONTRACT.stgAcc }]), bookingId: host.id, priceStates: ['read-only'] },
  { name: 'An office price change on a fixed Contract', state: withProcedures([{ governingContractId: CONTRACT.sxap, enteredPrice: 650 }]), bookingId: host.id },
  { name: 'No invoice destination yet', state: withProcedures([{ governingContractId: undefined }]), bookingId: host.id },
  { name: 'No RVG code yet on an RVG kind', state: withProcedures([{ governingContractId: CONTRACT.noContractRvg, rvgGroupId: undefined }]), bookingId: host.id },
  { name: 'A fixed price with the form collapsed', state: withProcedures([{ governingContractId: CONTRACT.doyleBariatric, rvgGroupId: undefined }]), bookingId: host.id },
  {
    name: 'A combination: a fixed-price primary and an RVG additional',
    state: withProcedures([{ governingContractId: CONTRACT.doyleBariatric }, { governingContractId: CONTRACT.noContractRvg, rvgGroupId }]),
    bookingId: host.id,
  },
  {
    name: 'An insurer with an approval number',
    state: withProcedures([{ governingContractId: CONTRACT.noContractRvg }], { funderPartyId: insurer.id, insuranceApprovalNumber: 'APP-55821' }),
    bookingId: host.id,
    expectApproval: 'APP-55821',
  },
]

// Seeded cases, rendered on the List they are seeded on.
const prepaid = bookingsForList(base, SEED_LIST_IDS.prepaymentUnpaidList).find((b) =>
  proceduresForBooking(base, b.id).some((p) => p.governingContractId !== undefined && contracts[p.governingContractId]?.prepaid === true),
)
if (prepaid !== undefined) CASES.push({ name: 'Her own price list, prepaid (read-only, D30)', state: base, bookingId: prepaid.id, expectPrepaid: true })
const multi = bookingsForList(base, SEED_LIST_IDS.multiProcedure).find((b) => b.patientId === MULTI_PROCEDURE_DEMO.patientId)
if (multi !== undefined) CASES.push({ name: 'The three-procedure Booking (23)', state: base, bookingId: multi.id, fixedList: true })
const split = bookingsForList(base, SEED_LIST_IDS.souterMon20Pm).find((b) => proceduresForBooking(base, b.id).some((p) => p.split !== undefined))
if (split !== undefined) CASES.push({ name: 'A split Procedure (22)', state: base, bookingId: split.id, fixedList: true })
const withEvents = Object.values(base.schedule.procedureEvents ?? {})
  .map((e) => base.schedule.procedures[(e as { procedureId: string }).procedureId])
  .find((p) => p !== undefined && base.schedule.lists[base.schedule.bookings[p.bookingId]?.listId ?? '']?.anaesthetistId === SOUTER_ACTOR.anaesthetistId)
if (withEvents !== undefined) CASES.push({ name: 'A Booking with events (39b)', state: base, bookingId: withEvents.bookingId, fixedList: true })

function contractsOf(state: AppState) {
  return state.masters.contracts
}

function submitted(state: AppState): AppState {
  const s = structuredClone(state) as AppState
  const list = s.schedule.lists[ACTIVE_LIST]!
  s.schedule.lists[ACTIVE_LIST] = { ...list, state: 'SUBMITTED' } as typeof list
  return s
}

function renderBooking(state: AppState, bookingId: string, actor: Actor, variant: 'mobile' | 'web') {
  useAppStore.setState(state)
  return render(
    <MemoryRouter>
      <SurfaceProvider variant={variant}>
        <BookingDetailBody bookingId={bookingId} actor={actor} onBack={() => {}} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('anaesthetist simplicity (Phase 43a, US-15.0.1)', () => {
  it('covers the seeded cases it asks for', () => {
    expect(prepaid, 'a prepaid Booking on her own price list').toBeDefined()
    expect(multi, 'the three-procedure Booking').toBeDefined()
    expect(split, 'a split Procedure').toBeDefined()
    expect(CASES.length).toBeGreaterThanOrEqual(19)
  })

  for (const c of CASES) {
    const states: [string, AppState][] = c.fixedList ? [['as seeded', c.state]] : [['ACTIVE', c.state], ['SUBMITTED', submitted(c.state)]]
    for (const [listLabel, state] of states) {
      for (const variant of ['mobile', 'web'] as const) {
        it(`${c.name} · ${listLabel} · ${variant}: nothing office-only, and everything she is given`, () => {
          const { container } = renderBooking(state, c.bookingId, SOUTER_ACTOR, variant)
          const doc = container.ownerDocument
          const text = readable(doc.body)
          expect(leaks(text), 'office-only words on an anaesthetist screen').toEqual([])
          expect(doc.querySelector('[data-shot="change-price"]')).toBeNull()

          // Kept: the stack for each Procedure with a Contract.
          const procs = proceduresForBooking(state, c.bookingId)
          const stacks = Array.from(doc.querySelectorAll('[data-shot="procedure-stack"]'))
          expect(stacks.length).toBeGreaterThanOrEqual(procs.length)
          // The stack's received wording sits in procedure-stack; its Contract part in the Billing card beside it (20a, 22a).
          const stackText = [...stacks, ...Array.from(doc.querySelectorAll('[data-shot="billing"], [data-shot="capture-billing"]'))].map((s) => s.textContent ?? '').join('\n')
          for (const p of procs) {
            const view = procedureStackViewFor(state, p.id, 'anaesthetist')
            if (view === undefined) continue
            if (view.contract !== null) {
              // The decided rail's rows as 20 built them for her: where the invoice goes, the Contract, the price.
              // The web rail shows an open price as its typed amount ("Fixed price $2,000.00").
              if (contractsOf(state)[view.contract.id]?.systemRole === 'openPriceFallback') expect(stackText).toMatch(/Fixed price/)
              else expect(stackText).toContain(view.contract.name)
              expect(stackText).toMatch(/Invoice to/)
              expect(stackText).toMatch(/Price/)
            }
            // The RVG code: in the stack, or on a fixed price in the capture card's optional code (21a).
            // (the phone's Billing summary names a fixed price's optional code by its description; the code is in its sheet).
            // With no Contract yet the web rail opens on its first step ("Where does the invoice go?"), as 20 built it.
            if (view.rvg !== null && typeof view.rvg === 'object' && !(view.contract === null && variant === 'web')) {
              const rvg = view.rvg
              expect(text.includes(rvg.code) || text.includes(rvg.description), `RVG code ${rvg.code}`).toBe(true)
            }
          }

          // Kept: the Price section and the Booking total.
          const priceCards = Array.from(doc.querySelectorAll('[data-shot="price-card"]'))
          expect(priceCards.length).toBeGreaterThan(0)
          if (c.priceStates !== undefined && listLabel === 'ACTIVE') {
            expect(c.priceStates).toContain(priceCards[0]!.getAttribute('data-state'))
          }
          expect(doc.querySelector('[data-shot="booking-total-strip"], [data-shot="booking-total"]')).not.toBeNull()
          if (c.expectPrepaid === true) expect(text).toMatch(/Prepaid amount/)
          if (c.expectPayerName !== undefined) expect(text).toContain(c.expectPayerName)
          if (c.expectApproval !== undefined) expect(text).toContain(c.expectApproval)
          // No Booking-level Payer row (22a): the payer is on each Procedure.
          expect(doc.querySelector('[data-shot="booking-payer"]')).toBeNull()
        })
      }
    }
  }

  it('positive control: the office sees Change price, the old rate label and the rule wording on the same Bookings', () => {
    const rvg = renderBooking(CASES[0]!.state, host.id, OFFICE_ACTOR, 'web')
    const doc = rvg.container.ownerDocument
    expect(doc.querySelector('[data-shot="change-price"]')).not.toBeNull()
    expect(readable(doc.body)).toMatch(/\/UNIT/)
    rvg.unmount()
    const combo = CASES.find((x) => x.name.startsWith('A combination'))!
    const office = renderBooking(combo.state, combo.bookingId, OFFICE_ACTOR, 'web')
    const officeText = readable(office.container.ownerDocument.body)
    expect(officeText).toContain('Base units are on the primary')
    expect(leaks(officeText).length).toBeGreaterThan(0)
  })

  it('her sheets show nothing office-only: Billing (the Contract picker), Paid by, Split and the two event sheets', () => {
    for (const variant of ['mobile', 'web'] as const) {
      const c = CASES[1]!
      const { container, unmount } = renderBooking(c.state, c.bookingId, SOUTER_ACTOR, variant)
      const doc = container.ownerDocument
      const opened: string[] = []
      for (const shot of ['capture-billing', 'paid-by-change', 'procedure-split-button']) {
        const trigger = doc.querySelector<HTMLElement>(`[data-shot="${shot}"]`)
        if (trigger === null) continue
        fireEvent.click(trigger.tagName === 'BUTTON' ? trigger : (trigger.querySelector('button') ?? trigger))
        opened.push(shot)
        expect(leaks(readable(doc.body)), `${variant} after ${shot}`).toEqual([])
      }
      expect(opened.length, `${variant}: sheets opened`).toBeGreaterThanOrEqual(2)
      unmount()
      cleanup()
    }
    const procedureId = proceduresForBooking(CASES[0]!.state, host.id)[0]!.id
    useAppStore.setState(CASES[0]!.state)
    for (const Sheet of [AddPrePostOpEventSheet, AddBillingEventSheet]) {
      const { container, unmount } = render(
        <MemoryRouter>
          <SurfaceProvider variant="mobile">
            <Sheet open procedureId={procedureId} actor={SOUTER_ACTOR} onClose={() => {}} />
          </SurfaceProvider>
        </MemoryRouter>,
      )
      const doc = container.ownerDocument
      for (const label of ['Pre-op', 'ACC pre-op assessment', 'Fixed fee']) {
        const el = Array.from(doc.querySelectorAll<HTMLElement>('button, [role="radio"], label')).find((b) => b.textContent?.trim() === label)
        if (el !== undefined) fireEvent.click(el)
      }
      const text = readable(doc.body)
      expect(leaks(text)).toEqual([])
      expect(text).not.toMatch(/Our reading|OQ-\d+|Method|hourly|rate basis/i)
      unmount()
    }
  })

  it("her Booking history drops a not-preferred pairing acknowledged on her List's reassignment; the office's keeps it", () => {
    const state = structuredClone(CASES[0]!.state) as AppState
    const at = `${state.clock.todayISO}T09:00:00`
    const row = (id: string, action: string, kind?: 'listReassign') => ({
      id, entityType: 'list', entityId: ACTIVE_LIST, who: 'Kirsty W.', role: 'office' as const, source: 'office' as const,
      action, after: {}, atISO: at, changeSetId: 'CS-T-43A', ...(kind !== undefined ? { changeSetKind: kind } : {}),
    })
    state.audit = [...state.audit, row('AU-T-1', 'list.reassign', 'listReassign'), row('AU-T-2', 'list.pairingAcknowledged')] as AppState['audit']
    for (const [actor, shows] of [[SOUTER_ACTOR, false], [OFFICE_ACTOR, true]] as const) {
      const { container, unmount } = renderBooking(state, host.id, actor, 'web')
      fireEvent.click(container.ownerDocument.querySelector('[data-shot="booking-history-button"]')!)
      const history = container.ownerDocument.querySelector('[data-shot="booking-history"]')
      expect(history, 'the history sheet').not.toBeNull()
      expect((history?.textContent ?? '').includes('Not preferred'), actor.role).toBe(shows)
      unmount()
    }
  })

  it('List detail and its rows show nothing office-only', () => {
    for (const c of [CASES[0]!, CASES.find((x) => x.name.startsWith('A combination'))!]) {
      useAppStore.setState(c.state)
      const { container, unmount } = render(
        <MemoryRouter>
          <SurfaceProvider variant="mobile">
            <ListDetailScreen listId={ACTIVE_LIST} actor={SOUTER_ACTOR} onBack={() => {}} onOpenBooking={() => {}} onAddBooking={() => {}} />
          </SurfaceProvider>
        </MemoryRouter>,
      )
      const text = readable(container.ownerDocument.body)
      expect(text.length).toBeGreaterThan(50)
      expect(leaks(text)).toEqual([])
      unmount()
    }
  })

  it('the anaesthetist reads one neutral line on an additional Procedure', () => {
    const combo = CASES.find((x) => x.name.startsWith('A combination'))!
    const { container } = renderBooking(combo.state, combo.bookingId, SOUTER_ACTOR, 'mobile')
    const note = container.ownerDocument.querySelector('[data-shot="procedure-additional-note"]')
    expect(note?.textContent).toBe('Second procedure. Record its times as usual.')
  })
})

// ── Source scan ──────────────────────────────────────────────────────────────

const APP_SOURCES = {
  ...(import.meta.glob('./mobile/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
  ...(import.meta.glob('./web/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
}

/** Office-only modules: the billing set-up, Change price and the Contract catalogue and editor. */
const OFFICE_ONLY_MODULES = /(OfficeBillingSetup|EditBillingSetupSheet|PricingSheet|ContractsView|ContractEditSheet|apps\/admin\/)/
const OFFICE_ONLY_NAMES = /\b(OfficeBillingSetup|EditBillingSetupSheet|PricingSheet|ContractsView|ContractEditSheet|OVERRIDE_PILL_LABEL)\b/

describe('anaesthetist simplicity: source scan', () => {
  const files = Object.keys(APP_SOURCES).filter((f) => !/\.test\.tsx?$/.test(f))
  it('finds the mobile and web sources', () => {
    expect(files.some((f) => f.startsWith('./mobile/'))).toBe(true)
    expect(files.some((f) => f.startsWith('./web/'))).toBe(true)
  })
  it('no mobile or web file imports the office billing set-up, Change price or the Contract catalogue', () => {
    for (const file of files) {
      const source = APP_SOURCES[file] ?? ''
      const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!)
      for (const spec of specifiers) expect(spec, `${file} imports ${spec}`).not.toMatch(OFFICE_ONLY_MODULES)
      expect(OFFICE_ONLY_NAMES.test(source), `${file} names an office-only component or label map`).toBe(false)
    }
  })
})
