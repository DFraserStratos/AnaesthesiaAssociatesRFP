/**
 * Faithful copies of Web components that are LOCAL to a screen file (not
 * exported), so the catalogue can show each on its own row. The markup and
 * styles are copied from the source named on each; the screens themselves are
 * untouched. Demo only.
 */

import type { ReactNode } from 'react'
import { Check, Lock, Plus } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { STATUS_PALETTE } from '../../../../theme/statusColours'
import { useDisplayStatus } from '../../../../shared'
import { isOpenSlotView, type SlotView } from '../../../../store'
import type { AgingBucketKey } from '../../../../domain/seed'
import { formatCurrency } from '../../../../shared/format'

/** Recreated: local `StatTile` in apps/web/screens/DashboardScreen.tsx. */
export function StatTile({ label, value, pill }: { label: string; value: string; pill?: string }) {
  return (
    <div style={{ background: neutral.bg, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
        {pill !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '2px 7px' }}>{pill}</span>
        )}
      </div>
    </div>
  )
}

/** Recreated: local `SubTabButton` in apps/web/screens/AccountsScreen.tsx. */
export function SubTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        background: 'none',
        padding: '10px 14px',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? neutral.ink : neutral.slate,
        boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/** Recreated: the day stepper's date pill and Today button in apps/web/screens/AvailabilityGrid.tsx. */
export function DayPill({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: 38, padding: '0 18px', borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>{children}</div>
  )
}
/** Recreated: local `SubmitAction` in apps/web/screens/ListDetailView.tsx. */
export function SubmitAction({
  state,
  authorisedLabel,
  incomplete,
  onBlockers,
  onConfirm,
}: {
  state: string
  authorisedLabel: string
  incomplete: number
  onBlockers: () => void
  onConfirm: () => void
}) {
  const shared = {
    height: 42,
    padding: '0 20px',
    borderRadius: 12,
    border: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as const

  if (state === 'AUTHORISED') {
    return (
      <span style={{ ...shared, background: neutral.sunken, color: neutral.slate }}>
        <Lock size={15} strokeWidth={2.4} aria-hidden /> {authorisedLabel} · read only
      </span>
    )
  }
  if (state !== 'ACTIVE') {
    return (
      <span style={{ ...shared, background: semantic.success.tint, color: semantic.success.onTint }}>
        <Check size={16} strokeWidth={3} aria-hidden /> Submitted to office
      </span>
    )
  }
  if (incomplete > 0) {
    return (
      <button
        type="button"
        onClick={onBlockers}
        title="See what is left to finish"
        style={{ ...shared, background: neutral.surface, color: neutral.slate, border: `1px solid ${neutral.lineStrong}`, cursor: 'pointer' }}
      >
        {incomplete} to finish before submitting
      </button>
    )
  }
  return (
    <button type="button" onClick={onConfirm} style={{ ...shared, background: accent.base, color: neutral.surface, cursor: 'pointer' }}>
      Mark list completed
    </button>
  )
}

/** Recreated: the dashed "Add a booking" button in apps/web/screens/ListDetailView.tsx. */
export function AddBookingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', background: neutral.surface, border: `1.5px dashed ${neutral.lineStrong}`, borderRadius: radius.ctl, fontFamily: 'inherit', color: accent.base, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
    >
      <Plus size={17} strokeWidth={2.4} aria-hidden /> Add a booking
    </button>
  )
}

/** Recreated: the receivables aging bars in apps/web/screens/DashboardScreen.tsx. */
export const AGING_ROWS: { key: AgingBucketKey; label: string; color: string; opacity: number }[] = [
  { key: 'current', label: 'Current', color: accent.base, opacity: 1 },
  { key: 'd31_60', label: '31 to 60 d', color: accent.base, opacity: 0.55 },
  { key: 'd61_90', label: '61 to 90 d', color: STATUS_PALETTE.preop.solid, opacity: 1 },
  { key: 'd90plus', label: '90 d +', color: semantic.error.solid, opacity: 1 },
]

export function AgingBars({ aging }: { aging: Record<AgingBucketKey, number> & { total: number } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {AGING_ROWS.map((r) => {
        const amount = aging[r.key]
        const pct = aging.total > 0 ? Math.round((amount / aging.total) * 100) : 0
        return (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 72, fontSize: 12, fontWeight: 600, color: neutral.slate }}>{r.label}</span>
            <span style={{ flex: 1, height: 14, borderRadius: 99, background: neutral.sunken, overflow: 'hidden', display: 'block' }}>
              <span style={{ display: 'block', height: '100%', borderRadius: 99, background: r.color, opacity: r.opacity, width: `${pct}%` }} />
            </span>
            <span className="mono" style={{ width: 72, textAlign: 'right', fontSize: 12 }}>{formatCurrency(amount)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Recreated: the "Who's free" name chip in apps/web/screens/DashboardScreen.tsx (a button when her List can move there, else a span; both carry `title`). */
export function WhosFreeChip({ name, title, onClick, tint, onTint }: { name: string; title: string; onClick?: () => void; tint: string; onTint: string }) {
  const chip = { padding: '5px 11px', borderRadius: 999, border: 'none', background: tint, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: onTint } as const
  return onClick !== undefined ? (
    <button type="button" onClick={onClick} title={title} style={{ ...chip, cursor: 'pointer' }}>
      {name}
    </button>
  ) : (
    <span title={title} style={chip}>
      {name}
    </span>
  )
}

/** Recreated: local `Cell` in apps/web/screens/AvailabilityGrid.tsx. */
export function AvailabilityCell({ view, labels, onClick, action, title, quietEmpty = false }: { view: SlotView | undefined; labels: { l1: string; l2: string }; onClick?: () => void; action?: string; title?: string; quietEmpty?: boolean }) {
  const resolved = useDisplayStatus(view?.displayKey ?? '')
  if (view === undefined) {
    if (quietEmpty) return <div aria-hidden style={{ height: 52, borderRadius: 9, border: `1px dashed ${neutral.line}` }} />
    return <div style={{ height: 52, borderRadius: 9, background: neutral.sunken, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: neutral.mist }}>No session</div>
  }
  const c = resolved.visual
  const isFree = isOpenSlotView(view)
  const bg = c.blockBackground
  const tc = c.onTint
  const border = isFree ? (c.border ?? '1.5px solid transparent') : '1.5px solid transparent'
  return (
    <button
      type="button"
      onClick={onClick}
      data-slot-id={view.slot.id}
      title={title}
      disabled={onClick === undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 52, borderRadius: 9, padding: '0 10px', textAlign: 'left', fontFamily: 'inherit', cursor: onClick !== undefined ? 'pointer' : 'default', background: bg, border, width: '100%' }}
    >
      {!isFree && <span aria-hidden style={{ width: 4, height: 34, borderRadius: 99, background: c.solid, flex: 'none' }} />}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: tc, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{labels.l1}</span>
        <span style={{ fontSize: 11, color: tc, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{labels.l2}</span>
      </span>
      {action !== undefined && <span style={{ fontSize: 12, fontWeight: 600, color: tc, flex: 'none' }}>{action}</span>}
    </button>
  )
}
