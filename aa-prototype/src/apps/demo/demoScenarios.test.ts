/**
 * The S1 to S5 scenario jumps (catch-up Phase 44): each stages cleanly from
 * the pristine seed, S3 and S5 leave what their beats need, staging is
 * deterministic, every beat link lands on a real route naming ids that exist,
 * and every word the presenter reads is dash-free and in the catalogue's
 * vocabulary. Runs against isolated stores (`createAppStore`), with the
 * billing run wired the way `main.tsx` wires the app's own store.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { matchPath } from 'react-router-dom'
import { createAppStore, type AppState, type AppStoreApi } from '../../store/appStore'
import { wireBillingRun } from '../../store/billingRun'
import { authoriseList, submitList } from '../../store/lifecycle'
import { decideImportRow, importHospitalDownload } from '../../store/matchingActions'
import { lastChangeSetFor } from '../../store/changeSetSelectors'
import { changeSetsFor } from '../../domain/changeSets'
import { bookingsForList, proceduresForBooking } from '../../store/selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../store/demoActors'
import { completeAnswered } from '../../test/completeAnswered'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { projectedListId } from '../../domain/slots'
import { MASTERS_NAV } from '../admin/screens/masters/view'
import { DEMO_TRIGGERS } from '../../shared/demoTriggers'
import { DEMO_SCENARIOS, demoScenarioById, type DemoScenario } from './demoScenarios'

let unwire: (() => void) | null = null
afterEach(() => {
  unwire?.()
  unwire = null
})

/** A fresh store with the billing run wired, as the app's own store is at bootstrap. */
function wiredStore(): AppStoreApi {
  const api = createAppStore()
  unwire = wireBillingRun(api)
  return api
}

function scenario(id: string): DemoScenario {
  const s = demoScenarioById(id)
  if (s === undefined) throw new Error(`no scenario ${id}`)
  return s
}

/** Every domain slice: the whole state but the shell and the store's functions. */
function domainOf(state: AppState): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(state)) if (k !== 'shell' && typeof v !== 'function') out[k] = v
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// The app's route patterns (src/router.tsx; the mobile stacks from apps/mobile/navigation.ts)
// ---------------------------------------------------------------------------

const ROUTE_PATTERNS = [
  '/web',
  '/web/lists',
  '/web/lists/:listId',
  '/web/lists/:listId/bookings/:bookingId',
  '/web/availability',
  '/web/availability/mine',
  '/web/accounts/:subTab',
  '/web/profile',
  '/admin/day/:dateISO',
  '/admin/day/:dateISO/bookings/:bookingId',
  '/admin/intake/matching',
  '/admin/intake/pdfs',
  '/admin/intake/quality',
  '/admin/intake/validators',
  '/admin/conflicts',
  '/admin/draft-lists',
  '/admin/notifications',
  '/admin/review',
  '/admin/review/:listId',
  '/admin/invoices',
  '/admin/invoices/:invoiceId',
  '/admin/patients',
  '/admin/patients/waiting',
  '/admin/patients/follow-up',
  '/admin/billing',
  '/admin/billing/aa-fees',
  '/admin/billing/aa-fees/settings',
  '/admin/ledger',
  '/admin/contracts',
  '/admin/contracts/:contractId',
  '/admin/masters',
  '/admin/audit',
  '/mobile/lists',
  '/mobile/lists/:listId',
  '/mobile/lists/:listId/bookings/:bookingId',
  '/mobile/availability',
  '/mobile/availability/calendar',
  '/mobile/balances',
  '/mobile/more',
  '/demo/control',
  '/demo/xero',
  '/demo/xero/invoices',
  '/demo/xero/invoices/:accRecId',
  '/demo/xero/bank',
  '/demo/integrations',
  '/demo/data',
] as const

const MASTERS_VIEWS = new Set<string>(MASTERS_NAV.map((n) => n.view))

/** The problems with one beat path: no route, an id not in state, an unknown query value. */
function pathProblems(state: AppState, path: string): string[] {
  const url = new URL(path, 'http://demo.invalid')
  const match = ROUTE_PATTERNS.map((pattern) => matchPath({ path: pattern, end: true }, url.pathname)).find((m) => m !== null)
  if (match === undefined || match === null) return [`${path}: matches no app route`]
  const problems: string[] = []
  for (const [param, value] of Object.entries(match.params)) {
    if (value === undefined) continue
    const exists =
      param === 'listId' ? state.schedule.lists[value] !== undefined
      : param === 'bookingId' ? state.schedule.bookings[value] !== undefined && (match.params['listId'] === undefined || state.schedule.bookings[value]?.listId === match.params['listId'])
      : param === 'invoiceId' ? state.billing.invoices[value] !== undefined
      : param === 'accRecId' ? state.xero.accRecs[value] !== undefined
      : param === 'dateISO' ? /^\d{4}-\d{2}-\d{2}$/.test(value)
      : param === 'contractId' ? state.masters.contracts[value] !== undefined
      : false
    if (!exists) problems.push(`${path}: ${param} ${value} is not in state (or not checked here)`)
  }
  const view = url.searchParams.get('view')
  if (view !== null && !MASTERS_VIEWS.has(view)) problems.push(`${path}: unknown Master data view ${view}`)
  const q = url.searchParams.get('q')
  if (q !== null && q.trim() === '') problems.push(`${path}: empty search`)
  return problems
}

