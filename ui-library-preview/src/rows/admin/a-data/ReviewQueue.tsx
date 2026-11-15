import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { PenLineIcon } from 'lucide-react'
import { billedLists, changedSinceSubmitted, invoiceCountsByList } from '@proto/store'
import { dayMicroCap, dayWithYear, hhmm } from '@proto/shared/format'
import { listShortLabel, listSourceLabels } from '@proto/apps/admin/util'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useStore } from './data'
import { Echo, TableCard } from './shared'

interface QueueRow {
  id: string
  anaesthetist: string
  primary: string
  secondary?: string
  dateISO: string
  bookings: number
  submittedAtISO?: string
  cue: { count: number; lastAtISO: string } | null
}

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, QueueRow>()

/** Keep links and buttons inside a clickable row in charge of their own action (tableChrome). */
function isInteractiveTarget(target: EventTarget | null, row: HTMLElement): boolean {
  if (!(target instanceof Element)) return false
  const hit = target.closest('a, button, input, select, textarea')
  return hit !== null && hit !== row
}

/** The "Changed since submitted" cue as an outline Badge with a Tooltip carrying today's title text. */
function ChangedCue({ cue }: { cue: { count: number; lastAtISO: string } }) {
  const changes = `${cue.count} change${cue.count === 1 ? '' : 's'}`
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            tabIndex={0}
            className="tw:gap-[5px] tw:border-[color-mix(in_srgb,var(--warning)_40%,transparent)] tw:px-2.5 tw:py-[3px] tw:text-xs tw:text-warning-on-tint"
          />
        }
      >
        <PenLineIcon aria-hidden strokeWidth={2.4} />
        Changed since submitted · <span className="tw:font-mono">{cue.count}</span>
      </TooltipTrigger>
      <TooltipContent>
        {changes} by the anaesthetist since the List was submitted, the last on {dayWithYear(cue.lastAtISO)} at {hhmm(cue.lastAtISO)}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The review queue on TanStack Table v9 (core row model) through shadcn Table. Same data as the
 * screen (every SUBMITTED List, by date then anaesthetist, booking counts, submit time, the
 * changed-since-submitted cue) and the Recently billed panel under it. `rowOpens`: the whole row
 * opens the List (as today) and is now in the Tab order with Enter and Space; off, only the
 * Review button opens it and rows are plain.
 */
