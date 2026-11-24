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

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { activeNotificationCount, latestNotifications, resolveNotification, useAppStore, type Actor, type NotificationRow, type NotificationTarget, type PoolState } from '../../../store'
import { neutral, radius } from '../../../theme/tokens'
import { CountBadge } from '../../../shared/ui/CountBadge'
import { motion } from '../../../theme/motion'
import { Card, FormError, TextAction, TickBadge, TickButton } from '../../../shared/ui'
import { stampText } from '../../../shared/format'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { NoticeLine } from '../../../shared/ui/NoticeLine'

const RAIL_ROWS = 3

/** "Resolved by Kirsty W., Tue 21 Jul, 09:14" (US-13.8.3 "Kept"; the stamp through `stampText`, question 24). */
export function resolvedLine(row: NotificationRow): string | null {
  const n = row.notification
  if (n.resolvedAt === undefined) return null
  return `Resolved by ${n.resolvedBy ?? 'the office'}, ${stampText(n.resolvedAt)}`
}

/**
 * One notification as the card and the page show it, on the shared `NoticeLine`: the sentence, any message
 * or note, and (on the rail, `compact`) when and by whom; who resolved it under. The page prints when in its
 * own column. `onOpen` and `action` make it the rail's row: the words open the notice, the tick sits beside.
 */
export function NotificationText({ row, compact = false, onOpen, action }: { row: NotificationRow; compact?: boolean; onOpen?: () => void; action?: ReactNode }) {
  const resolved = resolvedLine(row)
  const alert = row.notification.kind === 'officeAlert'
  const message = row.notification.message
  return (
    <NoticeLine
      size={compact ? 'sm' : 'md'}
      strong
      muted={row.resolved}
      text={row.text}
      {...(message !== undefined ? { message, messagePrefix: alert ? 'Note: ' : '', ...(alert ? { messageShot: 'notification-alert-note' } : {}) } : {})}
      {...(compact ? { atISO: row.atISO, stampSuffix: ` · ${row.by}` } : {})}
      footer={resolved !== null ? <span data-shot="notification-resolved-line" style={{ fontSize: 11.5, color: neutral.mist }}>{resolved}</span> : undefined}
      chevron={false}
      {...(onOpen !== undefined ? { onOpen } : {})}
      {...(action !== undefined ? { action } : {})}
      style={{ flex: 1 }}
    />
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

/**
 * The count of notices nobody has ticked, beside a heading (US-13.8.1 "Count"):
 * the shared rail bubble, not an action. It still shows "0" once all are ticked.
 */
export function ActiveCount({ count, shot }: { count: number; shot: string }) {
  return <CountBadge count={count} shot={shot} mono srNoun="active" hideAtZero={false} />
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
  const count = useMemo(() => activeNotificationCount(pool), [pool])
  const heading = useRef<HTMLHeadingElement>(null)
  return (
    <Card
      shot="admin-notifications-rail"
      headingId="admin-notifications-heading"
      headingRef={heading}
      title={
        <>
          Notifications
          <ActiveCount count={count} shot="admin-notifications-count" />
        </>
      }
    >
      {/* After a tick the row leaves; focus goes to the heading, not the page. */}
      <NotificationList actor={actor} onOpen={onOpen} onSeeAll={onSeeAll} {...(onShowResolved !== undefined ? { onShowResolved } : {})} onTicked={() => heading.current?.focus()} />
    </Card>
  )
}

/**
 * The pool's newest active notices with their ticks, then See all and Show resolved: the body of the
 * card above and of the Notices tab on the Admin Day rail's work card. `onTicked` says where focus goes
 * once a ticked row has left.
 */
export function NotificationList({
  actor,
  onOpen,
  onSeeAll,
  onShowResolved,
  onTicked,
}: {
  actor: Actor
  onOpen: (target: NotificationTarget) => void
  onSeeAll: () => void
  onShowResolved?: () => void
  onTicked?: () => void
}) {
  const pool = usePoolState()
  const rows = useMemo(() => latestNotifications(pool, RAIL_ROWS), [pool])
  const { resolving, resolve, error } = useResolveWithTick(actor, onTicked)
  const office = actor.role === 'office'
  return (
    <>
      {rows.length === 0 && (
        <EmptyState>Nothing waiting. When an anaesthetist moves a List or alerts the office, it shows here until someone ticks it.</EmptyState>
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
                <NotificationText
                  row={r}
                  compact
                  {...(r.target.kind !== 'gone' ? { onOpen: () => onOpen(r.target) } : {})}
                  {...(office
                    ? {
                        action: ticking ? (
                          <TickBadge size={30} animate />
                        ) : (
                          <TickButton compact shot="notification-tick" label={`Resolve notice: ${r.text}`} onClick={() => resolve(r.notification.id)}>
                            Resolve
                          </TickButton>
                        ),
                      }
                    : {})}
                />
              </li>
            )
          })}
        </ul>
      )}
      <FormError message={error} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <TextAction size="sm" flush shot="admin-notifications-see-all" onClick={onSeeAll}>
          See all notifications
        </TextAction>
        {onShowResolved !== undefined && (
          <TextAction size="sm" flush shot="admin-notifications-rail-show-resolved" onClick={onShowResolved}>
            Show resolved
          </TextAction>
        )}
      </div>
    </>
  )
}
