/**
 * Catch-up Phase 42 session 2 screens: Public holidays, Seed load (with its
 * result panel) and Go-live load, plus the parity of the sample trigger's
 * view-to-sheet map with `masterViews.ts`.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, listsFlaggedByPublicHoliday, stageGoLiveLoad, stageMasterLoad, useAppStore, type Actor } from '../../../../store'
import { SEED_LOAD_ACTOR } from '../../../../store/demoActors'
import { SurfaceProvider } from '../../../../shared'
import { SAMPLE_SHEETS, sampleFor } from '../../../../domain/masterLoad/samples'
import { SEEDED_SHEETS_BY_VIEW } from '../../../../shared/demoTriggers/registry'
import { AdminMastersRoute } from '../../routes'
import { MASTER_VIEWS } from './masterViews'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-07-21' }} />}>
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
            </Route>
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('the sample trigger follows masterViews.ts', () => {
  it("restates every view's seeded sheets exactly", () => {
    const fromViews = Object.fromEntries(MASTER_VIEWS.filter((v) => v.seeded !== undefined).map((v) => [v.view, [...v.seeded!]]))
    expect(SEEDED_SHEETS_BY_VIEW).toEqual(fromViews)
  })
})

describe('Public holidays view', () => {
  it('lists the calendar by date with kind, applies to and the Lists each flags', () => {
    renderAdmin('/admin/masters?view=publicHolidays')
    const view = shot('masters-public-holidays')
    expect(view).toHaveTextContent("Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.")
    const rows = view.querySelectorAll('tr[data-public-holiday]')
    expect(rows.length).toBe(Object.keys(useAppStore.getState().masters.publicHolidays).length)
    const labour = view.querySelector('tr[data-public-holiday="PH001"]') as HTMLElement
    expect(labour).toHaveTextContent('Mon 26 Oct 2026')
    expect(labour).toHaveTextContent('National')
    expect(labour).toHaveTextContent('All except AA rooms')
    expect(view.querySelector('tr[data-public-holiday="PH002"]')).toHaveTextContent('Regional · Canterbury')
    expect(view.querySelector('tr[data-public-holiday="PH003"]')).toHaveTextContent('All hospitals')
  })

  it('adds, marks a hospital open and deletes, each with a computed result line', () => {
    renderAdmin('/admin/masters?view=publicHolidays')
    fireEvent.click(screen.getByRole('button', { name: 'Add public holiday' }))
    const add = shot('public-holiday-add-sheet')
    fireEvent.change(within(add).getByLabelText('Date'), { target: { value: '2026-07-23' } })
    fireEvent.change(within(add).getByLabelText('Name'), { target: { value: 'Demo holiday' } })
    fireEvent.click(within(add).getByRole('button', { name: 'Add public holiday' }))
    const added = Object.values(useAppStore.getState().masters.publicHolidays).find((p) => p.name === 'Demo holiday')!
    const flagged = listsFlaggedByPublicHoliday(useAppStore.getState(), added.id)
    expect(flagged).toBeGreaterThan(0)
    expect(shot('public-holiday-result')).toHaveTextContent(`Public holiday added. ${flagged} ${flagged === 1 ? 'List' : 'Lists'} flagged.`)

    fireEvent.click(screen.getByRole('button', { name: 'Edit Demo holiday' }))
    const edit = shot('public-holiday-edit-sheet')
    const cph = Object.values(useAppStore.getState().masters.hospitals).find((h) => h.name === 'Christchurch Public')!
    const before = listsFlaggedByPublicHoliday(useAppStore.getState(), added.id)
    fireEvent.change(within(edit).getByLabelText('Open that day'), { target: { value: cph.id } })
    fireEvent.click(within(edit).getByRole('button', { name: 'Save changes' }))
    const cleared = before - listsFlaggedByPublicHoliday(useAppStore.getState(), added.id)
    expect(shot('public-holiday-result')).toHaveTextContent(`Christchurch Public marked open. ${cleared} ${cleared === 1 ? 'flag' : 'flags'} cleared.`)

    const left = listsFlaggedByPublicHoliday(useAppStore.getState(), added.id)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Demo holiday' }))
    const confirm = shot('public-holiday-delete-confirm')
    expect(confirm).toHaveTextContent(`clears ${left} flagged ${left === 1 ? 'List' : 'Lists'}`)
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete public holiday' }))
    expect(useAppStore.getState().masters.publicHolidays[added.id]).toBeUndefined()
    expect(shot('public-holiday-result')).toHaveTextContent('Public holiday deleted.')
  })
})

describe('Seed load view', () => {
  it('lists the twelve sheets in load order with their templates and hints, demo-badged', () => {
    renderAdmin('/admin/masters?view=seedLoad')
    const view = shot('seed-load')
    expect(view).toHaveTextContent('Demo stand-in: in the real system a developer runs this load; the office never sees this screen.')
    expect(view).toHaveTextContent('There is no Contract upload or export in the first release; Contracts are kept by hand after the load.')
    expect(view.querySelectorAll('[data-seed-sheet]').length).toBe(12)
    expect(view.querySelector('[data-seed-sheet="surgeons"]')).toHaveTextContent('A surgeon needs at least one specialty; an HPI CPN may be left blank.')
    expect(view.querySelector('[data-seed-sheet="contracts"]')).toHaveTextContent('A blank cell is not set; 0 means zero.')
    expect(view).toHaveTextContent('Reset the demo and load the same sheets again: the records come back identical.')
  })

  it('shows a staged sheet row by row, filters to the rejected, and loads the valid rows', () => {
    const sample = sampleFor('hospitals')
    act(() => {
      stageMasterLoad(useAppStore, SEED_LOAD_ACTOR, { entity: 'hospitals', csvText: sample.csv, source: { kind: 'sample', sampleId: sample.id } })
    })
    renderAdmin('/admin/masters?view=seedLoad')
    const panel = shot('master-load-result')
    const load = Object.values(useAppStore.getState().masterLoads.loads)[0]!
    const valid = load.rows.filter((r) => r.status === 'valid').length
    const rejected = load.rows.length - valid
    expect(panel).toHaveTextContent(`hospitals.csv: ${load.rows.length} rows · ${valid} valid · ${rejected} rejected`)
    expect(panel.querySelectorAll('tr[data-load-row]').length).toBe(load.rows.length)
    fireEvent.click(within(panel).getByRole('button', { name: 'Only rejected' }))
    expect(panel.querySelectorAll('tr[data-load-row]').length).toBe(rejected)
    fireEvent.click(within(panel).getByRole('button', { name: `Load ${valid} valid ${valid === 1 ? 'row' : 'rows'}` }))
    expect(shot('master-load-result')).toHaveTextContent(`Loaded ${valid} ${valid === 1 ? 'row' : 'rows'} on 21 Jul 2026 · ${rejected} rejected ${rejected === 1 ? 'row was' : 'rows were'} not loaded`)
  })

  it('checks a chosen .csv file as the developer', async () => {
    renderAdmin('/admin/masters?view=seedLoad')
    const sample = SAMPLE_SHEETS.find((s) => s.entity === 'specialties')!
    const input = document.querySelector('[data-seed-file="specialties"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([sample.csv], 'my-specialties.csv', { type: 'text/csv' })] } })
    await waitFor(() => expect(shot('master-load-result')).toHaveTextContent('my-specialties.csv'))
    const load = Object.values(useAppStore.getState().masterLoads.loads)[0]!
    expect(load.source).toEqual({ kind: 'file', fileName: 'my-specialties.csv' })
    expect(load.stagedBy).toBe('Developer seed load (simulated)')
  })
})

describe('Go-live load view', () => {
  it('points to the Demo actions menu until a batch is staged', () => {
    renderAdmin('/admin/masters?view=goLive')
    expect(shot('masters-go-live')).toHaveTextContent('open the Demo actions menu')
  })

  it('shows the names beside the controlled sheets, records AA decisions as the office, and loads approved data', () => {
    act(() => {
      stageGoLiveLoad(useAppStore, SEED_LOAD_ACTOR)
    })
    renderAdmin('/admin/masters?view=goLive')
    const table = shot('go-live-candidates')
    expect(table.querySelectorAll('tr[data-scan-row]').length).toBe(14)
    const junk = table.querySelector('tr[data-scan-row="3"]') as HTMLElement
    expect(within(junk).getByRole('button', { name: /Approve 10% discount/ })).toBeDisabled()
    expect(shot('masters-go-live')).toHaveTextContent('Solutions Plus identifiers and unit values are not carried over. Only operation names are used.')

    const knee = table.querySelector('tr[data-scan-row="8"]') as HTMLElement
    expect(knee).toHaveTextContent('Loads')
    fireEvent.click(within(knee).getByRole('button', { name: 'Unapprove Knee arthroscopy' }))
    const last = useAppStore.getState().audit.at(-1)!
    expect(last.action).toBe('goLive.unapprove')
    expect(last.who).toBe('Kirsty W.')
    expect(shot('go-live-candidates').querySelector('tr[data-scan-row="8"]')).toHaveTextContent('Not loaded')
    fireEvent.click(within(shot('go-live-candidates').querySelector('tr[data-scan-row="8"]') as HTMLElement).getByRole('button', { name: 'Approve Knee arthroscopy' }))

    fireEvent.click(screen.getByRole('button', { name: 'Load approved data' }))
    const counts = useAppStore.getState().masterLoads.goLive!.loadedCounts!
    expect(counts.notLoaded).toBeGreaterThan(0)
    expect(shot('go-live-result')).toHaveTextContent(/^Loaded \d+ surgeons?, .*Contracts? with \d+ price ranges? and \d+ public holidays?\. \d+ Solutions Plus entr(y was|ies were) not loaded\./)
    expect(shot('go-live-result')).toHaveTextContent(`${counts.notLoaded} Solutions Plus`)
  })
})
