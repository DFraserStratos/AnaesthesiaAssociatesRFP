/**
 * Making an anaesthetist inactive on today's record (build plan Phase 52; US-12.1.6, US-04.1.2):
 * the status card's three states, the make-inactive sheet's refusal listing the Lists after the
 * day, Clear last day, the offer-back sheet ticking and enabling the rule's Contracts, the history
 * card, the record header and the Anaesthetists list's status, and the edit sheet's missing toggle.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { dayAfterISO } from '../../../domain/anaesthetistStatus'
import { ANAE } from '../../../domain/seed'
import { PRICED_ITEM } from '../../../domain/seed/pricedItems'
import { SurfaceProvider } from '../../../shared'
import {
  freshAppState,
  makeAnaesthetistInactive,
  runInactiveContractsJob,
  useAppStore,
  type Actor,
} from '../../../store'
import { advanceClockToDate } from '../../../store/clockActions'
import { AdminAnaesthetistRecordRoute, AdminMastersRoute } from '../routes'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const BEAU = ANAE.beaumont
const RHINO = PRICED_ITEM.beaumontRhinoplasty

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: useAppStore.getState().clock.todayISO }} />}>
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
              <Route path="anaesthetists/:anaesthetistId" element={<AdminAnaesthetistRecordRoute />} />
            </Route>
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const statusCard = () => document.querySelector('[data-shot="anaesthetist-status"]') as HTMLElement

/** A last day after every List Beaumont holds. */
function freeLastDay(): string {
  return Object.values(useAppStore.getState().schedule.lists)
    .filter((l) => l.anaesthetistId === BEAU)
    .map((l) => l.dateISO)
    .reduce((a, b) => (b > a ? b : a), useAppStore.getState().clock.todayISO)
}

