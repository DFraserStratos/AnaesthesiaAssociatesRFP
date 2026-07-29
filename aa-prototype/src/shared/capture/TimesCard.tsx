import { accent, neutral } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { clockISO, editProcedure, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import { isoTimeLabel, minutesBetweenIso, shiftIsoMinutes } from './timeIso'
import { CaptureSection, FailureNotes, NudgeButton } from './ui'

interface TimesCardProps {
  procedure: Procedure
  actor: Actor
  canCapture: boolean
  /** anaestheticStartISO / handoverISO failures (shown post-latch, verbatim). */
  failures: BillingValidationFailure[]
  onError: (message: string) => void
}

/**
 * Start / Finish capture (mockup screen 3's Times card): big mono stamps with
 * −5/+5 nudges, "Start now" / "Finish now" stamping the demo clock (the demo
 * clock is the time authority — Start now works before the scheduled time;
 * Finish now falls back to five minutes after start when that clock is earlier).
 * ISO shifts are string maths on the local-naive shape (`timeIso.ts`), never
 * Date → toISOString.
 *
 * Both surfaces use one action that travels between two equal time cells.
 * Stamping the start reveals its controls as the same teal action moves to the
 * finish position. The phone keeps the tall, touch-first treatment; desktop
 * lays each label, time and nudge pair into one compact horizontal row. The
 * full-width track avoids nesting the cells inside another pair of columns.
 */
export function TimesCard({ procedure, actor, canCapture, failures, onError }: TimesCardProps) {
  const { variant } = useSurface()
  const start = procedure.anaestheticStartISO
  const finish = procedure.handoverISO

  function write(patch: Parameters<typeof editProcedure>[3]) {
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
  }

  function stampStart() {
    write({ anaestheticStartISO: clockISO(useAppStore.getState().clock) })
  }
  function stampFinish() {
    const stamped = clockISO(useAppStore.getState().clock)
    const earliest = start === undefined ? stamped : shiftIsoMinutes(start, 5)
    write({
      handoverISO:
        start !== undefined && minutesBetweenIso(start, stamped) < 5 ? earliest : stamped,
    })
  }

  function nudgeStart(delta: number) {
    if (start === undefined) return
    let next = shiftIsoMinutes(start, delta)
    // Keep at least 5 minutes before the handover.
    if (finish !== undefined && minutesBetweenIso(next, finish) < 5) next = shiftIsoMinutes(finish, -5)
    write({ anaestheticStartISO: next })
  }
  function nudgeFinish(delta: number) {
    if (finish === undefined) return
    let next = shiftIsoMinutes(finish, delta)
    // Keep at least 5 minutes after the start.
    if (start !== undefined && minutesBetweenIso(start, next) < 5) next = shiftIsoMinutes(start, 5)
    write({ handoverISO: next })
  }

  const startFailures = failures.filter((f) => f.field === 'anaestheticStartISO')
  const finishFailures = failures.filter((f) => f.field === 'handoverISO')

  return (
    <CaptureSection
      label="Times"
      validationTarget={{
        procedureId: procedure.id,
        fields: ['anaestheticStartISO', 'handoverISO'],
      }}
    >
      <TimeCapture
        procedureId={procedure.id}
        start={start}
        finish={finish}
        canCapture={canCapture}
        onStampStart={stampStart}
        onStampFinish={stampFinish}
        onNudgeStart={nudgeStart}
        onNudgeFinish={nudgeFinish}
        compact={variant === 'web'}
      />

      <FailureNotes failures={[...startFailures, ...finishFailures]} />
    </CaptureSection>
  )
}

interface TimeCaptureProps {
  procedureId: string
  start: string | undefined
  finish: string | undefined
  canCapture: boolean
  onStampStart: () => void
  onStampFinish: () => void
  onNudgeStart: (delta: number) => void
  onNudgeFinish: (delta: number) => void
  compact: boolean
}

/**
 * Start and Finish are one travelling action. The recorded time controls stay
 * in their grid cells underneath it, so stamping the start reveals the left
 * controls as the same teal action moves to the right.
 */
function TimeCapture({
  procedureId,
  start,
  finish,
  canCapture,
  onStampStart,
  onStampFinish,
  onNudgeStart,
  onNudgeFinish,
  compact,
}: TimeCaptureProps) {
  const hasStart = start !== undefined
  const showStartDetails = hasStart || !canCapture
  const showFinishDetails = hasStart && (finish !== undefined || !canCapture)

  return (
    <div
      data-testid="time-capture-track"
      data-layout={compact ? 'compact' : 'touch'}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        minHeight: compact ? 56 : 96,
        width: '100%',
        alignItems: compact ? 'center' : 'start',
      }}
    >
      <div
        className="aa-time-details-reveal"
        aria-hidden={!showStartDetails}
        style={{
          minWidth: 0,
          opacity: showStartDetails ? 1 : 0,
          transform: showStartDetails ? 'translateY(0)' : 'translateY(4px)',
          transition: `opacity ${motion.valueTick.stepDuration}ms ease-out 50ms, transform ${motion.valueTick.stepDuration}ms ease-out 50ms`,
          pointerEvents: showStartDetails ? 'auto' : 'none',
        }}
      >
        {start !== undefined ? (
          <RecordedTime
            label="Start"
            iso={start}
            canCapture={canCapture}
            onNudge={onNudgeStart}
            compact={compact}
          />
        ) : !canCapture ? (
          <MissingTime label="Start" compact={compact} />
        ) : null}
      </div>

      <div
        className="aa-time-details-reveal"
        aria-hidden={!showFinishDetails}
        style={{
          minWidth: 0,
          opacity: showFinishDetails ? 1 : 0,
          transform: showFinishDetails ? 'translateY(0)' : 'translateY(4px)',
          transition: `opacity ${motion.valueTick.stepDuration}ms ease-out 50ms, transform ${motion.valueTick.stepDuration}ms ease-out 50ms`,
          pointerEvents: showFinishDetails ? 'auto' : 'none',
        }}
      >
        {finish !== undefined ? (
          <RecordedTime
            label="Finish"
            iso={finish}
            canCapture={canCapture}
            onNudge={onNudgeFinish}
            compact={compact}
          />
        ) : hasStart && !canCapture ? (
          <MissingTime label="Finish" compact={compact} />
        ) : null}
      </div>

      {canCapture && finish === undefined && (
        <div
          className="aa-time-action-slider"
          data-testid="time-action-slider"
          data-position={hasStart ? 'right' : 'left'}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 'calc((100% - 12px) / 2)',
            transform: hasStart ? 'translateX(calc(100% + 12px))' : 'translateX(0)',
            transition: `transform ${motion.cardAdvance.in}ms ${motion.cardAdvance.easing}`,
            willChange: 'transform',
          }}
        >
          <StampButton
            label={hasStart ? 'Finish now' : 'Start now'}
            procedureId={procedureId}
            field={hasStart ? 'handoverISO' : 'anaestheticStartISO'}
            onClick={hasStart ? onStampFinish : onStampStart}
            compact={compact}
          />
        </div>
      )}
    </div>
  )
}

