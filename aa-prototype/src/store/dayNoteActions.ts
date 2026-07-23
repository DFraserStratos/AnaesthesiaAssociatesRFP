/**
 * Per-day internal office notes (Phase 06 — the Admin Day mockup's Internal
 * notes panel). Stored per calendar date on the `dayNotes` slice, never on a
 * List. `addDayNote` appends through the audit wrapper like any other write.
 */

import type { DayNote } from '../domain/types'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

/** Display initials from an author's name ("Kirsty W." -> "KW"). */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0)
  if (parts.length === 0) return '?'
  return parts
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3)
}

/** Append a per-day internal note. Audited `dayNote.add`; stamps no Card. */
export function addDayNote(
  api: AppStoreApi,
  actor: Actor,
  dateISO: string,
  text: string,
  flagged = false,
): Outcome<{ dayNoteId: string }> {
  if (text.trim() === '') return refuse('textRequired', 'A note needs some text.')

  let dayNoteId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'dayNote')
    dayNoteId = alloc.id
    const note: DayNote = {
      id: dayNoteId,
      atISO: clockISO(s.clock),
      by: actor.who,
      initials: initialsFor(actor.who),
      text: text.trim(),
      flagged,
    }
    const existing = s.dayNotes[dateISO] ?? []
    metas.push({
      entityType: 'dayNote',
      entityId: dayNoteId,
      action: 'dayNote.add',
      after: { dateISO, flagged },
      stampCardId: null,
    })
    return { dayNotes: { ...s.dayNotes, [dateISO]: [...existing, note] }, counters: alloc.counters }
  })
  return ok({ dayNoteId })
}
