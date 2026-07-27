import { useMemo } from 'react'
import { neutral } from '../../theme/tokens'
import { useAppStore } from '../../store'
import { sortAuditNewestFirst } from '../audit'
import { useSurface } from '../surface'
import { HistoryTimeline } from './HistoryTimeline'

interface HistorySheetProps {
  open: boolean
  /**
   * The entity ids whose audit trails to merge. A single id (a List or master
   * row) shows just that entity; a Card passes its own id PLUS its Procedure and
   * BillingLine ids so the card's full story — the BTM overrides and
   * billing-setup edits that the review FLAGS point at, audited as
   * `procedure`/`billingLine` entities — appears, not only card-level actions.
   */
  entityIds: readonly string[]
  /**
   * Optional `entityId` -> scope label, so a multi-procedure Card's rows say
   * which procedure they belong to. Omit on a single-entity history.
   */
  entityLabels?: Record<string, string>
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
/**
 * What the empty state calls the thing being read, taken from the heading the
 * reader is already looking at ("Card history" -> "card", "List history" ->
 * "list"), so the two can never disagree. Falls back to "record".
 */
function subjectFrom(title: string): string {
  const word = title.toLowerCase().replace(/\s*history\s*$/, '')
  return word === '' || word.includes(' ') ? 'record' : word
}

export function HistorySheet({ open, entityIds, entityLabels, title, onClose }: HistorySheetProps) {
  const { Overlay } = useSurface()
  const audit = useAppStore((s) => s.audit)
  const idSet = entityIds.join('|')
  const entries = useMemo(() => {
    const ids = new Set(idSet.split('|'))
    // Newest first, through the shared sort, so this surface and the admin Audit
    // viewer can never disagree on direction again (review finding 01.3). The
    // top row is therefore the record's LAST change, which is what
    // `lastModifiedBy` / `lastModifiedAt` were stamping but never showing
    // (finding 02.3).
    return sortAuditNewestFirst(audit.filter((a) => ids.has(a.entityId)))
  }, [audit, idSet])

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Every change to this record, most recent first.</div>
        <HistoryTimeline
          entries={entries}
          subject={subjectFrom(title)}
          {...(entityLabels !== undefined ? { entityLabels } : {})}
        />
      </div>
    </Overlay>
  )
}