function beatProblems(sc: DemoScenario, state: AppState): string[] {
  return sc.beats.flatMap((b) => {
    const path = b.path(state)
    return path === null ? [] : pathProblems(state, path).map((p) => `${sc.id} ${b.label}: ${p}`)
  })
}

// ---------------------------------------------------------------------------
// The words the presenter reads
// ---------------------------------------------------------------------------

/** Retired vocabulary (catch-up Phase 44 item 2, and the catalogue's terms). */
const RETIRED: readonly RegExp[] = [
  /swap/i,
  /Permanent List/i,
  /\bcards?\b/i,
  /slot/i,
  /Copy booking/i,
  /blacklist/i,
  /estimate/i,
  /deposit/i,
  /\bType [123]\b/i,
  /billing route/i,
  /Contract line/i,
  /staged change/i,
  /Contract version/i,
  /contract holder/i,
  /No contract \(RVG\)/i,
  /Needs a Contract/i,
  /surgeons?'? rooms?/i,
  /Public List/i,
  /hospital reference/i,
  /hospital sync/i,
  /Simulate sync/i,
  /part credit/i,
  /holder reference/i,
]

function copyProblems(where: string, text: string): string[] {
  const problems: string[] = []
  if (/[–—]/.test(text)) problems.push(`${where}: an en or em dash`)
  for (const word of RETIRED) if (word.test(text)) problems.push(`${where}: retired wording ${word}`)
  return problems
}

// ---------------------------------------------------------------------------

