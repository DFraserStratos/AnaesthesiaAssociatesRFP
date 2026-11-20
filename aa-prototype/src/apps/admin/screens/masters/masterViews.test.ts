/**
 * The Master data registry (catch-up Phase 42, work item 11; US-13.4.1 "in one
 * place"): every row of US-13.4.1's list maps to a view that can add and edit,
 * every seed-load sheet is named by a view's `seeded`, views that retire say
 * so, and no office view carries a load action (the load is the developer's
 * step, on the demo-badged Go-live views).
 */

import { describe, expect, it } from 'vitest'
import { LOAD_ORDER } from '../../../../domain/masterLoad/types'
import { MASTER_VIEWS, masterViewEntry, SEEDED_SUBTITLE } from './masterViews'
import type { MastersView } from './view'

const SOURCES = import.meta.glob(['./*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** US-13.4.1's list, each with the words its registry row uses. */
const CATALOGUE_ROWS: readonly { row: string; match: RegExp }[] = [
  { row: 'hospitals with contact email', match: /^hospitals, each with a contact email/ },
  { row: 'surgeons', match: /^surgeons$/ },
  { row: 'surgeon groups', match: /^surgeon groups$/ },
  { row: 'Parties, insurers and funders among them', match: /^Parties, insurers and funders among them$/ },
  { row: 'specialties', match: /^specialties$/ },
  { row: 'funding tags', match: /^funding tags$/ },
  { row: 'anaesthetists', match: /^anaesthetists$/ },
  { row: 'availability statuses', match: /availability statuses$/i },
  { row: 'recurring bookings', match: /^recurring bookings$/ },
  { row: 'the master public-holiday calendar', match: /master \(public holiday\) calendar/ },
  { row: 'hospital calendars', match: /hospital's own holiday calendar/ },
  { row: 'RVG codes and groups', match: /^RVG codes and groups$/ },
  { row: 'modifier codes', match: /^modifier codes$/ },
  { row: 'Contracts, with their price ranges', match: /^Contracts, with their price ranges$/ },
]

/** The views whose sheets carry `RetireSection` or whose tables carry `ShowRetiredToggle`. */
const RETIRE_VIEWS: Record<string, readonly MastersView[]> = {
  './HospitalsView.tsx': ['hospitals'],
  './SurgeonsView.tsx': ['surgeons', 'surgeonGroups'],
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

  it('every load sheet is named by at least one view', () => {
    const seeded = new Set(MASTER_VIEWS.flatMap((v) => v.seeded ?? []))
    for (const entity of LOAD_ORDER) expect(seeded.has(entity), entity).toBe(true)
  })

  it('views that retire declare it', () => {
    for (const [file, views] of Object.entries(RETIRE_VIEWS)) {
      expect(SOURCES[file], file).toMatch(/ShowRetiredToggle/)
      for (const view of views) expect(masterViewEntry(view).retire, view).toBe(true)
    }
    for (const view of ['hospitals', 'surgeons', 'surgeonGroups', 'modifiers', 'rvgGroups', 'availability-statuses', 'recurringBookings', 'contracts'] as const) {
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
    const office = Object.entries(SOURCES).filter(([file]) => !LOAD_VIEW_FILES.includes(file) && (/View(s)?\.tsx$/.test(file) || file === './chrome.tsx' || file === './MasterData.tsx'))
    expect(office.length).toBeGreaterThan(10)
    for (const [file, source] of office) {
      for (const action of LOAD_ACTIONS) expect(source.includes(action), `${file} names ${action}`).toBe(false)
    }
  })
})