function RecordedTime({
  label,
  iso,
  canCapture,
  onNudge,
  compact,
}: {
  label: 'Start' | 'Finish'
  iso: string
  canCapture: boolean
  onNudge: (delta: number) => void
  compact: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'stretch',
        gap: compact ? 12 : 6,
        minHeight: compact ? 56 : undefined,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{label}</div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{isoTimeLabel(iso)}</div>
      {canCapture && (
        <div style={{ display: 'flex', gap: 6 }}>
          <NudgeButton label="−5" onClick={() => onNudge(-5)} />
          <NudgeButton label="+5" onClick={() => onNudge(5)} />
        </div>
      )}
    </div>
  )
}

function MissingTime({ label, compact }: { label: 'Start' | 'Finish'; compact: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'stretch',
        gap: compact ? 12 : 6,
        minHeight: compact ? 56 : undefined,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{label}</div>
      <div style={{ fontSize: 14, color: neutral.mist }}>Not recorded</div>
    </div>
  )
}

/** The full-height teal stamp button (mockup's "Finish now"). */
function StampButton({
  label,
  procedureId,
  field,
  onClick,
  compact,
}: {
  label: string
  procedureId: string
  field: 'anaestheticStartISO' | 'handoverISO'
  onClick: () => void
  compact: boolean
}) {
  return (
    <button
      type="button"
      data-validation-procedure-id={procedureId}
      data-validation-fields={field}
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 12,
        background: accent.base,
        color: neutral.surface,
        fontFamily: 'inherit',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: compact ? 56 : 96,
        width: '100%',
      }}
    >
      {label}
    </button>
  )
}
