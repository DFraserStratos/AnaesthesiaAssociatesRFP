/**
 * The shuffle key (catch-up Phase 17, US-01.3.6 "Shuffled within a tier"): one
 * bump per opening, and the first render of an opening already uses the key
 * the bump produces, so the order never re-sorts after the picker appears.
 */

import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../../store'
import { useSuggestionKey } from './useOfficePairings'

function Probe({ open, seen }: { open: boolean; seen: string[] }) {
  const key = useSuggestionKey('L-1', open)
  if (open) seen.push(key)
  return null
}

describe('useSuggestionKey', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('mounted closed then opened: every open render has the final key, and the counter bumps once', () => {
    const seen: string[] = []
    const view = render(<StrictMode><Probe open={false} seen={seen} /></StrictMode>)
    view.rerender(<StrictMode><Probe open seen={seen} /></StrictMode>)
    expect(useAppStore.getState().shell.suggestionSeq).toBe(1)
    expect(new Set(seen)).toEqual(new Set(['L-1:1']))

    view.rerender(<StrictMode><Probe open={false} seen={seen} /></StrictMode>)
    seen.length = 0
    view.rerender(<StrictMode><Probe open seen={seen} /></StrictMode>)
    expect(useAppStore.getState().shell.suggestionSeq).toBe(2)
    expect(new Set(seen)).toEqual(new Set(['L-1:2']))
  })

  it('mounted open: the first render already has the key the bump produces', () => {
    const seen: string[] = []
    render(<Probe open seen={seen} />)
    expect(seen[0]).toBe('L-1:1')
    expect(new Set(seen)).toEqual(new Set(['L-1:1']))
  })
})
