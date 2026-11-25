/**
 * The shared side panel section (build plan Phase 53; D104): a few rows, See
 * all with the whole count, the empty line, and the rows' hooks.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

  it('with no allTo, See all shows every row in the section and Show fewer folds it back (Phase 55)', () => {
    const { container } = render(
      <MemoryRouter>
        <RailSection title="Next Lists" rows={rows(7)} empty="None booked." shot="t-rail" />
      </MemoryRouter>,
    )
    const all = container.querySelector('[data-shot="t-rail-all"]') as HTMLElement
    expect(all.tagName).toBe('BUTTON')
    fireEvent.click(all)
    expect(container.querySelectorAll('li')).toHaveLength(7)
    fireEvent.click(container.querySelector('[data-shot="t-rail-fewer"]') as HTMLElement)
    expect(container.querySelectorAll('li')).toHaveLength(5)
  })

  it('says its empty line when there are no rows, with a count of 0', () => {
    const { container } = renderSection(0)
    expect(screen.getByText('None booked.')).toBeInTheDocument()
    expect(container.querySelector('li')).toBeNull()
    expect(container.querySelector('[data-shot="t-rail"]')?.textContent).toContain('0')
  })
})
