import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDemoContextStore, useDemoTriggerContext, type DemoContextValues } from './context'

describe('useDemoTriggerContext', () => {
  it('publishes on mount, updates on change and withdraws on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ tab }: { tab: DemoContextValues['integrations.tab'] }) => useDemoTriggerContext('integrations.tab', tab),
      { initialProps: { tab: 'messages' as DemoContextValues['integrations.tab'] } },
    )
    expect(useDemoContextStore.getState().values['integrations.tab']).toBe('messages')
    rerender({ tab: 'pdfs' })
    expect(useDemoContextStore.getState().values['integrations.tab']).toBe('pdfs')
    unmount()
    expect('integrations.tab' in useDemoContextStore.getState().values).toBe(false)
  })
})
