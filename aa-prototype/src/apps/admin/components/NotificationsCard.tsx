/**
 * The shared notification pool on the Admin Day rail (catch-up Phase 32;
 * FT-13.8, US-13.8.1, US-13.8.3). Under 15a's To-do card and 31's Draft Lists
 * card, with their anatomy. Notices are active or resolved (D58; catch-up
 * Phase 32b): the heading carries the active count, each row the same tick as
 * the To-do card's Clear (`TickButton`), and a ticked row plays the
 * complete-tick and leaves, for every admin. It is not the to-do list: rows
 * are neutral (no warning edge). An alert shows its note. The same for every
 * admin; the panel's place and layout are Claude's design (US-13.8.1, Verify).
 */

import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { activeNotificationCount, latestNotifications, resolveNotification, useAppStore, type Actor, type NotificationRow, type NotificationTarget, type PoolState } from '../../../store'
import { accent, neutral, radius } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'
import { FormError, TickBadge, TickButton } from '../../../shared/ui'
import { stampText } from '../../../shared/format'

const RAIL_ROWS = 3

/** "Resolved by Kirsty W., Tue 21 Jul 09:14" (US-13.8.3 "Kept"). */
export function resolvedLine(row: NotificationRow): string | null {
  const n = row.notification
  if (n.resolvedAt === undefined) return null
  return `Resolved by ${n.resolvedBy ?? 'the office'}, ${format(parseISO(n.resolvedAt), 'EEE d MMM HH:mm')}`
}

/** One notification as the card and the page show it: the sentence, any message or note, and when and by whom. */
export function NotificationText({ row, compact = false }: { row: NotificationRow; compact?: boolean }) {
  const resolved = resolvedLine(row)
  const alert = row.notification.kind === 'officeAlert'
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: compact ? 12.5 : 13.5, lineHeight: compact ? '17px' : '19px', fontWeight: 600, color: row.resolved ? neutral.slate : neutral.ink }}>{row.text}</span>
      {row.notification.message !== undefined && (
        <span data-shot={alert ? 'notification-alert-note' : undefined} style={{ fontSize: compact ? 12 : 13, lineHeight: '17px', color: neutral.slate }}>
          {alert ? 'Note: ' : ''}"{row.notification.message}"
        </span>
      )}
      {compact && <span style={{ fontSize: 11, color: neutral.mist }}>{stampText(row.atISO)} · {row.by}</span>}
      {resolved !== null && <span data-shot="notification-resolved-line" style={{ fontSize: 11.5, color: neutral.mist }}>{resolved}</span>}
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
  const bookings = useAppStore((s) => s.schedule.bookings)
  return useMemo(
    () => ({ notifications, masters: { anaesthetists, hospitals, surgeons }, schedule: { lists, bookings } }),
    [notifications, anaesthetists, hospitals, surgeons, lists, bookings],
  )
}

/** The count of notices nobody has ticked, beside a heading (US-13.8.1 "Count"): a neutral pill, not an action. */
export function ActiveCount({ count, shot }: { count: number; shot: string }) {
  return (
    <span
      data-shot={shot}
      className="mono"
      style={{ display: 'inline-flex', alignItems: 'center', minWidth: 22, height: 22, padding: '0 8px', borderRadius: radius.pill, background: neutral.sunken, color: count > 0 ? neutral.ink : neutral.slate, fontSize: 12, fontWeight: 700, justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}
    >
      {count}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}> active</span>
    </span>
  )
}

/**
 * Tick a notice: the complete-tick plays on the row, then the store resolves it
 * (one `resolveNotification` commit) and the row leaves. Under reduced motion
 * the pause is the 80ms fade.
 */
export function useResolveWithTick(actor: Actor, onResolved?: () => void): { resolving: ReadonlySet<string>; resolve: (id: string) => void; error: string | null } {
  const [resolving, setResolving] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  // Ticks still playing their motion: committed at once if the panel unmounts first (a row opened mid-tick).
  const pending = useRef(new Map<string, number>())
  useEffect(
    () => () => {
      for (const [id, timer] of pending.current) {
        window.clearTimeout(timer)
        resolveNotification(useAppStore, actor, id)
      }
      pending.current.clear()
    },
    [actor],
  )
  function resolve(id: string) {
    if (pending.current.has(id)) return
    setError(null)
    setResolving((s) => new Set(s).add(id))
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    const timer = window.setTimeout(() => {
      pending.current.delete(id)
      const out = resolveNotification(useAppStore, actor, id)
      if (!out.ok) setError(out.message)
      setResolving((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
      onResolved?.()
    }, reduced ? 80 : motion.completeTick.pulseDuration)
    pending.current.set(id, timer)
  }
  return { resolving, resolve, error }
}

export function NotificationsCard({
  actor,
  onOpen,
  onSeeAll,
  onShowResolved,
}: {
  actor: Actor
  onOpen: (target: NotificationTarget) => void
  onSeeAll: () => void
  /** The page with "Show resolved" on (US-13.8.3's filter, from the panel too). */
  onShowResolved?: () => void
}) {
  const pool = usePoolState()
  const rows = useMemo(() => latestNotifications(pool, RAIL_ROWS), [pool])
  const count = useMemo(() => activeNotificationCount(pool), [pool])
  const heading = useRef<HTMLHeadingElement>(null)
  // After a tick the row leaves; focus goes to the heading, not the page.
  const { resolving, resolve, error } = useResolveWithTick(actor, () => heading.current?.focus())
  const office = actor.role === 'office'
  return (
    <section
      data-shot="admin-notifications-rail"
      aria-labelledby="admin-notifications-heading"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id="admin-notifications-heading" ref={heading} tabIndex={-1} style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, outline: 'none' }}>
        Notifications
        <ActiveCount count={count} shot="admin-notifications-count" />
      </h2>
      {rows.length === 0 && (
        <div style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.mist }}>Nothing waiting. When an anaesthetist moves a List or alerts the office, it shows here until someone ticks it.</div>
      )}
      {rows.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const ticking = resolving.has(r.notification.id)
            return (
              <li
                key={r.notification.id}
                data-notification-row={r.notification.id}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: radius.ctl, background: neutral.bg, opacity: ticking ? 0.55 : 1, transition: 'opacity 200ms' }}
              >
                {r.target.kind === 'gone' ? (
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <NotificationText row={r} compact />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpen(r.target)}
                    style={{ flex: 1, minWidth: 0, display: 'flex', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <NotificationText row={r} compact />
                  </button>
                )}
                {office &&
                  (ticking ? (
                    <TickBadge size={30} animate />
                  ) : (
                    <TickButton compact shot="notification-tick" label={`Resolve notice: ${r.text}`} onClick={() => resolve(r.notification.id)}>
                      Resolve
                    </TickButton>
                  ))}
              </li>
            )
          })}
        </ul>
      )}
      <FormError message={error} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          data-shot="admin-notifications-see-all"
          onClick={onSeeAll}
          style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          See all notifications
        </button>
        {onShowResolved !== undefined && (
          <button
            type="button"
            data-shot="admin-notifications-rail-show-resolved"
            onClick={onShowResolved}
            style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Show resolved
          </button>
        )}
      </div>
    </section>
  )
}
