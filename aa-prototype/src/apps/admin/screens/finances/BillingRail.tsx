/**
 * The Billing tab's rail (build plan Phase 60; US-13.3.1 "Approval only in
 * Review"): a line to the Xero tab while a hand-off has alerted, then the
 * Lists awaiting approval, oldest first, five shown. Each opens the Review
 * queue on that List, with the way back to this tab's filters; nothing here
 * approves.
 */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../../../store'
import { submittedLists } from '../../../../store/selectors'
import { bookingsByList } from '../../../../store/indexes'
import { sessionText } from '../../../../domain/outOfHours'
import { hhmm, plural, shortDay } from '../../../../shared/format'
import { Notice, RailSection, TextAction, type RailSectionRow } from '../../../../shared/ui'
import { financePath } from './financePaths'
import { listsPath, reviewPath } from '../lists/listsPaths'

/** How many awaiting Lists the rail shows before "See all". */
const AWAITING_SHOWN = 5

export function BillingRail() {
  return (
    <>
      <XeroHandoffNotice />
      <AwaitingApproval />
    </>
  )
}

/** "Hand-offs are failing": only while a Xero sync queue item has raised its alert. */
function XeroHandoffNotice() {
  const queue = useAppStore((s) => s.billing.xeroQueue)
  const failing = useMemo(() => {
    const open = Object.values(queue).filter((q) => q.status !== 'sent')
    if (!open.some((q) => q.status === 'alerted')) return undefined
    const handoffs = open.filter((q) => q.kind === 'handoff' || q.kind === 'correction')
    const waiting = handoffs.length > 0 ? handoffs : open
    const since = waiting.reduce((first, q) => (q.enqueuedAtISO < first ? q.enqueuedAtISO : first), waiting[0]?.enqueuedAtISO ?? '')
    return { count: waiting.length, since }
  }, [queue])
  if (failing === undefined) return null
  return (
    <Notice tone="warning" title="Hand-offs are failing." shot="billing-xero-notice">
      <span>{`${plural(failing.count, 'invoice')} waiting since ${hhmm(failing.since)}.`}</span>
      <TextAction size="sm" flush to={financePath('xero')} shot="billing-xero-notice-open">
        Open the Xero tab
      </TextAction>
    </Notice>
  )
}

/** The Lists awaiting approval, as Review will show them (the history Lists left out, as the monitor did). */
function AwaitingApproval() {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const location = useLocation()

  const lists = useMemo(() => submittedLists({ schedule }).filter((l) => !l.id.startsWith('L-HIST')), [schedule])

  // When each shown List was submitted: one pass over the audit, for the few rows on screen.
  const submittedAt = useMemo(() => {
    const shown = new Set(lists.slice(0, AWAITING_SHOWN).map((l) => l.id))
    const at = new Map<string, string>()
    if (shown.size === 0) return at
    for (const e of audit ?? []) if (e.entityType === 'list' && e.action === 'list.submit' && shown.has(e.entityId)) at.set(e.entityId, e.atISO)
    return at
  }, [lists, audit])

  const rows = useMemo((): RailSectionRow[] => {
    const byList = bookingsByList(schedule.bookings)
    const back = { from: 'billing', search: location.search }
    return lists.map((l, i) => {
      const name = masters.anaesthetists[l.anaesthetistId]?.name ?? l.anaesthetistId
      const hospital = masters.hospitals[l.hospitalId]?.name ?? l.hospitalId
      const at = submittedAt.get(l.id)
      // Only the shown rows count their Bookings; the rest sit behind See all.
      const bookings = i < AWAITING_SHOWN ? (byList.get(l.id) ?? []).filter((b) => b.cancellation === undefined).length : undefined
      const parts = [hospital, ...(bookings !== undefined ? [plural(bookings, 'Booking')] : []), ...(at !== undefined ? [`submitted ${shortDay(at)} ${hhmm(at)}`] : [])]
      return {
        key: l.id,
        to: reviewPath(l.id),
        state: back,
        title: `${name} · ${shortDay(l.dateISO)} · ${sessionText(l.session)}`,
        sub: parts.join(' · '),
        data: { 'data-shot': `billing-awaiting-${l.id}`, 'data-list-id': l.id },
      }
    })
  }, [lists, masters, schedule.bookings, submittedAt, location.search])

  return (
    <RailSection
      title="Awaiting approval"
      countNoun="Lists awaiting approval"
      rows={rows}
      limit={AWAITING_SHOWN}
      allTo={listsPath('to-authorise')}
      empty="No Lists are waiting for approval."
      shot="billing-awaiting"
    />
  )
}
