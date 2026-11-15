import { useMemo, useState } from 'react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useAppStore, useToday } from '@proto/store'
import { dayHeading, hhmm } from '@proto/shared/format'
import { actionLabel, auditFieldChanges, auditNamesFor, coalesceAudit, sortAuditNewestFirst } from '@proto/shared/audit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Missing } from './shared'

interface Entry {
  id: string
  atISO: string
  who: string
  role: string
  source: string
  action: string
  entityId: string
}
interface Change {
  key: string
  label: string
  before?: string
  after?: string
}
interface Group {
  entry: Entry
  steps: Entry[]
  changes: Change[]
}

const provenance = (e: Entry) => (e.role === e.source ? `${e.who} · ${e.role}` : `${e.who} · ${e.role} · ${e.source}`)

/**
 * The change ledger: one line per field, `LABEL  old → new` in mono, aligned around the arrow. A CSS
 * container query stacks the label above the values in a narrow column (today a ResizeObserver).
 */
function Ledger({ changes }: { changes: readonly Change[] }) {
  return (
    <div className="tw:@container tw:mt-0.5 tw:rounded-ctl tw:bg-sunken tw:px-2.5 tw:py-2">
      <div className="tw:flex tw:flex-col tw:gap-[3px] tw:@max-[300px]:gap-1.5">
        {changes.map((c) => (
          <div key={c.key} className="tw:flex tw:items-baseline tw:gap-2.5 tw:@max-[300px]:flex-col tw:@max-[300px]:items-stretch tw:@max-[300px]:gap-px">
            <span className="tw:w-[108px] tw:flex-none tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase tw:@max-[300px]:w-auto">{c.label}</span>
            <span className="tw:min-w-0 tw:text-[12.5px] tw:leading-[18px]">
              {c.before !== undefined && c.after !== undefined ? (
                <>
                  <span className="tw:font-mono tw:text-slate">{c.before}</span>
                  <span className="tw:px-1.5 tw:font-mono tw:text-mist">→</span>
                  <span className="tw:font-mono tw:font-semibold tw:text-ink">{c.after}</span>
                </>
              ) : (
                <span className="tw:font-mono tw:text-ink">{c.after ?? c.before}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupRow({ group, time, last, names }: { group: Group; time: string; last: boolean; names: unknown }) {
  const [open, setOpen] = useState(false)
  const { entry, steps, changes } = group
  const coalesced = steps.length > 1
  return (
    <div className={cn('tw:flex tw:items-start tw:gap-3 tw:py-2.5', !last && 'tw:border-b tw:border-line')}>
      <span className="tw:w-10 tw:flex-none tw:pt-0.5 tw:font-mono tw:text-[11.5px] tw:text-mist">{time}</span>
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <span className="tw:min-w-0 tw:flex-1 tw:text-[13.5px] tw:font-semibold tw:text-teal-pressed">{actionLabel(entry.action)}</span>
          {coalesced && <Badge className="tw:bg-teal-tint tw:text-[10.5px] tw:text-teal-pressed">{steps.length} changes</Badge>}
        </div>
        <span className="tw:text-xs tw:text-slate">{provenance(entry)}</span>
        {changes.length > 0 && <Ledger changes={changes} />}
        {coalesced && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger render={<Button variant="link" className="tw:mt-0.5 tw:text-xs" />}>{open ? `Hide the ${steps.length} steps` : `Show the ${steps.length} steps`}</CollapsibleTrigger>
            <CollapsibleContent className="tw:h-(--collapsible-panel-height) tw:overflow-hidden tw:transition-[height] tw:duration-260 tw:ease-sheet tw:data-ending-style:h-0 tw:data-starting-style:h-0 tw:motion-reduce:transition-none">
              <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-1.5">
                {steps.map((step) => (
                  <div key={step.id} className="tw:border-l-2 tw:border-line tw:pl-2">
                    <Ledger changes={auditFieldChanges(step, names) as Change[]} />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}

/**
 * A record's audit trail, newest first under day headings: the ledger layout stays ours, the coalesced
 * runs expand on shadcn Collapsible (Base UI), which adds aria-expanded and aria-controls to the toggle.
 * The same seeded Booking and the same coalesceAudit reading as the current example.
 */
export function HistoryTimelineReplacement() {
  const f = useWebFixtures() as { historyEntityId?: string }
  const audit = useAppStore((s: any) => s.audit) as Entry[]
  const rvgGroups = useAppStore((s: any) => s.masters.rvgGroups)
  const todayISO = useToday() as string
  const names = useMemo(() => auditNamesFor({ rvgGroups }), [rvgGroups])
  const entries = useMemo(() => sortAuditNewestFirst(audit.filter((a) => a.entityId === f.historyEntityId)) as Entry[], [audit, f.historyEntityId])
  if (f.historyEntityId === undefined) return <Missing what="Booking history" />
  if (entries.length === 0) return <div className="tw:text-[13px] tw:text-mist">No changes recorded yet. Every edit to this booking will appear here.</div>
  const groups = coalesceAudit(entries, names) as Group[]
  return (
    <div className="tw:flex tw:flex-col">
      {groups.map((g, i) => {
        const dayISO = g.entry.atISO.slice(0, 10)
        const prev = groups[i - 1]
        const newDay = prev === undefined || prev.entry.atISO.slice(0, 10) !== dayISO
        const time = hhmm(g.entry.atISO) as string
        const repeated = !newDay && prev !== undefined && hhmm(prev.entry.atISO) === time
        return (
          <div key={g.entry.id}>
            {newDay && <h3 className={cn('tw:m-0 tw:pb-2 tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase', i === 0 ? 'tw:pt-0.5' : 'tw:pt-[18px]')}>{dayHeading(dayISO, todayISO)}</h3>}
            <GroupRow group={g} time={repeated ? '' : time} last={i === groups.length - 1} names={names} />
          </div>
        )
      })}
    </div>
  )
}
