/**
 * The Admin Booking detail's draft (catch-up Phase 35; US-02.3.2, DM-35).
 *
 * A private, non-persisted store (`createAppStore()`), started from the real
 * state by reference (structural sharing; every store write is immutable).
 * While clean it follows the real store. The first drafted write fixes the
 * base (the Booking as it was last copied) and the draft stops following, so
 * the office's edits sit apart until Save writes their net change set to the
 * real store, or Discard throws them away. Undoing an edit by hand makes the
 * draft clean again.
 *
 * The draft store is marked (`markDraftStore`), so 27's prepayment send and
 * the shared app events are no-ops on it, and its own audit is thrown away.
 * A demo Reset while dirty discards the draft with one line of notice.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { diffSnapshots, snapshotBooking, type BookingSnapshot, type FieldChange } from '../../../domain/changeSets'
import type { AuditEntry } from '../../../domain/types'
import { copyStateIntoDraft, createAppStore, onDomainReset, markDraftStore, saveBookingChanges, useAppStore, type Actor, type BoundAppStore } from '../../../store'
import { BookingStoreContext, type BookingDraftValue, type BookingStoreContextValue } from './BookingStoreContext'

export const DRAFT_RESET_NOTICE = 'This Booking was reset. Your unsaved changes were discarded.'

interface Follow {
  /** The Booking as last copied from the real store: the base once the draft is edited. */
  copied: BookingSnapshot | undefined
  /** The real audit's length and last entry when copied (Reset detection). */
  auditLength: number
  auditTail: AuditEntry | undefined
  /** The draft's audit length when copied: its own entries come after. */
  draftAuditLength: number
}

/** True when the real audit no longer continues the one the draft was copied from (a demo Reset). */
function auditReplaced(audit: readonly AuditEntry[], follow: Follow): boolean {
  if (audit.length < follow.auditLength) return true
  const tail = follow.auditTail
  if (tail === undefined) return false
  // By reference: `mutate` appends (`[...audit, entry]`), so the entries the draft saw keep their
  // identity; a Reset rebuilds the seed's audit as new objects with the same ids and stamps.
  return audit[follow.auditLength - 1] !== tail
}

export function BookingDraftProvider({ bookingId, children, real = useAppStore }: { bookingId: string; children: ReactNode; real?: BoundAppStore }) {
  const draftApi = useMemo(() => {
    const api = createAppStore()
    markDraftStore(api)
    return api
  }, [])
  const follow = useRef<Follow>({ copied: undefined, auditLength: 0, auditTail: undefined, draftAuditLength: 0 })
  const [base, setBase] = useState<BookingSnapshot | null>(null)
  const [changes, setChanges] = useState<FieldChange[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const dirtyRef = useRef(false)

  const copyInto = useCallback(() => {
    const state = real.getState()
    // Before the copy: it notifies the draft's subscriber at once, which must see the new base and a clean draft.
    follow.current = {
      copied: snapshotBooking(state, bookingId),
      auditLength: state.audit.length,
      auditTail: state.audit[state.audit.length - 1],
      draftAuditLength: state.audit.length,
    }
    dirtyRef.current = false
    copyStateIntoDraft(draftApi, state)
  }, [real, draftApi, bookingId])

  const copyFromReal = useCallback(() => {
    copyInto()
    setBase(null)
    setChanges([])
  }, [copyInto])

  // Start from the real state (before the first paint, so no frame shows an empty draft).
  const started = useRef(false)
  if (!started.current) {
    started.current = true
    copyInto()
  }

  // While clean, follow the real store; while dirty, only watch for a Reset.
  useEffect(
    () =>
      real.subscribe((state) => {
        if (!dirtyRef.current) {
          copyFromReal()
          return
        }
        if (auditReplaced(state.audit, follow.current) || state.schedule.bookings[bookingId] === undefined) {
          copyFromReal()
          setNotice(DRAFT_RESET_NOTICE)
        }
      }),
    [real, copyFromReal, bookingId],
  )
  // A demo Reset always discards a dirty draft, even one that left the store exactly as seeded.
  useEffect(
    () =>
      onDomainReset((api) => {
        if (api !== real || !dirtyRef.current) return
        copyFromReal()
        setNotice(DRAFT_RESET_NOTICE)
      }),
    [real, copyFromReal],
  )

  // Each drafted write: dirty when the Booking differs from the copy.
  useEffect(
    () =>
      draftApi.subscribe((state) => {
        const copied = follow.current.copied
        const now = snapshotBooking(state, bookingId)
        if (copied === undefined || now === undefined) return
        const diff = diffSnapshots(copied, now)
        if (diff.length === 0) {
          if (dirtyRef.current) copyFromReal()
          return
        }
        dirtyRef.current = true
        setBase(copied)
        setChanges(diff)
      }),
    [draftApi, bookingId, copyFromReal],
  )

  const save = useCallback(
    (actor: Actor) => {
      const copied = follow.current.copied
      const next = snapshotBooking(draftApi.getState(), bookingId)
      if (copied === undefined || next === undefined) return { ok: false as const, code: 'notFound', message: 'Booking not found.' }
      const draftAudit = draftApi.getState().audit.slice(follow.current.draftAuditLength)
      const out = saveBookingChanges(real, actor, bookingId, { base: copied, next, draftAudit })
      if (out.ok) copyFromReal()
      return out
    },
    [draftApi, real, bookingId, copyFromReal],
  )

  const draft: BookingDraftValue = useMemo(
    () => ({
      bookingId,
      dirty: base !== null && changes.length > 0,
      changes,
      base,
      save,
      discard: copyFromReal,
      notice,
      dismissNotice: () => setNotice(null),
    }),
    [bookingId, base, changes, save, copyFromReal, notice],
  )
  const value: BookingStoreContextValue = useMemo(() => ({ api: draftApi, mode: 'draft', draft }), [draftApi, draft])
  return <BookingStoreContext.Provider value={value}>{children}</BookingStoreContext.Provider>
}
