/**
 * The shared side panel section (build plan Phase 53; D104): a few rows, See
 * all with the whole count, the empty line, and the rows' hooks.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RailSection, type RailSectionRow } from './RailSection'

const rows = (n: number): RailSectionRow[] =>
  Array.from({ length: n }, (_, i) => ({ key: `r${i}`, to: `/x/${i}`, title: `Row ${i}`, sub: `Sub ${i}`, data: { 'data-kind': i % 2 === 0 ? 'even' : 'odd' } }))

function renderSection(n: number, limit?: number) {
  return render(
    <MemoryRouter>
      <RailSection title="Next Lists" countNoun="Lists" rows={rows(n)} {...(limit !== undefined ? { limit } : {})} empty="None booked." allTo="/x" shot="t-rail" />
    </MemoryRouter>,
  )
}

describe('RailSection', () => {
  it('shows five rows by default, then See all with the whole count to the full list', () => {
    const { container } = renderSection(8)
    expect(container.querySelectorAll('[data-shot="t-rail"] li')).toHaveLength(5)
    const all = container.querySelector('[data-shot="t-rail-all"]') as HTMLAnchorElement
    expect(all.textContent).toBe('See all 8')
    expect(all.getAttribute('href')).toBe('/x')
    expect(screen.getByRole('link', { name: 'Row 0' })).toHaveAttribute('href', '/x/0')
    expect(container.querySelector('li[data-kind="odd"]')?.textContent).toContain('Sub 1')
  })

  it('takes another row limit, and offers no See all when every row shows', () => {
    expect(renderSection(3, 3).container.querySelector('[data-shot="t-rail-all"]')).toBeNull()
    expect(renderSection(4, 2).container.querySelectorAll('li')).toHaveLength(2)
  })

  it('says its empty line when there are no rows, with a count of 0', () => {
    const { container } = renderSection(0)
    expect(screen.getByText('None booked.')).toBeInTheDocument()
    expect(container.querySelector('li')).toBeNull()
    expect(container.querySelector('[data-shot="t-rail"]')?.textContent).toContain('0')
  })

  it('with no allTo, See all expands the section in place to every row, then Show fewer (Phase 54)', () => {
    const { container } = render(
      <MemoryRouter>
        <RailSection title="Next Lists" rows={rows(8)} limit={3} empty="None." shot="t-rail" />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll('li')).toHaveLength(3)
    const all = container.querySelector('[data-shot="t-rail-all"]') as HTMLButtonElement
    expect(all.tagName).toBe('BUTTON')
    expect(all.textContent).toBe('See all 8')
    fireEvent.click(all)
    expect(container.querySelectorAll('li')).toHaveLength(8)
    expect(container.querySelector('[data-shot="t-rail-all"]')).toBeNull()
    fireEvent.click(container.querySelector('[data-shot="t-rail-fewer"]') as HTMLButtonElement)
    expect(container.querySelectorAll('li')).toHaveLength(3)
  })

  it("carries a row's router state on its link (Phase 54)", () => {
    function Where() {
      const location = useLocation()
      return <div data-testid="state">{JSON.stringify(location.state)}</div>
    }
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Routes>
          <Route path="/x" element={<RailSection title="Next Lists" rows={[{ key: 'a', to: '/day', title: 'Open it', sub: 'AM', state: { openListId: 'L1' } }]} empty="None." shot="t-rail" />} />
          <Route path="/day" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Open it' }))
    expect(screen.getByTestId('state').textContent).toBe('{"openListId":"L1"}')
  })
})
