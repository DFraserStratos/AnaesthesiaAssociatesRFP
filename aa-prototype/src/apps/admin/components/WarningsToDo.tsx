import { InfoTip } from '../../../shared/help/InfoTip'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { clearWarning, openConflictCount, replacedContractsToDisable, useAppStore, type Actor, type OpenWarningRow } from '../../../store'
import type { ReplacedContractRow } from '../../../domain/warnings/rules'
import { plainDate } from '../../../domain/dateText'
import { neutral, semantic, type as typeScale } from '../../../theme/tokens'
import { CountBadge } from '../../../shared/ui/CountBadge'
import { FormError } from '../../../shared/ui/Field'
import { Card, TextAction } from '../../../shared/ui'
import { drSurname, shortDay, plural } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'
import { ClearWarningButton, warningTone } from '../../../shared/warnings'
import { RowOpenButton, isInteractiveRowTarget } from '../../../shared/table/ClickableRow'
import { WARNING_RULES } from '../../../domain/warnings/rules'
import type { WarningRuleId } from '../../../domain/warnings'
import { CalendarX2, ChevronRight, FileCheck, ReceiptText, Ruler, ShieldAlert, Split, TriangleAlert, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import { compareSessions, sessionText } from '../../../domain/outOfHours'
import { EmptyState } from '../../../shared/ui/EmptyState'

/** Rows shown before "Show all". */
export const TODO_VISIBLE_ROWS = 6

/** Hooks the capture recipes target on a rule's To-do rows (catch-up Phase 21). */
const TODO_ROW_SHOTS: Partial<Record<string, string>> = {
  childPayer: 'todo-child-warning',
  approvalNumberMissing: 'todo-approval-warning',
}

/** Each rule's icon on a To-do row, so the kind of problem reads at a glance; its colour is the strength's. */
const RULE_ICONS: Record<WarningRuleId, LucideIcon> = {
  childPayer: UserRound,
  approvalNumberMissing: ShieldAlert,
  patientBalance: Wallet,
  prepaymentUnpaid: ReceiptText,
  baseUnitsOutsideGuide: Ruler,
  splitDoesNotFit: Split,
}

/** A rule's short name, the row's title (the rule's own label; one home). */
function ruleLabel(ruleId: string): string {
  return WARNING_RULES.find((r) => r.id === ruleId)?.label ?? 'Warning'
}

/**
 * The rows the to-do list shows: open warnings, plus (on the rail's work card) replaced Contracts
 * still active on or after their change date (build plan Phase 49, DM-03). Procedures with no
 * Contract are not to-dos: they wait on the Contracts tab (US-04.3.12).
 */
export type ToDoItem =
  | { kind: 'warning'; row: OpenWarningRow }
  | { kind: 'replacedContract'; row: ReplacedContractRow }

/** The old Contracts to disable (DM-03): derived, so no Clear; each goes once the office disables it. */
export function useReplacedContractRows(): ReplacedContractRow[] {
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const clock = useAppStore((s) => s.clock)
  return useMemo(() => replacedContractsToDisable({ masters, audit, clock }), [masters, audit, clock])
}

/** A to-do's date: a replaced Contract's change date, else its Booking's day. */
export function toDoItemDate(item: ToDoItem): string {
  return item.kind === 'replacedContract' ? item.row.fromISO : item.row.dateISO
}

const KIND_ORDER: Record<ToDoItem['kind'], number> = { replacedContract: 0, warning: 1 }

/**
 * Every to-do in one order: by date; on a date, a replaced Contract (which has no session) first;
 * then by session.
 */
export function toDoItems(warnings: readonly OpenWarningRow[], replaced: readonly ReplacedContractRow[] = []): ToDoItem[] {
  const items: ToDoItem[] = [
    ...warnings.map((row) => ({ kind: 'warning' as const, row })),
    ...replaced.map((row) => ({ kind: 'replacedContract' as const, row })),
  ]
  // A stable sort keeps each source's own order inside a session.
  return items.sort((a, b) => {
    const byDate = toDoItemDate(a).localeCompare(toDoItemDate(b))
    if (byDate !== 0) return byDate
    if (a.kind === 'replacedContract' || b.kind === 'replacedContract') return KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    return compareSessions(a.row.session, b.row.session) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
  })
}

/**
 * The dashboard to-do list (US-13.7.2) as a card: every OPEN warning, all
 * dates, soonest first, each with Open and the office's Clear. The Admin Day
 * rail shows the same list as the To-do tab of its work card (`ToDoList`).
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
 * replaced Contract to disable), six at first, then Show all.
 */
export function ToDoList({
  items,
  actor,
  onOpenBooking,
  onOpenConflicts,
  onOpenContract,
}: {
  items: readonly ToDoItem[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenConflicts?: () => void
  /** Opens a Contract's page (a replaced Contract's to-do, build plan Phase 49). */
  onOpenContract?: (contractId: string) => void
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

  const text: CSSProperties = { fontSize: typeScale.small.size, lineHeight: '17px', color: neutral.slate, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
  const metaLine: CSSProperties = { fontSize: typeScale.captionSm.size, lineHeight: '16px', color: neutral.slate }
  const chevron = <ChevronRight size={14} aria-hidden style={{ flex: 'none', marginTop: 3, color: neutral.mist }} />

  return (
    <>
      {items.length === 0 && conflicts === 0 && <EmptyState>Nothing needs attention.</EmptyState>}
      {(conflicts > 0 || shown.length > 0) && (
        <div style={{ margin: '-4px -16px 0' }}>
          {conflicts > 0 && onOpenConflicts !== undefined && (
            <ToDoRow
              as="div"
              icon={CalendarX2}
              iconColor={semantic.warning.solid}
              onOpen={onOpenConflicts}
              action={chevron}
              shot={undefined}
              style={shown.length > 0 || items.length === 0 ? { borderBottom: `1px solid ${neutral.line}` } : undefined}
            >
              <RowOpenButton label={`${plural(conflicts, 'open conflict')}, open Conflicts`} onOpen={onOpenConflicts} data-shot="admin-todo-conflicts" style={ROW_TITLE}>
                {plural(conflicts, 'open conflict')}
              </RowOpenButton>
            </ToDoRow>
          )}
          {items.length === 0 && conflicts > 0 && <EmptyState>No open warnings.</EmptyState>}
          {shown.length > 0 && (
            <ul className="aa-row-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {shown.map((item) => {
                if (item.kind === 'replacedContract') {
                  const r = item.row
                  const open = onOpenContract !== undefined ? () => onOpenContract(r.contractId) : undefined
                  const title = `Disable ${r.contractName} (${r.aaCode})`
                  return (
                    <ToDoRow key={`rc:${r.contractId}`} icon={FileCheck} iconColor={neutral.slate} {...(open !== undefined ? { onOpen: open, action: chevron } : {})} shot="todo-replaced-contract" data-contract-id={r.contractId}>
                      {open !== undefined ? (
                        <RowOpenButton label={`Open ${r.contractName} (${r.aaCode})`} onOpen={open} data-shot="todo-replaced-contract-open" style={ROW_TITLE}>
                          {title}
                        </RowOpenButton>
                      ) : (
                        <span style={ROW_TITLE}>{title}</span>
                      )}
                      <span style={metaLine}>{`Replaced by ${r.replacementCode} from ${plainDate(r.fromISO)}`}</span>
                    </ToDoRow>
                  )
                }
                const r = item.row
                const patient = masters.patients[r.patientId]?.name ?? 'Unknown patient'
                const anae = r.anaesthetistId !== undefined ? masters.anaesthetists[r.anaesthetistId] : undefined
                const open = () => onOpenBooking(r.dateISO, r.bookingId)
                const strong = r.warning.strength === 'strong'
                return (
                  <ToDoRow
                    key={r.warning.key}
                    icon={RULE_ICONS[r.warning.ruleId] ?? TriangleAlert}
                    iconColor={warningTone(r.warning.strength).solid}
                    onOpen={open}
                    shot={TODO_ROW_SHOTS[r.warning.ruleId]}
                    data-warning-key={r.warning.key}
                    data-strength={r.warning.strength}
                    action={
                      <ClearWarningButton
                        iconOnly
                        warning={r.warning}
                        label={`Clear warning for ${patient}`}
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
                    }
                  >
                    <RowOpenButton label={`Open ${patient}'s Booking`} onOpen={open} style={ROW_TITLE}>
                      {ruleLabel(r.warning.ruleId)}
                      {strong && <span style={VISUALLY_HIDDEN}> (strong warning)</span>}
                    </RowOpenButton>
                    <span style={text}>{r.warning.text}</span>
                    <span style={metaLine}>
                      {patient} · {anae !== undefined ? drSurname(anae.name) : (r.anaesthetistId ?? UNASSIGNED)} · {shortDay(r.dateISO)} {sessionText(r.session)}
                    </span>
                  </ToDoRow>
                )
              })}
            </ul>
          )}
        </div>
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

/** A row's title: the open handle's words, at the rail's label size. */
const ROW_TITLE: CSSProperties = { fontSize: typeScale.label.size, lineHeight: '18px', fontWeight: 600, color: neutral.ink }

const VISUALLY_HIDDEN: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }

/**
 * One work-card row (docs/explorations/todo-restyle.html, "Quiet list, bare icons"): flat, split from
 * its neighbours by the list's hairline, never a well or a coloured edge. An optional 20px icon in its
 * own column (a warning's rule, in its strength's colour); the title, wording and details share one
 * left edge beside it; an optional `action` on the right (the round Clear tick, or a chevron). With
 * `onOpen` the whole row opens (clicks on an inner button do only their own action); put a
 * `RowOpenButton` in it as the keyboard handle.
 */
export function ToDoRow({
  icon: Icon,
  iconColor,
  onOpen,
  action,
  as = 'li',
  shot,
  style,
  children,
  ...data
}: {
  icon?: LucideIcon
  iconColor?: string
  onOpen?: () => void
  action?: ReactNode
  as?: 'li' | 'div'
  shot: string | undefined
  style?: CSSProperties | undefined
  children: ReactNode
} & { [key: `data-${string}`]: string }) {
  const Tag = as
  return (
    <Tag
      {...data}
      data-shot={shot}
      className={onOpen !== undefined ? 'aa-clickable-list-row' : undefined}
      onClick={onOpen !== undefined ? (e: React.MouseEvent) => { if (!isInteractiveRowTarget(e.target)) onOpen() } : undefined}
      style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', ...style }}
    >
      {Icon !== undefined && <Icon size={20} strokeWidth={2} aria-hidden style={{ flex: 'none', marginTop: -1, color: iconColor ?? neutral.slate }} />}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>{children}</span>
      {action}
    </Tag>
  )
}
