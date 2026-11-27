import { useMemo, useState } from 'react'
import { listsNeedingContracts, useAppStore, type ListNeedingContractsRow } from '../../../store'
import { neutral } from '../../../theme/tokens'
import { Pill } from '../../../shared/ui/Pill'
import { TextAction } from '../../../shared/ui'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { drSurname, shortDay } from '../../../shared/format'
import { sessionText } from '../../../domain/outOfHours'
import { ToDoRow, TODO_VISIBLE_ROWS } from './WarningsToDo'

/** Procedures named under a List before "+n more". */
const NAMED_PROCEDURES = 3

/** The Lists still waiting for Contracts (US-04.3.12), from the store. */
export function useListsNeedingContracts(): ListNeedingContractsRow[] {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  return useMemo(() => listsNeedingContracts({ masters, schedule, clock }), [masters, schedule, clock])
}

/**
 * The Contracts tab of the Admin Day rail's work card (US-04.3.12): one row per List whose Procedures
 * still need a Contract, with how many are set and how far each of the rest has got. A List whose day
 * has passed is marked strongly: it now holds up submission. Six Lists show, then Show all.
 */
export function ContractsToSetList({
  rows,
  onOpenList,
  onOpenBooking,
}: {
  rows: readonly ListNeedingContractsRow[]
  onOpenList?: (listId: string) => void
  onOpenBooking: (dateISO: string, bookingId: string) => void
}) {
  const masters = useAppStore((s) => s.masters)
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? rows : rows.slice(0, TODO_VISIBLE_ROWS)

  if (rows.length === 0) return <EmptyState>Every List has its Contracts.</EmptyState>

  return (
    <>
      <ul className="aa-row-list" style={{ listStyle: 'none', margin: '-4px -16px 0', padding: 0 }}>
        {shown.map((r) => {
          const hospital = masters.hospitals[r.hospitalId]?.name ?? r.hospitalId
          const anae = masters.anaesthetists[r.anaesthetistId]
          const first = r.toSet[0]!
          const more = r.toSet.length - NAMED_PROCEDURES
          return (
            <ToDoRow key={r.listId} shot="contracts-to-set-row" data-list-id={r.listId} data-past={r.past ? 'true' : 'false'}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, lineHeight: '17px', fontWeight: 600, color: neutral.ink }}>
                <Pill tone={r.past ? 'error' : 'neutral'} variant="outline" size="sm" mono>{`${r.set} of ${r.total} set`}</Pill>
                {`${shortDay(r.dateISO)} ${sessionText(r.session)} · ${hospital}`}
              </span>
              <span style={{ fontSize: 11, lineHeight: '15px', color: neutral.slate }}>
                {anae !== undefined ? drSurname(anae.name) : r.anaesthetistId}
                {r.past ? ' · Day passed, holds up submission' : ''}
              </span>
              <ul style={{ listStyle: 'none', margin: '2px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {r.toSet.slice(0, NAMED_PROCEDURES).map((p) => (
                  <li key={p.procedureId} data-shot="contracts-to-set-procedure" data-started={p.started ? 'true' : 'false'} style={{ display: 'flex', gap: 6, fontSize: 11.5, lineHeight: '16px', color: neutral.ink }}>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.patientName}</span>
                    <span style={{ flex: 'none', color: p.started ? neutral.ink : neutral.mist }}>{p.started ? p.answersText : 'Nothing chosen'}</span>
                  </li>
                ))}
                {more > 0 && <li style={{ fontSize: 11.5, lineHeight: '16px', color: neutral.mist }}>{`+${more} more`}</li>}
              </ul>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <TextAction size="sm" flush label={`Set the Contract for ${first.patientName}'s Booking`} onClick={() => onOpenBooking(r.dateISO, first.bookingId)} style={{ minHeight: 30 }}>
                  Set Contracts
                </TextAction>
                {onOpenList !== undefined && (
                  <TextAction size="sm" flush label={`Open the ${shortDay(r.dateISO)} ${sessionText(r.session)} List at ${hospital}`} onClick={() => onOpenList(r.listId)} style={{ minHeight: 30 }}>
                    Open List
                  </TextAction>
                )}
              </span>
            </ToDoRow>
          )
        })}
      </ul>
      {rows.length > TODO_VISIBLE_ROWS && (
        <TextAction size="sm" flush ariaExpanded={expanded} onClick={() => setExpanded((v) => !v)} style={{ alignSelf: 'flex-start', minHeight: 28 }}>
          {expanded ? 'Show fewer' : `Show all (${rows.length})`}
        </TextAction>
      )}
    </>
  )
}
