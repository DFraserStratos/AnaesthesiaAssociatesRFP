/** The harness bar's "Signed in as": the framed Mobile and Web apps run as Dr Souter unless switched. */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE } from '../domain/seed'
import { freshAppState, useAppStore } from '../store'
import { anaesthetistUserId, SCRIPTED_ANAESTHETIST_IDS, useAnaesthetistPersona } from './anaesthetistUser'

beforeEach(() => useAppStore.setState(freshAppState()))

describe('the anaesthetist the framed apps are signed in as', () => {
  it('is Dr Souter at reset', () => {
    expect(anaesthetistUserId(useAppStore.getState().shell)).toBe(ANAE.souter)
    const { result } = renderHook(() => useAnaesthetistPersona())
    expect(result.current).toEqual({ name: 'Dr Melanie Souter', initials: 'MS', role: 'Anaesthetist', anaesthetistId: ANAE.souter })
  })

  it('follows the switch, named from the anaesthetist record', () => {
    const { result } = renderHook(() => useAnaesthetistPersona())
    act(() => useAppStore.getState().setAnaesthetistUser(ANAE.rutherford))
    expect(result.current).toEqual({ name: 'Dr James Rutherford', initials: 'JR', role: 'Anaesthetist', anaesthetistId: ANAE.rutherford })
  })

  it('offers the scripted cast, Dr Souter first, each in the seed', () => {
    expect(SCRIPTED_ANAESTHETIST_IDS[0]).toBe(ANAE.souter)
    expect(SCRIPTED_ANAESTHETIST_IDS).toHaveLength(14)
    for (const id of SCRIPTED_ANAESTHETIST_IDS) expect(useAppStore.getState().masters.anaesthetists[id]).toBeDefined()
  })
})
