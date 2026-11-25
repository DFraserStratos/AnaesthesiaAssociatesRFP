/**
 * The price ranges table on a Contract's page (build plan Phase 45;
 * US-04.2.15 "Table" and "To worked out"). The ranges are built here, not in
 * the seed: the demo clock's today is 24 Nov 2026.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Contract, PriceRange } from '../../../../domain/types'
import { mkContract } from '../../../../domain/billing/fixtures'
import { freshAppState, pricedPerRange, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { PriceRangesTable, foldRows, rangeRows } from './PriceRangesTable'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const fixed = (ranges: PriceRange[]): Contract => mkContract({ name: 'Cataract IOL', pricing: { kind: 'fixed', ranges } })
const rows = () => [...document.querySelectorAll('tr[data-shot="price-range-row"]')] as HTMLElement[]
const cells = (row: HTMLElement) => [...row.querySelectorAll('td')].map((td) => td.textContent ?? '')

function renderTable(contract: Contract) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <PriceRangesTable contract={contract} actor={OFFICE} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('the price ranges table (US-04.2.15)', () => {
  it('Table: yearly ranges 2019 to 2026 show 2026 first and in force, then 2025, 2024 and 2023, the earlier four folded', () => {
    const yearly = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y, i) => ({ startISO: `${y}-04-01`, price: 300 + i * 10 }))
    renderTable(fixed(yearly))
    expect(rows().map((r) => r.getAttribute('data-range-start'))).toEqual(['2026-04-01', '2025-04-01', '2024-04-01', '2023-04-01'])
    const top = rows()[0]!
    expect(top.getAttribute('data-range-state')).toBe('inForce')
    expect(cells(top)[1]).toBe('Onwards')
    expect(cells(top)[2]).toBe('$370.00')
    // Its change on 2025's $360.00, and the Procedures it priced (none: the Contract is not in the store).
    expect(cells(top)[3]).toBe('+2.8%')
    expect(cells(top)[4]).toBe('0')
    expect(top.textContent).toContain('In force')
    fireEvent.click(screen.getByRole('button', { name: 'Show 4 earlier ranges, back to 1 Apr 2019' }))
    expect(rows()).toHaveLength(8)
    expect(cells(rows()[7]!)[3]).toBe('First')
  })

  it('To worked out: a 1 June range runs to 30 September; the 1 October range has no end', () => {
    renderTable(fixed([{ startISO: '2026-06-01', price: 3100 }, { startISO: '2026-10-01', price: 3200 }]))
    const [october, june] = rows()
    expect(cells(october!).slice(0, 2)).toEqual(['1 Oct 2026', 'Onwards'])
    expect(cells(june!).slice(0, 2)).toEqual(['1 Jun 2026', '30 Sep 2026'])
  })

  it('counts the Procedures each range priced, from the store (the seeded Face lift)', () => {
    const state = useAppStore.getState()
    const faceLift = state.masters.contracts['CT-MER-FACELIFT']!
    const priced = pricedPerRange(state, faceLift.id, faceLift)
    renderTable(faceLift)
    for (const row of rows()) {
      const start = row.getAttribute('data-range-start')!
      expect(cells(row)[4]).toBe(String(priced[start] ?? 0))
    }
    expect(Object.values(priced).some((n) => n > 0)).toBe(true)
  })

  it('keeps a future range showing with the current one, whatever the fold', () => {
    const ranges = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map((y) => ({ startISO: `${y}-04-01`, price: 100 }))
    const { shown, folded } = foldRows(rangeRows(ranges, '2026-11-24'), false)
    expect(shown.map((r) => r.range.startISO)).toEqual(['2027-04-01', '2026-04-01', '2025-04-01', '2024-04-01', '2023-04-01'])
    expect(shown.map((r) => r.state)).toEqual(['future', 'inForce', 'ended', 'ended', 'ended'])
    expect(folded).toHaveLength(5)
  })
})
