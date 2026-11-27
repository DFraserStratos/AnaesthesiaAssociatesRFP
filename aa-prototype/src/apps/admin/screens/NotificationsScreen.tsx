import { useSearchParams } from 'react-router-dom'
import { useMemo, useRef, type CSSProperties } from 'react'
import { CalendarArrowUp, Forward, MessageCircleQuestion, Undo2, type LucideIcon } from 'lucide-react'
import { neutral, semantic, type as typeScale } from '../../../theme/tokens'
import { hhmm, plural } from '../../../shared/format'
import { activeNotificationCount, notificationPool, useAppStore, type Actor, type NotificationRow, type NotificationTarget, type PoolState } from '../../../store'
import { NOTIFICATION_POOL_RULE, notificationDetail, notificationHeadline } from '../../../domain/notifications'
import type { Notification } from '../../../domain/types'
import { ActiveCount, resolvedLine, usePoolState, useResolveWithTick } from '../components/NotificationsCard'
import { ToDoRow } from '../components/WarningsToDo'
import { Card, FormError, TextAction, TickBadge, TickButton } from '../../../shared/ui'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { AdminPage, PageBody } from '../components/AdminPage'
import { Pager } from '../components/Pager'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { NotificationEmailAction } from '../flows/UpdateEmailActions'
import { dayGroupLabel } from './lists/draftListsRows'

/**
 * The shared notification pool, in full (FT-13.8, US-13.8.1, US-13.8.2, US-13.8.3): `/admin/notifications`
 * (`?page=` keeps the place, `?resolved=1` shows resolved notices too). A quiet feed, newest first, under a
 * band for each day (docs/explorations/notifications-ideas.html, idea B with bare icons): each notice is a
 * Day rail To-do row (`ToDoRow`), its kind as a bare icon (amber only for a check request), a short
 * headline, the List or Booking on a line of its own, any message, and its actions as words (Open, Email).
 * The round tick on the right resolves it for every admin; nothing expires and there is no un-tick. The
 * rail shows what the office resolved today, and Show resolved brings resolved notices back into the feed,
 * muted, with who resolved them and when. `NOTIFICATION_POOL_RULE.pageSize` a page.
 */
