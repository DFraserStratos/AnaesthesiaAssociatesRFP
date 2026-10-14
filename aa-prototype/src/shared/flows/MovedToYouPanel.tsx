import { format, parseISO } from 'date-fns'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { useAppStore } from '../../store'
import type { Notification } from '../../domain/types'
import { drSurname, locationName } from '../format'
import { useMovedToMe } from './useListMoves'

/** The mover as the apps name them ("Dr Hughes"), or a plain fallback when the record is gone. */
function moverName(fromName: string | undefined): string {
  return fromName !== undefined ? drSurname(fromName) : 'A colleague'
}

/** "Dr Hughes moved Thu 23 Jul AM, St George's, to you." from the pool's record (a snapshot). */
export function movedToYouLine(n: Notification, names: { from: string | undefined; hospital: string }): string {
  return `${moverName(names.from)} moved ${format(parseISO(n.dateISO), 'EEE d MMM')} ${n.session}, ${names.hospital}, to you.`
}

/** List detail's line: "Moved to you by Dr Hughes on Tue 21 Jul". */
export function movedToYouByLine(n: Notification, fromName: string | undefined): string {
  return `Moved to you by ${moverName(fromName)} on ${format(parseISO(n.atISO), 'EEE d MMM')}`
}

/**
 * The receiving colleague's notice (catch-up Phase 32; US-01.4.3 AC2): Lists a
 * colleague moved to her in the last week, read from the shared pool's
 * records, neutral (it needs no action), with any message typed. It says
 * nothing about pairing preferences (US-01.4.5 "Nothing revealed"). Shown at
 * the top of Find cover on mobile and web while there is something to show.
 */
export function MovedToYouPanel({ anaesthetistId, onOpenList }: { anaesthetistId: string; onOpenList?: (listId: string) => void }) {
  const notices = useMovedToMe(anaesthetistId)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const lists = useAppStore((s) => s.schedule.lists)
  if (notices.length === 0) return null
  return (
    <section
      data-shot="moved-to-you"
      aria-label="Moved to you"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{ width: 28, height: 28, borderRadius: 999, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <ArrowRightLeft size={14} strokeWidth={2.4} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>Moved to you</span>
      </div>
      {notices.map((n) => {
        const line = movedToYouLine(n, { from: anaesthetists[n.fromAnaesthetistId]?.name, hospital: locationName(n.hospitalId, hospitals) })
        const stillHers = lists[n.listId]?.anaesthetistId === anaesthetistId
        const body = (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13.5, lineHeight: '19px', color: neutral.ink }}>{line}</span>
            {n.message !== undefined && <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>"{n.message}"</span>}
            <span style={{ fontSize: 12, color: neutral.mist }}>{format(parseISO(n.atISO), 'EEE d MMM, HH:mm')}</span>
          </span>
        )
        return onOpenList !== undefined && stillHers ? (
          <button
            key={n.id}
            type="button"
            data-shot="moved-to-you-row"
            onClick={() => onOpenList(n.listId)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: radius.ctl, border: 'none', background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
          >
            {body}
            <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
          </button>
        ) : (
          <div key={n.id} data-shot="moved-to-you-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: radius.ctl, background: neutral.bg }}>
            {body}
          </div>
        )
      })}
    </section>
  )
}
