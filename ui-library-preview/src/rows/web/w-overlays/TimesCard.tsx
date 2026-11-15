import { useState } from 'react'
import { motion } from '@proto/theme/motion'
import { clockISO, useAppStore } from '@proto/store'
import { isoTimeLabel, minutesBetweenIso, shiftIsoMinutes } from '@proto/shared/capture/timeIso'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'
import { CaptureHost, type Procedure } from './capture'
import { CaptureCard, Echo, KnobButton } from './shared'

export function TimesCardReplacement() {
  return <CaptureHost>{({ procedure, canCapture }) => <Times seeded={procedure} canCapture={canCapture} />}</CaptureHost>
}

/**
 * Start and Finish capture on shadcn Card: one teal Button that stamps the
 * demo clock and travels from the Start cell to the Finish cell (today's
 * slide, kept), and each recorded time with its −5 and +5 nudges as a Button
 * Group with named buttons ("Start 5 minutes earlier"). The rules are the
 * prototype's: Finish now never lands within 5 minutes of the start, and a
 * nudge keeps 5 minutes between them. Times are local here.
 */
function Times({ seeded, canCapture }: { seeded: Procedure; canCapture: boolean }) {
  const [start, setStart] = useState<string | undefined>(seeded.anaestheticStartISO)
  const [finish, setFinish] = useState<string | undefined>(seeded.handoverISO)
  const now = () => clockISO(useAppStore.getState().clock) as string

  function stampFinish() {
    const stamped = now()
    setFinish(start !== undefined && minutesBetweenIso(start, stamped) < 5 ? shiftIsoMinutes(start, 5) : stamped)
  }
  function nudgeStart(delta: number) {
    if (start === undefined) return
    let next: string = shiftIsoMinutes(start, delta)
    if (finish !== undefined && minutesBetweenIso(next, finish) < 5) next = shiftIsoMinutes(finish, -5)
    setStart(next)
  }
  function nudgeFinish(delta: number) {
    if (finish === undefined) return
    let next: string = shiftIsoMinutes(finish, delta)
    if (start !== undefined && minutesBetweenIso(start, next) < 5) next = shiftIsoMinutes(start, 5)
    setFinish(next)
  }

  const hasStart = start !== undefined
  const showStart = hasStart || !canCapture
  const showFinish = hasStart && (finish !== undefined || !canCapture)
  const reveal = (shown: boolean) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(4px)',
    transition: `opacity ${motion.valueTick.stepDuration}ms ease-out 50ms, transform ${motion.valueTick.stepDuration}ms ease-out 50ms`,
    pointerEvents: shown ? ('auto' as const) : ('none' as const),
  })

  return (
    <>
      <CaptureCard label="Times">
        <div className="tw:relative tw:grid tw:min-h-14 tw:w-full tw:grid-cols-2 tw:items-center tw:gap-3">
          <div className="tw:min-w-0" aria-hidden={!showStart} style={reveal(showStart)}>
            {start !== undefined ? <Recorded label="Start" iso={start} canCapture={canCapture} onNudge={nudgeStart} /> : !canCapture ? <NotRecorded label="Start" /> : null}
          </div>
          <div className="tw:min-w-0" aria-hidden={!showFinish} style={reveal(showFinish)}>
            {finish !== undefined ? <Recorded label="Finish" iso={finish} canCapture={canCapture} onNudge={nudgeFinish} /> : hasStart && !canCapture ? <NotRecorded label="Finish" /> : null}
          </div>
          {canCapture && finish === undefined && (
            <div
              className="tw:absolute tw:top-0 tw:left-0 tw:w-[calc((100%-12px)/2)]"
              style={{
                transform: hasStart ? 'translateX(calc(100% + 12px))' : 'translateX(0)',
                transition: `transform ${motion.cardAdvance.in}ms ${motion.cardAdvance.easing}`,
              }}
            >
              <Button className="tw:h-14 tw:w-full tw:rounded-[12px]! tw:text-base tw:font-bold" onClick={hasStart ? stampFinish : () => setStart(now())}>
                {hasStart ? 'Finish now' : 'Start now'}
              </Button>
            </div>
          )}
        </div>
      </CaptureCard>
      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
        <Echo>Local only: stamps and nudges are not saved.</Echo>
        {canCapture && (start !== undefined || finish !== undefined) && (
          <span className="tw:mt-2">
            <KnobButton
              onClick={() => {
                setStart(undefined)
                setFinish(undefined)
              }}
            >
              Clear both times
            </KnobButton>
          </span>
        )}
      </div>
    </>
  )
}

function Recorded({ label, iso, canCapture, onNudge }: { label: 'Start' | 'Finish'; iso: string; canCapture: boolean; onNudge: (d: number) => void }) {
  const which = label.toLowerCase()
  return (
    <div className="tw:flex tw:min-h-14 tw:flex-row tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1.5">
      <div className="tw:text-xs tw:font-semibold tw:text-slate">{label}</div>
      <div className="tw:font-mono tw:text-2xl tw:font-bold tw:tabular-nums">{isoTimeLabel(iso)}</div>
      {canCapture && (
        <ButtonGroup aria-label={`Nudge the ${which} time`} className="tw:gap-1.5">
          {[-5, 5].map((d) => (
            <Button
              key={d}
              variant="outline"
              aria-label={`${label} 5 minutes ${d < 0 ? 'earlier' : 'later'}`}
              onClick={() => onNudge(d)}
              className={cn('tw:h-9 tw:w-11 tw:rounded-ctl! tw:border-l! tw:px-0 tw:text-[15px] tw:text-slate')}
            >
              {d < 0 ? '−5' : '+5'}
            </Button>
          ))}
        </ButtonGroup>
      )}
    </div>
  )
}

function NotRecorded({ label }: { label: 'Start' | 'Finish' }) {
  return (
    <div className="tw:flex tw:min-h-14 tw:items-center tw:gap-3">
      <div className="tw:text-xs tw:font-semibold tw:text-slate">{label}</div>
      <div className="tw:text-sm tw:text-mist">Not recorded</div>
    </div>
  )
}