describe('DEMO_SCENARIOS (catch-up Phase 44)', () => {
  it('keeps the ids S1 to S5 in order, each with its beats', () => {
    expect(DEMO_SCENARIOS.map((s) => s.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5'])
    expect(DEMO_SCENARIOS.map((s) => s.beats.length)).toEqual([7, 8, 7, 8, 5])
    for (const s of DEMO_SCENARIOS) {
      expect(s.title.startsWith(`${s.id} · `)).toBe(true)
      expect(s.beats.map((b) => b.label.split(' · ')[0])).toEqual(s.beats.map((_, i) => `Beat ${i + 1}`))
    }
  })

  it('every stage returns ok on a fresh store', () => {
    for (const s of DEMO_SCENARIOS) {
      const result = s.stage(wiredStore())
      expect(result.ok, `${s.id}: ${result.message}`).toBe(true)
      unwire?.()
    }
  })

  it('every stage starts from the pristine seed, whatever ran before it', () => {
    const api = wiredStore()
    scenario('S5').stage(api)
    expect(scenario('S1').stage(api).ok).toBe(true)
    expect(domainOf(api.getState())).toEqual(domainOf(createAppStore().getState()))
  })

  it("S1, S2 and S4 stage nothing beyond the reset", () => {
    const pristine = domainOf(createAppStore().getState())
    for (const id of ['S1', 'S2', 'S4']) {
      const api = wiredStore()
      scenario(id).stage(api)
      expect(domainOf(api.getState()), id).toEqual(pristine)
      unwire?.()
    }
  })

  it("S3 leaves both of Dr Souter's Mon 23 Nov Lists SUBMITTED and authorises nothing", () => {
    const api = wiredStore()
    expect(scenario('S3').stage(api).ok).toBe(true)
    const lists = api.getState().schedule.lists
    expect(lists[SEED_LIST_IDS.souterMon20Am]?.state).toBe('SUBMITTED')
    expect(lists[SEED_LIST_IDS.souterMon20Pm]?.state).toBe('SUBMITTED')
    expect(domainOf(api.getState())).toEqual(domainOf(createAppStore().getState()))
  })

  it("S5 leaves a grouped office save and a claimed then removed modifier on David Chen's History", () => {
    const api = wiredStore()
    const seeded = createAppStore().getState().audit.length
    expect(scenario('S5').stage(api).ok).toBe(true)
    const state = api.getState()
    const chenId = SEED_MARKERS['overriddenTimeUnitsBooking']!.entityId
    const procedureIds = proceduresForBooking(state, chenId).map((p) => p.id)

    const save = lastChangeSetFor(state, chenId)
    expect(save).toMatchObject({ who: OFFICE_ACTOR.who, kind: 'save' })
    expect(save!.fields.map((f) => f.field).sort()).toEqual(['notes', 'scheduledTime'])
    const group = changeSetsFor(state.audit, new Set([chenId, ...procedureIds])).find((g) => g.changeSetId === save!.changeSetId)
    expect(group!.entries.length).toBeGreaterThan(1)

    const staged = state.audit.slice(seeded).filter((a) => procedureIds.includes(a.entityId))
    expect(staged.map((a) => a.action)).toEqual(['procedure.modifierClaim', 'procedure.modifierUnclaim'])
    expect(staged[0]).toMatchObject({ role: 'anaesthetist', after: { explanation: 'Pre-op review: ASA III' } })
    expect(state.schedule.procedures[procedureIds[0]!]?.modifierClaims).toEqual([])
  })

  it("S5 authorises Dr Whitaker's Fri 20 Nov List: a pricing snapshot on each Procedure and the invoices raised", () => {
    const api = wiredStore()
    expect(scenario('S5').stage(api).ok).toBe(true)
    const state = api.getState()
    expect(state.schedule.lists[SEED_LIST_IDS.whitakerFri17]?.state).toBe('AUTHORISED')
    const bookings = bookingsForList(state, SEED_LIST_IDS.whitakerFri17).filter((b) => b.cancellation === undefined)
    expect(bookings.length).toBeGreaterThan(0)
    for (const b of bookings) {
      const lock = state.billing.locks[b.id]
      expect(lock?.state, b.id).toBe('locked')
      expect(lock!.procedures.map((p) => p.procedureId).sort(), b.id).toEqual(proceduresForBooking(state, b.id).map((p) => p.id).sort())
      expect(Object.values(state.billing.invoices).some((i) => i.bookingId === b.id && i.kind === 'standard'), b.id).toBe(true)
    }
    // The capture recipes (US-11.3.3, US-08.4.4) open S5's first invoice by id and by Hemi Walker's row.
    expect(state.billing.invoices['INV0002']?.invoiceNumber).toBe('AA-2026-0002')
    // Beat 5 authorises Dr Souter's Mon 20 Jul AM List: Dr Whitaker's Contract carries its own rate, so his unit value moves nothing.
    expect(scenario('S5').beats[4]!.path(state)).toBe('/admin/review/L-34821-2026-11-23-AM')
  })

  it('staging twice from reset gives deep-equal domain state', () => {
    for (const s of DEMO_SCENARIOS) {
      const api = wiredStore()
      s.stage(api)
      const first = domainOf(api.getState())
      s.stage(api)
      expect(domainOf(api.getState()), s.id).toEqual(first)
      unwire?.()
    }
  })

  it('every beat path on each staged state matches an app route and names ids that exist', () => {
    for (const s of DEMO_SCENARIOS) {
      const api = wiredStore()
      s.stage(api)
      expect(beatProblems(s, api.getState())).toEqual([])
      unwire?.()
    }
  })

  it('a beat that waits says so in its label, and opens once its target exists', () => {
    // On each staged state, the waiting beats are exactly these, each label naming what it waits for.
    const waiting: Record<string, number[]> = { S1: [4, 6], S2: [], S3: [3], S4: [2, 5, 7], S5: [] }
    for (const s of DEMO_SCENARIOS) {
      const api = wiredStore()
      s.stage(api)
      const nulls = s.beats.flatMap((b, i) => (b.path(api.getState()) === null ? [i + 1] : []))
      expect(nulls, s.id).toEqual(waiting[s.id])
      for (const n of nulls) expect(s.beats[n - 1]!.label, `${s.id} beat ${n}`).toMatch(/, after /)
      unwire?.()
    }

    // S1: the import and Create Booking put Sarah Mitchell on Tue 28 Jul AM.
    const s1 = wiredStore()
    scenario('S1').stage(s1)
    const imported = importHospitalDownload(s1, OFFICE_ACTOR, 'SAMPLE_STG')
    if (!imported.ok) throw new Error(imported.message)
    const row = s1.getState().intake.batches[imported.value.batchId!]!.rowIds[0]!
    expect(decideImportRow(s1, OFFICE_ACTOR, row, { kind: 'createBooking', listId: SEED_LIST_IDS.integrationStgList }).ok).toBe(true)
    expect(scenario('S1').beats.every((b) => b.path(s1.getState()) !== null)).toBe(true)
    expect(beatProblems(scenario('S1'), s1.getState())).toEqual([])
    unwire?.()

    // S3: authorising both Lists hands the nib share to Xero.
    const s3 = wiredStore()
    scenario('S3').stage(s3)
    expect(authoriseList(s3, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
    expect(authoriseList(s3, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    const xeroPath = scenario('S3').beats[2]!.path(s3.getState())
    expect(xeroPath).toMatch(/^\/demo\/xero\/invoices\//)
    const accRec = s3.getState().xero.accRecs[xeroPath!.split('/').pop()!]
    expect(accRec).toBeDefined()
    expect(beatProblems(scenario('S3'), s3.getState())).toEqual([])
    unwire?.()

    // S4: Dr Sharma's Tue 14 Jul AM authorised (Stage post-op scenario's first half), Fri 24 Jul PM submitted.
    const s4 = wiredStore()
    scenario('S4').stage(s4)
    const postOp = projectedListId(ANAE.sharma, '2026-11-17', 'AM')
    if (s4.getState().schedule.lists[postOp]?.state === 'ACTIVE') expect(submitList(s4, OFFICE_ACTOR, postOp).ok).toBe(true)
    expect(authoriseList(s4, OFFICE_ACTOR, postOp).ok).toBe(true)
    // Dr Souter completes and submits her Fri 24 Jul PM List, as Beat 2 has her do on Mobile.
    for (const b of bookingsForList(s4.getState(), SEED_LIST_IDS.prepaymentPaidList).filter((x) => x.cancellation === undefined)) {
      completeAnswered(s4, SOUTER_ACTOR, b.id)
    }
    expect(submitList(s4, SOUTER_ACTOR, SEED_LIST_IDS.prepaymentPaidList).ok).toBe(true)
    expect(scenario('S4').beats.every((b) => b.path(s4.getState()) !== null)).toBe(true)
    expect(beatProblems(scenario('S4'), s4.getState())).toEqual([])
  })

  it("every title, blurb, message, beat name, label and steps line is dash-free and in the catalogue vocabulary", () => {
    const problems: string[] = []
    for (const s of DEMO_SCENARIOS) {
      const api = wiredStore()
      const { message } = s.stage(api)
      unwire?.()
      problems.push(...copyProblems(`${s.id} title`, s.title), ...copyProblems(`${s.id} blurb`, s.blurb), ...copyProblems(`${s.id} message`, message))
      for (const b of s.beats) {
        problems.push(...copyProblems(`${s.id} ${b.label}`, `${b.beat} ${b.label}`), ...copyProblems(`${s.id} ${b.label} steps`, b.does ?? ''))
      }
    }
    expect(problems).toEqual([])
  })

  it('each message says what was staged in at most two sentences and leaves the steps to the beats', () => {
    for (const s of DEMO_SCENARIOS) {
      const api = wiredStore()
      const { message } = s.stage(api)
      unwire?.()
      expect(message.endsWith('Follow the beats below in order.'), s.id).toBe(true)
      expect(message, s.id).not.toMatch(/\bBeat \d/)
      expect(message, s.id).not.toMatch(/Demo actions/)
      expect(message.match(/\.(\s|$)/g)?.length ?? 0, s.id).toBeLessThanOrEqual(2)
    }
  })

  it('every beat has a steps line, and a harness-bar press reads "Demo actions → <its label in the registry>"', () => {
    const labels = [...new Set(DEMO_TRIGGERS.map((t) => t.label))]
    const problems: string[] = []
    for (const s of DEMO_SCENARIOS) {
      for (const b of s.beats) {
        const does = b.does ?? ''
        if (does.trim() === '') problems.push(`${s.id} ${b.label}: no steps line`)
        for (const m of does.matchAll(/Demo actions/g)) {
          const rest = does.slice(m.index + 'Demo actions'.length)
          if (!rest.startsWith(' → ')) {
            problems.push(`${s.id} ${b.label}: "Demo actions" without the arrow`)
            continue
          }
          const after = rest.slice(3)
          const named = labels.some((l) => after.startsWith(l) && /^($|,|;| \()/.test(after.slice(l.length)))
          if (!named) problems.push(`${s.id} ${b.label}: no Demo actions entry is labelled like "${after}"`)
        }
      }
    }
    expect(problems).toEqual([])
  })
})

describe('the run sheet quotes the beat links as the Control Panel shows them (catch-up Phase 44 review)', () => {
  it('every "Beat n · ..." the run sheet names is a label of that scenario', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const runSheet = resolve(__dirname, '../../../../docs/demo-guide/03-demo-script.md')
    if (!existsSync(runSheet)) return
    const text = readFileSync(runSheet, 'utf8')
    const misses: string[] = []
    for (const s of DEMO_SCENARIOS) {
      const start = text.indexOf(`## ${s.id} · `)
      const next = text.indexOf('\n## ', start + 1)
      const section = text.slice(start, next === -1 ? undefined : next)
      expect(start, s.id).toBeGreaterThanOrEqual(0)
      const labels = new Set(s.beats.map((b) => b.label))
      for (const m of section.matchAll(/\*\*(Beat \d+ · [^*]+)\*\*/g)) if (!labels.has(m[1]!)) misses.push(`${s.id}: "${m[1]}"`)
    }
    expect(misses).toEqual([])
  })
})
