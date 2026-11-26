/** The feed's filters (build plan Phase 68; D125): the pills with their counts, and choosing one. */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedFilters } from './FeedFilters'

vi.mock('../../../../../store/intakeSelectors', () => ({
  useArrivalFeedCounts: () => ({ toDecide: 9, needsNhi: 2, roomsPdfs: 3, decided: 14, byHospital: { 'h-stg': 6 } }),
  useConnectedHospitals: () => [
    { hospitalId: 'h-stg', name: "St George's" },
    { hospitalId: 'h-sx', name: 'Southern Cross' },
  ],
}))

afterEach(cleanup)

const group = () => screen.getByRole('group', { name: 'Show arrivals' })
const pill = (name: RegExp) => within(group()).getByRole('button', { name })

describe('FeedFilters', () => {
  it('shows To decide, Needs NHI, Rooms PDFs, each connected hospital and Decided, with the numbers still to decide', () => {
    render(<FeedFilters filter={{ kind: 'toDecide' }} q="" onFilterChange={() => {}} onSearchChange={() => {}} />)
    const labels = within(group())
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(labels).toEqual(['To decide9', 'Needs NHI2', 'Rooms PDFs3', "St George's6", 'Southern Cross', 'Decided'])
    expect(pill(/^To decide/)).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-shot="intake-filters"]')).not.toBeNull()
    expect(screen.getByRole('searchbox', { name: 'Search patient, NHI, surgeon' })).toBeInTheDocument()
  })

  it('calls back with the chosen filter', () => {
    const onFilterChange = vi.fn()
    render(<FeedFilters filter={{ kind: 'needsNhi' }} q="" onFilterChange={onFilterChange} onSearchChange={() => {}} />)
    expect(pill(/^Needs NHI/)).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(pill(/^St George's/))
    fireEvent.click(pill(/^Decided/))
    fireEvent.click(pill(/^To decide/))
    expect(onFilterChange.mock.calls.map((c) => c[0])).toEqual([{ kind: 'hospital', hospitalId: 'h-stg' }, { kind: 'decided' }, { kind: 'toDecide' }])
  })

  it('passes what is typed in the search box', () => {
    const onSearchChange = vi.fn()
    render(<FeedFilters filter={{ kind: 'toDecide' }} q="" onFilterChange={() => {}} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Okafor' } })
    expect(onSearchChange).toHaveBeenCalledWith('Okafor')
  })
})
