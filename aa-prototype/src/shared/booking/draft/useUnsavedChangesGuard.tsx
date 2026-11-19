/**
 * The unsaved-changes warning (catch-up Phase 35; US-02.3.2 "Unsaved
 * warning"). While the Admin Booking draft is dirty:
 *
 * - any in-app navigation that would change the pathname (the side nav, the
 *   back link, the app switcher, the Demo actions menu, the Control Panel's
 *   links, the browser back button) is blocked and "Leave without saving?"
 *   asks first (`useBlocker`, which needs the data router `router.tsx`
 *   builds);
 * - a reload or tab close gets the browser's own prompt (`beforeunload`).
 *
 * Outside a data router (a `MemoryRouter` in older tests) it degrades to the
 * `beforeunload` prompt alone.
 */

import { useContext, useEffect } from 'react'
import { UNSAFE_DataRouterContext, useBlocker, type Blocker } from 'react-router-dom'
import { ConfirmSheet } from '../../surface/ConfirmSheet'

const NO_BLOCKER: Blocker = { state: 'unblocked', proceed: undefined, reset: undefined, location: undefined }

/** `useBlocker` only inside a data router; a stable no-op otherwise. */
function useBlockerIfDataRouter(when: boolean): Blocker {
  const inDataRouter = useContext(UNSAFE_DataRouterContext) !== null
  // The router kind never changes for a mounted tree, so the hook order is stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return inDataRouter ? useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname) : NO_BLOCKER
}

/** Block leaving while `dirty`; returns the blocker for the dialog. */
export function useUnsavedChangesGuard(dirty: boolean): Blocker {
  const blocker = useBlockerIfDataRouter(dirty)
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older browsers need a return value to show their prompt.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
  // A blocked navigation that became moot (the draft was saved or discarded meanwhile) goes on.
  useEffect(() => {
    if (blocker.state === 'blocked' && !dirty) blocker.proceed()
  }, [blocker, dirty])
  return blocker
}

/** "Leave without saving?": Keep editing (stay) or Discard and leave. */
export function LeaveWithoutSavingDialog({ blocker, count, onDiscard }: { blocker: Blocker; count: number; onDiscard: () => void }) {
  const open = blocker.state === 'blocked'
  return (
    <ConfirmSheet
      open={open}
      onClose={() => blocker.reset?.()}
      shot="leave-without-saving"
      // Keep editing is the safe choice here, so focus opens on it, never on Discard and leave.
      initialFocus="confirm"
      title="Leave without saving?"
      description={
        <>
          You have <span className="mono">{count}</span> unsaved {count === 1 ? 'change' : 'changes'} to this Booking.
        </>
      }
      confirmLabel="Keep editing"
      onConfirm={() => blocker.reset?.()}
      cancelLabel="Discard and leave"
      onCancel={() => {
        onDiscard()
        blocker.proceed?.()
      }}
    />
  )
}
