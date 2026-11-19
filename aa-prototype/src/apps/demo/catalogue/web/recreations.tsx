/**
 * Faithful copies of Web components that are LOCAL to a screen file (not
 * exported), so the catalogue can show each on its own row. The markup and
 * styles are copied from the source named on each; the screens themselves are
 * untouched. Demo only.
 */

import type { ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'
import { accent, neutral, semantic } from '../../../../theme/tokens'
import { useDisplayStatus } from '../../../../shared'
import { isOpenSlotView, type SlotView } from '../../../../store'

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
