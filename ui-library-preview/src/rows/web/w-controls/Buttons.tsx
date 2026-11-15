import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Echo, KnobButton, Knobs, StageHint, useWebFixtures } from './shared'

// ---------------------------------------------------------------------------
// IconBtn · NavButton · WeekNavButton
// ---------------------------------------------------------------------------

/** The square chevron button: shadcn Button outline at an icon size, slate glyph as today. */
function ChevronButton({ label, size, disabled, onClick, children }: { label: string; size: 38 | 34 | 32; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'tw:text-slate tw:disabled:text-line-strong',
        size === 38 && 'tw:size-[38px]',
        size === 34 && 'tw:size-[34px]',
        size === 32 && 'tw:size-8 tw:rounded-[9px]!',
      )}
    >
      {children}
    </Button>
  )
}

/**
 * The three chevron buttons as one shadcn Button (outline, icon). `unified={false}`
 * keeps the three sizes (38, 34, 32); `unified` puts all three at the kit's
 * 32px icon-sm, so the screens stop differing by a few pixels.
 */
export function IconButtonsReplacement({ unified = false }: { unified?: boolean }) {
  const [said, setSaid] = useState<string | null>(null)
  const [atEnd, setAtEnd] = useState(false)
  const s = (n: 38 | 34 | 32) => (unified ? 32 : n)
  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-[18px]">
        <span className="tw:flex tw:gap-1.5">
          <ChevronButton label="Previous day" size={s(38)} onClick={() => setSaid('IconBtn: Previous day')}>
            <ChevronLeft aria-hidden />
          </ChevronButton>
          <ChevronButton label="Next day" size={s(38)} onClick={() => setSaid('IconBtn: Next day')}>
            <ChevronRight aria-hidden />
          </ChevronButton>
        </span>
        <span className="tw:flex tw:gap-1.5">
          <ChevronButton label="Previous month" size={s(34)} disabled={!atEnd} onClick={() => setAtEnd(false)}>
            <ChevronLeft aria-hidden />
          </ChevronButton>
          <ChevronButton label="Next month" size={s(34)} disabled={atEnd} onClick={() => setAtEnd(true)}>
            <ChevronRight aria-hidden />
          </ChevronButton>
        </span>
        <span className="tw:flex tw:gap-1.5">
          <ChevronButton label="Previous week" size={32} onClick={() => setSaid('WeekNavButton: Previous week')}>
            <ChevronLeft aria-hidden />
          </ChevronButton>
          <ChevronButton label="Next week" size={32} onClick={() => setSaid('WeekNavButton: Next week')}>
            <ChevronRight aria-hidden />
          </ChevronButton>
        </span>
      </div>
      <Echo>{said}</Echo>
      <StageHint>{unified ? 'One Button, one size (32px) for day, month and week stepping.' : 'One Button at the three sizes of today: 38px, 34px (disables at the horizon), 32px.'}</StageHint>
    </>
  )
}

// ---------------------------------------------------------------------------
// Day stepper
// ---------------------------------------------------------------------------

/**
 * Previous day, the day, next day and Today. `joined` puts the three in a
 * shadcn ButtonGroup with shared borders; otherwise they stay spaced as today.
 * Both add ArrowLeft / ArrowRight / T while focus is in the stepper, and
 * announce the day politely.
 */
export function DayStepperReplacement({ joined = false }: { joined?: boolean }) {
  const f = useWebFixtures()
  const [dateISO, setDateISO] = useState(f.todayISO)
  const shift = (d: number) => setDateISO((cur) => format(addDays(parseISO(cur), d), 'yyyy-MM-dd'))
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') shift(-1)
    else if (e.key === 'ArrowRight') shift(1)
    else if (e.key === 't' || e.key === 'T') setDateISO(f.todayISO)
    else return
    e.preventDefault()
  }
  const day = (
    <span
      data-slot="button-group-text"
      aria-live="polite"
      className="tw:flex tw:h-[38px] tw:items-center tw:rounded-ctl tw:border tw:border-line tw:bg-surface tw:px-[18px] tw:text-sm tw:font-semibold"
    >
      {format(parseISO(dateISO), 'EEEE d MMMM')}
    </span>
  )
  const prev = (
    <Button variant="outline" size="icon" aria-label="Previous day" aria-keyshortcuts="ArrowLeft" onClick={() => shift(-1)} className="tw:size-[38px] tw:text-slate">
      <ChevronLeft aria-hidden />
    </Button>
  )
  const next = (
    <Button variant="outline" size="icon" aria-label="Next day" aria-keyshortcuts="ArrowRight" onClick={() => shift(1)} className="tw:size-[38px] tw:text-slate">
      <ChevronRight aria-hidden />
    </Button>
  )
  return (
    <>
      <div role="group" aria-label="Day" onKeyDown={onKeyDown} className="tw:flex tw:items-center tw:gap-2">
        {joined ? (
          <ButtonGroup aria-label="Step the day">
            {prev}
            {day}
            {next}
          </ButtonGroup>
        ) : (
          <>
            {prev}
            {day}
            {next}
          </>
        )}
        <Button variant="outline" aria-keyshortcuts="T" onClick={() => setDateISO(f.todayISO)} className="tw:h-[38px] tw:border-primary tw:px-3.5 tw:text-[13px] tw:text-primary tw:hover:bg-teal-tint">
          Today
        </Button>
      </div>
      <StageHint>With focus on any of its buttons: Left and Right arrows step the day, T goes to today.</StageHint>
    </>
  )
}

// ---------------------------------------------------------------------------
// LinkButton
// ---------------------------------------------------------------------------

