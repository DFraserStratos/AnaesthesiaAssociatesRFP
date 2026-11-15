import { useMemo, useState } from 'react'
import { useAppStore, useToday } from '@proto/store'
import { actionLabel, auditFieldChanges, auditNamesFor, coalesceAudit, sortAuditNewestFirst } from '@proto/shared/audit'
import { dayHeading, hhmm } from '@proto/shared/format'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Missing } from './parts'

interface AuditEntry {
  id: string
  entityId: string
  who: string
  role: string
  source: string
  action: string
  after?: unknown
  atISO: string
}
interface FieldChange {
  key: string
  label: string
  before?: string
  after?: string
}
interface AuditGroup {
  entry: AuditEntry
  steps: readonly AuditEntry[]
  changes: readonly FieldChange[]
}
type Names = unknown

export type StepsStyle = 'link' | 'accordion'

/** "List history" -> "list", as the prototype's subjectFrom. */
function subjectFrom(title: string): string {
  const word = title.toLowerCase().replace(/\s*history\s*$/, '')
  return word === '' || word.includes(' ') ? 'record' : word
}

function provenance(e: AuditEntry): string {
  return e.role === e.source ? `${e.who} · ${e.role}` : `${e.who} · ${e.role} · ${e.source}`
}

/**
 * The change ledger: one line per field, `LABEL  old → new` in tabular mono. The
 * prototype measures its width with a ResizeObserver to stack below 300px; here
 * a CSS container query does it.
 */
