import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { useMemo, useRef } from 'react'
import { activeNotificationCount, notificationPool, type Actor, type NotificationTarget } from '../../../store'
import { cellStyle as cellFactory, headCellStyle as headFactory, textActionStyle } from '../tableChrome'
import { ActiveCount, NotificationText, usePoolState, useResolveWithTick } from '../components/NotificationsCard'
import { FormError, TickBadge, TickButton } from '../../../shared/ui'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'

const cellStyle = cellFactory()
const headCellStyle = headFactory()

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
      <div>
        <h1 ref={heading} tabIndex={-1} style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10, outline: 'none' }}>
          Notifications
          <ActiveCount count={count} shot="admin-notifications-page-count" />
        </h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 760, lineHeight: '19px' }}>
          Lists anaesthetists have moved themselves, and their alerts to the office, newest first. A notice stays until someone resolves it; resolving it hides it for everyone in the office.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label data-shot="admin-notifications-show-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: neutral.slate, cursor: 'pointer' }}>
          <input type="checkbox" checked={showResolved} onChange={(e) => setQuery({ page: 1, resolved: e.target.checked })} />
          Show resolved
        </label>
        <FormError message={error} />
      </div>

      <div data-shot="admin-notifications-table" style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
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
                <th key={i} style={headCellStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pool.rows.length === 0 && (
              <tr>
                <td style={{ ...cellStyle, color: neutral.slate }} colSpan={5}>
                  {showResolved ? 'No notifications yet.' : 'Nothing waiting. When an anaesthetist moves a List or alerts the office, it shows here until someone resolves it.'}
                </td>
              </tr>
            )}
            {pool.rows.map((r) => (
              <tr key={r.notification.id} data-notification-row={r.notification.id} data-notification-resolved={r.resolved ? 'true' : undefined} style={{ background: r.resolved ? neutral.bg : undefined, opacity: resolving.has(r.notification.id) ? 0.55 : 1, transition: 'opacity 200ms' }}>
                <td className="mono" style={{ ...cellStyle, whiteSpace: 'nowrap', color: r.resolved ? neutral.mist : neutral.slate }}>{format(parseISO(r.atISO), 'EEE d MMM HH:mm')}</td>
                <td style={cellStyle}>
                  <NotificationText row={r} />
                </td>
                <td style={{ ...cellStyle, color: r.resolved ? neutral.slate : undefined }}>{r.by}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {office && !r.resolved && (resolving.has(r.notification.id) ? (
                    <span style={{ display: 'inline-flex' }}><TickBadge size={30} animate /></span>
                  ) : (
                    <TickButton compact shot="notification-tick" label={`Resolve notice: ${r.text}`} onClick={() => resolve(r.notification.id)}>
                      Resolve
                    </TickButton>
                  ))}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {r.target.kind !== 'gone' && (
                    <button type="button" onClick={() => onOpen(r.target)} style={textActionStyle}>
                      {r.target.kind === 'draftList' ? `Open ${DRAFT_LIST}` : r.target.kind === 'booking' ? 'Open Booking' : 'Open List'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pool.total > 0 && (
        <div data-shot="admin-notifications-pager" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PagerButton disabled={pool.page <= 1} onClick={() => go(pool.page - 1)}>Newer</PagerButton>
          <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>
            Page {pool.page} of {pool.pageCount}
          </span>
          <PagerButton disabled={pool.page >= pool.pageCount} onClick={() => go(pool.page + 1)}>Older</PagerButton>
        </div>
      )}
    </div>
  )
}

function PagerButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ minHeight: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: disabled ? neutral.mist : neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}
