/**
 * Where a List sits (build plan Phase 69, Work item 3; docs/explorations/intake-ideas.html #reco "where it lands" and
 * #idea1 mock A's side card; the session block of docs/design/Admin Day.dc.html): the anaesthetist, day and session
 * as one session block in the List kind's status tint and bar, the hospital, surgeon and Bookings (not cancelled)
 * under it, then the List's state in words, and a link to that day's Day view with the List open. A List that is
 * gone reads as a quiet empty state.
 */

import { useMemo } from 'react'
import type { List } from '../../../../../../domain/types'
import { sessionLabel } from '../../../../../../domain/intake/matching'
import { useAppStore } from '../../../../../../store/appStore'
import { drSurname, plural, titledSurname } from '../../../../../../shared/format'
import { Card, EmptyState, Eyebrow, TextAction } from '../../../../../../shared/ui'
import { neutral, radius, type as typeScale } from '../../../../../../theme/tokens'
import { LIST_KIND_VISUAL, STATUS_PALETTE } from '../../../../../../theme/statusColours'
import { listStateLine } from './updateText'
import { useHeldList } from './updateReads'

/** The Bookings on a List that are not cancelled. */
function useBookingCount(listId: string | undefined): number {
  const bookings = useAppStore((s) => s.schedule.bookings)
  return useMemo(() => (listId === undefined ? 0 : Object.values(bookings).filter((b) => b.listId === listId && b.cancellation === undefined).length), [bookings, listId])
}

function sessionBlockColours(list: List): { background: string; bar: string; onTint: string } {
  if (list.state === 'DRAFT') return { background: neutral.bg, bar: neutral.lineStrong, onTint: neutral.slate }
  const p = STATUS_PALETTE[LIST_KIND_VISUAL[list.kind].colour]
  return { background: p.tint, bar: p.solid, onTint: p.onTint }
}

export function SlotCard({ listId, shot = 'intake-slot-card', title = 'Where it lands' }: { listId: string | undefined; shot?: string; title?: string }) {
  const list = useHeldList(listId)
  const bookings = useBookingCount(list?.id)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const heading = <Eyebrow as="span">{title}</Eyebrow>

  if (list === undefined) {
    return (
      <Card title={heading} titleLevel={3} shot={shot}>
        <EmptyState variant="inline">This List is no longer on the schedule.</EmptyState>
      </Card>
    )
  }

  const anaesthetist = list.anaesthetistId !== undefined ? anaesthetists[list.anaesthetistId] : undefined
  const who = anaesthetist !== undefined ? drSurname(anaesthetist.name) : 'No anaesthetist yet'
  const when = sessionLabel(list.dateISO, list.session)
  const surgeon = surgeons[list.surgeonId]
  const where = [hospitals[list.hospitalId]?.name ?? list.hospitalId, surgeon !== undefined ? titledSurname(surgeon.name) : undefined, plural(bookings, 'Booking')]
    .filter((part): part is string => part !== undefined)
    .join(' · ')
  const colours = sessionBlockColours(list)

  return (
    <Card
      title={heading}
      titleLevel={3}
      shot={shot}
      data-list-id={list.id}
      data-list-state={list.state}
      action={
        <TextAction size="sm" flush to={`/admin/day/${list.dateISO}`} linkState={{ openListId: list.id }} label={`Open ${when} in the Day view`} shot={`${shot}-day`}>
          Day view
        </TextAction>
      }
    >
      <div
        data-list-kind={list.kind}
        style={{
          background: colours.background,
          boxShadow: `inset 3px 0 0 ${colours.bar}`,
          borderRadius: radius.sm,
          padding: '10px 12px 10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: typeScale.label.size, lineHeight: `${typeScale.label.line + 2}px`, fontWeight: 600, color: neutral.ink }}>
          {who} · {when}
        </span>
        <span style={{ fontSize: typeScale.captionSm.size, lineHeight: `${typeScale.captionSm.line}px`, color: colours.onTint }}>{where}</span>
      </div>
      <div data-shot={`${shot}-state`} style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
        {listStateLine(list.state)}
      </div>
    </Card>
  )
}
