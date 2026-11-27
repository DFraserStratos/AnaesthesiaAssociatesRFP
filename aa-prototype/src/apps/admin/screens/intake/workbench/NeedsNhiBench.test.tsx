/**
 * Intake · the Needs NHI bench (build plan Phase 72; US-11.1.5, US-11.1.4, US-02.6.3; D117, D124, D125; was the
 * Waiting for NHI tab's test, catch-up Phases 40 and 40a, Phase 51): the waiting row as received, its List and stub,
 * the one address to chase, Intake's count, Add NHI (the one path) and its register check, the row with no List yet,
 * and the old waiting addresses landing on Needs NHI.
 */

import { useState, type ReactNode } from 'react'
import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, MemoryRouter, Outlet, Route, RouterProvider, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, OFFICE_ACTOR, useAppStore, waitingNhiRows, type AppState } from '../../../../../store'
import { arrivalFeedCounts, arrivalItemsOf, useArrival } from '../../../../../store/intakeSelectors'
import { matchingAttentionCount } from '../../../../../store/matchingSelectors'
import { stubForRow } from '../../../../../store/stubSelectors'
import { stageNoNhiList } from '../../../../../test/intakeSamples'
import { NO_NHI_NEW_PATIENT_NHI, NO_NHI_RETURNING_NHI } from '../../../../../domain/intake/hospitalDownloads'
import { SEED_STUB } from '../../../../../domain/seed/intakeSeed'
import { SurfaceProvider } from '../../../../../shared/surface'
import { HUB_TIMING } from '../../../../../shared/nhiHub'
import { REGISTER_DIFFERS_LINE } from '../../../intake/AddNhiSheet'
import { intakeRoutes, mastersAndLegacyRoutes } from '../../../../../test/adminRoutes'
import { NeedsNhiBench } from './NeedsNhiBench'

const noop = () => undefined

/** The Needs NHI item holding a row (the feed's own read model). */
function needsNhiKeyFor(state: AppState, rowId: string): string | undefined {
  return arrivalItemsOf(state).find((i) => i.kind === 'needsNhi' && i.rowIds.includes(rowId))?.key
}

function rowIdOf(name: string): string {
  const row = waitingNhiRows(useAppStore.getState()).find((r) => r.patientName === name)
  if (row === undefined) throw new Error(`no waiting row for ${name}`)
  return row.rowId
}

function Where() {
  const location = useLocation()
  return <span data-testid="where">{`${location.pathname}${location.search}`}</span>
}

/** The bench on one arrival, held after the arrival leaves the feed (the Workbench would move on). */
function Bench({ arrivalKey, onDone }: { arrivalKey: string; onDone: () => void }) {
  const live = useArrival(arrivalKey)
  const [first] = useState(live)
  const arrival = live ?? first
  if (arrival === undefined) throw new Error(`no arrival ${arrivalKey}`)
  return <NeedsNhiBench arrival={arrival} actor={OFFICE_ACTOR} onDone={onDone} />
}

function inAdmin(node: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/admin/intake?filter=needs-nhi']}>
      <SurfaceProvider variant="web">
        {node}
        <Where />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

function benchFor(name: string, onDone: () => void = noop): HTMLElement {
  const key = needsNhiKeyFor(useAppStore.getState(), rowIdOf(name))
  if (key === undefined) throw new Error(`no Needs NHI item for ${name}`)
  const { container } = inAdmin(<Bench arrivalKey={key} onDone={onDone} />)
  return container.querySelector('[data-shot="intake-bench-needsNhi"]') as HTMLElement
}

function openAddNhi(bench: HTMLElement): HTMLElement {
  fireEvent.click(within(bench).getByRole('button', { name: 'Add NHI' }))
  return document.querySelector('[data-shot="add-nhi-sheet"]')!.closest('[role="dialog"]') as HTMLElement
}

function addNhi(sheet: HTMLElement, nhi: string) {
  fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: nhi } })
  fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))
}

