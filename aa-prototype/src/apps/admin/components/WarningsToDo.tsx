import { InfoTip } from '../../../shared/help/InfoTip'
import { useMemo, useState, type ReactNode } from 'react'
import { clearWarning, needsInvoiceDestinationBookings, openConflictCount, useAppStore, type Actor, type NeedsInvoiceDestinationRow, type OpenWarningRow } from '../../../store'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { CountBadge } from '../../../shared/ui/CountBadge'
import { Pill } from '../../../shared/ui/Pill'
import { FormError } from '../../../shared/ui/Field'
import { Card, TextAction } from '../../../shared/ui'
import { drSurname, shortDay, plural } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'
import { AttentionDot } from '../../../shared/warnings/AttentionDot'
import { ClearWarningButton, WarningTriangle, warningTone } from '../../../shared/warnings'
import { compareSessions, sessionText } from '../../../domain/outOfHours'
import { EmptyState } from '../../../shared/ui/EmptyState'

/** Rows shown before "Show all". */
export const TODO_VISIBLE_ROWS = 6

/** Hooks the capture recipes target on a rule's To-do rows (catch-up Phase 21). */
const TODO_ROW_SHOTS: Partial<Record<string, string>> = {
  childPayer: 'todo-child-warning',
  approvalNumberMissing: 'todo-approval-warning',
}

/** The rows the to-do list shows: open warnings, plus (on the rail's work card) Bookings with no Contract yet. */
export type ToDoItem = { kind: 'warning'; row: OpenWarningRow } | { kind: 'noContract'; row: NeedsInvoiceDestinationRow }

/** Bookings with no Contract yet (US-04.3.4), soonest first: a work list, so no Clear. */
export function useNoContractRows(): NeedsInvoiceDestinationRow[] {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  return useMemo(() => needsInvoiceDestinationBookings({ masters, schedule }), [masters, schedule])
}

/** Warnings and no-Contract rows in one order: by date, then session; a warning before a work row on the same session. */
export function toDoItems(warnings: readonly OpenWarningRow[], noContract: readonly NeedsInvoiceDestinationRow[] = []): ToDoItem[] {
  const items: ToDoItem[] = [...warnings.map((row) => ({ kind: 'warning' as const, row })), ...noContract.map((row) => ({ kind: 'noContract' as const, row }))]
  // A stable sort keeps each source's own order inside a session.
  return items.sort((a, b) => a.row.dateISO.localeCompare(b.row.dateISO) || compareSessions(a.row.session, b.row.session) || (a.kind === b.kind ? 0 : a.kind === 'warning' ? -1 : 1))
}

/**
 * The dashboard to-do list (US-13.7.2) as a card: every OPEN warning, all
 * dates, soonest first, each with Open and the office's Clear. The Admin Day
 * rail shows the same list as the To-do tab of its work card (`ToDoList`),
 * where Bookings with no Contract yet join it.
 */
