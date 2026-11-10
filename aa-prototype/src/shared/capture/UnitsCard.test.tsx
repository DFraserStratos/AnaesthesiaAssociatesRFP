/**
 * The T row of the Units card (catch-up Phase 19a; US-05.2.2, D25): time units
 * come from the start and finish stamps under the RVG time tiers held as data,
 * the caption says so (no "assumption"), its tooltip words the rule, and no
 * field lets anyone type time units.
 */

import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SEED_MARKERS } from '../../domain/seed'
import { resolveBtm } from '../../domain/billing/fee'
import { describeTimeRule } from '../../domain/billing/timeUnits'
import { proceduresForBooking, resetDemo, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface/SurfaceProvider'
import { UnitsCard } from './UnitsCard'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function Harness() {
  const bookingId = SEED_MARKERS.pendingCaptureBooking!.entityId
  const state = useAppStore.getState()
  const procedure = proceduresForBooking(state, bookingId)[0]!
  const group = procedure.rvgGroupId !== undefined ? state.masters.rvgGroups[procedure.rvgGroupId] : undefined
  const btm = resolveBtm(procedure, group, state.masters.rvgTimeRule)
  return (
    <SurfaceProvider variant="mobile">
      <UnitsCard procedure={procedure} btm={btm} rvgGroup={group} actor={SOUTER} canCapture isAdditional={false} onError={() => undefined} />
    </SurfaceProvider>
  )
}

describe('the T row: RVG time tiers as data', () => {
  beforeEach(() => resetDemo(useAppStore))

  it('captions the source, words the rule as its title, and never says "assumption"', () => {
    const { container } = render(<Harness />)
    const row = container.querySelector('[data-shot=units-row-t]') as HTMLElement
    const caption = within(row).getByText('From start and finish stamps · RVG time tiers')
    expect(caption).toHaveAttribute('title', describeTimeRule(useAppStore.getState().masters.rvgTimeRule))
    expect(caption).toHaveAttribute('title', '1 unit per 15 minutes or part for the first 2 hours, then 1 unit per 10 minutes or part.')
    expect(screen.queryByText(/assumption/i)).toBeNull()
  })

  it('offers no field to type time units', () => {
    const { container } = render(<Harness />)
    const row = container.querySelector('[data-shot=units-row-t]') as HTMLElement
    expect(row.querySelector('input, textarea, [contenteditable=true]')).toBeNull()
  })
})
