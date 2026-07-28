import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { advanceClockDays, resetDemo, useAppStore } from '../store'
import { DemoResetButton } from './DemoResetButton'

describe('DemoResetButton', () => {
  afterEach(() => {
    resetDemo(useAppStore)
  })

  it('confirms before restoring the pristine seed and preserves shell choices', () => {
    useAppStore.getState().setCurrentApp('admin')
    useAppStore.getState().setCardCalculationMode('units')
    advanceClockDays(useAppStore, 2)

    render(<DemoResetButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo data' }))
    expect(screen.getByRole('dialog', { name: 'Reset all demo data?' })).toBeInTheDocument()
    expect(useAppStore.getState().clock.todayISO).toBe('2026-07-23')

    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))

    const state = useAppStore.getState()
    expect(state.clock.todayISO).toBe('2026-07-21')
    expect(state.clock.minutesSinceMidnight).toBe(8 * 60)
    expect(state.shell.currentApp).toBe('admin')
    expect(state.shell.cardCalculationMode).toBe('units')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
