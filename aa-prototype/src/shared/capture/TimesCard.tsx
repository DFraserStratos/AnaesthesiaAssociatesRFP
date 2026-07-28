import { accent, neutral } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { Procedure } from '../../domain/types'
import { timeUnitsFromMinutes, type BillingValidationFailure } from '../../domain/billing'
import { clockISO, editProcedure, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import { durationLabel, isoTimeLabel, minutesBetweenIso, shiftIsoMinutes } from './timeIso'
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
 * the validator only requires handover after start). ISO shifts are string
 * maths on the local-naive shape (`timeIso.ts`), never Date → toISOString.
 * The duration strip repeats the tiered rule and the ROUNDING ASSUMPTION
 * (Decisions log 2026-07-22: the RFP is silent on partial intervals).
 *
 * The stamps and the duration strip go through `useSurface().Pair`: stacked on
 * the phone and side by side on a desktop. On the phone one action travels
 * between the two time cells; desktop retains its static two-column treatment.
 * It is the one `align="start"` pair because these halves are content inside
 * this card, not peer cards that should stretch to matching heights.
 */
export function TimesCard({ procedure, actor, canCapture, failures, onError }: TimesCardProps) {
  const { Pair, variant } = useSurface()

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
    write({ handoverISO: clockISO(useAppStore.getState().clock) })
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
  const minutes = start !== undefined && finish !== undefined ? minutesBetweenIso(start, finish) : null

  return (
    <CaptureSection
      label="Times"
      validationTarget={{
        procedureId: procedure.id,
        fields: ['anaestheticStartISO', 'handoverISO'],
      }}
    >
      <Pair align="start">
        {variant === 'mobile' ? (
          <MobileTimeCapture
            procedureId={procedure.id}
            start={start}
            finish={finish}
            canCapture={canCapture}
            onStampStart={stampStart}
            onStampFinish={stampFinish}
            onNudgeStart={nudgeStart}
            onNudgeFinish={nudgeFinish}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {start !== undefined ? (
                <RecordedTime label="Start" iso={start} canCapture={canCapture} onNudge={nudgeStart} />
              ) : canCapture ? (
                <StampButton
                  label="Start now"
                  procedureId={procedure.id}
                  field="anaestheticStartISO"
                  onClick={stampStart}
                />
              ) : (
                <MissingTime label="Start" />
              )}
            </div>

            {start !== undefined && (
              <div>
                {finish !== undefined ? (
                  <RecordedTime label="Finish" iso={finish} canCapture={canCapture} onNudge={nudgeFinish} />
                ) : canCapture ? (
                  <StampButton
                    label="Finish now"
                    procedureId={procedure.id}
                    field="handoverISO"
                    onClick={stampFinish}
                  />
                ) : (
                  <MissingTime label="Finish" />
                )}
              </div>
            )}
          </div>
        )}

        {minutes !== null && minutes > 0 && (
          <div style={{ fontSize: 12, color: neutral.slate, background: neutral.bg, borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>
              Duration {durationLabel(minutes)} →{' '}
              <strong style={{ color: neutral.ink }}>
                {timeUnitsFromMinutes(minutes)} time {timeUnitsFromMinutes(minutes) === 1 ? 'unit' : 'units'}
              </strong>
            </span>
            <span style={{ color: neutral.mist }}>
              1 unit per 15 min for the first 2 hours, then 1 per 10 min. Part intervals round up
              (assumption to confirm with AA).
            </span>
          </div>
        )}
      </Pair>

      <FailureNotes failures={[...startFailures, ...finishFailures]} />
    </CaptureSection>
  )
}

interface MobileTimeCaptureProps {
  procedureId: string
  start: string | undefined
  finish: string | undefined
  canCapture: boolean
  onStampStart: () => void
  onStampFinish: () => void
  onNudgeStart: (delta: number) => void
  onNudgeFinish: (delta: number) => void
}

/**
 * The phone presents Start and Finish as one travelling action. The recorded
 * time controls stay in their grid cells underneath it, so stamping the start
 * reveals the left controls as the same teal action moves to the right.
 */
function MobileTimeCapture({
  procedureId,
  start,
  finish,
  canCapture,
  onStampStart,
  onStampFinish,
  onNudgeStart,
  onNudgeFinish,
}: MobileTimeCaptureProps) {
  const hasStart = start !== undefined
  const showStartDetails = hasStart || !canCapture
  const showFinishDetails = hasStart && (finish !== undefined || !canCapture)

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        minHeight: 96,
        alignItems: 'start',
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
          <RecordedTime label="Start" iso={start} canCapture={canCapture} onNudge={onNudgeStart} />
        ) : !canCapture ? (
          <MissingTime label="Start" />
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
          <RecordedTime label="Finish" iso={finish} canCapture={canCapture} onNudge={onNudgeFinish} />
        ) : hasStart && !canCapture ? (
          <MissingTime label="Finish" />
        ) : null}
      </div>

      {canCapture && finish === undefined && (
        <div
          className="aa-time-action-slider"
          data-testid="mobile-time-action-slider"
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
}: {
  label: 'Start' | 'Finish'
  iso: string
  canCapture: boolean
  onNudge: (delta: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

function MissingTime({ label }: { label: 'Start' | 'Finish' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
}: {
  label: string
  procedureId: string
  field: 'anaestheticStartISO' | 'handoverISO'
  onClick: () => void
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
        minHeight: 96,
        width: '100%',
      }}
    >
      {label}
    </button>
  )
}
