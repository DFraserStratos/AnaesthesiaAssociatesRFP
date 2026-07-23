/**
 * Seeded per-day internal notes (Phase 06). Reproduces the Admin Day mockup's
 * three Tue-21 Internal-notes entries — the office's day-level annotations,
 * with the em dashes replaced per the app-copy rule. Runtime notes append via
 * `addDayNote`; the DN counter starts after these.
 */

import type { DayNote, IsoDate } from '../types'
import { DEMO_TODAY } from '../clock'

export const DAY_NOTES: Record<IsoDate, DayNote[]> = {
  [DEMO_TODAY]: [
    {
      id: 'DN0001',
      atISO: `${DEMO_TODAY}T08:12:00`,
      by: 'Kirsty W.',
      initials: 'KW',
      text: 'Dr Delaney on call for ICU tonight. Keep his PM free.',
      flagged: false,
    },
    {
      id: 'DN0002',
      atISO: `${DEMO_TODAY}T09:40:00`,
      by: 'Rachel T.',
      initials: 'RT',
      text: "St George's theatre 3 closed this PM. Ms Lim's list moved to theatre 5.",
      flagged: false,
    },
    {
      id: 'DN0003',
      atISO: `${DEMO_TODAY}T11:05:00`,
      by: 'Kirsty W.',
      initials: 'KW',
      text: "Fitzgerald PM surgeon unconfirmed, chasing St George's booking office.",
      flagged: true,
    },
  ],
}

/** Next free DN suffix (three seeded above). */
export const DAY_NOTE_NEXT = 4
