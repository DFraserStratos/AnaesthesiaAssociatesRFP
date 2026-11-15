import { useState, type ReactNode } from 'react'
import { CheckIcon, TriangleAlertIcon } from 'lucide-react'
import { openConflictCount, useAppStore } from '@proto/store'
import { drSurname, shortDay } from '@proto/shared/format'
import { UNASSIGNED } from '@proto/shared/scheduleTerms'
import { sessionText } from '@proto/domain/outOfHours'
import { useAdminDay, useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Echo } from './parts'

const VISIBLE = 6

interface Row {
  warning: { key: string; text: string; strength: 'mild' | 'strong' }
  bookingId: string
  dateISO: string
  session: unknown
  patientId: string
  anaesthetistId?: string
}

const EDGE = { strong: 'tw:shadow-[inset_3px_0_0_var(--error)]', mild: 'tw:shadow-[inset_3px_0_0_var(--warning)]' } as const
const DISC = { strong: 'tw:bg-error', mild: 'tw:bg-warning' } as const

/** The tick-and-word action (TickButton): a teal outline button with a check. */
export function TickAction({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" aria-label={label} onClick={onClick} className="tw:h-[30px] tw:gap-1 tw:border-primary tw:px-2.5 tw:text-xs tw:text-primary tw:hover:bg-teal-tint">
      <CheckIcon aria-hidden className="tw:size-[13px]!" />
      {children}
    </Button>
  )
}

function ToDoItem({ row, onOpen, onClear }: { row: Row; onOpen: () => void; onClear: () => void }) {
  const masters = useAppStore((s: { masters: { patients: Record<string, { name: string }>; anaesthetists: Record<string, { name: string }> } }) => s.masters)
  const patient = masters.patients[row.patientId]?.name ?? 'Unknown patient'
  const anae = row.anaesthetistId !== undefined ? masters.anaesthetists[row.anaesthetistId] : undefined
  const strength = row.warning.strength
  return (
    <li data-warning-key={row.warning.key} className={cn('tw:flex tw:gap-2.5 tw:rounded-ctl tw:bg-background tw:px-3 tw:py-2.5', EDGE[strength])}>
      <span role="img" aria-label={`1 warning: ${row.warning.text}`} className={cn('tw:mt-px tw:inline-flex tw:size-[15px] tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:text-white', DISC[strength])}>
        <TriangleAlertIcon aria-hidden className="tw:size-[9px]!" strokeWidth={2.75} />
      </span>
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-[3px]">
        <span className="tw:text-[12.5px] tw:leading-[17px] tw:font-semibold tw:text-ink">{row.warning.text}</span>
        <span className="tw:text-[11px] tw:leading-[15px] tw:text-slate">
          {patient} · {anae !== undefined ? drSurname(anae.name) : (row.anaesthetistId ?? UNASSIGNED)} · {shortDay(row.dateISO)} {sessionText(row.session)}
        </span>
        <span className="tw:mt-1 tw:flex tw:items-center tw:gap-2.5">
          <Button variant="link" aria-label={`Open ${patient}'s Booking`} onClick={onOpen} className="tw:min-h-[30px]">
            Open
          </Button>
          <TickAction label={`${strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning for ${patient}`} onClick={onClear}>
            {strength === 'mild' ? 'Clear (optional)' : 'Clear'}
          </TickAction>
        </span>
      </span>
    </li>
  )
}

/**
 * The rail's To-do card on shadcn Card + Collapsible: the heading with its
 * count, the open-conflicts line, the first six warnings and "Show all (n)"
 * revealing the rest in place. Clear hides the row locally (the prototype
 * writes a clearance to the demo store).
 */
export function WarningsToDoReplacement() {
  const { todayISO } = useSeedIds() as { todayISO: string }
  const day = useAdminDay(todayISO) as { todoRows: Row[] }
  const conflicts = useAppStore((s: unknown) => openConflictCount(s)) as number
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set())
  const [expanded, setExpanded] = useState(false)
  const [last, setLast] = useState('')
  const rows = day.todoRows.filter((r) => !cleared.has(r.warning.key))
  const item = (r: Row) => (
    <ToDoItem
      key={r.warning.key}
      row={r}
      onOpen={() => setLast(`Open booking ${r.bookingId} on ${r.dateISO} (stubbed).`)}
      onClear={() => {
        setCleared((s) => new Set(s).add(r.warning.key))
        setLast(`Cleared locally: ${r.warning.text}`)
      }}
    />
  )
  return (
    <div>
      <Card size="sm" className="tw:gap-2.5 tw:shadow-none" aria-labelledby="lib-todo-heading">
        <CardHeader>
          <CardTitle id="lib-todo-heading" className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold" role="heading" aria-level={2}>
            To-do
            {rows.length > 0 && <Badge className="tw:font-bold tw:tabular-nums">{rows.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="tw:flex tw:flex-col tw:gap-2.5">
          {conflicts > 0 && (
            <Button
              variant="ghost"
              onClick={() => setLast('Open Conflicts (stubbed).')}
              className="tw:h-auto tw:justify-start tw:gap-2 tw:bg-background tw:px-3 tw:py-2 tw:text-[12.5px] tw:text-primary tw:shadow-[inset_3px_0_0_var(--warning)] tw:hover:text-teal-pressed"
            >
              <span aria-hidden className="tw:inline-flex tw:size-3.5 tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:bg-warning tw:text-[9px] tw:font-bold tw:text-white">!</span>
              {conflicts} open conflict{conflicts === 1 ? '' : 's'}
            </Button>
          )}
          {rows.length === 0 && <div className="tw:text-[12.5px] tw:text-mist">{conflicts > 0 ? 'No open warnings.' : 'Nothing needs attention.'}</div>}
          <Collapsible open={expanded} onOpenChange={setExpanded} className="tw:flex tw:flex-col tw:gap-2">
            {rows.length > 0 && <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">{rows.slice(0, VISIBLE).map(item)}</ul>}
            {rows.length > VISIBLE && (
              <>
                <CollapsibleContent>
                  <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">{rows.slice(VISIBLE).map(item)}</ul>
                </CollapsibleContent>
                <CollapsibleTrigger render={<Button variant="link" className="tw:min-h-7 tw:self-start" />}>
                  {expanded ? 'Show fewer' : `Show all (${rows.length})`}
                </CollapsibleTrigger>
              </>
            )}
          </Collapsible>
        </CardContent>
      </Card>
      <Echo>{last}</Echo>
    </div>
  )
}
