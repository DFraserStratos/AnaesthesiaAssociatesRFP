import { isOverdue, supportStampText } from '../../domain/support'
import type { SupportTicket } from '../../domain/types'
import { EmptyState, Eyebrow, Pill, type PillTone } from '../ui'
import { fontFamily, neutral } from '../../theme/tokens'
import { easing, motion } from '../../theme/motion'
import { AWAITING_APPROVAL, BEST_EFFORT, CALL_OUT_APPROVED, KIND_LABEL, noTimeLine, OVERDUE, STATUS_LABEL } from './supportCopy'

const STATUS_TONE: Readonly<Record<SupportTicket['status'], PillTone>> = { logged: 'warning', responded: 'success', closed: 'neutral' }

/**
 * The requester's tickets, or every ticket for the office (catch-up Phase
 * 43b), newest first: id and subject, the status pill, the respond-by in
 * mono (or why there is none), a derived "Response overdue" pill, and the
 * cover pills where the ticket was raised outside plain business hours.
 */
export function TicketList({
  tickets,
  clockISO,
  showRequester,
  title,
  newestId,
}: {
  tickets: readonly SupportTicket[]
  clockISO: string
  /** The office sees who raised each request. */
  showRequester: boolean
  title: string
  /** The ticket just sent, marked for a moment. */
  newestId?: string
}) {
  return (
    <section data-shot="support-ticket-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Eyebrow as="h3">{title}</Eyebrow>
      {tickets.length === 0 ? (
        <EmptyState>No requests yet. Raise one above and it shows here.</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} clockISO={clockISO} showRequester={showRequester} fresh={t.id === newestId} />
          ))}
        </ul>
      )}
    </section>
  )
}

function TicketRow({ ticket: t, clockISO, showRequester, fresh }: { ticket: SupportTicket; clockISO: string; showRequester: boolean; fresh: boolean }) {
  const overdue = isOverdue(t, clockISO)
  const note = noTimeLine(t)
  const coverPill =
    t.callOut === 'awaitingApproval' ? AWAITING_APPROVAL
    : t.callOut === 'approved' ? CALL_OUT_APPROVED
    : t.channel === 'productSupport' && (t.cover === 'afterHours' || t.cover === 'christmas') ? BEST_EFFORT
    : null
  return (
    <li
      data-ticket-id={t.id}
      data-status={t.status}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 0',
        borderTop: `1px solid ${neutral.line}`,
        animation: fresh ? `aa-fade-in ${motion.cardAdvance.in}ms ${easing.card}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: fontFamily.mono, fontSize: 12, color: neutral.mist, flex: 'none' }}>{t.id}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{t.subject}</span>
        <Pill tone={STATUS_TONE[t.status]} data-ticket-status={t.status}>{STATUS_LABEL[t.status]}</Pill>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 12, color: neutral.slate }}>
        <span>
          {t.priority}
          {t.kind !== 'request' ? ` · ${KIND_LABEL[t.kind]}` : ''}
          {showRequester ? ` · ${t.raisedBy.who}` : ''}
        </span>
        {t.respondByISO !== undefined && t.status === 'logged' && (
          <span>
            Respond by <span style={{ fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', color: neutral.ink }}>{supportStampText(t.respondByISO)}</span>
          </span>
        )}
        {note !== null && t.status === 'logged' && <span>{note}</span>}
        {overdue && <Pill tone="error" size="sm" data-ticket-overdue="true">{OVERDUE}</Pill>}
        {coverPill !== null && <Pill tone={t.callOut === 'approved' ? 'success' : 'warning'} size="sm" data-ticket-cover={t.callOut ?? t.cover}>{coverPill}</Pill>}
      </div>
    </li>
  )
}