/** The teal text action inside a sentence: shadcn Button, link variant, at the sentence's 13px. */
export function LinkButtonReplacement() {
  const [said, setSaid] = useState<string | null>(null)
  return (
    <>
      <div className="tw:text-[13px] tw:text-slate">
        3 accounts over 60 days ·{' '}
        <Button variant="link" onClick={() => setSaid('Would open Accounts, Overdue.')} className="tw:align-baseline tw:text-[13px] tw:font-semibold">
          view overdue accounts
        </Button>
      </div>
      <Echo>{said}</Echo>
    </>
  )
}

// ---------------------------------------------------------------------------
// SubmitAction
// ---------------------------------------------------------------------------

type SubmitState = 'blocked' | 'ready' | 'submitted' | 'authorised'
const TOASTER_ID = 'web-w-controls-submit-action'
/** Today's 42px, r12, 14/600 action shape. */
const SHAPE = 'tw:h-[42px] tw:gap-2 tw:rounded-[12px]! tw:px-5 tw:text-sm tw:font-semibold'

/**
 * List detail's primary action on Button and Badge. Blocked is an outline
 * Button with its reason in a Tooltip; ready is the teal Button; submitted and
 * authorised are Badges. Here "Mark list completed" submits locally (the
 * confirm sheet is left out) and the swap is announced: through a polite live
 * region, or (`toast`) also with a Sonner toast.
 */
export function SubmitActionReplacement({ withToast = false }: { withToast?: boolean }) {
  const [state, setState] = useState<SubmitState>('blocked')
  const [said, setSaid] = useState<string | null>(null)

  function submit() {
    setState('submitted')
    setSaid('List submitted to the office (local only).')
    if (withToast) toast('List submitted to the office', { toasterId: TOASTER_ID, id: 'submitted', description: 'It is read only until the office returns it.' })
  }

  let action: ReactNode
  if (state === 'authorised') {
    action = (
      <Badge variant="default" className={SHAPE}>
        <Lock className="tw:size-[15px]!" strokeWidth={2.4} aria-hidden /> Invoiced · read only
      </Badge>
    )
  } else if (state === 'submitted') {
    action = (
      <Badge variant="success" className={SHAPE}>
        <Check className="tw:size-4!" strokeWidth={3} aria-hidden /> Submitted to office
      </Badge>
    )
  } else if (state === 'blocked') {
    action = (
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" className={cn(SHAPE, 'tw:border-line-strong tw:text-slate')} />} onClick={() => setSaid('Would open the blockers sheet: the 2 Bookings left to finish.')}>
          2 to finish before submitting
        </TooltipTrigger>
        <TooltipContent>See what is left to finish</TooltipContent>
      </Tooltip>
    )
  } else {
    action = (
      <Button className={SHAPE} onClick={submit}>
        Mark list completed
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <div className="tw:relative tw:min-h-[150px] tw:[transform:translateZ(0)]">
        <Knobs
          label="State"
          value={state}
          options={[
            { value: 'blocked', label: 'Blocked' },
            { value: 'ready', label: 'Ready' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'authorised', label: 'Authorised' },
          ]}
          onChange={(v: SubmitState) => {
            setState(v)
            setSaid(null)
          }}
        />
        {action}
        <Echo>{said}</Echo>
        {withToast && <Toaster id={TOASTER_ID} position="bottom-right" offset={0} duration={5000} closeButton={false} />}
      </div>
    </TooltipProvider>
  )
}

// ---------------------------------------------------------------------------
// Add a booking (dashed)
// ---------------------------------------------------------------------------

/** The dashed full-width add button: shadcn Button outline with the dashed border as a class. */
export function AddBookingButtonReplacement() {
  const f = useWebFixtures()
  const [said, setSaid] = useState<string | null>(null)
  if (f.detailListId === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no active List for this persona right now.</div>
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setSaid('Would open the Add a booking dialog for her next List (the dialog has its own row).')}
        className="tw:h-auto tw:w-full tw:gap-2 tw:border-[1.5px] tw:border-dashed tw:border-line-strong tw:px-4 tw:py-[13px] tw:text-sm tw:text-primary tw:hover:text-primary"
      >
        <Plus className="tw:size-[17px]!" strokeWidth={2.4} aria-hidden /> Add a booking
      </Button>
      <Echo>{said}</Echo>
    </>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

/** The Bookings count and bar as shadcn Progress: role=progressbar with its value, label and value text. */
export function ProgressBarReplacement() {
  const [done, setDone] = useState(2)
  const total = 5
  return (
    <>
      <Progress
        value={done}
        max={total}
        getAriaValueText={(_formatted: string, value: number | null) => `${value ?? 0} of ${total} complete`}
        className="tw:flex-nowrap tw:items-center tw:gap-3 tw:[&_[data-slot=progress-indicator]]:bg-success tw:[&_[data-slot=progress-indicator]]:duration-300 tw:[&_[data-slot=progress-track]]:w-[200px] tw:[&_[data-slot=progress-track]]:bg-line"
      >
        <ProgressLabel className="tw:flex-none tw:text-xs tw:font-semibold tw:text-slate">
          {done} of {total} complete
        </ProgressLabel>
      </Progress>
      <div className="tw:mt-2.5 tw:flex tw:gap-1.5">
        <KnobButton onClick={() => setDone((d) => Math.max(0, d - 1))}>One fewer</KnobButton>
        <KnobButton onClick={() => setDone((d) => Math.min(total, d + 1))}>One more</KnobButton>
      </div>
    </>
  )
}