/** Edit one row in place, as a test fixture only: a date with no List (its stub goes with it). */
function moveToNoList(rowId: string) {
  useAppStore.setState((s) => {
    const row = s.intake.rows[rowId]!
    const stubs = Object.fromEntries(Object.entries(s.intake.stubs).filter(([, stub]) => stub.importRowId !== rowId))
    return { intake: { ...s.intake, stubs, rows: { ...s.intake.rows, [rowId]: { ...row, incoming: { ...row.incoming, dateISO: '2027-06-02' } } } } }
  })
}

const answer = () =>
  act(() => {
    vi.advanceTimersByTime(HUB_TIMING.answerMs)
  })

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('Needs NHI bench: the waiting row', () => {
  it("shows the patient as received, the List with its stub, and the one address to chase (the seed's Mere Tipene)", () => {
    const bench = benchFor(SEED_STUB.patientName)
    const waiting = waitingNhiRows(useAppStore.getState()).find((r) => r.rowId === SEED_STUB.rowId)!
    const row = bench.querySelector('[data-shot="waiting-nhi-row"]') as HTMLElement
    expect(row.getAttribute('data-row-id')).toBe(SEED_STUB.rowId)

    const patient = bench.querySelector('[data-shot="waiting-nhi-patient"]') as HTMLElement
    expect(patient.textContent).toContain('Mere Tipene')
    expect(patient.textContent).toContain('Lap chole')
    expect(patient.textContent).toContain('14:00')
    expect(patient.textContent).toContain(waiting.hospital)
    expect(patient.textContent).not.toContain('No date of birth')

    // The stub on the List, linking to the List on the Day view.
    const list = bench.querySelector('[data-shot="waiting-nhi-list"]') as HTMLElement
    expect(list.getAttribute('data-list-id')).toBe(SEED_STUB.listId)
    expect(list.textContent).toContain('Tue 8 Dec PM')
    expect(list.textContent).toContain(`${waiting.daysToGo} days to go`)
    expect(list.querySelector('[data-shot="waiting-nhi-stub-marker"]')).not.toBeNull()
    const stubLink = within(list).getByText("Stub on Dr Souter's List").closest('a')!
    expect(stubLink.getAttribute('href')).toBe('/admin/day/2026-12-08')

    // The one address to chase, and the request as a real mailto draft to it.
    expect(waiting.chase.to).not.toBe('')
    expect(bench.querySelector('[data-shot="waiting-nhi-chase"]')?.textContent).toContain(waiting.chase.to)
    expect(bench.querySelector('a[data-shot="waiting-nhi-email"]')?.getAttribute('href')).toMatch(new RegExp(`^mailto:${waiting.chase.to.replace(/[.+]/g, '\\$&')}\\?`))
    expect(bench.querySelector('[data-shot="waiting-nhi-requested"]')?.textContent).toBe('Not requested yet')
    expect(within(bench).getByRole('button', { name: 'Add NHI' })).toBeInTheDocument()
  })

  it('urgent when the List is within three days, not otherwise', () => {
    stageNoNhiList(useAppStore)
    const aroha = benchFor('Aroha Ngata')
    expect(aroha.querySelector('[data-shot="waiting-nhi-row"]')?.getAttribute('data-urgent')).toBe('true')
    expect(within(aroha).getByText('Urgent')).toBeInTheDocument()
    cleanup()
    const losa = benchFor('Losa Tuilagi')
    expect(losa.querySelector('[data-shot="waiting-nhi-row"]')?.getAttribute('data-urgent')).toBe('false')
    expect(within(losa).queryByText('Urgent')).toBeNull()
  })

  it('with several office addresses the request goes to one, the one chosen, and audits it; Requested shows the date', () => {
    // A fixture only: Mere Tipene's surgeon's rooms hold a second office address.
    const surgeonId = useAppStore.getState().schedule.lists[SEED_STUB.listId]!.surgeonId
    useAppStore.setState((s) => {
      const surgeon = s.masters.surgeons[surgeonId]!
      const officeContacts = [...(surgeon.officeContacts ?? []), { name: 'Second office', email: 'second.office@rooms.example' }]
      return { masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [surgeonId]: { ...surgeon, officeContacts } } } }
    })
    const several = waitingNhiRows(useAppStore.getState()).find((r) => r.rowId === SEED_STUB.rowId)!
    expect(several.chase.to).not.toBe('')
    expect(several.chase.alternatives.length).toBeGreaterThan(0)
    const bench = benchFor(several.patientName)
    const other = several.chase.alternatives.at(-1)!.email
    expect(other).not.toBe(several.chase.to)
    fireEvent.change(within(bench).getByLabelText('Send the request to'), { target: { value: other } })
    const email = bench.querySelector('a[data-shot="waiting-nhi-email"]') as HTMLAnchorElement
    const recipients = decodeURIComponent(email.getAttribute('href')!.slice('mailto:'.length).split('?')[0]!)
    expect(recipients).toBe(other)
    expect(recipients).not.toContain(',')
    fireEvent.click(email)
    const entry = useAppStore.getState().audit.at(-1)!
    expect(entry.action).toBe('importRow.nhiRequested')
    expect(entry.after).toEqual({ to: other })
    expect(bench.querySelector('[data-shot="waiting-nhi-requested"]')?.textContent).toMatch(/^Requested /)
  })
})