export function WarningsToDo({
  rows,
  actor,
  onOpenBooking,
  onOpenConflicts,
}: {
  rows: readonly OpenWarningRow[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  /** Opens the Conflicts screen (catch-up Phase 30); without it the conflicts line is not shown. */
  onOpenConflicts?: () => void
}) {
  return (
    <Card
      shot="admin-warnings-todo"
      headingId="admin-todo-heading"
      aside={<InfoTip topic="day.todo" />}
      title={
        <>
          To-do
          <CountBadge count={rows.length} srNoun="to do" />
        </>
      }
    >
      <ToDoList items={toDoItems(rows)} actor={actor} onOpenBooking={onOpenBooking} {...(onOpenConflicts !== undefined ? { onOpenConflicts } : {})} />
    </Card>
  )
}

/**
 * The to-do list's body: the conflicts line, then each item (a warning with Open and Clear, or a
 * Booking with no Contract yet with Set Contract), six at first, then Show all.
 */
export function ToDoList({
  items,
  actor,
  onOpenBooking,
  onOpenConflicts,
}: {
  items: readonly ToDoItem[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenConflicts?: () => void
}) {
  const masters = useAppStore((s) => s.masters)
  // One summary line for conflicts (catch-up Phase 30): a link to the Conflicts
  // screen, not a warning. ListConflict stays List-level and out of the
  // warning routine (15a's ruling), so the count is warnings only.
  const openConflicts = useAppStore((s) => openConflictCount(s))
  const conflicts = onOpenConflicts !== undefined ? openConflicts : 0
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shown = expanded ? items : items.slice(0, TODO_VISIBLE_ROWS)

  return (
    <>
      {conflicts > 0 && (
        <button
          type="button"
          data-shot="admin-todo-conflicts"
          onClick={onOpenConflicts}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', borderRadius: radius.ctl, background: neutral.bg, boxShadow: `inset 3px 0 0 ${semantic.warning.solid}`, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: accent.base, cursor: 'pointer', textAlign: 'left' }}
        >
          <AttentionDot size={14} />
          {plural(conflicts, 'open conflict')}
        </button>
      )}
      {items.length === 0 && conflicts === 0 && <EmptyState>Nothing needs attention.</EmptyState>}
      {items.length === 0 && conflicts > 0 && <EmptyState>No open warnings.</EmptyState>}
      {shown.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((item) => {
            if (item.kind === 'noContract') {
              const r = item.row
              const hospital = r.hospitalId !== undefined ? masters.hospitals[r.hospitalId]?.name ?? r.hospitalId : undefined
              return (
                <ToDoRow key={`nc:${r.procedureId}`} edge={null} shot="needs-destination-row" data-booking-id={r.bookingId}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, lineHeight: '17px', fontWeight: 600, color: neutral.ink }}>
                    <Pill tone="neutral" variant="outline" size="sm">No Contract</Pill>
                    {r.patientName}
                  </span>
                  <span style={{ fontSize: 11, lineHeight: '15px', color: neutral.slate }}>
                    {shortDay(r.dateISO)} {sessionText(r.session)}
                    {hospital !== undefined ? ` · ${hospital}` : ''}
                    {r.answersText !== 'Not started' ? ` · ${r.answersText}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <TextAction size="sm" flush label={`Set the Contract for ${r.patientName}'s Booking`} onClick={() => onOpenBooking(r.dateISO, r.bookingId)} style={{ minHeight: 30 }}>
                      Set Contract
                    </TextAction>
                  </span>
                </ToDoRow>
              )
            }
            const r = item.row
            const patient = masters.patients[r.patientId]?.name ?? 'Unknown patient'
            const anae = r.anaesthetistId !== undefined ? masters.anaesthetists[r.anaesthetistId] : undefined
            const tone = warningTone(r.warning.strength)
            return (
              <ToDoRow key={r.warning.key} edge={tone.solid} shot={TODO_ROW_SHOTS[r.warning.ruleId]} data-warning-key={r.warning.key} lead={<WarningTriangle warnings={[r.warning]} size="sm" />}>
                <span style={{ fontSize: 12.5, lineHeight: '17px', fontWeight: 600, color: neutral.ink }}>{r.warning.text}</span>
                <span style={{ fontSize: 11, lineHeight: '15px', color: neutral.slate }}>
                  {patient} · {anae !== undefined ? drSurname(anae.name) : (r.anaesthetistId ?? UNASSIGNED)} · {shortDay(r.dateISO)} {sessionText(r.session)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <TextAction size="sm" flush label={`Open ${patient}'s Booking`} onClick={() => onOpenBooking(r.dateISO, r.bookingId)} style={{ minHeight: 30 }}>
                    Open
                  </TextAction>
                  <ClearWarningButton
                    compact
                    warning={r.warning}
                    label={`${r.warning.strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning for ${patient}`}
                    onClear={() => {
                      // A folded row (the child warning on each Procedure, catch-up Phase 22a) clears every Procedure's.
                      let message: string | null = null
                      for (const key of [r.warning.key, ...(r.foldedKeys ?? [])]) {
                        const res = clearWarning(useAppStore, actor, r.bookingId, key)
                        if (!res.ok) message = res.message
                      }
                      setError(message)
                    }}
                  />
                </span>
              </ToDoRow>
            )
          })}
        </ul>
      )}
      {items.length > TODO_VISIBLE_ROWS && (
        <TextAction size="sm" flush ariaExpanded={expanded} onClick={() => setExpanded((v) => !v)} style={{ alignSelf: 'flex-start', minHeight: 28 }}>
          {expanded ? 'Show fewer' : `Show all (${items.length})`}
        </TextAction>
      )}
      <FormError message={error} variant="inline" />
    </>
  )
}

/** One to-do row: the bg well, a left edge in the warning's tone (none for a work row), an optional lead mark. */
function ToDoRow({ edge, lead, shot, children, ...data }: { edge: string | null; lead?: ReactNode; shot: string | undefined; children: ReactNode } & { [key: `data-${string}`]: string }) {
  return (
    <li {...data} data-shot={shot} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: neutral.bg, borderRadius: radius.ctl, ...(edge !== null ? { boxShadow: `inset 3px 0 0 ${edge}` } : {}) }}>
      {lead !== undefined && <span style={{ paddingTop: 1 }}>{lead}</span>}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</span>
    </li>
  )
}