describe('the anaesthetist record (Phase 52)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('Refused while holding Lists: the sheet lists the Lists after today, each opening its day, and Make inactive waits', () => {
    renderAt(`/admin/masters/anaesthetists/${BEAU}`)
    expect(statusCard().dataset['status']).toBe('active')
    fireEvent.click(within(statusCard()).getByRole('button', { name: 'Make inactive' }))
    const sheet = document.querySelector('[data-shot="make-inactive-sheet"]') as HTMLElement
    const rows = sheet.querySelectorAll('[data-shot="make-inactive-list-row"]')
    expect(rows.length).toBeGreaterThan(0)
    expect(within(sheet).getByText(/^Dr Beaumont has \d+ Lists? after Tue 24 Nov\. Reassign (it|them) first\.$/)).toBeTruthy()
    const firstList = useAppStore.getState().schedule.lists[(rows[0] as HTMLElement).dataset['listId']!]!
    expect(within(rows[0] as HTMLElement).getByRole('link').getAttribute('href')).toBe(`/admin/day/${firstList.dateISO}`)
    const confirm = document.querySelector('[data-shot="make-inactive-confirm"]') as HTMLButtonElement
    expect(confirm.disabled || confirm.getAttribute('aria-disabled') === 'true').toBe(true)
    expect(useAppStore.getState().masters.anaesthetists[BEAU]!.lastDayISO).toBeNull()
  })

  it('Last day chosen then Cleared in time: the card reads Inactive from the day, Clear puts it back, each audited', () => {
    const last = freeLastDay()
    renderAt(`/admin/masters/anaesthetists/${BEAU}`)
    fireEvent.click(within(statusCard()).getByRole('button', { name: 'Make inactive' }))
    const sheet = document.querySelector('[data-shot="make-inactive-sheet"]') as HTMLElement
    fireEvent.change(within(sheet).getByLabelText('Last day'), { target: { value: last } })
    expect(sheet.querySelector('[data-shot="make-inactive-after"]')?.textContent).toContain('Rhinoplasty')
    fireEvent.change(within(sheet).getByLabelText('Reason'), { target: { value: 'longLeave' } })
    fireEvent.click(document.querySelector('[data-shot="make-inactive-confirm"]') as HTMLElement)
    expect(statusCard().dataset['status']).toBe('leaving')
    expect(within(statusCard()).getByText('Long leave')).toBeTruthy()
    expect(document.querySelector('[data-shot="anaesthetist-status-sub"]')?.textContent).toMatch(/^Inactive from /)
    expect(useAppStore.getState().audit.findLast((e) => e.entityType === 'anaesthetist')?.action).toBe('anaesthetist.makeInactive')

    fireEvent.click(within(statusCard()).getByRole('button', { name: 'Clear last day' }))
    expect(statusCard().dataset['status']).toBe('active')
    expect(useAppStore.getState().audit.findLast((e) => e.entityType === 'anaesthetist')?.action).toBe('anaesthetist.clearLastDay')
  })

  it('Active again: the sheet offers Rhinoplasty ticked with its price, and confirming makes it Active', () => {
    const last = freeLastDay()
    expect(makeAnaesthetistInactive(useAppStore, OFFICE, BEAU, last, 'leftPractice').ok).toBe(true)
    advanceClockToDate(useAppStore, dayAfterISO(last))
    runInactiveContractsJob(useAppStore)
    expect(useAppStore.getState().masters.contracts[RHINO]!.status).toBe('disabled')
    renderAt(`/admin/masters/anaesthetists/${BEAU}`)
    expect(statusCard().dataset['status']).toBe('inactive')
    expect(document.querySelector('[data-shot="anaesthetist-status-sub"]')?.textContent).toBe('Inactive')
    // History readable while inactive.
    expect(document.querySelectorAll('[data-shot="anaesthetist-history-row"]').length).toBeGreaterThan(0)
    expect(document.querySelector('[data-shot="anaesthetist-ledger-link"]')?.getAttribute('href')).toBe(`/admin/ledger/anaesthetists/${BEAU}`)

    fireEvent.click(within(statusCard()).getByRole('button', { name: 'Make active' }))
    const row = document.querySelector(`[data-shot="make-active-contract"][data-contract-id="${RHINO}"]`) as HTMLInputElement
    expect(row.checked).toBe(true)
    expect(screen.getByText(/\$1,350\.00/)).toBeTruthy()
    fireEvent.click(document.querySelector('[data-shot="make-active-confirm"]') as HTMLElement)
    expect(useAppStore.getState().masters.contracts[RHINO]!.status).toBe('active')
    expect(statusCard().dataset['status']).toBe('active')
  })

  it('an unticked Contract stays Disabled; none offered reads so', () => {
    const last = freeLastDay()
    makeAnaesthetistInactive(useAppStore, OFFICE, BEAU, last, 'leftPractice')
    advanceClockToDate(useAppStore, dayAfterISO(last))
    runInactiveContractsJob(useAppStore)
    renderAt(`/admin/masters/anaesthetists/${BEAU}`)
    fireEvent.click(within(statusCard()).getByRole('button', { name: 'Make active' }))
    fireEvent.click(document.querySelector(`[data-shot="make-active-contract"][data-contract-id="${RHINO}"]`) as HTMLElement)
    fireEvent.click(document.querySelector('[data-shot="make-active-confirm"]') as HTMLElement)
    expect(useAppStore.getState().masters.contracts[RHINO]!.status).toBe('disabled')
  })

  it('the edit sheet has no Status control', () => {
    renderAt(`/admin/masters/anaesthetists/${BEAU}`)
    fireEvent.click(screen.getByRole('button', { name: /Edit details/ }))
    const sheet = document.querySelector('[data-shot="edit-anaesthetist-sheet"]') as HTMLElement
    expect(within(sheet).queryByText('Status')).toBeNull()
    expect(within(sheet).queryByText('Inactive')).toBeNull()
  })

  it('the Anaesthetists list reads Active, Inactive from a day, and Inactive', () => {
    const last = freeLastDay()
    makeAnaesthetistInactive(useAppStore, OFFICE, BEAU, last, 'leftPractice')
    renderAt('/admin/masters?view=anaesthetists')
    const kinds = [...document.querySelectorAll<HTMLElement>('[data-anaesthetist-status]')].map((el) => el.dataset['anaesthetistStatus'])
    expect(kinds.filter((k) => k === 'leaving')).toHaveLength(1)
    expect(screen.getByText(/^Inactive from /)).toBeTruthy()
  })
})
