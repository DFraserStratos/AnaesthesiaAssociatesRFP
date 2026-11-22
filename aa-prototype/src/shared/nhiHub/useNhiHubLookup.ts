/**
 * One NHI lookup through the simulated Hub (catch-up Phase 40a), for every
 * surface that looks an NHI up: the add-booking form, the rows waiting for an
 * NHI and the patient record's refresh.
 *
 * `lookup(input)` reads the Hub's demo mode from the store at call time,
 * computes the answer at once with `askHub` and reveals it after the mode's
 * wait. An invalid NHI shows its reason straight away and is never sent.
 * Every lookup carries a token: a new lookup, `cancel`, `reset` or an unmount
 * discards a pending answer, so a stale result never lands. The wait is a
 * UI-layer timer only; nothing stored reads it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store'
import { nhiRegister } from '../../domain/seed/nhiRegister'
import type { NhiHubMode } from '../../domain/types'
import type { NhiRegisterPerson } from '../../domain/nhiRegister'
import { askHub, HUB_TIMING, type HubTiming } from './hub'

export type NhiLookupState =
  | { status: 'idle' }
  | { status: 'checking'; nhi: string }
  | { status: 'slow'; nhi: string }
  | { status: 'found'; nhi: string; person: NhiRegisterPerson }
  | { status: 'notFound'; nhi: string }
  | { status: 'unavailable'; nhi: string }
  | { status: 'invalid'; reason: string }
  | { status: 'cancelled'; nhi: string }

export interface NhiHubLookup {
  state: NhiLookupState
  /** The Hub's demo mode now (for the badge). */
  mode: NhiHubMode
  /** True while an answer is pending. */
  busy: boolean
  lookup: (input: string) => void
  /** "Stop waiting and enter by hand". */
  cancel: () => void
  /** Ask again with the last NHI. */
  retry: () => void
  reset: () => void
}

export function useNhiHubLookup({ timing = HUB_TIMING }: { timing?: HubTiming } = {}): NhiHubLookup {
  const mode = useAppStore((s) => s.settings.nhiHubMode ?? 'available')
  const [state, setState] = useState<NhiLookupState>({ status: 'idle' })
  const token = useRef(0)
  const timers = useRef<number[]>([])
  const lastInput = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }, [])

  const lookup = useCallback(
    (input: string) => {
      clearTimers()
      const mine = ++token.current
      lastInput.current = input
      const hubMode = useAppStore.getState().settings.nhiHubMode ?? 'available'
      const answer = askHub(hubMode, nhiRegister(), input)
      if (answer.kind === 'invalid') {
        setState({ status: 'invalid', reason: answer.reason })
        return
      }
      const nhi = answer.kind === 'found' ? answer.person.nhi : answer.nhi
      const reveal = () => {
        if (token.current !== mine) return
        clearTimers()
        setState(answer.kind === 'found' ? { status: 'found', nhi, person: answer.person } : { status: answer.kind, nhi })
      }
      const wait = hubMode === 'slow' ? timing.slowAnswerMs : timing.answerMs
      if (wait <= 0) {
        reveal()
        return
      }
      setState({ status: 'checking', nhi })
      if (hubMode === 'slow') {
        timers.current.push(
          window.setTimeout(() => {
            if (token.current === mine) setState({ status: 'slow', nhi })
          }, timing.slowNoticeMs),
        )
      }
      timers.current.push(window.setTimeout(reveal, wait))
    },
    [clearTimers, timing.answerMs, timing.slowAnswerMs, timing.slowNoticeMs],
  )

  const cancel = useCallback(() => {
    token.current++
    clearTimers()
    setState((s) => (s.status === 'checking' || s.status === 'slow' ? { status: 'cancelled', nhi: s.nhi } : s))
  }, [clearTimers])

  const reset = useCallback(() => {
    token.current++
    clearTimers()
    lastInput.current = null
    setState({ status: 'idle' })
  }, [clearTimers])

  const retry = useCallback(() => {
    if (lastInput.current !== null) lookup(lastInput.current)
  }, [lookup])

  useEffect(
    () => () => {
      token.current++
      clearTimers()
    },
    [clearTimers],
  )

  return { state, mode, busy: state.status === 'checking' || state.status === 'slow', lookup, cancel, retry, reset }
}
