import { useMemo } from 'react'
import { neutral } from '../../theme/tokens'
import { useAppStore } from '../../store'
import { useSurface } from '../surface'
import { HistoryTimeline } from './HistoryTimeline'

interface HistorySheetProps {
  open: boolean
  /**
   * The entity ids whose audit trails to merge, oldest first. A single id (a
   * List or master row) shows just that entity; a Card passes its own id PLUS
   * its Procedure and BillingLine ids so the card's full story — the BTM
   * overrides and billing-setup edits that the review FLAGS point at, audited as
   * `procedure`/`billingLine` entities — appears, not only card-level actions.
   */
  entityIds: readonly string[]
  title: string
  onClose: () => void
}

/**
 * The shared History affordance (Phase 07): opens through `useSurface().Overlay`
 * (a mobile bottom sheet or a web/admin dialog) and renders the merged
 * append-only audit trail via `HistoryTimeline` (same predicate as
 * `auditForEntity`, across the given ids). Wired into `CardDetailBody` (mobile /
 * web / admin), the admin review row and the admin List drawer. An anaesthetist
 * seeing their own card's full history (incl. office / integration actions) is
 * fine per A8 (their own data).
 */
export function HistorySheet({ open, entityIds, title, onClose }: HistorySheetProps) {
  const { Overlay } = useSurface()
  const audit = useAppStore((s) => s.audit)
  const idSet = entityIds.join('|')
  const entries = useMemo(() => {
    const ids = new Set(idSet.split('|'))
    return audit.filter((a) => ids.has(a.entityId))
  }, [audit, idSet])

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Every recorded action on this record, with the acting role and source (A7).</div>
        <HistoryTimeline entries={entries} />
      </div>
    </Overlay>
  )
}
