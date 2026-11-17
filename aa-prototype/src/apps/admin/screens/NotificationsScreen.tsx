import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { useMemo, useRef, type CSSProperties } from 'react'
import { activeNotificationCount, notificationPool, type Actor, type NotificationTarget } from '../../../store'
import { TableShell, Td, Th } from '../../../shared/table'
import { ActiveCount, NotificationText, usePoolState, useResolveWithTick } from '../components/NotificationsCard'
import { Button, Checkbox, FormError, PageHeader, TextAction, TickBadge, TickButton } from '../../../shared/ui'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'


/**
 * The shared notification pool, in full (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2, US-13.8.3): `/admin/notifications` (`?page=` keeps the
 * place, `?resolved=1` shows resolved notices too). Newest first,
 * `NOTIFICATION_POOL_RULE.pageSize` a page, with Newer and Older. Notices are
 * active or resolved (D58; catch-up Phase 32b): the heading carries the active
 * count, each active row the shared tick (`TickButton`, the To-do card's
 * Clear), and "Show resolved" (Claude's proposal, US-13.8.3) brings resolved
 * rows back, muted, with who resolved them and when. One admin's tick hides a
 * notice for every admin; nothing expires; there is no un-tick. Phase 35 adds
 * "Draft update email" to each row.
 */
export function NotificationsScreen({ actor, onOpen }: { actor: Actor; onOpen: (target: NotificationTarget) => void }) {
  const state = usePoolState()
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page') ?? '1')
  const page = Number.isFinite(requested) ? requested : 1
  const showResolved = params.get('resolved') === '1'
  const pool = useMemo(() => notificationPool(state, { page, showResolved }), [state, page, showResolved])
  const count = useMemo(() => activeNotificationCount(state), [state])
  const heading = useRef<HTMLHeadingElement>(null)
  // After a tick the row leaves; focus goes to the heading, not the page.
  const { resolving, resolve, error } = useResolveWithTick(actor, () => heading.current?.focus())
  const office = actor.role === 'office'

  function setQuery(next: { page?: number; resolved?: boolean }) {
    const p = next.page ?? page
    const r = next.resolved ?? showResolved
    setParams({ ...(p > 1 ? { page: String(p) } : {}), ...(r ? { resolved: '1' } : {}) }, { replace: true })
  }
  const go = (p: number) => setQuery({ page: p })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <PageHeader
        size="admin"
        title="Notifications"
        count={<ActiveCount count={count} shot="admin-notifications-page-count" />}
        headingRef={heading}
        subStyle={{ maxWidth: 760, lineHeight: '19px' }}
        sub="Lists anaesthetists have moved themselves, and their alerts to the office, newest first. A notice stays until someone resolves it; resolving it hides it for everyone in the office."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Checkbox labelShot="admin-notifications-show-resolved" checked={showResolved} onChange={(c) => setQuery({ page: 1, resolved: c })} style={{ display: 'inline-flex', gap: 6, fontSize: 13, color: neutral.slate }}>
          Show resolved
        </Checkbox>
        <FormError message={error} />
      </div>

      <TableShell shot="admin-notifications-table" label="Notifications" density="compact" minWidth={760}>
          <colgroup>
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: 170 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              {['When', 'What happened', 'By', '', ''].map((h, i) => (
                <Th key={i}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pool.rows.length === 0 && (
              <tr>
                <Td colSpan={5} style={{ color: neutral.slate }}>
                  {showResolved ? 'No notifications yet.' : 'Nothing waiting. When an anaesthetist moves a List or alerts the office, it shows here until someone resolves it.'}
                </Td>
              </tr>
            )}
            {pool.rows.map((r) => (
              <tr key={r.notification.id} data-notification-row={r.notification.id} data-notification-resolved={r.resolved ? 'true' : undefined} style={{ background: r.resolved ? neutral.bg : undefined, opacity: resolving.has(r.notification.id) ? 0.55 : 1, transition: 'opacity 200ms' }}>
                <Td mono nowrap style={{ color: r.resolved ? neutral.mist : neutral.slate }}>{format(parseISO(r.atISO), 'EEE d MMM HH:mm')}</Td>
                <Td>
                  <NotificationText row={r} />
                </Td>
                <Td style={r.resolved ? { color: neutral.slate } : undefined}>{r.by}</Td>
                <Td align="right">
                  {office && !r.resolved && (resolving.has(r.notification.id) ? (
                    <span style={{ display: 'inline-flex' }}><TickBadge size={30} animate /></span>
                  ) : (
                    <TickButton compact shot="notification-tick" label={`Resolve notice: ${r.text}`} onClick={() => resolve(r.notification.id)}>
                      Resolve
                    </TickButton>
                  ))}
                </Td>
                <Td align="right">
                  {r.target.kind !== 'gone' && (
                    <TextAction size="sm" flush onClick={() => onOpen(r.target)}>
                      {r.target.kind === 'draftList' ? `Open ${DRAFT_LIST}` : r.target.kind === 'booking' ? 'Open Booking' : 'Open List'}
                    </TextAction>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
      </TableShell>

      {pool.total > 0 && (
        <div data-shot="admin-notifications-pager" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" size="compact" disabled={pool.page <= 1} style={pagerStyle(pool.page <= 1)} onClick={() => go(pool.page - 1)}>Newer</Button>
          <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>
            Page {pool.page} of {pool.pageCount}
          </span>
          <Button variant="secondary" size="compact" disabled={pool.page >= pool.pageCount} style={pagerStyle(pool.page >= pool.pageCount)} onClick={() => go(pool.page + 1)}>Older</Button>
        </div>
      )}
    </div>
  )
}

/**
 * The pager keeps its pill shape, ink label and stronger border on the compact secondary
 * `Button` (U5); disabled takes the shared disabled treatment.
 */
function pagerStyle(disabled: boolean): CSSProperties {
  return disabled ? { borderRadius: radius.pill } : { borderRadius: radius.pill, border: `1px solid ${neutral.lineStrong}`, color: neutral.ink }
}
