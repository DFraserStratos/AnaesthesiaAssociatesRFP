/**
 * Which store a Booking's screens read and write (catch-up Phase 35; DM-35).
 *
 * The shared Booking detail is one component in all three apps. With no
 * provider (mobile, web, the PWA) it reads and writes the real store and every
 * edit saves at once, as before. Under `BookingDraftProvider` (the Admin
 * Booking detail only) it reads and writes a private draft until the office
 * presses Save changes.
 *
 * Writes that are commands (complete, cancel, move, approve, the update
 * email) never go to the draft: they use `useAppStore` directly, sit in the
 * allowlist of `draftDiscipline.test.ts`, and are disabled while the draft
 * has unsaved changes (`useCommandBlock`).
 */

import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { useAppStore, type AppState, type BoundAppStore } from '../../../store'
import type { BookingSnapshot, FieldChange } from '../../../domain/changeSets'
import type { Actor, Outcome } from '../../../store'

export type BookingStoreMode = 'immediate' | 'draft'

/** What a Booking draft offers its screen (null without a provider). */
export interface BookingDraftValue {
  bookingId: string
  /** True while the draft holds changes not yet saved. */
  dirty: boolean
  /** The draft's changes since its base, field by field. */
  changes: FieldChange[]
  base: BookingSnapshot | null
  /** Save the changes as one change set, as the given office actor. */
  save: (actor: Actor) => Outcome<{ changeSetId: string; changes: FieldChange[] }>
  /** Throw the changes away and follow the real store again. */
  discard: () => void
  /** One line after a demo Reset discarded the draft, until dismissed. */
  notice: string | null
  dismissNotice: () => void
}

export interface BookingStoreContextValue {
  api: BoundAppStore
  mode: BookingStoreMode
  draft: BookingDraftValue | null
}

export const BookingStoreContext = createContext<BookingStoreContextValue | null>(null)

/** The store a Booking screen writes to: the draft under a provider, else the real one. */
export function useBookingApi(): BoundAppStore {
  return useContext(BookingStoreContext)?.api ?? useAppStore
}

/** Read from the Booking screen's store (the draft under a provider, else the real one). */
export function useBookingStore<T>(selector: (state: AppState) => T): T {
  return useStore(useBookingApi(), selector)
}

/** `immediate` (mobile, web, the PWA) or `draft` (the Admin Booking detail). */
export function useBookingStoreMode(): BookingStoreMode {
  return useContext(BookingStoreContext)?.mode ?? 'immediate'
}

/** The draft, under a provider; null in immediate mode. */
export function useBookingDraft(): BookingDraftValue | null {
  return useContext(BookingStoreContext)?.draft ?? null
}

/** An edit sheet's primary label in draft mode: it applies to the draft, and Save changes saves. */
export const APPLY_LABEL = 'Apply'

/** An edit sheet's primary label: its own Save wording at once, "Apply" in the Admin draft. */
export function primaryEditLabel(mode: BookingStoreMode, saveLabel: string): string {
  return mode === 'draft' ? APPLY_LABEL : saveLabel
}

/** `primaryEditLabel` for the Booking screen this sheet sits in. */
export function usePrimaryEditLabel(saveLabel: string): string {
  return primaryEditLabel(useBookingStoreMode(), saveLabel)
}

export const SAVE_OR_DISCARD_FIRST = 'Save or discard your changes first.'

/**
 * Commands act on the real store at once, so while the draft holds unsaved
 * changes they are disabled with this reason (null when they may run).
 */
export function useCommandBlock(): string | null {
  return useBookingDraft()?.dirty === true ? SAVE_OR_DISCARD_FIRST : null
}
