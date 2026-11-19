import { describe, expect, it } from 'vitest'
import { activeOnly, isRetired, retireBlockers } from '../domain/masterLifecycle'
import { pairingIssues } from '../domain/listPairing'
import { DEFAULT_RVG_TIME_RULE } from '../domain/billing/timeUnits'
import { HOSP } from '../domain/seed'
import { createAppStore, type BoundAppStore } from './appStore'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { createHospital, editHospital } from './mastersActions'
import { editParty } from './partyActions'
import { addAaModifier } from './modifierActions'
import { createSurgeonGroup } from './surgeonActions'
import { editAaModifier, reinstateMaster, retireFactsFor, retireMaster } from './masterLifecycleActions'
import { addPublicHoliday, deletePublicHoliday, editPublicHoliday, editRvgTimeRule, listsFlaggedByPublicHoliday, PART_INTERVAL_FIXED } from './publicHolidayActions'

const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)

describe('masterLifecycle (pure)', () => {
  it('activeOnly keeps the current value even when retired', () => {
    const rows = [{ id: 'a' }, { id: 'b', retiredAtISO: '2026-07-21' }]
    expect(activeOnly(rows).map((r) => r.id)).toEqual(['a'])
    expect(activeOnly(rows, 'b').map((r) => r.id)).toEqual(['a', 'b'])
    expect(isRetired(rows[1])).toBe(true)
  })
  it('blocker sentences carry counts and say what to do first', () => {
    expect(retireBlockers('hospital', { name: "St George's", upcomingLists: 3, partyActiveContracts: { partyName: "St George's", count: 1 } })).toEqual([
      "3 upcoming Lists are at St George's. Move or reassign them first.",
      "Disable its Contracts first: St George's, 1 Active Contract.",
    ])
    expect(retireBlockers('hospital', { name: 'AA rooms', builtIn: true })).toEqual(['AA rooms is built in and cannot be retired.'])
  })
})

