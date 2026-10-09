/**
 * The Draft Lists band on the Day dashboard (catch-up Phase 31; US-13.1.1,
 * US-01.6.2 "on the day view"). A row above the anaesthetists, on the same
 * ruler, holding the day's Draft Lists at their session's default times (a
 * Draft List has no session of its own), stacked in lanes when two share a
 * session, in the one order. A block is white with a stronger border, a
 * warning-solid left bar and a micro caps "UNASSIGNED" line, so it reads
 * differently from every status tint and never by colour alone (US-01.6.2
 * "looks different from an active List"). It ignores the status and focus
 * filters. A click opens the drawer.
 */

import { useAppStore } from '../../../store'
import type { DraftList, Session } from '../../../domain/types'
import { drSurname, pairingLine } from '../../../shared/format'
import { DRAFT_LISTS, UNASSIGNED, bookingCountLabel, unavailableDetail } from '../../../shared/scheduleTerms'
import { neutral, semantic } from '../../../theme/tokens'
import { blockGeometry, hoursOf } from '../util'
import { BookingCount, WaitingTime } from './draftLists/DraftListParts'

const LANE = 52

export function DraftListBand({
  draftLists,
  bookingCounts,
  onOpen,
}: {
  /** The day's live Draft Lists, already in `compareDraftLists` order. */
  draftLists: readonly DraftList[]
  bookingCounts: ReadonlyMap<string, number>
  onOpen: (listId: string) => void
}) {
  const masters = useAppStore((s) => s.masters)
  const defaults = useAppStore((s) => s.appSettings.schedule.defaultTimes)
  if (draftLists.length === 0) return null

  // Lanes: the n-th Draft List of a session goes in lane n.
  const laneOf = new Map<string, number>()
  const perSession: Record<Session, number> = { AM: 0, PM: 0 }
  for (const l of draftLists) {
    laneOf.set(l.id, perSession[l.session])
    perSession[l.session] += 1
  }
  const lanes = Math.max(perSession.AM, perSession.PM, 1)

  return (
    <div data-shot="daygrid-draft-band" data-draft-band-count={draftLists.length} style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${neutral.lineStrong}`, background: neutral.bg }}>
      <span style={{ width: 148, flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, paddingLeft: 16, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.ink }}>
          {DRAFT_LISTS} <span className="mono" style={{ fontVariantNumeric: 'tabular-nums', color: semantic.warning.onTint }}>{draftLists.length}</span>
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: semantic.warning.onTint }}>{UNASSIGNED.toUpperCase()}</span>
      </span>
      <span style={{ flex: 1, position: 'relative', height: lanes * LANE, display: 'block' }}>
        {draftLists.map((l) => {
          const t = defaults[l.session]
          const geo = blockGeometry(hoursOf(t.startTime), hoursOf(t.endTime))
          const lane = laneOf.get(l.id) ?? 0
          const from = l.draft.origin === 'recurringClash' && l.draft.fromAnaesthetistId !== undefined ? masters.anaesthetists[l.draft.fromAnaesthetistId] : undefined
          const count = bookingCounts.get(l.id) ?? 0
          const pairing = pairingLine(l, masters)
          return (
            <button
              key={l.id}
              type="button"
              data-draft-block={l.id}
              onClick={() => onOpen(l.id)}
              title={`${UNASSIGNED} · ${pairing}${from !== undefined ? ` · ${unavailableDetail(drSurname(from.name))}` : ''} · ${bookingCountLabel(count)}`}
              style={{
                position: 'absolute',
                top: lane * LANE + 4,
                height: LANE - 8,
                left: geo.left,
                width: geo.width,
                boxSizing: 'border-box',
                borderRadius: 6,
                padding: '3px 8px 3px 10px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1,
                textAlign: 'left',
                cursor: 'pointer',
                background: neutral.surface,
                border: `1px solid ${neutral.lineStrong}`,
                boxShadow: `inset 3px 0 0 ${semantic.warning.solid}`,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, lineHeight: '12px', fontWeight: 700, letterSpacing: '0.06em', color: semantic.warning.onTint }}>
                {UNASSIGNED.toUpperCase()}
                <span style={{ marginLeft: 'auto', letterSpacing: 0 }}>
                  <WaitingTime list={l} style={{ fontSize: 10 }} />
                </span>
              </span>
              {/* The booking count starts the second line, as on every List block. */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <span data-booking-count={count} style={{ flex: 'none', minWidth: 14, height: 12, padding: '0 3px', boxSizing: 'border-box', borderRadius: 99, background: neutral.sunken, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookingCount count={count} style={{ fontSize: 9, lineHeight: '12px' }} />
                </span>
                <span style={{ fontSize: 10.5, lineHeight: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: neutral.ink }}>{pairing}</span>
              </span>
              {from !== undefined && (
                <span style={{ fontSize: 9.5, lineHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: neutral.slate }}>{unavailableDetail(drSurname(from.name))}</span>
              )}
            </button>
          )
        })}
      </span>
    </div>
  )
}
