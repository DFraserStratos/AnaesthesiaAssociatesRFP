/**
 * The NHI lookup's one status line (catch-up Phase 40a), in the field's
 * caption slot on every surface that looks an NHI up: never a modal. Built on
 * the shared `FieldHint` (error tint for an invalid NHI, success for a found
 * person, slate while it waits) and, for an unavailable Hub, the shared
 * warning `Notice`. Retry and Stop waiting are teal text actions.
 */

import type { ReactNode } from 'react'
import { formatDob } from '../format'
import { FieldHint, Notice, TextAction, type FieldHintTone } from '../ui'
import type { NhiLookupState } from './useNhiHubLookup'

const mono = (text: string) => <span className="mono">{text}</span>

/** Every line the lookup shows, in one place. */
export const NHI_LOOKUP_COPY = {
  checking: 'Checking the NHI register',
  /** The Look up button's label while it waits. */
  checkingButton: 'Checking',
  lookUp: 'Look up',
  slow: 'The Hub is slow to answer. Keep waiting, or stop and enter the details by hand.',
  stopWaiting: 'Stop waiting',
  unavailable: 'The Digital Services Hub is not answering. Enter the details by hand, or try again.',
  retry: 'Retry',
  cancelled: 'Stopped waiting for the Hub. Enter the details by hand.',
  /** Where no details are typed (the waiting row, the refresh): the same states without the manual fallback. */
  unavailableNoManual: 'The Digital Services Hub is not answering. Try again.',
  cancelledNoManual: 'Stopped waiting for the Hub.',
  newFormat: 'New format NHI',
  found: (name: string) => `Found ${name} on the NHI register. Details pre-filled, still editable.`,
  /** S2's empty-NHI lookup, which fills the booking details too. */
  foundWithBooking: (name: string) => `Found ${name} on the NHI register. Patient and booking details pre-filled, still editable.`,
  /** The found line where nothing is filled in (the waiting row, the refresh). */
  onRegister: (name: string, dobISO: string): ReactNode => (
    <>
      On the NHI register: {name}, {mono(formatDob(dobISO))}.
    </>
  ),
  notFound: (nhi: string, manual = true): ReactNode => (
    <>
      No one with NHI {mono(nhi)} is on the NHI register. {manual ? 'Check the number, or enter the details by hand.' : 'Check the number.'}
    </>
  ),
} as const

export function NhiLookupStatus({
  state,
  onStopWaiting,
  onRetry,
  found,
  manualEntry = true,
}: {
  state: NhiLookupState
  onStopWaiting: () => void
  onRetry: () => void
  /** False where the surface has no details to type by hand (the waiting row, the refresh): the lines drop that fallback. */
  manualEntry?: boolean
  /** The found line where the surface says something else (S2's prefill, the waiting row, the refresh). */
  found?: (state: Extract<NhiLookupState, { status: 'found' }>) => ReactNode
}) {
  if (state.status === 'idle') return null
  const line = (tone: FieldHintTone, children: ReactNode) => (
    <FieldHint tone={tone} live="status" shot="nhi-lookup-status" data-status={state.status}>
      {children}
    </FieldHint>
  )
  switch (state.status) {
    case 'checking':
      return line('slate', NHI_LOOKUP_COPY.checking)
    case 'slow':
      return line(
        'slate',
        <>
          {NHI_LOOKUP_COPY.slow}{' '}
          <TextAction inline onClick={onStopWaiting} shot="nhi-lookup-stop">
            {NHI_LOOKUP_COPY.stopWaiting}
          </TextAction>
        </>,
      )
    case 'found':
      return line(
        'success',
        found !== undefined ? (
          found(state)
        ) : (
          <>
            {NHI_LOOKUP_COPY.found(state.person.name)}
            {state.person.format === 'new' && <span style={{ fontWeight: 600 }}> {NHI_LOOKUP_COPY.newFormat}</span>}
          </>
        ),
      )
    case 'notFound':
      return line('slate', NHI_LOOKUP_COPY.notFound(state.nhi, manualEntry))
    case 'cancelled':
      return line('slate', manualEntry ? NHI_LOOKUP_COPY.cancelled : NHI_LOOKUP_COPY.cancelledNoManual)
    case 'invalid':
      return line('error', state.reason)
    case 'unavailable':
      return (
        <Notice
          tone="warning"
          live="status"
          shot="nhi-lookup-status"
          data-status="unavailable"
          action={
            <TextAction onClick={onRetry} shot="nhi-lookup-retry">
              {NHI_LOOKUP_COPY.retry}
            </TextAction>
          }
        >
          {manualEntry ? NHI_LOOKUP_COPY.unavailable : NHI_LOOKUP_COPY.unavailableNoManual}
        </Notice>
      )
  }
}