export function NotificationsScreen({ actor, onOpen }: { actor: Actor; onOpen: (target: NotificationTarget) => void }) {
  const state = usePoolState()
  const todayISO = useAppStore((s) => s.clock.todayISO)
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page') ?? '1')
  const page = Number.isFinite(requested) ? requested : 1
  const showResolved = params.get('resolved') === '1'
  const pool = useMemo(() => notificationPool(state, { page, showResolved }), [state, page, showResolved])
  const count = useMemo(() => activeNotificationCount(state), [state])
  const days = useMemo(() => byDay(pool.rows), [pool.rows])
  const heading = useRef<HTMLHeadingElement>(null)
  // After a tick the row leaves; focus goes to the heading, not the page.
  const { resolving, resolve, error } = useResolveWithTick(actor, () => heading.current?.focus())
  const office = actor.role === 'office'

  function setQuery(next: { page?: number; resolved?: boolean }) {
    const p = next.page ?? page
    const r = next.resolved ?? showResolved
    setParams({ ...(p > 1 ? { page: String(p) } : {}), ...(r ? { resolved: '1' } : {}) }, { replace: true })
  }

  return (
    <AdminPage
      mode="fit"
      title="Notifications"
      count={<ActiveCount count={count} shot="admin-notifications-page-count" />}
      headingRef={heading}
      sub="What anaesthetists have moved or asked the office to check. Resolving one clears it for everyone."
    >
      <PageBody
        railLabel="Resolved notices"
        rail={<ResolvedToday state={state} todayISO={todayISO} showResolved={showResolved} onToggle={() => setQuery({ page: 1, resolved: !showResolved })} />}
      >
        <FormError message={error} />
        <Card flush elevation="e1" shot="admin-notifications-table" aria-label="Notifications" style={{ flex: 1, minHeight: 0, gap: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {pool.rows.length === 0 && (
              <EmptyState style={{ padding: 16 }}>
                {showResolved ? 'No notifications yet.' : 'Nothing waiting. When an anaesthetist moves a List or a Booking, or asks the office to check one, it shows here until someone resolves it.'}
              </EmptyState>
            )}
            {days.map((day) => (
              <section key={day.dateISO} aria-label={dayGroupLabel(day.dateISO, todayISO)}>
                <div style={BAND}>
                  {dayGroupLabel(day.dateISO, todayISO)}
                  <span style={{ color: neutral.mist, marginLeft: 8 }}>{plural(day.rows.length, 'notice')}</span>
                </div>
                <ul className="aa-row-list" style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: `1px solid ${neutral.line}` }}>
                  {day.rows.map((r) => (
                    <FeedRow
                      key={r.notification.id}
                      row={r}
                      state={state}
                      actor={actor}
                      office={office}
                      ticking={resolving.has(r.notification.id)}
                      onResolve={() => resolve(r.notification.id)}
                      onOpen={onOpen}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {pool.pageCount > 1 && (
            <div style={{ flex: 'none', borderTop: `1px solid ${neutral.line}`, padding: '4px 12px' }}>
              <Pager shot="admin-notifications-pager" total={pool.total} size={NOTIFICATION_POOL_RULE.pageSize} page={pool.page} onPage={(p) => setQuery({ page: p })} />
            </div>
          )}
        </Card>
      </PageBody>
    </AdminPage>
  )
}

/** The day band over each day's notices, as the Draft Lists and Intake tables' group rows read. */
const BAND: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: neutral.bg,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: neutral.ink,
  borderBottom: `1px solid ${neutral.line}`,
}

const TITLE: CSSProperties = { fontSize: typeScale.label.size, lineHeight: '18px', fontWeight: 600 }
const SMALL: CSSProperties = { fontSize: typeScale.small.size, lineHeight: '18px', color: neutral.slate }

/** Each kind's bare icon: a check request reads amber, a move slate. */
function kindIcon(n: Notification): LucideIcon {
  if (n.kind === 'officeAlert') return MessageCircleQuestion
  if (n.kind === 'bookingMoved') return CalendarArrowUp
  return n.route === 'office' ? Undo2 : Forward
}

function openLabel(target: NotificationTarget): string {
  return target.kind === 'draftList' ? `Open ${DRAFT_LIST}` : target.kind === 'booking' ? 'Open Booking' : 'Open List'
}

function FeedRow({
  row,
  state,
  actor,
  office,
  ticking,
  onResolve,
  onOpen,
}: {
  row: NotificationRow
  state: PoolState
  actor: Actor
  office: boolean
  ticking: boolean
  onResolve: () => void
  onOpen: (target: NotificationTarget) => void
}) {
  const n = row.notification
  const alert = n.kind === 'officeAlert'
  const message = n.message?.trim()
  const resolved = resolvedLine(row)
  return (
    <ToDoRow
      icon={kindIcon(n)}
      iconColor={row.resolved ? neutral.mist : alert ? semantic.warning.solid : neutral.slate}
      shot={undefined}
      data-notification-row={n.id}
      {...(row.resolved ? { 'data-notification-resolved': 'true' } : {})}
      style={{ opacity: ticking ? 0.55 : 1, transition: 'opacity 200ms' }}
      action={
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
          <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>{hhmm(row.atISO)}</span>
          {office && !row.resolved && (ticking ? (
            <TickBadge size={28} animate />
          ) : (
            <TickButton iconOnly shot="notification-tick" label={`Resolve notice: ${row.text}`} onClick={onResolve}>
              Resolve
            </TickButton>
          ))}
        </span>
      }
    >
      <span style={{ ...TITLE, color: row.resolved ? neutral.slate : neutral.ink }}>{notificationHeadline(n, state.masters)}</span>
      <span style={SMALL}>{notificationDetail(n, state.masters)}</span>
      {message !== undefined && message !== '' && (
        <span {...(alert ? { 'data-shot': 'notification-alert-note' } : {})} style={{ ...SMALL, maxWidth: '72ch', marginTop: 2 }}>
          {alert ? 'Note: ' : ''}"{message}"
        </span>
      )}
      {resolved !== null && (
        <span data-shot="notification-resolved-line" style={{ fontSize: typeScale.captionSm.size, color: neutral.mist }}>{resolved}</span>
      )}
      {(row.target.kind !== 'gone' || office) && (
        <span style={{ display: 'flex', gap: 16, marginTop: 2 }}>
          {row.target.kind !== 'gone' && (
            <TextAction size="sm" flush onClick={() => onOpen(row.target)}>
              {openLabel(row.target)}
            </TextAction>
          )}
          {/* The update email a move offers (OQ-65). Drafting changes nothing here. */}
          {office && <NotificationEmailAction notification={n} actor={actor} />}
        </span>
      )}
    </ToDoRow>
  )
}

/** The page's notices by the day they were posted, in the page's (newest first) order. */
function byDay(rows: readonly NotificationRow[]): { dateISO: string; rows: NotificationRow[] }[] {
  const out: { dateISO: string; rows: NotificationRow[] }[] = []
  for (const r of rows) {
    const dateISO = r.atISO.slice(0, 10)
    const last = out[out.length - 1]
    if (last !== undefined && last.dateISO === dateISO) last.rows.push(r)
    else out.push({ dateISO, rows: [r] })
  }
  return out
}

/**
 * The rail: what the office resolved today, newest first, with who and when (US-13.8.3 "Kept"), and Show
 * resolved, which brings resolved notices back into the feed.
 */
function ResolvedToday({ state, todayISO, showResolved, onToggle }: { state: PoolState; todayISO: string; showResolved: boolean; onToggle: () => void }) {
  const today = useMemo(
    () =>
      Object.values(state.notifications)
        .filter((n) => n.resolvedAt !== undefined && n.resolvedAt.slice(0, 10) === todayISO)
        .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? '')),
    [state.notifications, todayISO],
  )
  return (
    <Card
      title="Resolved today"
      shot="admin-notifications-resolved-today"
      action={
        <TextAction size="sm" flush shot="admin-notifications-show-resolved" ariaExpanded={showResolved} onClick={onToggle}>
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </TextAction>
      }
    >
      {today.length === 0 && <EmptyState>Nothing resolved yet today.</EmptyState>}
      {today.length > 0 && (
        <ul className="aa-row-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {today.map((n) => (
            <li key={n.id} style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: typeScale.small.size, lineHeight: '18px', color: neutral.ink }}>
                {notificationHeadline(n, state.masters)}
              </span>
              <span style={{ fontSize: typeScale.captionSm.size, color: neutral.mist }}>
                {notificationDetail(n, state.masters)}
              </span>
              <span style={{ fontSize: typeScale.captionSm.size, color: neutral.slate }}>
                {n.resolvedBy ?? 'The office'}, {hhmm(n.resolvedAt!)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
