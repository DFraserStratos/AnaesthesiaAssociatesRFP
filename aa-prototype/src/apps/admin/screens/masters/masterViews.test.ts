/**
 * The reference data's registries (catch-up Phase 42, work item 11; US-13.4.1
 * "Three places"): every row of US-13.4.1's lists maps to a Master data view, a
 * tab of the Contracts section (build plan Phase 48) or a tab of the People
 * section (Phase 53), each that can edit; no surgeon group list remains (D98);
 * every seed-load sheet is named by a view's or tab's `seeded`, views that
 * retire say so, and no office view carries a load action (the load is the
 * developer's step, on the demo-badged Go-live views).
 */

import { describe, expect, it } from 'vitest'
import { LOAD_ORDER } from '../../../../domain/masterLoad/types'
import { MASTER_VIEWS, masterViewEntry, SEEDED_SUBTITLE } from './masterViews'
import { CONTRACTS_TABS } from '../contracts/contractsTabs'
import { PEOPLE_TABS } from '../people/peopleTabs'
import type { MastersView } from './view'

const SOURCES = import.meta.glob(['./*.tsx', '../contracts/PartiesTab.tsx', '../contracts/FundingTagsTab.tsx', '../contracts/PartyPage.tsx', '../people/*Tab.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** US-13.4.1's Master data list, each with the words its registry row uses. */
const CATALOGUE_ROWS: readonly { row: string; match: RegExp }[] = [
  { row: 'hospitals with contact email', match: /^hospitals, each with a contact email/ },
  { row: 'availability statuses', match: /availability statuses$/i },
  { row: 'recurring bookings', match: /^recurring bookings$/ },
  { row: 'the master public-holiday calendar', match: /master \(public holiday\) calendar/ },
  { row: 'hospital calendars', match: /hospital's own holiday calendar/ },
  { row: 'RVG codes and groups', match: /^RVG codes and groups$/ },
  { row: 'modifier codes', match: /^modifier codes$/ },
]

/** US-13.4.1's Contracts section list: each a tab of the section (build plan Phase 48). */
const SECTION_ROWS: readonly { row: string; match: RegExp }[] = [
  { row: 'Contracts, with their price ranges', match: /^Contracts, with their price ranges$/ },
  { row: 'Parties, insurers and funders among them', match: /^Parties, insurers and funders among them$/ },
  { row: 'funding tags', match: /^funding tags$/ },
]

/** US-13.4.1's People section list: each a tab of the section (build plan Phase 53). */
const PEOPLE_ROWS: readonly { row: string; match: RegExp }[] = [
  { row: 'anaesthetists', match: /^anaesthetists$/ },
  { row: 'surgeons', match: /^surgeons$/ },
  { row: 'specialties', match: /^specialties$/ },
  { row: 'patients', match: /^patients, whose records come from Bookings$/ },
]

/** The views whose sheets carry `RetireSection` or whose tables carry `ShowRetiredToggle`. */
const RETIRE_VIEWS: Record<string, readonly MastersView[]> = {
  './HospitalsView.tsx': ['hospitals'],
  './ModifiersView.tsx': ['modifiers'],
}

const LOAD_ACTIONS = ['Load from spreadsheet', 'Load sample', 'stageMasterLoad', 'commitMasterLoad']
const LOAD_VIEW_FILES = ['./SeedLoadView.tsx', './GoLiveLoadView.tsx']

describe('the Master data registry', () => {
  it.each(CATALOGUE_ROWS)('$row maps to a view that adds and edits', ({ match }) => {
    const views = MASTER_VIEWS.filter((v) => v.catalogueRows.some((r) => match.test(r)))
    expect(views.length).toBeGreaterThan(0)
    expect(views.some((v) => v.add && v.edit)).toBe(true)
  })

  it.each(SECTION_ROWS)('$row maps to a Contracts section tab that adds and edits, and to no Master data view', ({ match }) => {
    const tabs = CONTRACTS_TABS.filter((t) => t.catalogueRows.some((r) => match.test(r)))
    expect(tabs).toHaveLength(1)
    expect(tabs[0]!.add && tabs[0]!.edit).toBe(true)
    expect(MASTER_VIEWS.some((v) => v.catalogueRows.some((r) => match.test(r)))).toBe(false)
  })

  it.each(PEOPLE_ROWS)('$row maps to a People tab that edits, and to no Master data view or Contracts tab', ({ match }) => {
    const tabs = PEOPLE_TABS.filter((t) => t.catalogueRows.some((r) => match.test(r)))
    expect(tabs).toHaveLength(1)
    expect(tabs[0]!.edit).toBe(true)
    expect(MASTER_VIEWS.some((v) => v.catalogueRows.some((r) => match.test(r)))).toBe(false)
    expect(CONTRACTS_TABS.some((t) => t.catalogueRows.some((r) => match.test(r)))).toBe(false)
  })

  it('anaesthetists, surgeons and specialties are added on their People tabs; patients come from Bookings', () => {
    expect(PEOPLE_TABS.map((t) => [t.tab, t.add])).toEqual([['anaesthetists', true], ['surgeons', true], ['specialties', true], ['patients', false]])
  })

  it('Master data keeps no Contracts, Parties, Funding tags or People view, nor a surgeon group list, and Billing keeps RVG groups and Modifiers', () => {
    const ids: readonly string[] = MASTER_VIEWS.map((v) => v.view)
    for (const gone of ['contracts', 'parties', 'fundingTags', 'insurers', 'organisations', 'anaesthetists', 'surgeons', 'specialties', 'surgeonGroups']) expect(ids).not.toContain(gone)
    expect(MASTER_VIEWS.some((v) => v.catalogueRows.some((r) => /surgeon groups?/i.test(r)))).toBe(false)
    expect(MASTER_VIEWS.filter((v) => v.group === 'Places').map((v) => v.view)).toEqual(['hospitals'])
    expect(MASTER_VIEWS.filter((v) => v.group === 'Billing').map((v) => v.view)).toEqual(['rvgGroups', 'modifiers'])
  })

  it('every load sheet is named by at least one view, Contracts tab or People tab', () => {
    const seeded = new Set([...MASTER_VIEWS.flatMap((v) => v.seeded ?? []), ...CONTRACTS_TABS.flatMap((t) => t.seeded), ...PEOPLE_TABS.flatMap((t) => t.seeded)])
    for (const entity of LOAD_ORDER) expect(seeded.has(entity), entity).toBe(true)
  })

  it('the Surgeons tab filters Active, Retired or All instead of Show retired', () => {
    const source = SOURCES['../people/SurgeonsTab.tsx']!
    expect(source).toMatch(/label: 'Retired'/)
    expect(source).not.toMatch(/ShowRetiredToggle/)
  })

  it('views that retire declare it', () => {
    for (const [file, views] of Object.entries(RETIRE_VIEWS)) {
      expect(SOURCES[file], file).toMatch(/ShowRetiredToggle/)
      for (const view of views) expect(masterViewEntry(view).retire, view).toBe(true)
    }
    for (const view of ['hospitals', 'modifiers', 'rvgGroups', 'availability-statuses', 'recurringBookings'] as const) {
      expect(masterViewEntry(view).retire, view).toBe(true)
    }
  })

  it('the view ids are unique and the Go-live views are demo-badged', () => {
    const ids = MASTER_VIEWS.map((v) => v.view)
    expect(new Set(ids).size).toBe(ids.length)
    expect(masterViewEntry('seedLoad').demo).toBe(true)
    expect(masterViewEntry('goLive').demo).toBe(true)
  })

  it('the seeded subtitle says the load is once, then by hand', () => {
    expect(SEEDED_SUBTITLE).toBe("Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.")
  })

  it('no office view renders a load action', () => {
    const office = Object.entries(SOURCES).filter(([file]) => !LOAD_VIEW_FILES.includes(file) && (/(View(s)?|Tab|Page)\.tsx$/.test(file) || file === './chrome.tsx' || file === './MasterData.tsx'))
    expect(office.length).toBeGreaterThan(10)
    for (const [file, source] of office) {
      for (const action of LOAD_ACTIONS) expect(source.includes(action), `${file} names ${action}`).toBe(false)
    }
  })
})