export function ReviewQueueReplacement({ rowOpens }: { rowOpens: boolean }) {
  const schedule = useStore((s) => s.schedule)
  const billing = useStore((s) => s.billing)
  const masters = useStore((s) => s.masters)
  const audit = useStore((s) => s.audit) as { action: string; entityId: string; atISO: string }[]
  const [opened, setOpened] = useState('Open is stubbed: nothing navigates.')

  const data = useMemo<QueueRow[]>(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(schedule.bookings) as { listId: string; cancellation?: unknown }[]) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    const submitTimes: Record<string, string> = {}
    for (const a of audit) if (a.action === 'list.submit') submitTimes[a.entityId] = a.atISO
    return (Object.values(schedule.lists) as { id: string; state: string; dateISO: string; anaesthetistId: string }[])
      .filter((l) => l.state === 'SUBMITTED')
      .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO)))
      .map((l) => {
        const source = listSourceLabels(l, masters) as { primary: string; secondary?: string }
        return {
          id: l.id,
          anaesthetist: masters.anaesthetists[l.anaesthetistId]?.name ?? 'Anaesthetist unavailable',
          primary: source.primary,
          ...(source.secondary !== undefined ? { secondary: source.secondary } : {}),
          dateISO: l.dateISO,
          bookings: counts[l.id] ?? 0,
          ...(submitTimes[l.id] !== undefined ? { submittedAtISO: submitTimes[l.id] } : {}),
          cue: changedSinceSubmitted({ schedule, audit, masters }, l.id),
        }
      })
  }, [schedule, audit, masters])

  const recentlyBilled = useMemo(() => (billedLists({ schedule }) as { id: string; dateISO: string; billedAtISO: string }[]).slice(0, 6), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }) as Record<string, number>, [schedule, billing])

  const open = (row: QueueRow) => setOpened(`Open ${row.anaesthetist}, ${row.primary} (${row.dateISO}): stubbed.`)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('anaesthetist', { header: 'Anaesthetist', cell: (i) => <span className="tw:font-semibold">{i.getValue()}</span> }),
        helper.accessor('primary', {
          header: 'List',
          cell: ({ row }) => (
            <div className="tw:whitespace-normal">
              <div className="tw:font-semibold">{row.original.primary}</div>
              {row.original.secondary !== undefined && <div className="tw:mt-0.5 tw:text-[11.5px] tw:text-mist">{row.original.secondary}</div>}
            </div>
          ),
        }),
        helper.accessor('dateISO', { header: 'List date', cell: (i) => <span className="tw:font-mono">{dayMicroCap(i.getValue())}</span> }),
        helper.accessor('bookings', { header: 'Bookings', meta: { numeric: true }, cell: (i) => <span className="tw:font-semibold">{i.getValue()}</span> }),
        helper.accessor('submittedAtISO', {
          header: 'Submitted',
          cell: ({ row }) => (
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:font-mono">{row.original.submittedAtISO !== undefined ? hhmm(row.original.submittedAtISO) : 'Submitted'}</span>
              {row.original.cue !== null && <ChangedCue cue={row.original.cue} />}
            </div>
          ),
        }),
        helper.display({
          id: 'review',
          header: '',
          meta: { right: true },
          cell: ({ row }) => (
            <Button variant="link" className="tw:font-sans tw:text-[13px] tw:font-semibold" onClick={() => open(row.original)}>
              Review →
            </Button>
          ),
        }),
      ]),
    [],
  )

  const table = useTable({ features, columns, data, getRowId: (r) => r.id })

  return (
    <div className="tw:flex tw:w-full tw:flex-col tw:gap-4">
      <div>
        <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">Review queue</h1>
        <div className="tw:mt-1 tw:text-[13px] tw:text-slate">
          Submitted lists awaiting a sanity check and authorisation for billing. {data.length} in the queue.
        </div>
      </div>
      {data.length === 0 ? (
        <div className="tw:text-[13px] tw:text-mist">Nothing awaiting review.</div>
      ) : (
        <TableCard>
          <Table className="tw:min-w-[980px]">
            <TableHeader>
              {table.getHeaderGroups().map((g) => (
                <TableRow key={g.id}>
                  {g.headers.map((h) => (
                    <TableHead key={h.id} data-numeric={(h.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? true : undefined}>
                      <table.FlexRender header={h} />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const activate = rowOpens
                  ? {
                      tabIndex: 0,
                      'aria-label': `Review ${row.original.anaesthetist}, ${row.original.primary}, ${dayMicroCap(row.original.dateISO)}`,
                      onClick: (e: MouseEvent<HTMLTableRowElement>) => {
                        if (!isInteractiveTarget(e.target, e.currentTarget)) open(row.original)
                      },
                      onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          open(row.original)
                        }
                      },
                    }
                  : {}
                return (
                  <TableRow
                    key={row.id}
                    {...activate}
                    className={cn(rowOpens ? 'tw:cursor-pointer tw:outline-none tw:focus-visible:bg-teal-tint tw:focus-visible:shadow-[inset_3px_0_0_var(--teal)]' : 'tw:hover:bg-transparent')}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} data-numeric={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? true : undefined} className={cn('tw:h-auto', cell.column.id === 'review' && 'tw:text-right')}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
      <Echo>{opened}</Echo>

      <div className="tw:flex tw:flex-col tw:gap-2 tw:rounded-card tw:border tw:border-line tw:bg-sunken tw:p-4">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <span className="tw:text-sm tw:font-bold">Recently billed</span>
          <Button variant="link" className="tw:text-[13px]" onClick={() => setOpened('View invoices: stubbed.')}>
            View invoices →
          </Button>
        </div>
        <div className="tw:text-[12.5px] tw:text-slate">Authorising a list hands it to the Billing Engine as a unit; its invoices are raised in the same moment.</div>
        {recentlyBilled.length === 0 ? (
          <div className="tw:text-[12.5px] tw:text-mist">Nothing billed yet.</div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-1">
            {recentlyBilled.map((l) => {
              const n = invoiceCountByList[l.id] ?? 0
              return (
                <div key={l.id} className="tw:text-[12.5px] tw:text-ink">
                  {listShortLabel(l, masters)} · {dayMicroCap(l.dateISO)}
                  <span className="tw:text-mist">
                    {' '}
                    · billed {hhmm(l.billedAtISO)} · {n} invoice{n === 1 ? '' : 's'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
