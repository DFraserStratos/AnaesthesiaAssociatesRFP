import { useState } from 'react'
import { accent, neutral } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { timeUnitsFromMinutes, type BillingValidationFailure } from '../../../domain/billing'
import { clockISO, editProcedure, useAppStore, type Actor } from '../../../store'
import { durationLabel, isoTimeLabel, minutesBetweenIso, shiftIsoMinutes } from './timeIso'
import { CaptureSection, Caption, FailureNotes, NudgeButton } from './ui'

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
 */
export function TimesCard({ procedure, actor, canCapture, failures, onError }: TimesCardProps) {
  const [stamped, setStamped] = useState<{ start: boolean; finish: boolean }>({ start: false, finish: false })

  const start = procedure.anaestheticStartISO
  const finish = procedure.handoverISO

  function write(patch: Parameters<typeof editProcedure>[3]) {
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
    return outcome.ok
  }

  function stampStart() {
    if (write({ anaestheticStartISO: clockISO(useAppStore.getState().clock) })) {
      setStamped((s) => ({ ...s, start: true }))
    }
  }
  function stampFinish() {
    if (write({ handoverISO: clockISO(useAppStore.getState().clock) })) {
      setStamped((s) => ({ ...s, finish: true }))
    }
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
    <CaptureSection label="Times">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Start column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {start !== undefined ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>Start</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{isoTimeLabel(start)}</div>
              {canCapture && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <NudgeButton label="−5" onClick={() => nudgeStart(-5)} />
                  <NudgeButton label="+5" onClick={() => nudgeStart(5)} />
                </div>
              )}
              {stamped.start && <Caption>Stamped from the demo clock</Caption>}
            </>
          ) : canCapture ? (
            <StampButton label="Start now" onClick={stampStart} />
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>Start</div>
              <div style={{ fontSize: 14, color: neutral.mist }}>Not recorded</div>
            </>
          )}
        </div>

        {/* Finish column appears once a start exists */}
        {start !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {finish !== undefined ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>Finish</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{isoTimeLabel(finish)}</div>
                {canCapture && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <NudgeButton label="−5" onClick={() => nudgeFinish(-5)} />
                    <NudgeButton label="+5" onClick={() => nudgeFinish(5)} />
                  </div>
                )}
                {stamped.finish && <Caption>Stamped from the demo clock</Caption>}
              </>
            ) : canCapture ? (
              <StampButton label="Finish now" onClick={stampFinish} />
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>Finish</div>
                <div style={{ fontSize: 14, color: neutral.mist }}>Not recorded</div>
              </>
            )}
          </div>
        )}
      </div>

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

      <FailureNotes failures={[...startFailures, ...finishFailures]} />
    </CaptureSection>
  )
}

/** The full-height teal stamp button (mockup's "Finish now"). */
function StampButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
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
