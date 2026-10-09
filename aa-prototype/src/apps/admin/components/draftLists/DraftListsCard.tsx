/**
 * The Draft Lists rail card (catch-up Phase 31; US-01.6.2 "prominently in the
 * core planning view ... in space reserved beside the day view"). It sits
 * under 15a's To-do card with the same anatomy (heading, mono count, at most
 * five rows, "See all N"), and above the place Phase 32's notification pool
 * takes. Rows are the soonest five waiting Draft Lists on any day, in the one
 * order (ascending date), each flagged "Unassigned" with its waiting time and
 * booking count; a row opens the drawer.
 */

import { useMemo } from 'react'
import { bookingCountsByList, useAppStore, waitingDraftLists } from '../../../../store'
import { format, parseISO } from 'date-fns'
import { pairingLine } from '../../../../shared/format'
import { DRAFT_LISTS } from '../../../../shared/scheduleTerms'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { BookingCount, UnassignedPill, WaitingTime } from './DraftListParts'

const RAIL_ROWS = 5

export function DraftListsCard({ onOpenDraftList, onSeeAll }: { onOpenDraftList: (listId: string) => void; onSeeAll: () => void }) {
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const masters = useAppStore((s) => s.masters)
  const waiting = useMemo(() => waitingDraftLists({ schedule: { lists } }), [lists])
  const counts = bookingCountsByList(bookings)
  const shown = waiting.slice(0, RAIL_ROWS)

  return (
    <section
      data-shot="admin-draft-lists-rail"
      aria-labelledby="admin-draft-lists-heading"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id="admin-draft-lists-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        {DRAFT_LISTS}
        {waiting.length > 0 && (
          <span className="mono" style={{ padding: '0 7px', borderRadius: radius.pill, background: semantic.warning.tint, color: semantic.warning.onTint, fontSize: 11.5, fontWeight: 700, lineHeight: '18px', fontVariantNumeric: 'tabular-nums' }}>
            {waiting.length}
          </span>
        )}
      </h2>
      {waiting.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>No {DRAFT_LISTS} waiting.</div>}
      {shown.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                data-draft-rail-row={l.id}
                onClick={() => onOpenDraftList(l.id)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', border: 'none', borderRadius: 10, background: neutral.bg, boxShadow: `inset 3px 0 0 ${semantic.warning.solid}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 12.5, lineHeight: '17px', fontWeight: 600, color: neutral.ink }}>
                  {format(parseISO(l.dateISO), 'EEE d')} {l.session} · {pairingLine(l, masters)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: neutral.slate }}>
                  <UnassignedPill />
                  <WaitingTime list={l} style={{ fontSize: 11 }} />
                  <span aria-hidden>·</span>
                  <BookingCount count={counts.get(l.id) ?? 0} noun />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {waiting.length > 0 && (
        <button type="button" data-shot="admin-draft-lists-see-all" onClick={onSeeAll} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
          See all {waiting.length}
        </button>
      )}
    </section>
  )
}
