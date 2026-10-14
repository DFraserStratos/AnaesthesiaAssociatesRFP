import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { useMemo } from 'react'
import { notificationPool, type NotificationTarget } from '../../../store'
import { cellStyle as cellFactory, headCellStyle as headFactory, textActionStyle } from '../tableChrome'
import { NotificationText, usePoolState } from '../components/NotificationsCard'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'

const cellStyle = cellFactory()
const headCellStyle = headFactory()

/**
 * The shared notification pool, in full (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2): `/admin/notifications` (`?page=` keeps the place).
 * Newest first, `NOTIFICATION_POOL_RULE.pageSize` a page, with Newer and Older.
 * The same for every admin: there is no read, actioned or per-user state, and
 * no Clear or Done (a notification needs no action; it is not the to-do list
 * and not the Audit screen). Phase 35 adds "Draft update email" to each row.
 */
export function NotificationsScreen({ onOpen }: { onOpen: (target: NotificationTarget) => void }) {
  const state = usePoolState()
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page') ?? '1')
  const page = Number.isFinite(requested) ? requested : 1
  const pool = useMemo(() => notificationPool(state, { page }), [state, page])

  function go(page: number) {
    setParams(page <= 1 ? {} : { page: String(page) }, { replace: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Notifications</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>
          Lists anaesthetists have moved themselves, newest first. Everyone in the office sees the same notifications.
        </div>
        {/* OQ-79, open: the pool's one provisional caption (NOTIFICATION_POOL_RULE). */}
        <div data-shot="admin-notifications-provisional" style={{ fontSize: 12, color: neutral.mist, marginTop: 6 }}>
          What else shows here, and for how long, is still being confirmed with AA.
        </div>
      </div>

      <div data-shot="admin-notifications-table" style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <colgroup>
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: 190 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              {['When', 'What happened', 'By', ''].map((h, i) => (
                <th key={i} style={headCellStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pool.rows.length === 0 && (
              <tr>
                <td style={{ ...cellStyle, color: neutral.slate }} colSpan={4}>
                  No notifications yet. When an anaesthetist moves a List, it shows here.
                </td>
              </tr>
            )}
            {pool.rows.map((r) => (
              <tr key={r.notification.id} data-notification-row={r.notification.id}>
                <td className="mono" style={{ ...cellStyle, whiteSpace: 'nowrap', color: neutral.slate }}>{format(parseISO(r.atISO), 'EEE d MMM HH:mm')}</td>
                <td style={cellStyle}>
                  <NotificationText row={r} />
                </td>
                <td style={cellStyle}>{r.by}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {r.target.kind !== 'gone' && (
                    <button type="button" onClick={() => onOpen(r.target)} style={textActionStyle}>
                      {r.target.kind === 'draftList' ? `Open ${DRAFT_LIST}` : 'Open List'}
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