describe('Needs NHI bench: Add NHI, the one path', () => {
  it("Intake's count holds the waiting row once and drops by one on Add NHI; the row leaves Needs NHI and the bench says so", () => {
    const onDone = vi.fn()
    const before = matchingAttentionCount(useAppStore.getState())
    const needsNhi = arrivalFeedCounts(useAppStore.getState()).needsNhi
    expect(needsNhiKeyFor(useAppStore.getState(), SEED_STUB.rowId)).toBeDefined()
    const sheet = openAddNhi(benchFor(SEED_STUB.patientName, onDone))
    addNhi(sheet, SEED_STUB.nhiToType)
    expect(matchingAttentionCount(useAppStore.getState())).toBe(before - 1)
    expect(arrivalFeedCounts(useAppStore.getState()).needsNhi).toBe(needsNhi - 1)
    expect(needsNhiKeyFor(useAppStore.getState(), SEED_STUB.rowId)).toBeUndefined()
    expect(stubForRow(useAppStore.getState(), SEED_STUB.rowId)).toBeUndefined()
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-shot="add-nhi-done"]')?.textContent).toBe("Mere Tipene is now on Dr Souter's List.")
    expect(document.querySelector('[data-shot="waiting-nhi-empty"]')).not.toBeNull()
  })

  it('a returning patient: the sheet shows the existing record and no second patient record is made', () => {
    stageNoNhiList(useAppStore)
    const before = Object.keys(useAppStore.getState().masters.patients).length
    const sheet = openAddNhi(benchFor('Losa Tuilagi'))
    const save = within(sheet).getByRole('button', { name: 'Add NHI' })
    expect(save).toBeDisabled()
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="add-nhi-preview"]')?.textContent).toMatch(/^Matches Losa Tuilagi, born 1 JUN 1992, \d+ earlier Bookings?\. The row uses this record; no second one is made\.$/)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))
    expect(waitingNhiRows(useAppStore.getState()).some((r) => r.patientName === 'Losa Tuilagi')).toBe(false)
    expect(Object.keys(useAppStore.getState().masters.patients).length).toBe(before)
    expect(document.querySelector('[data-shot="add-nhi-done"]')?.textContent).toMatch(/^Losa Tuilagi is now on Dr .+'s List\.$/)
  })

  it('an invalid NHI shows its reason and keeps Add NHI disabled', () => {
    stageNoNhiList(useAppStore)
    const sheet = openAddNhi(benchFor('Aroha Ngata'))
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAE0311' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeDisabled()
  })

  it('a row with no List yet reads None; Add NHI takes it off Needs NHI, counted once, and links to the row under its own kind', () => {
    stageNoNhiList(useAppStore)
    const rowId = rowIdOf('Aroha Ngata')
    moveToNoList(rowId)
    const onDone = vi.fn()
    const bench = benchFor('Aroha Ngata', onDone)
    const list = bench.querySelector('[data-shot="waiting-nhi-list"]') as HTMLElement
    expect(list.getAttribute('data-list-id')).toBeNull()
    expect(within(list).getAllByText('None')).toHaveLength(2)
    expect(list.querySelector('[data-shot="waiting-nhi-stub"]')).toBeNull()

    const before = matchingAttentionCount(useAppStore.getState())
    addNhi(openAddNhi(bench), NO_NHI_NEW_PATIENT_NHI)
    expect(needsNhiKeyFor(useAppStore.getState(), rowId)).toBeUndefined()
    expect(matchingAttentionCount(useAppStore.getState())).toBe(before)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-shot="add-nhi-needs-decision"]')?.textContent).toBe('The NHI is added. The row has no List yet: decide it with its arrival.')
    fireEvent.click(document.querySelector('[data-shot="add-nhi-open-row"]')!)
    const where = document.querySelector('[data-testid="where"]')!.textContent!
    const opened = /^\/admin\/intake\/arrival\/([^?]+)/.exec(where)
    expect(opened).not.toBeNull()
    const item = decodeURIComponent(opened![1]!)
    expect(arrivalItemsOf(useAppStore.getState()).find((i) => i.key === item)?.rowIds).toContain(rowId)
    expect(item).not.toMatch(/^nhi~/)
  })
})

