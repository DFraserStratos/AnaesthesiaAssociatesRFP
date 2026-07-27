import { useEffect, useRef, useState } from 'react'
import type { AuditEntry } from '../../domain/types'
import { accent, neutral, radius } from '../../theme/tokens'
import { easing, motion } from '../../theme/motion'
import { useToday } from '../../store'
import { dayHeading, hhmm } from '../format'
import { actionLabel, auditFieldChanges, coalesceAudit, type AuditFieldChange, type AuditGroup } from '../audit'

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
}: {
  entries: readonly AuditEntry[]
  /**
   * Optional `entityId` -> scope label ("Procedure 2 · Total hip"), for a Card
   * whose trail merges several procedures. Omitted on a single-entity history,
   * where naming the entity on every row would be noise.
   */
  entityLabels?: Record<string, string>
  /** What the empty state calls the thing being read ("card", "list"). */
  subject?: string
}) {
  const todayISO = useToday()
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

  const groups = coalesceAudit(entries)

  return (
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
            <GroupRow
              group={group}
              time={repeatedTime ? '' : time}
              stacked={stacked}
              last={index === groups.length - 1}
              {...(entityLabels !== undefined ? { entityLabels } : {})}
            />
          </div>
        )
      })}
    </div>
  )
}

function DayHeading({ label, first }: { label: string; first: boolean }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: neutral.mist,
        padding: first ? '2px 0 8px' : '18px 0 8px',
      }}
    >
      {label}
    </div>
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
}: {
  group: AuditGroup
  time: string
  stacked: boolean
  /** The final row carries no rule, so the list does not end on a stray line. */
  last: boolean
  entityLabels?: Record<string, string>
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
            <span
              style={{
                flex: 'none',
                fontSize: 10.5,
                fontWeight: 600,
                color: accent.pressed,
                background: accent.tint,
                borderRadius: radius.pill,
                padding: '1px 8px',
              }}
            >
              {steps.length} changes
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: neutral.slate }}>{provenance(entry)}</span>
        {scope !== undefined && <span style={{ fontSize: 11.5, color: neutral.mist }}>{scope}</span>}
        {changes.length > 0 && <Ledger changes={changes} stacked={stacked} />}
        {coalesced && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                alignSelf: 'flex-start',
                border: 'none',
                background: 'none',
                padding: 0,
                marginTop: 2,
                color: accent.base,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {expanded ? `Hide the ${steps.length} steps` : `Show the ${steps.length} steps`}
            </button>
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
          <span
            style={{
              flex: 'none',
              width: stacked ? undefined : LABEL_WIDTH,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: neutral.mist,
            }}
          >
            {change.label}
          </span>
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
  return (
    <div style={{ borderLeft: `2px solid ${neutral.line}`, paddingLeft: 8 }}>
      <Ledger changes={auditFieldChanges(step)} stacked={stacked} />
    </div>
  )
}
