/**
 * The demo-trigger audit (catch-up Phase 44, work item 4): the whole registry
 * checked against the rules the later phases left it with. Extends
 * `demoTriggers.test.ts` (shape, route scoping, the bodies) and does not repeat
 * it: these checks read every entry at once, so a new entry that breaks a rule
 * fails here without a test of its own.
 */

import { matchPath } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { bookingsForList } from '../../store/selectors'
import { openWarnings } from '../../store/warnings'
import { raiseSamplesOn, WARNING_SAMPLES } from '../../store/warningSamples'
import { WARNING_RULES } from '../../domain/warnings/rules'
import { ANAE, SEED_LIST_IDS, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { DEMO_SCENARIOS } from '../../apps/demo/demoScenarios'
import { DEMO_TRIGGERS } from './registry'
import { useDemoTriggerMemory } from './memory'
import type { DemoContextValues } from './context'
import type { DemoTrigger, DemoTriggerCtx, DemoTriggerSurface } from './types'

beforeEach(() => {
  useDemoTriggerMemory.setState({ lastMessageId: null, lastWebhook: null, webhookCounter: 0 })
})

type StoreState = ReturnType<ReturnType<typeof createAppStore>['getState']>

/** Each scenario staged once on a fresh store (each `stage` resets first), shared by the checks that read the staged states. */
let staged: { id: string; ok: boolean; message: string; state: StoreState }[] | undefined
function stagedScenarios() {
  staged ??= DEMO_SCENARIOS.map((scenario) => {
    const api = createAppStore()
    const res = scenario.stage(api)
    return { id: scenario.id, ok: res.ok, message: res.message, state: api.getState() }
  })
  return staged
}

const MOBILE = /^\/mobile(\/|$)/
const WEB = /^\/web(\/|$)/

function byId(id: string): DemoTrigger {
  const t = DEMO_TRIGGERS.find((x) => x.id === id)
  if (t === undefined) throw new Error(`no trigger ${id}`)
  return t
}

function byLabel(label: string): DemoTrigger[] {
  return DEMO_TRIGGERS.filter((t) => t.label === label)
}

/** True when one of the entry's own route patterns matches `pathname` (as `demoTriggersFor` matches, `when` aside). */
function routeMatches(t: DemoTrigger, pathname: string): boolean {
  return t.routes.some((pattern) => matchPath({ path: pattern, end: true }, pathname) !== null)
}

/** A path a pattern matches: each param and the splat filled in. */
function concretePath(pattern: string): string {
  return pattern.replace(/:[A-Za-z]+/g, 'x').replace(/\*$/, 'x')
}

/** The pathname of an index link, its `?view=` and any hash dropped. */
function pathnameOf(link: string): string {
  return link.split(/[?#]/)[0]!
}

function sameSurfaces(t: DemoTrigger, surfaces: readonly DemoTriggerSurface[]): boolean {
  return [...t.surfaces].sort().join(',') === [...surfaces].sort().join(',')
}

describe('surfaces and routes', () => {
  it('every office stand-in shows on the PWA alone, on /mobile routes only', () => {
    // The one deliberate exception (catch-up Phase 43b, also pinned in demoTriggers.test.ts):
    // AA approves a public-holiday call-out with Stratos outside the app, so that stand-in
    // sits in Admin's Product support tab, on the bar, gated by the tab Admin publishes.
    const ADMIN_STAND_INS = ['support-approve-call-out']
    const standIns = DEMO_TRIGGERS.filter((t) => t.badge === 'office-stand-in' && !ADMIN_STAND_INS.includes(t.id))
    expect(standIns.length).toBeGreaterThan(0)
    for (const id of ADMIN_STAND_INS) expect(DEMO_TRIGGERS.find((t) => t.id === id)?.surfaces, id).toEqual(['bar'])
    for (const t of standIns) {
      expect(t.surfaces, t.id).toEqual(['pwa'])
      for (const r of t.routes) expect(r, t.id).toMatch(MOBILE)
    }
  })

  it("the colleague stand-ins on the phone (32's List move, 32a's Booking move) show on the PWA alone, on /mobile routes only", () => {
    for (const label of ['Colleague moves a List into my free session', 'Colleague moves a Booking to me']) {
      const entries = byLabel(label)
      expect(entries.map((t) => t.id), label).toHaveLength(1)
      const t = entries[0]!
      expect(t.surfaces, t.id).toEqual(['pwa'])
      for (const r of t.routes) expect(r, t.id).toMatch(MOBILE)
    }
  })

  it('every PWA-only entry routes only to /mobile (the PWA has nothing else)', () => {
    const pwaOnly = DEMO_TRIGGERS.filter((t) => sameSurfaces(t, ['pwa']))
    expect(pwaOnly.map((t) => t.id)).toContain('pwa-sign-out')
    for (const t of pwaOnly) for (const r of t.routes) expect(r, t.id).toMatch(MOBILE)
  })

  it('every entry on both surfaces has at least one /mobile route', () => {
    const both = DEMO_TRIGGERS.filter((t) => sameSurfaces(t, ['bar', 'pwa']))
    for (const id of ['nhi-hub-mode', 'load-multi-procedure-booking', 'feed-changes-primary', 'stage-post-op', 'show-first-run-hints']) {
      expect(both.map((t) => t.id), id).toContain(id)
    }
    for (const t of both) expect(t.routes.some((r) => MOBILE.test(r)), t.id).toBe(true)
  })

  it('no entry routes to the Control Panel, which is only the index', () => {
    for (const t of DEMO_TRIGGERS) {
      for (const r of t.routes) expect(r, t.id).not.toMatch(/^\/demo\/control(\/|$)/)
      expect(routeMatches(t, '/demo/control'), t.id).toBe(false)
    }
  })

  it('no two entries visible on the same route and surface share a label (a bar entry and a PWA entry may)', () => {
    const clashes: string[] = []
    for (const t of DEMO_TRIGGERS) {
      for (const pattern of t.routes) {
        const path = concretePath(pattern)
        for (const surface of t.surfaces) {
          for (const other of DEMO_TRIGGERS) {
            if (other === t || other.label !== t.label || !other.surfaces.includes(surface)) continue
            if (routeMatches(other, path)) clashes.push(`${t.id} and ${other.id}: "${t.label}" on ${surface} at ${path}`)
          }
        }
      }
    }
    expect(clashes).toEqual([])
  })

  it("Phase 27's \"Move to 2 days before procedure\" is one entry on both surfaces, so the bar and the PWA share its label", () => {
    const entries = byLabel('Move to 2 days before procedure')
    expect(entries.map((t) => t.id)).toEqual(['prepayment-two-days-before'])
    expect(entries[0]!.surfaces).toEqual(['bar', 'pwa'])
  })
})

describe('index links', () => {
  function indexPathMisses(state: StoreState): string[] {
    const misses: string[] = []
    for (const t of DEMO_TRIGGERS) {
      const link = t.indexPath(state)
      if (link !== null && !routeMatches(t, pathnameOf(link))) misses.push(`${t.id}: ${link}`)
    }
    return misses
  }

  it("every entry's Open screen link, on the pristine seed, is null or one of its own routes", () => {
    expect(indexPathMisses(createAppStore().getState())).toEqual([])
  })

  it('every scenario stages, and on each staged state every Open screen link is null or one of its own routes', () => {
    const scenarioStates = stagedScenarios()
    expect(scenarioStates.map((s) => s.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5'])
    for (const scenario of scenarioStates) {
      expect(scenario.ok, `${scenario.id}: ${scenario.message}`).toBe(true)
      expect(indexPathMisses(scenario.state), scenario.id).toEqual([])
    }
  })
})

/**
 * The withdrawn flows and superseded readings (phase doc item 4): no label or
 * description may match any of these. Each line names the phase or decision
 * that withdrew the words.
 */
const WITHDRAWN: readonly { re: RegExp; why: string }[] = [
  { re: /swap|cover request|offer cover|tap to ask/i, why: 'the swap and cover flows (32, D7)' },
  { re: /copy (a )?booking/i, why: 'Copy a Booking (15b)' },
  { re: /addendum/i, why: 'the addendum (38b re-pointed stage-post-op)' },
  { re: /\bslots?\b/i, why: 'slot, a session in the catalogue (OQ-64)' },
  { re: /blacklist|whitelist/i, why: 'blacklist and whitelist (17, D44)' },
  { re: /estimate|deposit|balance invoice|overpaid|excess/i, why: 'the estimate, deposit and overpaid readings (27, 41)' },
  { re: /Type [123]\b|billing route|default (hospital |insurer )?Contract/i, why: 'billing types, routes and default Contracts (18, 20)' },
  {
    re: /trust account|prepay(ment)? holding account|insurers? master|second pair|handover|procedure picker|first.party|third.party/i,
    why: 'the trust account, insurer master, second pair, handover and party readings (21, 27a)',
  },
  {
    re: /contract holder|Contract lines?|Contract versions?|staged (Contract )?changes?|No contract \(RVG\)|Needs a Contract/i,
    why: 'the flat Contract model (D77; 18, 20)',
  },
  {
    re: /surgeons?'? rooms?|Public (List|kind)|hospital (reference|sync)|Simulate sync|part credit|holder references?/i,
    why: "surgeons' rooms, Public Lists, hospital sync, part credits, holder references (D74, D86, D52, D31, D82; 17b, 32d, 33, 34, 25a)",
  },
  { re: /child billed directly/i, why: 'the child billed directly (21)' },
]

describe('withdrawn flows and superseded readings', () => {
  it('no label or description uses a withdrawn word', () => {
    const hits: string[] = []
    for (const t of DEMO_TRIGGERS) {
      for (const [field, text] of [['label', t.label], ['description', t.description]] as const) {
        for (const { re, why } of WITHDRAWN) {
          const m = re.exec(text)
          if (m !== null) hits.push(`${t.id} ${field} "${m[0]}": ${why}`)
        }
      }
    }
    expect(hits).toEqual([])
  })

  it('no id names a swap', () => {
    for (const t of DEMO_TRIGGERS) expect(t.id).not.toMatch(/swap/)
  })

  it("33's PWA row-match stand-in keeps its id with 34's import label; 33's label is gone", () => {
    const t = byId('matching-office-matches-row')
    expect(t.label).toBe('Hospital file imported and my booking matched')
    expect(t.label).not.toMatch(/sync/i)
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    expect(DEMO_TRIGGERS.filter((x) => /hospital row arrives and the office matches it/i.test(x.label))).toEqual([])
  })
})

describe('sample warnings cover every rule (15a, 19, 21, 40)', () => {
  const ruleIds = WARNING_RULES.map((r) => r.id)

  it('every registered rule has exactly one sample, and every sample belongs to a registered rule', () => {
    const sampleIds = WARNING_SAMPLES.map((s) => s.ruleId)
    expect([...sampleIds].sort()).toEqual([...ruleIds].sort())
    expect(new Set(sampleIds).size).toBe(sampleIds.length)
  })

  it("27's prepaid-price-missing rule is gone (D27)", () => {
    for (const id of ruleIds) expect(id).not.toMatch(/prepaidPrice|priceMissing/i)
  })

  /** The open to-do rows a staging adds, counted per rule. */
  function raisedPerRule(api: ReturnType<typeof createAppStore>, stage: () => void): Map<string, number> {
    const before = new Set(openWarnings(api.getState()).map((r) => r.warning.key))
    stage()
    const perRule = new Map<string, number>()
    for (const r of openWarnings(api.getState())) {
      if (!before.has(r.warning.key)) perRule.set(r.warning.ruleId, (perRule.get(r.warning.ruleId) ?? 0) + 1)
    }
    return perRule
  }

  it('staging every sample from one Booking on a fresh store opens one to-do row per rule', () => {
    const api = createAppStore()
    const perRule = raisedPerRule(api, () => {
      const res = raiseSamplesOn(api, SEED_WARNING_SAMPLE_BOOKINGS.multiWarning)
      expect(res.ok).toBe(true)
    })
    expect([...perRule.keys()].sort()).toEqual([...ruleIds].sort())
    // A rule raised per Procedure (the child payer) folds into one row per Booking.
    for (const id of ruleIds) expect(perRule.get(id), id).toBe(1)
  })

  it('"Raise sample warnings" on the Day view opens a warning for every rule, and for nothing else', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    const ctx: DemoTriggerCtx = { pathname: '/admin/day/2026-07-21', params: { dateISO: '2026-07-21' }, published: {} }
    expect(raise.disabledReason(api.getState(), ctx)).toBeNull()
    const perRule = raisedPerRule(api, () => {
      const res = raise.run(api, ctx)
      expect(res.ok, res.message).toBe(true)
    })
    expect([...perRule.keys()].sort()).toEqual([...ruleIds].sort())
  })
})

/**
 * Every entry badged Future scope, with its surfaces and routes, as Phase 44
 * found it. A new Future-scope entry must be added here deliberately.
 * - 15b's photo capture (US-02.4.4), still Future scope.
 * - 34's two HL7 and FHIR entries: both survived 20a's per-Booking re-point and
 *   34's move, bar only, on the three Future-scope simulator routes.
 * The rooms' PDF entries (in scope since 34, D51) and 33a's stub stand-in are
 * not on this list.
 */
const FUTURE_SCOPE: readonly { id: string; label: string; surfaces: readonly DemoTriggerSurface[]; routes: readonly string[] }[] = [
  { id: 'photo-capture-future', label: 'Photo capture (Future scope)', surfaces: ['bar', 'pwa'], routes: ['/mobile/lists/:listId'] },
  {
    id: 'fire-hospital-message',
    label: 'Fire hospital message',
    surfaces: ['bar'],
    routes: ['/demo/integrations', '/demo/integrations/log', '/demo/integrations/mapping'],
  },
  {
    id: 'replay-hospital-message',
    label: 'Replay last message (dedupe)',
    surfaces: ['bar'],
    routes: ['/demo/integrations', '/demo/integrations/log', '/demo/integrations/mapping'],
  },
]

describe('Future-scope entries are deliberate', () => {
  it('every Future-scope entry is on the expected list, with its label, surfaces and routes', () => {
    const actual = DEMO_TRIGGERS.filter((t) => t.badge === 'future-scope').map((t) => ({
      id: t.id,
      label: t.label,
      surfaces: [...t.surfaces],
      routes: [...t.routes],
    }))
    expect(actual).toEqual(FUTURE_SCOPE.map((f) => ({ ...f, surfaces: [...f.surfaces], routes: [...f.routes] })))
  })

  it("the rooms' PDF entries (34) are in scope: own Intake screen, bar only, no badge; the old ingest and auto-match entries are gone", () => {
    const pdf = DEMO_TRIGGERS.filter((t) => /pdf/i.test(t.id) || /\bPDF\b/.test(t.label))
    expect(pdf.map((t) => t.id)).toEqual(['pdf-list-resend'])
    for (const t of pdf) {
      expect(t.badge, t.id).toBeUndefined()
      expect(t.surfaces, t.id).toEqual(['bar'])
      expect(t.screen, t.id).toBe('Admin · Intake')
      for (const r of t.routes) expect(r, t.id).toMatch(/^\/admin\/intake\//)
    }
    for (const t of DEMO_TRIGGERS) expect(t.id).not.toMatch(/^ingest-pdf|auto-match/)
  })

  it("33a's stub stand-in is in scope: an office stand-in, not Future scope", () => {
    const t = byId('stub-office-adds-nhi')
    expect(t.badge).toBe('office-stand-in')
  })
})

describe('the privacy boundary holds (17, D44, US-13.6.3)', () => {
  const PRIVATE = /prefer|pairing|tier/i

  /** Anaesthetist-facing: a /mobile or /web route, or the PWA's Demo sheet. */
  const facing = DEMO_TRIGGERS.filter((t) => t.surfaces.includes('pwa') || t.routes.some((r) => MOBILE.test(r) || WEB.test(r)))

  /** Real params for a route pattern: Dr Souter's Tue 21 PM List and its first Booking, unless the Open screen link names others. */
  function ctxFor(t: DemoTrigger, state: StoreState): DemoTriggerCtx {
    const listId = SEED_LIST_IDS.souterPm21
    const bookingId = bookingsForList(state, listId)[0]?.id ?? 'x'
    const values: Record<string, string> = { listId, bookingId, dateISO: '2026-07-21', anaesthetistId: ANAE.souter, subTab: 'outstanding' }
    const index = t.indexPath(state)
    const indexPattern = index !== null ? t.routes.find((r) => matchPath({ path: r, end: true }, pathnameOf(index)) !== null) : undefined
    const pattern = indexPattern ?? t.routes.find((r) => MOBILE.test(r)) ?? t.routes[0]!
    const pathname =
      indexPattern !== undefined && index !== null
        ? pathnameOf(index)
        : pattern.replace(/:([A-Za-z]+)/g, (_, k: string) => values[k] ?? 'x').replace(/\*$/, 'more')
    const params: Record<string, string> = {}
    for (const [k, v] of Object.entries(matchPath({ path: pattern, end: true }, pathname)?.params ?? {})) if (v !== undefined) params[k] = v
    const published: Partial<DemoContextValues> = { 'support.tab': 'helpLine', 'nhiHub.inUse': true }
    return { pathname, params, published }
  }

  /** What every anaesthetist-facing entry says on `state`: each choice, and per choice its disabled reason, message and link, each run on its own copy of `state`. */
  function whatTheySay(state: StoreState): string[] {
    const said: string[] = []
    for (const t of facing) {
      const ctx = ctxFor(t, state)
      const choices = t.choices?.(state, ctx) ?? []
      for (const c of choices) said.push(`${t.id} choice: ${c.label}`)
      for (const choiceId of choices.length > 0 ? choices.map((c) => c.id) : [undefined]) {
        const api = createAppStore()
        // The data only: the actions stay this store's own.
        api.setState(Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== 'function')) as Partial<StoreState>)
        useDemoTriggerMemory.setState({ lastMessageId: null, lastWebhook: null, webhookCounter: 0 })
        const reason = t.disabledReason(api.getState(), ctx, choiceId)
        if (reason !== null) said.push(`${t.id} disabled: ${reason}`)
        let out
        try {
          out = t.run(api, ctx, choiceId)
        } catch {
          continue // A body run off its screen state may throw; the bar never runs it there.
        }
        said.push(`${t.id} message: ${out.message}`)
        if (out.link !== undefined) said.push(`${t.id} link: ${out.link.label}`)
      }
    }
    return said
  }

  it('no anaesthetist-facing entry mentions a preference, a pairing or a tier in its label, description or index text', () => {
    expect(facing.length).toBeGreaterThan(0)
    for (const t of facing) {
      expect(t.label, t.id).not.toMatch(PRIVATE)
      expect(t.description, t.id).not.toMatch(PRIVATE)
      expect(t.indexHint ?? '', t.id).not.toMatch(PRIVATE)
      expect(t.indexEmptyReason ?? '', t.id).not.toMatch(PRIVATE)
    }
  })

  it('nor in what it says when run on the pristine seed: its choices, disabled reason and message', () => {
    const said = whatTheySay(createAppStore().getState())
    expect(said.length).toBeGreaterThan(facing.length)
    expect(said.filter((line) => PRIVATE.test(line))).toEqual([])
  })

  it("nor when run on each scenario's staged state", () => {
    for (const scenario of stagedScenarios()) {
      const said = whatTheySay(scenario.state)
      expect(said.filter((line) => PRIVATE.test(line)), scenario.id).toEqual([])
    }
  })
})
