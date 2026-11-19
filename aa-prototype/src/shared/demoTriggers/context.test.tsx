import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDemoContextStore, useDemoTriggerContext, type DemoContextValues } from './context'

describe('useDemoTriggerContext', () => {
  it('publishes on mount, updates on change and withdraws on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ month }: { month: DemoContextValues['aaFees.month'] }) => useDemoTriggerContext('aaFees.month', month),
      { initialProps: { month: '2026-06' as DemoContextValues['aaFees.month'] } },
    )
    expect(useDemoContextStore.getState().values['aaFees.month']).toBe('2026-06')
    rerender({ month: '2026-07' })
    expect(useDemoContextStore.getState().values['aaFees.month']).toBe('2026-07')
    unmount()
    expect('aaFees.month' in useDemoContextStore.getState().values).toBe(false)
  })
})
