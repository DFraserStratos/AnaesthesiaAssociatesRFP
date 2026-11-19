import { useBookingStore } from './draft'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AuditEntry, ChangeSetKind } from '../../domain/types'
import { accent, neutral, radius } from '../../theme/tokens'
import { easing, motion } from '../../theme/motion'
import { Pill } from '../ui/Pill'
import { Eyebrow } from '../ui/Eyebrow'
import { TextAction } from '../ui/TextAction'
import { useToday } from '../../store'
import { dayHeading, hhmm } from '../format'
import { actionLabel, auditFieldChanges, auditNamesFor, coalesceAudit, sortAuditNewestFirst, type AuditFieldChange, type AuditGroup, type AuditNames } from '../audit'

/** Names for ids in audit values (an RVG group by its code and description, catch-up Phase 19). */
const NamesContext = createContext<AuditNames>({})

/** Content width below which the ledger stacks (see the note in the observer). */
const STACK_BELOW = 300

/** The ledger's fixed label column, the anchor the values align against. */
const LABEL_WIDTH = 108

/**
 * A per-entity history timeline (Phase 07 shared affordance), rewritten in the
 * audit-presentation fix: the append-only trail for one entity read as plain
 * English change records, newest first. Pure over the entries it is given
 * (`auditForEntity`'s output) — used by the `HistorySheet` and reusable anywhere
 * an entity's reconstructable history is shown (A6/A7).
 *
 * Four structural decisions, all in service of legibility (the old surface
 * printed `JSON.stringify` of the patch):
 *
 * DAY HEADING + SUPPRESSED TIME GUTTER. The demo clock is pinned, so a run of
 * live edits all carry one timestamp. Printing it twelve times reads as a broken
 * clock; printing it once, under a day heading, reads as "these happened
 * together" — and reclaims the width the JSON was wrapping in.
 *
 * THE CHANGE LEDGER. One line per changed field, `LABEL  old → new`, values in
 * tabular mono aligned around the arrow, so a numeric ratchet forms a visible
 * staircase. Below ~360px of available width the ledger stacks the label above
 * the values rather than breaking the alignment.
 *
 * COALESCED GROUPS. Consecutive single-field edits by one actor at one timestamp
 * collapse to one net statement with a count chip and a toggle; the stored trail
 * is untouched (see `coalesceAudit`).
 *
 * NO SEMANTIC COLOUR. Nothing in a history is a warning or an error, and tinting
 * rows would imply a judgement the audit does not make.
 */
