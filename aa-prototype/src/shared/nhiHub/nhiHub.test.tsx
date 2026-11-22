import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, OFFICE_ACTOR, setNhiHubMode, useAppStore } from '../../store'
import { nhiRegister } from '../../domain/seed/nhiRegister'
import type { NhiHubMode } from '../../domain/types'
import { askHub, HUB_TIMING } from './hub'
import { useNhiHubLookup } from './useNhiHubLookup'

describe('askHub (catch-up Phase 40a)', () => {
  const modes: NhiHubMode[] = ['available', 'slow', 'unavailable']

  it('an invalid NHI is invalid in every mode, never sent', () => {
    for (const mode of modes) expect(askHub(mode, nhiRegister(), 'ZAA0068')).toEqual({ kind: 'invalid', reason: 'The check digit does not match.' })
  })

  it('Available and Slow answer from the register; Unavailable answers nothing', () => {
    expect(askHub('available', nhiRegister(), 'ZBR4417')).toMatchObject({ kind: 'found', person: { name: 'Mereana Tipene' } })
    expect(askHub('slow', nhiRegister(), 'ZBR4417')).toMatchObject({ kind: 'found', person: { name: 'Mereana Tipene' } })
    expect(askHub('available', nhiRegister(), 'ZBW6638')).toEqual({ kind: 'notFound', nhi: 'ZBW6638' })
    expect(askHub('unavailable', nhiRegister(), 'zbr4417')).toEqual({ kind: 'unavailable', nhi: 'ZBR4417' })
  })
})

describe('useNhiHubLookup', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('checks, then reveals the answer after the wait', () => {
    const { result } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZBR4417'))
    expect(result.current.state).toEqual({ status: 'checking', nhi: 'ZBR4417' })
    expect(result.current.busy).toBe(true)
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs))
    expect(result.current.state).toMatchObject({ status: 'found', person: { name: 'Mereana Tipene' } })
  })

  it('an invalid NHI shows its reason at once', () => {
    const { result } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZAA0068'))
    expect(result.current.state).toEqual({ status: 'invalid', reason: 'The check digit does not match.' })
  })

  it('zero timing answers at once', () => {
    const { result } = renderHook(() => useNhiHubLookup({ timing: { answerMs: 0, slowAnswerMs: 0, slowNoticeMs: 0 } }))
    act(() => result.current.lookup('ZBW6638'))
    expect(result.current.state).toEqual({ status: 'notFound', nhi: 'ZBW6638' })
  })

  it('Unavailable, then Retry once the Hub is back', () => {
    setNhiHubMode(useAppStore, OFFICE_ACTOR, 'unavailable')
    const { result } = renderHook(() => useNhiHubLookup())
    expect(result.current.mode).toBe('unavailable')
    act(() => result.current.lookup('ZBR4417'))
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs))
    expect(result.current.state).toEqual({ status: 'unavailable', nhi: 'ZBR4417' })
    act(() => {
      setNhiHubMode(useAppStore, OFFICE_ACTOR, 'available')
    })
    act(() => result.current.retry())
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs))
    expect(result.current.state).toMatchObject({ status: 'found' })
  })

  it('Slow shows its notice, then the answer; Stop waiting cancels', () => {
    setNhiHubMode(useAppStore, OFFICE_ACTOR, 'slow')
    const { result } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZBR4417'))
    act(() => vi.advanceTimersByTime(HUB_TIMING.slowNoticeMs))
    expect(result.current.state.status).toBe('slow')
    act(() => vi.advanceTimersByTime(HUB_TIMING.slowAnswerMs))
    expect(result.current.state.status).toBe('found')

    act(() => result.current.lookup('ZBT2253'))
    act(() => vi.advanceTimersByTime(HUB_TIMING.slowNoticeMs))
    act(() => result.current.cancel())
    expect(result.current.state).toEqual({ status: 'cancelled', nhi: 'ZBT2253' })
    act(() => vi.advanceTimersByTime(HUB_TIMING.slowAnswerMs))
    expect(result.current.state.status).toBe('cancelled')
  })

  it('a stale answer never lands: lookup A, then B, then A\'s timer', () => {
    const { result } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZBR4417'))
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs - 100))
    act(() => result.current.lookup('ZBT2253'))
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.state.status).toBe('checking')
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs))
    expect(result.current.state).toMatchObject({ status: 'found', person: { name: 'Lucas Brennan' } })
  })

  it('reset discards a pending answer', () => {
    const { result } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZBR4417'))
    act(() => result.current.reset())
    act(() => vi.advanceTimersByTime(HUB_TIMING.answerMs))
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('unmount clears its timers', () => {
    const { result, unmount } = renderHook(() => useNhiHubLookup())
    act(() => result.current.lookup('ZBR4417'))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
