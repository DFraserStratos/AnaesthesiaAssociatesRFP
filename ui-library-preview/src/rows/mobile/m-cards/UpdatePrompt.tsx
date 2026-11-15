import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Said } from './shared'

export type PromptStyle = 'teal-pill' | 'neutral-toast'


/**
 * The "new version ready" prompt as a Sonner toast, mounted inside the phone stage at the
 * bottom (24px here; the app would offset it above --aa-dock-height). It stays until tapped
 * (duration Infinity), and Sonner announces it through its own live region.
 *  - teal-pill: today's floating teal pill, rendered with toast.custom so it keeps its look;
 *  - neutral-toast: the kit toast (surface card) with "Reload" as its action button.
 */
export function UpdatePromptReplacement({ look }: { look: PromptStyle }) {
  const toasterId = `m-cards-update-${look}`
  const TOAST_ID = `${toasterId}-ready`
  const [line, setLine] = useState<string | null>(null)
  // Sonner's toast store is global: clear this option's prompt when it unmounts (switching options).
  useEffect(() => () => void toast.dismiss(TOAST_ID), [TOAST_ID])

  function reload() {
    toast.dismiss(TOAST_ID)
    setLine('Would reload into the new service worker.')
  }

  function simulate() {
    setLine(null)
    if (look === 'teal-pill') {
      toast.custom(
        () => (
          <Button onClick={reload} className="tw:mx-auto tw:h-11 tw:gap-2 tw:rounded-pill! tw:px-[18px] tw:text-sm tw:shadow-e3 tw:[&>svg]:size-4">
            <RefreshCw strokeWidth={2.2} aria-hidden />
            New version ready · Tap to reload
          </Button>
        ),
        { id: TOAST_ID, toasterId, duration: Infinity, unstyled: true, className: 'tw:flex! tw:w-full! tw:justify-center! tw:border-0! tw:bg-transparent! tw:p-0! tw:shadow-none!' },
      )
      return
    }
    toast('New version ready', {
      id: TOAST_ID,
      toasterId,
      duration: Infinity,
      icon: <RefreshCw className="tw:size-4 tw:text-slate" strokeWidth={2.2} aria-hidden />,
      action: { label: 'Reload', onClick: reload },
    })
  }

  return (
    <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:[transform:translateZ(0)]">
      <div className="tw:p-3.5">
        <Button variant="outline" size="lg" onClick={simulate}>
          Simulate a new build
        </Button>
        <Said line={line} />
      </div>
      <Toaster id={toasterId} position="bottom-center" offset={24} mobileOffset={24} closeButton={false} />
    </div>
  )
}
