/**
 * The Draft List's small display parts (catch-up Phase 31; US-01.6.2 "flagged
 * as unassigned wherever it appears", "how long it has been waiting"). A Draft
 * List never takes one of the six status colours: its flag is the warning tint
 * and on-tint (Design Language), its state chip a quiet neutral, and its
 * figures Spline Sans Mono with tabular numbers. Every word comes from
 * `shared/scheduleTerms.ts`. Admin only.
 */

import type { CSSProperties } from 'react'
import { useAppStore, clockISO } from '../../../../store'
import { waitingMinutes } from '../../../../domain/draftLists'
import type { List } from '../../../../domain/types'
import { waitingLabel } from '../../../../shared/format'
import { DRAFT_STATE, UNASSIGNED, bookingCountLabel, bookingNoun } from '../../../../shared/scheduleTerms'
import { Pill } from '../../../../shared/ui/Pill'
import { neutral, semantic, type as typeScale } from '../../../../theme/tokens'

/** The flag on every Draft List surface: the warning tint, a solid dot (never colour alone: it carries the word). */
export function UnassignedPill() {
  return (
    <Pill tone="warning" data-unassigned="true" leading={<span aria-hidden style={{ width: 6, height: 6, borderRadius: 3, background: semantic.warning.solid }} />}>
      {UNASSIGNED}
    </Pill>
  )
}

/** The DRAFT state chip, shown only on a Draft List beside its flag (its caps keep their tracking). */
export function DraftStateChip() {
  return (
    <Pill data-list-state="DRAFT" style={{ letterSpacing: typeScale.micro.tracking }}>
      {DRAFT_STATE}
    </Pill>
  )
}

/** A day or more is a display emphasis (not a rule): the warning on-tint. */
export const LONG_WAIT_MINUTES = 24 * 60

/** The live waiting time, from the demo clock: it moves with every clock change and freezes once the List stops waiting. */
export function useWaitingMinutes(list: Pick<List, 'draft' | 'removedAtISO'>): number {
  const nowISO = useAppStore((s) => clockISO(s.clock))
  return waitingMinutes(list, nowISO)
}

export function WaitingTime({ list, style }: { list: Pick<List, 'draft' | 'removedAtISO'>; style?: CSSProperties }) {
  const minutes = useWaitingMinutes(list)
  const long = minutes >= LONG_WAIT_MINUTES && list.removedAtISO === undefined && list.draft?.assignedAtISO === undefined
  return (
    <span
      className="mono"
      data-waiting-minutes={minutes}
      title={long ? 'Waiting over a day' : undefined}
      style={{ fontVariantNumeric: 'tabular-nums', fontWeight: long ? 600 : 500, color: long ? semantic.warning.onTint : neutral.slate, ...style }}
    >
      {waitingLabel(minutes)}
    </span>
  )
}

/** A small mono booking count ("0" muted when empty); `noun` adds "booking(s)" after it. */
export function BookingCount({ count, style, noun = false }: { count: number; style?: CSSProperties; noun?: boolean }) {
  const label = bookingCountLabel(count)
  const figure = (
    <span
      className="mono"
      {...(noun ? {} : { 'aria-label': label })}
      style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, fontWeight: 600, color: count === 0 ? neutral.mist : neutral.slate, ...style }}
    >
      {count}
    </span>
  )
  if (!noun) return figure
  return (
    <span>
      {figure} {bookingNoun(count)}
    </span>
  )
}
