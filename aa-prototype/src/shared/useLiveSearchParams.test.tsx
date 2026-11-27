import { act, render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useLiveSearchParams } from './useLiveSearchParams'

describe('useLiveSearchParams', () => {
  it('two quick functional edits before a re-render both land', () => {
    let setter: ReturnType<typeof useLiveSearchParams>[1] | undefined
    let search = ''
    function Probe() {
      const [, set] = useLiveSearchParams()
      setter = set
      search = useLocation().search
      return null
    }
    render(
      <MemoryRouter initialEntries={['/x?show=done']}>
        <Probe />
      </MemoryRouter>,
    )
    const stale = setter!
    act(() => {
      stale((prev) => { const n = new URLSearchParams(prev); n.set('show', 'all'); return n }, { replace: true })
      stale((prev) => { const n = new URLSearchParams(prev); n.set('anaesthetist', '34821'); return n }, { replace: true })
    })
    expect(new URLSearchParams(search).get('show')).toBe('all')
    expect(new URLSearchParams(search).get('anaesthetist')).toBe('34821')
  })
})
