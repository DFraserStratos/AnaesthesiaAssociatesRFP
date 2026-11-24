import { useEffect, useId, useState, type ReactNode } from 'react'
import { useUpcomingPrepayments } from '../../../store'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { Card, DisclosureButton } from '../../../shared/ui'
import { plural } from '../../../shared/format'
import { ReconciliationDetail, useReconciliationStatus } from './ReconciliationCard'
import { PrepaymentRows } from './PrepaymentsRailCard'

type Reading = 'books' | 'prepayments'

/**
 * The Admin Day rail's two readings under the calendar: whether the books are square (US-13.2.4)
 * and the upcoming pre-payments (US-06.3.2), as two tiles. A tile opens its detail under the pair,
 * one at a time. Out of balance, the books detail opens by itself, so each failing check and its
 * difference is in view. With no pre-payments to come, that tile is left out.
 */
export function RailReadings({
  onOpenBooking,
  onOpenInvoices,
}: {
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenInvoices?: () => void
}) {
  const status = useReconciliationStatus()
  const rows = useUpcomingPrepayments()
  const square = status.status === 'square'
  const [open, setOpen] = useState<Reading | null>(square ? null : 'books')
  const detailId = useId()
  useEffect(() => {
    if (!square) setOpen('books')
  }, [square])

  const toApprove = rows.filter((r) => r.status === 'awaitingApproval').length
  const unpaid = rows.filter((r) => r.status === 'unpaid' || r.status === 'partPaid').length
  const prepaymentLine = [toApprove > 0 ? `${toApprove} to approve` : null, unpaid > 0 ? `${unpaid} unpaid` : null].filter((x) => x !== null).join(' · ')
  const toggle = (r: Reading) => setOpen((cur) => (cur === r ? null : r))

  return (
    <div data-shot="rail-readings" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: rows.length > 0 ? '1fr 1fr' : '1fr', gap: 10 }}>
        <Tile
          shot="dashboard-reconciliation"
          data-status={status.status}
          open={open === 'books'}
          onToggle={() => toggle('books')}
          controls={detailId}
          tone={square ? 'success' : 'warning'}
          title={square ? 'Books square' : 'Out of balance'}
          line={square ? 'All checks agree' : `${plural(status.items.length, 'item')} to resolve`}
        />
        {rows.length > 0 && (
          <Tile
            shot="rail-prepayments"
            open={open === 'prepayments'}
            onToggle={() => toggle('prepayments')}
            controls={detailId}
            tone="neutral"
            title={plural(rows.length, 'pre-payment')}
            line={prepaymentLine === '' ? 'All received' : prepaymentLine}
            lineTone={unpaid > 0 ? 'warning' : 'neutral'}
          />
        )}
      </div>
      {open !== null && (
        <Card shot={open === 'books' ? 'rail-reconciliation-detail' : 'rail-prepayments-detail'} data-status={open === 'books' ? status.status : undefined}>
          <div id={detailId} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {open === 'books' ? (
              <ReconciliationDetail status={status} />
            ) : (
              <PrepaymentRows rows={rows} onOpenBooking={onOpenBooking} {...(onOpenInvoices !== undefined ? { onOpenInvoices } : {})} />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

const TILE_TONES = {
  success: { background: semantic.success.tint, color: semantic.success.onTint, border: 'transparent' },
  warning: { background: semantic.warning.tint, color: semantic.warning.onTint, border: 'transparent' },
  neutral: { background: neutral.surface, color: neutral.ink, border: neutral.line },
} as const

/** One reading: a whole-tile toggle (the shared DisclosureButton) with its answer and one line under it. */
function Tile({
  open,
  onToggle,
  controls,
  tone,
  title,
  line,
  lineTone = 'neutral',
  shot,
  ...data
}: {
  open: boolean
  onToggle: () => void
  controls: string
  tone: keyof typeof TILE_TONES
  title: ReactNode
  line: ReactNode
  lineTone?: 'neutral' | 'warning'
  shot: string
} & { [key: `data-${string}`]: string | undefined }) {
  const t = TILE_TONES[tone]
  return (
    <DisclosureButton
      open={open}
      onToggle={onToggle}
      controls={controls}
      size={14}
      chevronTone="inherit"
      shot={shot}
      {...data}
      style={{
        width: '100%',
        alignItems: 'flex-start',
        gap: 6,
        padding: '12px 14px',
        borderRadius: radius.ctl,
        background: t.background,
        color: t.color,
        boxShadow: `inset 0 0 0 1px ${t.border}`,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, marginTop: -2 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 11.5, fontWeight: lineTone === 'warning' ? 600 : 400, color: lineTone === 'warning' ? semantic.warning.onTint : tone === 'neutral' ? neutral.slate : t.color }}>{line}</span>
      </span>
    </DisclosureButton>
  )
}
