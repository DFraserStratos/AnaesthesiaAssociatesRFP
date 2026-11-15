import { useId, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Col, Said } from './shared'
import { SegmentedToggle } from './Segmented'

// ---------------------------------------------------------------------------
// CaptureSection
// ---------------------------------------------------------------------------

/**
 * The capture card on shadcn Card: the micro-caps label becomes a real h3 that names the card,
 * the body is CardContent and the footer is CardFooter pushed to the foot. The kit Card's
 * shadow, footer rule and footer band are switched off to keep today's flat card.
 */
export function CaptureSectionReplacement() {
  const [note, setNote] = useState('')
  const headingId = useId()
  return (
    <Card role="group" aria-labelledby={headingId} className="tw:gap-3 tw:py-4 tw:pb-4! tw:shadow-none tw:[--card-spacing:--spacing(4)]">
      <CardHeader>
        <h3 id={headingId} className="tw:m-0 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">
          Notes
        </h3>
      </CardHeader>
      <CardContent>
        <Textarea aria-labelledby={headingId} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the office should know" />
      </CardContent>
      <CardFooter className="tw:mt-auto tw:border-t-0 tw:bg-transparent tw:py-0 tw:text-xs tw:leading-4 tw:text-mist">
        Saved when you leave the field.
      </CardFooter>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ToggleRow (switch)
// ---------------------------------------------------------------------------

/**
 * The presenter panel's row on shadcn Switch (Base UI Switch): the whole 44px row is the
 * label, so a tap anywhere toggles it, and the switch carries role=switch and aria-checked
 * itself. Same 52 by 32 track, teal on, line-strong off.
 */
export function ToggleRowReplacement() {
  const [on, setOn] = useState(false)
  const id = useId()
  return (
    <div className="tw:rounded-[16px] tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-1.5">
      <label htmlFor={id} className="tw:flex tw:min-h-11 tw:w-full tw:cursor-pointer tw:items-center tw:gap-3">
        <span className="tw:flex-1 tw:text-[15px] tw:font-semibold">Play the office</span>
        <Switch id={id} checked={on} onCheckedChange={setOn} />
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InstallCoach
// ---------------------------------------------------------------------------

/**
 * The Add to your home screen tip on shadcn Alert: teal-outlined card, title, a corner dismiss
 * as AlertAction, the iPhone steps or the Android Install button. role=note, not alert: it is a
 * standing tip, not an urgent message. Platform switch as in the current example.
 */
export function InstallCoachReplacement() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
  const [dismissed, setDismissed] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const ios = platform === 'ios'
  return (
    <Col>
      <SegmentedToggle
        value={platform}
        options={[
          { value: 'ios', label: 'iPhone' },
          { value: 'android', label: 'Android' },
        ]}
        onSelect={setPlatform}
        variant="surface"
        ariaLabel="Platform"
      />
      {dismissed ? (
        <Button variant="pill" className="tw:h-11" onClick={() => setDismissed(false)}>
          Show the tip again
        </Button>
      ) : (
        <Alert role="note" className="tw:mt-4 tw:flex tw:flex-col tw:gap-2.5 tw:rounded-card tw:border-primary tw:p-4 tw:pr-4!">
          <AlertTitle className="tw:pr-8 tw:text-[15px] tw:leading-[22px]">Add to your home screen</AlertTitle>
          <AlertAction className="tw:top-1 tw:right-1">
            <Button variant="ghost" size="icon" className="tw:size-11 tw:text-mist" aria-label="Dismiss the install tip" onClick={() => setDismissed(true)}>
              <X className="tw:size-[18px]" strokeWidth={2.2} aria-hidden />
            </Button>
          </AlertAction>
          {ios ? (
            <AlertDescription className="tw:flex tw:flex-col tw:gap-1.5 tw:text-sm">
              <span className="tw:flex tw:items-center tw:gap-2">
                <Share className="tw:size-4 tw:flex-none tw:text-primary" strokeWidth={2} aria-hidden />
                Tap Share in the browser toolbar
              </span>
              <span className="tw:flex tw:items-center tw:gap-2">
                <SquarePlus className="tw:size-4 tw:flex-none tw:text-primary" strokeWidth={2} aria-hidden />
                Choose Add to Home Screen
              </span>
              <span className="tw:text-[13px] tw:text-mist">It then opens full screen, with no browser bars, and works with no connection.</span>
            </AlertDescription>
          ) : (
            <>
              <AlertDescription className="tw:text-sm">Install it and it opens full screen, with no browser bars, and works with no connection.</AlertDescription>
              <Button className="tw:h-11 tw:w-full tw:text-[15px]" onClick={() => setLine('Would replay the browser install prompt.')}>
                Install
              </Button>
            </>
          )}
        </Alert>
      )}
      <Said line={line} />
    </Col>
  )
}