describe('Add NHI: the register check (catch-up Phase 40a)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('ZAA0068 shows the check-digit reason as typed; ZAA0067 clears it', () => {
    stageNoNhiList(useAppStore)
    const sheet = openAddNhi(benchFor('Aroha Ngata'))
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0068' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0067' } })
    expect(sheet.textContent).not.toContain('The check digit does not match.')
    expect(sheet.textContent).toContain('Valid NHI')
  })

  it("a valid NHI is looked up on the register with the AA office's purpose note; the row's own patient shows no caution", () => {
    stageNoNhiList(useAppStore)
    const sheet = openAddNhi(benchFor('Losa Tuilagi'))
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('Checking the NHI register')
    answer()
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('On the NHI register: Losa Tuilagi, 1 JUN 1992.')
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')).toBeNull()
    expect(sheet.querySelector('[data-shot="nhi-purpose"]')?.textContent).toContain('Looked up on behalf of the AA office,')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })

  it("the register's different name is a mild caution, never a block", () => {
    stageNoNhiList(useAppStore)
    const sheet = openAddNhi(benchFor('Aroha Ngata'))
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    answer()
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')?.textContent).toBe(REGISTER_DIFFERS_LINE)
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })
})

describe('The old Patients and Intake waiting links land on Needs NHI (Phase 51, re-pointed by Phase 68; D99, D100, D117)', () => {
  function mountAt(url: string) {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/admin" element={<Outlet context={{ actor: OFFICE_ACTOR, onOpenList: noop }} />}>
          <Route path="day/:dateISO" element={<div data-testid="day" />} />
          {intakeRoutes()}
          {mastersAndLegacyRoutes()}
        </Route>,
      ),
      { initialEntries: ['/admin/day/2026-11-24', url], initialIndex: 1 },
    )
    render(
      <SurfaceProvider variant="web">
        <RouterProvider router={router} />
      </SurfaceProvider>,
    )
    return router
  }

  for (const url of ['/admin/patients/waiting', '/admin/intake/waiting']) {
    it(`${url} lands on the inbox showing rows waiting for an NHI, replacing the old entry so Back does not loop`, async () => {
      const router = mountAt(url)
      expect(router.state.location.pathname).toBe('/admin/intake')
      expect(router.state.location.search).toBe('?show=needs-nhi')
      expect(router.state.historyAction).toBe('REPLACE')
      await act(async () => {
        await router.navigate(-1)
      })
      expect(router.state.location.pathname).toBe('/admin/day/2026-11-24')
    })
  }
})