export function HistoryTimeline({
  entries,
  entityLabels,
  subject = 'record',
  onViewAsAt,
}: {
  entries: readonly AuditEntry[]
  /**
   * Optional `entityId` -> scope label ("Procedure 2 · Total hip"), for a Booking
   * whose trail merges several procedures. Omitted on a single-entity history,
   * where naming the entity on every row would be noise.
   */
  entityLabels?: Record<string, string>
  /** What the empty state calls the thing being read ("booking", "list"). */
  subject?: string
  /**
   * Admin only (catch-up Phase 35; US-02.5.5): each row offers "View as at",
   * which calls this with the row's newest audit entry id.
   */
  onViewAsAt?: (entryId: string) => void
}) {
  const todayISO = useToday()
  const rvgGroups = useBookingStore((s) => s.masters.rvgGroups)
  const contracts = useBookingStore((s) => s.masters.contracts)
  const names = useMemo(() => auditNamesFor({ rvgGroups, contracts }), [rvgGroups, contracts])
  const rootRef = useRef<HTMLDivElement>(null)
  const [stacked, setStacked] = useState(false)

  // The ledger's aligned value column costs horizontal room; below what it needs
  // it stacks the label above the values instead of breaking the alignment.
  // Measured, not guessed: the same component renders inside a bottom sheet and
  // a desktop dialog. The threshold is what the aligned form costs — gutter 40 +
  // gap 12 + ledger padding 20 + label 108 + gap 10 + value room — so the design
  // phone (390px, 350px inside the sheet's 20px padding) keeps the alignment and
  // only a genuinely narrow viewport stacks.
  useEffect(() => {
    const node = rootRef.current
    if (node === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((observed) => {
      const width = observed[0]?.contentRect.width ?? 0
      if (width > 0) setStacked(width < STACK_BELOW)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (entries.length === 0) {
    return (
      <div style={{ fontSize: 13, color: neutral.mist }}>
        No changes recorded yet. Every edit to this {subject} will appear here.
      </div>
    )
  }

  const groups = historyRows(entries, names)

  return (
    <NamesContext.Provider value={names}>
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column' }}>
      {groups.map((group, index) => {
        const day = group.entry.atISO.slice(0, 10)
        const previous = groups[index - 1]
        const newDay = previous === undefined || previous.entry.atISO.slice(0, 10) !== day
        // The gutter prints a time only when it differs from the row above.
        const time = hhmm(group.entry.atISO)
        const repeatedTime = !newDay && previous !== undefined && hhmm(previous.entry.atISO) === time
        return (
          <div key={group.entry.id}>
            {newDay && <DayHeading label={dayHeading(day, todayISO)} first={index === 0} />}
            {group.changeSet !== undefined ? (
              <ChangeSetRow
                group={group.changeSet}
                time={repeatedTime ? '' : time}
                stacked={stacked}
                last={index === groups.length - 1}
                {...(entityLabels !== undefined ? { entityLabels } : {})}
                {...(onViewAsAt !== undefined ? { onViewAsAt } : {})}
              />
            ) : (
              <GroupRow
                group={group}
                time={repeatedTime ? '' : time}
                stacked={stacked}
                last={index === groups.length - 1}
                {...(entityLabels !== undefined ? { entityLabels } : {})}
                {...(onViewAsAt !== undefined ? { onViewAsAt } : {})}
              />
            )}
          </div>
        )
      })}
    </div>
    </NamesContext.Provider>
  )
}

function DayHeading({ label, first }: { label: string; first: boolean }) {
  return (
    <Eyebrow style={{ padding: first ? '2px 0 8px' : '18px 0 8px' }}>
      {label}
    </Eyebrow>
  )
}

/** Who acted, collapsed when the role and the source say the same thing. */
function provenance(entry: AuditEntry): string {
  return entry.role === entry.source
    ? `${entry.who} · ${entry.role}`
    : `${entry.who} · ${entry.role} · ${entry.source}`
}

function GroupRow({
  group,
  time,
  stacked,
  last,
  entityLabels,
  onViewAsAt,
}: {
  group: AuditGroup
  time: string
  stacked: boolean
  /** The final row carries no rule, so the list does not end on a stray line. */
  last: boolean
  entityLabels?: Record<string, string>
  onViewAsAt?: (entryId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { entry, steps, changes } = group
  const coalesced = steps.length > 1
  const scope = entityLabels?.[entry.entityId]

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 0',
        borderBottom: last ? 'none' : `1px solid ${neutral.line}`,
        alignItems: 'flex-start',
      }}
    >
      <span className="mono" style={{ fontSize: 11.5, color: neutral.mist, flex: 'none', width: 40, paddingTop: 2 }}>
        {time}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: accent.pressed, flex: 1, minWidth: 0 }}>
            {actionLabel(entry.action)}
          </span>
          {coalesced && (
            <Pill size="sm" style={{ flex: 'none' }}>
              {steps.length} changes
            </Pill>
          )}
        </div>
        <span style={{ fontSize: 12, color: neutral.slate }}>{provenance(entry)}</span>
        {scope !== undefined && <span style={{ fontSize: 11.5, color: neutral.mist }}>{scope}</span>}
        {changes.length > 0 && <Ledger changes={changes} stacked={stacked} />}
        {onViewAsAt !== undefined && <ViewAsAt onClick={() => onViewAsAt(entry.id)} />}
        {coalesced && (
          <>
            <TextAction size="sm" flush onClick={() => setExpanded((v) => !v)} style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 12 }}>
              {expanded ? `Hide the ${steps.length} steps` : `Show the ${steps.length} steps`}
            </TextAction>
            <Steps steps={steps} expanded={expanded} stacked={stacked} />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * The change ledger: one line per field. Values are mono/tabular and align
 * around the arrow, which is what makes a run of numeric edits legible as
 * movement. `→` is house-legal user-facing copy (the ban is en/em dashes).
 */
function Ledger({ changes, stacked }: { changes: readonly AuditFieldChange[]; stacked: boolean }) {
  return (
    <div
      style={{
        background: neutral.sunken,
        borderRadius: radius.ctl,
        padding: '8px 10px',
        marginTop: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: stacked ? 6 : 3,
      }}
    >
      {changes.map((change) => (
        <div
          key={change.key}
          style={{
            display: 'flex',
            flexDirection: stacked ? 'column' : 'row',
            alignItems: stacked ? 'stretch' : 'baseline',
            gap: stacked ? 1 : 10,
          }}
        >
          <Eyebrow as="span" style={{ flex: 'none', width: stacked ? undefined : LABEL_WIDTH }}>
            {change.label}
          </Eyebrow>
          <span style={{ minWidth: 0, fontSize: 12.5, lineHeight: '18px' }}>
            {change.before !== undefined && change.after !== undefined ? (
              <>
                <span className="mono" style={{ color: neutral.slate }}>{change.before}</span>
                <span className="mono" style={{ color: neutral.mist, padding: '0 6px' }}>→</span>
                <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{change.after}</span>
              </>
            ) : (
              <span className="mono" style={{ color: neutral.ink }}>{change.after ?? change.before}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * The individual writes behind a coalesced group, newest first (matching the
 * feed around them). Height transitions on the sheet easing; reduced motion
 * collapses it to an 80ms fade in `global.css`.
 */
function Steps({
  steps,
  expanded,
  stacked,
}: {
  steps: readonly AuditEntry[]
  expanded: boolean
  stacked: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: `grid-template-rows ${motion.sheetIn.out}ms ${easing.sheet}`,
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6 }}>
          {steps.map((step) => (
            <StepLedger key={step.id} step={step} stacked={stacked} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** One write behind a group: its own ledger (a single-field edit, by construction). */
function StepLedger({ step, stacked }: { step: AuditEntry; stacked: boolean }) {
  const names = useContext(NamesContext)
  return (
    <div style={{ borderLeft: `2px solid ${neutral.line}`, paddingLeft: 8 }}>
      <Ledger changes={auditFieldChanges(step, names)} stacked={stacked} />
    </div>
  )
}

/** One history row: a change set (catch-up Phase 35), or a coalesced group of ungrouped entries. */
type HistoryRow = AuditGroup & { changeSet?: ChangeSetRowGroup }

interface ChangeSetRowGroup {
  id: string
  kind: ChangeSetKind | null
  /** The newest entry (the row's place in the feed). */
  newest: AuditEntry
  /** Every entry of the change set, oldest first. */
  entries: AuditEntry[]
}

/**
 * The rows of a history, newest first: each change set is ONE row (a save, a
 * create, a cancel, a move, a List's reassignment, an applied hospital row),
 * and the entries saved without one coalesce as before, never across a
 * change set (`coalesceAudit`).
 */
function historyRows(entries: readonly AuditEntry[], names: AuditNames): HistoryRow[] {
  const sorted = sortAuditNewestFirst(entries)
  const sets = new Map<string, ChangeSetRowGroup>()
  for (const e of sorted) {
    if (e.changeSetId === undefined) continue
    const group = sets.get(e.changeSetId)
    if (group === undefined) sets.set(e.changeSetId, { id: e.changeSetId, kind: e.changeSetKind ?? null, newest: e, entries: [e] })
    else {
      group.entries.unshift(e)
      if (e.changeSetKind !== undefined) group.kind = e.changeSetKind
    }
  }
  const rows: HistoryRow[] = []
  let run: AuditEntry[] = []
  const flush = () => {
    if (run.length > 0) rows.push(...coalesceAudit(run, names))
    run = []
  }
  const seen = new Set<string>()
  for (const e of sorted) {
    if (e.changeSetId === undefined) {
      run.push(e)
      continue
    }
    flush()
    if (seen.has(e.changeSetId)) continue
    seen.add(e.changeSetId)
    const group = sets.get(e.changeSetId)!
    rows.push({ entry: group.newest, steps: [group.newest], changes: [], changeSet: group })
  }
  flush()
  return rows
}

/** Change-set titles; a `listReassign` is titled by its List entry's action (a return to the office is no new anaesthetist). */
const CHANGE_SET_TITLES: Record<Exclude<ChangeSetKind, 'listReassign'>, string> = {
  save: 'Saved',
  create: 'Booking created',
  cancel: 'Booking cancelled',
  move: 'Booking moved',
  match: "Updated from the hospital's list",
}

function changeSetTitle(kind: ChangeSetKind | null, entries: readonly AuditEntry[]): string {
  const first = entries[0]!
  if (kind === 'save') return `Saved by ${first.who}`
  if (kind === 'listReassign') return actionLabel((entries.find((e) => e.entityType === 'list') ?? first).action)
  if (kind !== null) return CHANGE_SET_TITLES[kind]
  return actionLabel(first.action)
}

/** A change set as one row: who saved it, how many fields, and each field's before and after beneath. */
function ChangeSetRow({
  group,
  time,
  stacked,
  last,
  entityLabels,
  onViewAsAt,
}: {
  group: ChangeSetRowGroup
  time: string
  stacked: boolean
  last: boolean
  entityLabels?: Record<string, string>
  onViewAsAt?: (entryId: string) => void
}) {
  const names = useContext(NamesContext)
  const header = group.entries.find((e) => e.action === 'booking.save')
  const parts = group.entries
    .filter((e) => e.action !== 'booking.save')
    .map((e) => ({ entry: e, changes: auditFieldChanges(e, names).filter((c) => c.key !== 'bookingId') }))
  const count = header !== undefined ? ((header.after as { fields?: unknown[] } | undefined)?.fields?.length ?? parts.length) : parts.length
  const first = group.entries[0]!
  const title = changeSetTitle(group.kind, group.entries)
  return (
    <div
      data-shot="history-change-set"
      data-change-set-id={group.id}
      style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${neutral.line}`, alignItems: 'flex-start' }}
    >
      <span className="mono" style={{ fontSize: 11.5, color: neutral.mist, flex: 'none', width: 40, paddingTop: 2 }}>
        {time}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: accent.pressed, flex: 1, minWidth: 0 }}>{title}</span>
          <Pill size="sm" style={{ flex: 'none' }}>
            {count} {count === 1 ? 'change' : 'changes'}
          </Pill>
        </div>
        <span style={{ fontSize: 12, color: neutral.slate }}>
          {provenance(first)} · <span className="mono">{group.id}</span>
        </span>
        {parts.map(({ entry, changes }) => {
          const scope = entityLabels?.[entry.entityId]
          return (
            <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: neutral.mist }}>
                {actionLabel(entry.action)}
                {scope !== undefined ? ` · ${scope}` : ''}
              </span>
              {changes.length > 0 && <Ledger changes={changes} stacked={stacked} />}
            </div>
          )
        })}
        {onViewAsAt !== undefined && <ViewAsAt onClick={() => onViewAsAt(group.newest.id)} />}
      </div>
    </div>
  )
}

function ViewAsAt({ onClick }: { onClick: () => void }) {
  return (
    <TextAction size="sm" flush shot="history-view-as-at" onClick={onClick} style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 12 }}>
      View as at
    </TextAction>
  )
}
