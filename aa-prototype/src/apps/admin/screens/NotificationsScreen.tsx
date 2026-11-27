import { useSearchParams } from 'react-router-dom'
import { neutral } from '../../../theme/tokens'
import { stampText } from '../../../shared/format'
import { useMemo, useRef } from 'react'
import { activeNotificationCount, notificationPool, type Actor, type NotificationTarget } from '../../../store'
import { NOTIFICATION_POOL_RULE } from '../../../domain/notifications'
import { TableShell, Td, Th } from '../../../shared/table'
import { ActiveCount, NotificationText, usePoolState, useResolveWithTick } from '../components/NotificationsCard'
import { Checkbox, FormError, TextAction, TickBadge, TickButton } from '../../../shared/ui'
import { AdminPage, PageBody, PageToolbar } from '../components/AdminPage'
import { Pager } from '../components/Pager'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { NotificationEmailAction } from '../flows/UpdateEmailActions'


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
 * the update email a move offers (`NotificationEmailAction`).
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
    <AdminPage
      mode="fit"
      title="Notifications"
      count={<ActiveCount count={count} shot="admin-notifications-page-count" />}
      headingRef={heading}
      sub="What anaesthetists have moved or asked the office to check. Resolving one clears it for everyone."
    >
      <PageToolbar>
        <Checkbox labelShot="admin-notifications-show-resolved" checked={showResolved} onChange={(c) => setQuery({ page: 1, resolved: c })} style={{ display: 'inline-flex', gap: 6, fontSize: 13, color: neutral.slate }}>
          Show resolved
        </Checkbox>
        <FormError message={error} />
      </PageToolbar>

      <PageBody>
      <TableShell
        fit
        shot="admin-notifications-table"
        label="Notifications"
        density="compact"
        minWidth={760}
        {...(pool.pageCount > 1 ? { footer: <Pager shot="admin-notifications-pager" total={pool.total} size={NOTIFICATION_POOL_RULE.pageSize} page={pool.page} onPage={go} /> } : {})}
      >
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
                <Td mono nowrap style={{ color: r.resolved ? neutral.mist : neutral.slate }}>{stampText(r.atISO)}</Td>
                <Td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <NotificationText row={r} />
                    {/* The update email a move offers (catch-up Phase 35; OQ-65). Drafting changes nothing here. */}
                    {office && <NotificationEmailAction notification={r.notification} target={r.target} actor={actor} onOpen={onOpen} />}
                  </div>
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
      </PageBody>
    </AdminPage>
  )
}