describe('retire and reinstate (catch-up Phase 42; US-13.4.1)', () => {
  it('only the office retires, reinstates or edits an AA modifier', () => {
    const api = store()
    expect(code(retireMaster(api, SOUTER_ACTOR, 'hospital', HOSP.stg, 'x'))).toBe('officeOnly')
    expect(code(reinstateMaster(api, SOUTER_ACTOR, 'hospital', HOSP.stg))).toBe('officeOnly')
    expect(code(editAaModifier(api, SOUTER_ACTOR, 'x', { factor: 'y', units: 1 }))).toBe('officeOnly')
    expect(code(addPublicHoliday(api, SOUTER_ACTOR, { dateISO: '2027-03-26', name: 'Good Friday', kind: 'national', openHospitalIds: [] }))).toBe('officeOnly')
    expect(code(editRvgTimeRule(api, SOUTER_ACTOR, DEFAULT_RVG_TIME_RULE))).toBe('officeOnly')
  })

  it("a hospital in use is refused with its blockers; its Party's Active Contracts among them", () => {
    const api = store()
    const out = retireMaster(api, OFFICE_ACTOR, 'hospital', HOSP.stg, 'Closing')
    expect(code(out)).toBe('inUse')
    expect(!out.ok && out.message).toMatch(/upcoming Lists? (is|are) at St George's/)
    expect(!out.ok && out.message).toMatch(/Disable its Contracts first: St George's, \d+ Active Contracts?\./)
    expect(code(retireMaster(api, OFFICE_ACTOR, 'hospital', HOSP.aaRooms, 'x'))).toBe('inUse')
    expect(retireFactsFor(api.getState(), 'hospital', HOSP.aaRooms)).toEqual({ name: 'AA rooms', builtIn: true })
  })

  it('a hospital nothing depends on retires with a reason, and reinstates', () => {
    const api = store()
    const made = createHospital(api, OFFICE_ACTOR, 'Rangiora Day Surgery')
    const id = made.ok ? made.value.hospital.id : ''
    expect(code(retireMaster(api, OFFICE_ACTOR, 'hospital', id, '  '))).toBe('reasonRequired')
    expect(code(retireMaster(api, OFFICE_ACTOR, 'hospital', 'nope', 'x'))).toBe('notFound')
    expect(code(retireMaster(api, OFFICE_ACTOR, 'hospital', id, 'Closed for good'))).toBe('ok')
    expect(api.getState().masters.hospitals[id]).toMatchObject({ retiredAtISO: '2026-07-21', retiredReason: 'Closed for good' })
    expect(code(retireMaster(api, OFFICE_ACTOR, 'hospital', id, 'again'))).toBe('alreadyRetired')
    // An edit keeps the retire fields; a rename still follows through.
    expect(editHospital(api, OFFICE_ACTOR, id, { contactEmail: 'b@rangiora.example' }).ok).toBe(true)
    expect(isRetired(api.getState().masters.hospitals[id])).toBe(true)
    expect(code(reinstateMaster(api, OFFICE_ACTOR, 'hospital', id))).toBe('ok')
    expect(code(reinstateMaster(api, OFFICE_ACTOR, 'hospital', id))).toBe('notRetired')
    const actions = api.getState().audit.map((a) => a.action)
    expect(actions).toContain('hospital.retire')
    expect(actions).toContain('hospital.reinstate')
  })

  it('a retired hospital or surgeon is refused when newly chosen, and tolerated when unchanged', () => {
    const masters = { hospitals: { H1: { name: 'Old Hospital', retiredAtISO: '2026-07-21' } }, surgeons: { S1: { name: 'Mr Gone', retiredAtISO: '2026-07-21' } } }
    expect(pairingIssues({ hospitalId: 'H1', surgeonId: 'S1' }, masters).map((i) => i.message)).toEqual(['Old Hospital is retired.', 'Mr Gone is retired.'])
    expect(pairingIssues({ hospitalId: 'H1', surgeonId: 'S1' }, masters, { hospitalId: 'H1', surgeonId: 'S1' })).toEqual([])
  })

  it('a rename carries the hospital Party along, unless the office renamed the Party by hand', () => {
    const api = store()
    const made = createHospital(api, OFFICE_ACTOR, 'Rangiora Day Surgery')
    if (!made.ok) throw new Error(made.message)
    const { hospital, party } = made.value
    expect(editHospital(api, OFFICE_ACTOR, hospital.id, { name: 'Rangiora Surgical' }).ok).toBe(true)
    expect(api.getState().masters.parties[party.id]!.name).toBe('Rangiora Surgical')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'party.update', before: { name: 'Rangiora Day Surgery' }, after: { name: 'Rangiora Surgical' } })
    const p = api.getState().masters.parties[party.id]!
    expect(editParty(api, OFFICE_ACTOR, party.id, { kind: 'hospital', name: 'Rangiora (billing)', codePrefix: p.codePrefix, hospitalId: hospital.id }).ok).toBe(true)
    expect(editHospital(api, OFFICE_ACTOR, hospital.id, { name: 'Rangiora Hospital' }).ok).toBe(true)
    expect(api.getState().masters.parties[party.id]!.name).toBe('Rangiora (billing)')
  })

  it('a surgeon group retires only once empty', () => {
    const api = store()
    const surgeonId = Object.keys(api.getState().masters.surgeons)[0]!
    const g = createSurgeonGroup(api, OFFICE_ACTOR, { name: 'Night team', memberSurgeonIds: [surgeonId] })
    const id = g.ok ? g.value.id : ''
    const out = retireMaster(api, OFFICE_ACTOR, 'surgeonGroup', id, 'Disbanded')
    expect(!out.ok && out.message).toBe('1 surgeon is still in Night team. Take them out first.')
    const empty = createSurgeonGroup(api, OFFICE_ACTOR, { name: 'Empty team', memberSurgeonIds: [] })
    expect(code(retireMaster(api, OFFICE_ACTOR, 'surgeonGroup', empty.ok ? empty.value.id : '', 'Unused'))).toBe('ok')
  })

  it("AA's own modifiers edit and retire; the RVG table's rows are as printed", () => {
    const api = store()
    const added = addAaModifier(api, OFFICE_ACTOR, { code: 'WKND', factor: 'Weekend loading', units: 2 })
    const id = added.ok ? added.value.id : ''
    expect(code(editAaModifier(api, OFFICE_ACTOR, id, { factor: 'Weekend or public holiday loading', units: 3 }))).toBe('ok')
    expect(api.getState().masters.modifiers[id]).toMatchObject({ code: 'WKND', units: 3, unitsAsPrinted: '3' })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'modifier.update', before: { units: 2 }, after: { units: 3 } })
    expect(code(retireMaster(api, OFFICE_ACTOR, 'aaModifier', id, 'Not used'))).toBe('ok')
    const rvg = Object.values(api.getState().masters.modifiers).find((m) => m.source === 'rvg')!
    expect(editAaModifier(api, OFFICE_ACTOR, rvg.id, { factor: 'x', units: 1 })).toMatchObject({ ok: false, message: 'RVG modifiers are as printed and cannot be changed.' })
    expect(retireMaster(api, OFFICE_ACTOR, 'aaModifier', rvg.id, 'x')).toMatchObject({ ok: false, message: 'RVG modifiers are as printed and cannot be retired.' })
  })
})