function Ledger({ changes }: { changes: readonly FieldChange[] }) {
  return (
    <div className="tw:@container tw:mt-0.5 tw:flex tw:flex-col tw:gap-[3px] tw:rounded-ctl tw:bg-sunken tw:px-2.5 tw:py-2">
      {changes.map((c) => (
        <div key={c.key} className="tw:flex tw:items-baseline tw:gap-2.5 tw:@max-[280px]:flex-col tw:@max-[280px]:items-stretch tw:@max-[280px]:gap-px">
          <span className="tw:w-[108px] tw:flex-none tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase tw:@max-[280px]:w-auto">{c.label}</span>
          <span className="tw:min-w-0 tw:font-mono tw:text-[12.5px] tw:leading-[18px] tw:tabular-nums">
            {c.before !== undefined && c.after !== undefined ? (
              <>
                <span className="tw:text-slate">{c.before}</span>
                <span className="tw:px-1.5 tw:text-mist">→</span>
                <span className="tw:font-semibold tw:text-ink">{c.after}</span>
              </>
            ) : (
              <span className="tw:text-ink">{c.after ?? c.before}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

function Steps({ steps, names }: { steps: readonly AuditEntry[]; names: Names }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-1.5">
      {steps.map((s) => (
        <div key={s.id} className="tw:border-l-2 tw:border-line tw:pl-2">
          <Ledger changes={auditFieldChanges(s, names) as FieldChange[]} />
        </div>
      ))}
    </div>
  )
}

function GroupBody({ group }: { group: AuditGroup }) {
  const coalesced = group.steps.length > 1
  return (
    <>
      <div className="tw:flex tw:items-baseline tw:gap-2">
        <span className="tw:min-w-0 tw:flex-1 tw:text-[13.5px] tw:font-semibold tw:text-teal-pressed">{actionLabel(group.entry.action)}</span>
        {coalesced && <Badge className="tw:bg-teal-tint tw:text-teal-pressed tw:text-[10.5px]">{group.steps.length} changes</Badge>}
      </div>
      <span className="tw:text-xs tw:text-slate">{provenance(group.entry)}</span>
    </>
  )
}

function GroupRow({ group, time, last, names, steps }: { group: AuditGroup; time: string; last: boolean; names: Names; steps: StepsStyle }) {
  const [open, setOpen] = useState(false)
  const coalesced = group.steps.length > 1
  return (
    <div className={cn('tw:flex tw:items-start tw:gap-3 tw:py-2.5', !last && 'tw:border-b tw:border-line')}>
      <span className="tw:w-10 tw:flex-none tw:pt-0.5 tw:font-mono tw:text-[11.5px] tw:text-mist tw:tabular-nums">{time}</span>
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
        <GroupBody group={group} />
        {group.changes.length > 0 && <Ledger changes={group.changes} />}
        {coalesced && steps === 'link' && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger render={<Button variant="link" className="tw:mt-0.5 tw:text-xs" />}>
              {open ? `Hide the ${group.steps.length} steps` : `Show the ${group.steps.length} steps`}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Steps steps={group.steps} names={names} />
            </CollapsibleContent>
          </Collapsible>
        )}
        {coalesced && steps === 'accordion' && (
          <Accordion>
            <AccordionItem value="steps" className="tw:border-0">
              <AccordionTrigger className="tw:py-1 tw:text-xs tw:text-primary">{`The ${group.steps.length} steps`}</AccordionTrigger>
              <AccordionContent className="tw:pb-0">
                <Steps steps={group.steps} names={names} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  )
}

/** The merged, newest-first audit trail of the given ids, as HistorySheet reads it. */
function useEntries(entityIds: readonly string[]): AuditEntry[] {
  const audit: AuditEntry[] = useAppStore((s: { audit: AuditEntry[] }) => s.audit)
  const key = entityIds.join('|')
  return useMemo(() => {
    const ids = new Set(key.split('|'))
    const named = (a: AuditEntry) => {
      const listed = (a.after as { draftListIds?: unknown } | undefined)?.draftListIds
      return Array.isArray(listed) && listed.some((id) => ids.has(id as string))
    }
    return sortAuditNewestFirst(audit.filter((a) => ids.has(a.entityId) || named(a))) as AuditEntry[]
  }, [audit, key])
}

/**
 * The shared History affordance as a shadcn Dialog: the title, the mist intro,
 * day headings, the time gutter (blank when repeated), the ledger and coalesced
 * groups whose steps expand (Collapsible link, or Accordion).
 */
export function HistoryDialog({
  open,
  onOpenChange,
  entityIds,
  title,
  steps = 'link',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityIds: readonly string[]
  title: string
  steps?: StepsStyle
}) {
  const entries = useEntries(entityIds)
  const todayISO = useToday() as string
  const rvgGroups = useAppStore((s: { masters: { rvgGroups: unknown } }) => s.masters.rvgGroups)
  const names = useMemo(() => auditNamesFor({ rvgGroups }), [rvgGroups])
  const groups = useMemo(() => coalesceAudit(entries, names) as AuditGroup[], [entries, names])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="tw:gap-3">
        <DialogHeader className="tw:gap-3">
          <DialogTitle className="tw:text-lg tw:font-bold">{title}</DialogTitle>
          <DialogDescription className="tw:text-[12.5px] tw:text-mist">Every change to this record, most recent first.</DialogDescription>
        </DialogHeader>
        {groups.length === 0 ? (
          <div className="tw:text-[13px] tw:text-mist">No changes recorded yet. Every edit to this {subjectFrom(title)} will appear here.</div>
        ) : (
          <div className="tw:flex tw:flex-col">
            {groups.map((g, i) => {
              const day = g.entry.atISO.slice(0, 10)
              const prev = groups[i - 1]
              const newDay = prev === undefined || prev.entry.atISO.slice(0, 10) !== day
              const time = hhmm(g.entry.atISO) as string
              const repeated = !newDay && prev !== undefined && hhmm(prev.entry.atISO) === time
              return (
                <div key={g.entry.id}>
                  {newDay && (
                    <h3 className={cn('tw:m-0 tw:pb-2 tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase', i === 0 ? 'tw:pt-0.5' : 'tw:pt-[18px]')}>
                      {dayHeading(day, todayISO)}
                    </h3>
                  )}
                  <GroupRow group={g} time={repeated ? '' : time} last={i === groups.length - 1} names={names} steps={steps} />
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** The catalogue example: "List history" for the first submitted List and its session. */
export function HistorySheetReplacement({ steps = 'link' }: { steps?: StepsStyle }) {
  const { submittedListId } = useSeedIds() as { submittedListId?: string }
  const slotId = useAppStore((s: { schedule: { lists: Record<string, { slotId?: string }> } }) =>
    submittedListId !== undefined ? s.schedule.lists[submittedListId]?.slotId : undefined,
  )
  const [open, setOpen] = useState(false)
  if (submittedListId === undefined) return <Missing what="submitted Lists" />
  return (
    <div>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        List history
      </Button>
      <HistoryDialog open={open} onOpenChange={setOpen} entityIds={slotId !== undefined ? [submittedListId, slotId] : [submittedListId]} title="List history" steps={steps} />
    </div>
  )
}
