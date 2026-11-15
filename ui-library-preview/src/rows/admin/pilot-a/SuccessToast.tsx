import { useState, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Echo } from './Echo'

const TOASTER_ID = 'admin-pilot-a-inline-success'
const MESSAGE = 'Conflict cleared. It shows again under "Show cleared", where "Flag again" restores it.'

export type ConfirmationStyle = 'neutral-toast' | 'teal-toast' | 'inline'

/** Sonner reads these vars on the toast itself, so the tint is local to this row (the kit stays neutral). */
const TEAL_TOAST: CSSProperties = {
  '--normal-bg': 'var(--teal-tint)',
  '--normal-border': 'var(--teal-tint)',
  '--normal-text': 'var(--teal-pressed)',
} as CSSProperties

/**
 * The Conflicts screen's success confirmation. The button clears a (simulated,
 * local) conflict, then confirms in one of three ways:
 *  - a Sonner toast, neutral (the kit's card) or teal-tint, whose action is the
 *    screen's own "Flag again" (it restores the conflict);
 *  - the inline line kept, rebuilt as a shadcn Alert with role=status and Dismiss.
 * The Toaster is mounted inside this box, and the box is a containing block for
 * its fixed position, so the toast appears in the row, not at the window corner.
 */
export function SuccessToastReplacement({ style = 'neutral-toast' }: { style?: ConfirmationStyle }) {
  const [cleared, setCleared] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const teal = style === 'teal-toast'

  function clear() {
    setCleared(true)
    if (style === 'inline') {
      setMessage(MESSAGE)
      return
    }
    toast(<span className={teal ? 'tw:text-teal-pressed' : undefined}>Conflict cleared</span>, {
      toasterId: TOASTER_ID,
      id: 'conflict-cleared',
      description: (
        <span className={teal ? 'tw:text-teal-pressed' : undefined}>
          It shows again under "Show cleared", where "Flag again" restores it.
        </span>
      ),
      style: teal ? TEAL_TOAST : undefined,
      action: { label: 'Flag again', onClick: () => setCleared(false) },
    })
  }

  if (style === 'inline') {
    return (
      <div className="tw:flex tw:flex-col tw:gap-2.5">
        <div>
          <Button variant="pill" className="tw:h-11" onClick={clear}>
            Clear a conflict (simulated)
          </Button>
        </div>
        {message !== null && (
          <Alert role="status" className="tw:bg-teal-tint tw:pr-20 tw:text-teal-pressed">
            <AlertDescription className="tw:text-teal-pressed">{message}</AlertDescription>
            <AlertAction className="tw:top-2.5 tw:right-3">
              <Button variant="link" onClick={() => setMessage(null)}>
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="tw:relative tw:min-h-[150px] tw:[transform:translateZ(0)]">
      <div>
        <Button variant="pill" className="tw:h-11" onClick={clear}>
          Clear a conflict (simulated)
        </Button>
      </div>
      <Echo>{cleared ? 'The conflict is cleared (local only).' : 'The conflict is open.'}</Echo>
      <Toaster id={TOASTER_ID} position="bottom-right" offset={0} duration={6000} closeButton={false} />
    </div>
  )
}