describe('the public-holiday calendar (catch-up Phase 42; DM-38)', () => {
  /** A canvas weekday with Lists at more than one hospital. */
  function busyDay(api: BoundAppStore): { dateISO: string; hospitals: string[] } {
    const byDate = new Map<string, Set<string>>()
    for (const l of Object.values(api.getState().schedule.lists)) {
      if (l.dateISO <= '2026-07-21' || l.state === 'AUTHORISED' || l.id.startsWith('L-HIST')) continue
      if (l.conflicts.length > 0) continue
      const set = byDate.get(l.dateISO) ?? new Set<string>()
      set.add(l.hospitalId)
      byDate.set(l.dateISO, set)
    }
    const [dateISO, set] = [...byDate.entries()].filter(([, s]) => s.size >= 2).sort(([a], [b]) => a.localeCompare(b))[0]!
    return { dateISO, hospitals: [...set].sort() }
  }

  it('adding one flags the Lists that day; one hospital open clears only its flags; a move and a delete clear', () => {
    const api = store()
    const { dateISO, hospitals } = busyDay(api)
    const added = addPublicHoliday(api, OFFICE_ACTOR, { dateISO, name: 'Show Day', kind: 'regional', region: 'Canterbury', openHospitalIds: [] })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const id = added.value.id
    expect(added.value.flagged).toBeGreaterThan(0)
    expect(listsFlaggedByPublicHoliday(api.getState(), id)).toBe(added.value.flagged)
    const open = hospitals[0]!
    const atOpen = Object.values(api.getState().schedule.lists).filter((l) => l.dateISO === dateISO && l.hospitalId === open && l.conflicts.length > 0).length
    const opened = editPublicHoliday(api, OFFICE_ACTOR, id, { openHospitalIds: [open] })
    expect(opened.ok && opened.value.resolved).toBe(atOpen)
    expect(listsFlaggedByPublicHoliday(api.getState(), id)).toBe(added.value.flagged - atOpen)
    const moved = editPublicHoliday(api, OFFICE_ACTOR, id, { dateISO: '2027-03-26' })
    expect(moved.ok && moved.value.resolved).toBe(added.value.flagged - atOpen)
    expect(listsFlaggedByPublicHoliday(api.getState(), id)).toBe(0)
    expect(code(deletePublicHoliday(api, OFFICE_ACTOR, id))).toBe('ok')
    expect(api.getState().masters.publicHolidays[id]).toBeUndefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'publicHoliday.delete' })
  })

  it('refuses a second public holiday on a date, a blank name, a bad date and an unknown open hospital', () => {
    const api = store()
    const base = { name: 'X', kind: 'national' as const, openHospitalIds: [] as string[] }
    expect(addPublicHoliday(api, OFFICE_ACTOR, { ...base, dateISO: '2026-12-25' })).toMatchObject({ ok: false, code: 'duplicatePublicHoliday', message: 'Christmas Day is already a public holiday on that date.' })
    expect(code(addPublicHoliday(api, OFFICE_ACTOR, { ...base, name: ' ', dateISO: '2027-03-26' }))).toBe('nameRequired')
    expect(code(addPublicHoliday(api, OFFICE_ACTOR, { ...base, dateISO: '2027-02-31' }))).toBe('dateRequired')
    expect(code(addPublicHoliday(api, OFFICE_ACTOR, { ...base, dateISO: '2027-03-26', openHospitalIds: ['H-NOPE'] }))).toBe('unknownHospital')
    expect(code(editPublicHoliday(api, OFFICE_ACTOR, 'PH999', { name: 'x' }))).toBe('notFound')
  })

  it('Labour Day: listing St George’s open clears its flags and keeps the others', () => {
    const api = store()
    const before = listsFlaggedByPublicHoliday(api.getState(), 'PH001')
    const atStg = Object.values(api.getState().schedule.lists).filter((l) => l.conflicts.some((c) => c.cause === 'publicHoliday:PH001') && l.hospitalId === HOSP.stg).length
    const out = editPublicHoliday(api, OFFICE_ACTOR, 'PH001', { openHospitalIds: [HOSP.aaRooms, HOSP.stg] })
    expect(out.ok && out.value.resolved).toBe(atStg)
    expect(listsFlaggedByPublicHoliday(api.getState(), 'PH001')).toBe(before - atStg)
  })
})

describe('the RVG time rule editor (catch-up Phase 42; US-05.2.2)', () => {
  it('saves a valid tier change, audited in words; refuses a part-interval change and a malformed rule', () => {
    const api = store()
    const locks = api.getState().billing.locks
    const rule = { tiers: DEFAULT_RVG_TIME_RULE.tiers.map((t, i) => (i === 0 ? { ...t, intervalMinutes: t.intervalMinutes + 5 } : t)), partInterval: 'roundUp' as const }
    expect(code(editRvgTimeRule(api, OFFICE_ACTOR, rule))).toBe('ok')
    expect(api.getState().masters.rvgTimeRule).toEqual(rule)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'rvgTimeRule.update' })
    // AUTHORISED Procedures keep their locked figures.
    expect(api.getState().billing.locks).toBe(locks)
    expect(editRvgTimeRule(api, OFFICE_ACTOR, { ...rule, partInterval: 'roundDown' as unknown as 'roundUp' })).toMatchObject({ ok: false, message: PART_INTERVAL_FIXED })
    expect(code(editRvgTimeRule(api, OFFICE_ACTOR, { tiers: [], partInterval: 'roundUp' }))).toBe('invalidRule')
  })
})
