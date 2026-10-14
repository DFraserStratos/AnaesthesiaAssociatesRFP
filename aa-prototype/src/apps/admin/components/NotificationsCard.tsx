/**
 * The shared notification pool on the Admin Day rail (catch-up Phase 32;
 * FT-13.8, US-13.8.1). Under 15a's To-do card and 31's Draft Lists card, with
 * their anatomy but not their count: the pool has no read state (OQ-79's
 * recommendation), so the heading carries no number and no row an unread dot.
 * It is not the to-do list: a notification needs no action, so rows are
 * neutral (no warning edge) and carry no Clear. The same for every admin.
 */

import { format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { latestNotifications, useAppStore, type NotificationRow, type NotificationTarget, type PoolState } from '../../../store'
import { accent, neutral } from '../../../theme/tokens'

const RAIL_ROWS = 3

/** One notification as the card and the page show it: the sentence, any message, and when and by whom. */
export function NotificationText({ row, compact = false }: { row: NotificationRow; compact?: boolean }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: compact ? 12.5 : 13.5, lineHeight: compact ? '17px' : '19px', fontWeight: 600, color: neutral.ink }}>{row.text}</span>
      {row.notification.message !== undefined && (
        <span style={{ fontSize: compact ? 12 : 13, lineHeight: '17px', color: neutral.slate }}>"{row.notification.message}"</span>
      )}
      {compact && <span style={{ fontSize: 11, color: neutral.mist }}>{format(parseISO(row.atISO), 'EEE d MMM, HH:mm')} · {row.by}</span>}
    </span>
  )
}

/** The pool's inputs, memoised on just the slices a row reads (not every schedule or master edit). */
export function usePoolState(): PoolState {
  const notifications = useAppStore((s) => s.notifications)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const lists = useAppStore((s) => s.schedule.lists)
  return useMemo(() => ({ notifications, masters: { anaesthetists, hospitals, surgeons }, schedule: { lists } }), [notifications, anaesthetists, hospitals, surgeons, lists])
}

export function NotificationsCard({ onOpen, onSeeAll }: { onOpen: (target: NotificationTarget) => void; onSeeAll: () => void }) {
  const pool = usePoolState()
  const rows = useMemo(() => latestNotifications(pool, RAIL_ROWS), [pool])
  return (
    <section
      data-shot="admin-notifications-rail"
      aria-labelledby="admin-notifications-heading"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id="admin-notifications-heading" style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        Notifications
      </h2>
      {rows.length === 0 && (
        <div style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.mist }}>No notifications yet. When an anaesthetist moves a List, it shows here.</div>
      )}
      {rows.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => (
            <li key={r.notification.id}>
              {r.target.kind === 'gone' ? (
                <div data-notification-row={r.notification.id} style={{ padding: '10px 12px', borderRadius: 10, background: neutral.bg }}>
                  <NotificationText row={r} compact />
                </div>
              ) : (
                <button
                  type="button"
                  data-notification-row={r.notification.id}
                  onClick={() => onOpen(r.target)}
                  style={{ width: '100%', display: 'flex', padding: '10px 12px', border: 'none', borderRadius: 10, background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <NotificationText row={r} compact />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        data-shot="admin-notifications-see-all"
        onClick={onSeeAll}
        style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
      >
        See all notifications
      </button>
    </section>
  )
}
