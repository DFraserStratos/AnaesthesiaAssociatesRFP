import { useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { useAppStore } from '../../store'
import { sortAuditNewestFirst } from '../audit'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { HistoryTimeline } from './HistoryTimeline'
import { BookingAsAtPanel } from './BookingAsAtPanel'

interface HistorySheetProps {
  open: boolean
  /**
   * The entity ids whose audit trails to merge. A single id (a List or master
   * row) shows just that entity; a Booking passes its own id PLUS its Procedure and
   * BillingLine ids so the booking's full story — the BTM overrides and
   * billing-setup edits that the review FLAGS point at, audited as
   * `procedure`/`billingLine` entities — appears, not only booking-level actions.
   */
  entityIds: readonly string[]
  /**
   * Optional `entityId` -> scope label, so a multi-procedure Booking's rows say
   * which procedure they belong to. Omit on a single-entity history.
   */
  entityLabels?: Record<string, string>
  title: string
  onClose: () => void
  /**
   * A Booking's history also shows its List's changes of anaesthetist
   * (catch-up Phase 35; US-01.4.1): the List's `listReassign` change sets.
   */
  coverListId?: string
  /** Admin only (catch-up Phase 35): each row offers View as at for this Booking. */
  asAtBookingId?: string
}

/**
 * The shared History affordance (Phase 07): opens through `useSurface().Overlay`
 * (a mobile bottom sheet or a web/admin dialog) and renders the merged
 * append-only audit trail via `HistoryTimeline` (same predicate as
 * `auditForEntity`, across the given ids). Wired into `BookingDetailBody` (mobile /
 * web / admin), the admin review row and the admin List drawer. An anaesthetist
 * seeing their own booking's full history (incl. office / integration actions) is
 * fine per A8 (their own data).
 */
/**
 * What the empty state calls the thing being read, taken from the heading the
 * reader is already looking at ("Booking history" -> "booking", "List history" ->
 * "list"), so the two can never disagree. Falls back to "record".
 */
function subjectFrom(title: string): string {
  const word = title.toLowerCase().replace(/\s*history\s*$/, '')
  return word === '' || word.includes(' ') ? 'record' : word
}

export function HistorySheet({ open, entityIds, entityLabels, title, onClose, coverListId, asAtBookingId }: HistorySheetProps) {
  const [asAt, setAsAt] = useState<string | null>(null)
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
    // A roll forward records its recurring-clash Draft Lists in one batch row (catch-up Phase 31): each one's History shows it.
    const named = (a: (typeof audit)[number]) => {
      const listed = (a.after as { draftListIds?: unknown } | undefined)?.draftListIds
      return Array.isArray(listed) && listed.some((id) => ids.has(id as string))
    }
    // The List's changes of anaesthetist while this Booking was on it (catch-up Phase 35): its listReassign
    // change sets made after the Booking's own first entry (its creation, or its first seeded entry).
    const coverSets = new Set<string>()
    if (coverListId !== undefined) {
      const born = audit.findIndex((a) => ids.has(a.entityId))
      const kinds = new Map<string, string>()
      for (const a of audit) if (a.changeSetId !== undefined && a.changeSetKind !== undefined) kinds.set(a.changeSetId, a.changeSetKind)
      audit.forEach((a, i) => {
        if (born !== -1 && i <= born) return
        if (a.entityId === coverListId && a.changeSetId !== undefined && kinds.get(a.changeSetId) === 'listReassign') coverSets.add(a.changeSetId)
      })
    }
    const cover = (a: (typeof audit)[number]) => a.changeSetId !== undefined && coverSets.has(a.changeSetId) && a.entityType === 'list'
    return sortAuditNewestFirst(audit.filter((a) => ids.has(a.entityId) || named(a) || cover(a)))
  }, [audit, idSet, coverListId])

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot={coverListId !== undefined ? 'booking-history' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <OverlayHeader title={title} />
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Every change to this record, most recent first.</div>
        {asAt !== null && asAtBookingId !== undefined && <BookingAsAtPanel bookingId={asAtBookingId} entryId={asAt} onClose={() => setAsAt(null)} />}
        <HistoryTimeline
          entries={entries}
          {...(asAtBookingId !== undefined ? { onViewAsAt: setAsAt } : {})}
          subject={subjectFrom(title)}
          {...(entityLabels !== undefined ? { entityLabels } : {})}
        />
      </div>
    </Overlay>
  )
}
