import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { accent, elevation, neutral, radius } from '../theme/tokens'
import { rememberRegistration } from './swRegistration'

/**
 * The update affordance for the installed PWA, and the main operational risk
 * this whole target carries: **once a service worker is installed,
 * pull-to-refresh does not get you the new build**. The old worker answers
 * every navigation from its own precache, so a phone can sit two deploys behind
 * with no outward sign. Three layers guard against that, and this component is
 * the first two of them (the third is the build id in the More tab).
 *
 * `registerType: 'prompt'`, never `'autoUpdate'`: auto-update reloads the page
 * by itself, and mid-demo that would drop the slide-stack position and any open
 * sheet. Here the presenter chooses the moment. The reload is cheap because all
 * state is in localStorage on the same origin, so only in-flight sheet position
 * is lost.
 *
 * Teal, not crimson: this is an action, and crimson is identity only.
 */

/** Re-check for a new build this often, in ms. */
const POLL_MS = 60_000

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      rememberRegistration(registration)
      if (registration === undefined) return
      // Gated on both conditions: polling a backgrounded tab wakes the radio
      // for nothing, and polling offline just logs a failed fetch. An installed
      // demo phone spends most of its life in exactly those two states.
      window.setInterval(() => {
        if (document.visibilityState !== 'visible') return
        if (!navigator.onLine) return
        void registration.update()
      }, POLL_MS)
    },
  })

  // Check once the moment the app is brought back to the foreground, so
  // picking the phone up is enough to notice a deploy pushed while it slept.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!navigator.onLine) return
      void navigator.serviceWorker?.getRegistration().then((r) => r?.update())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (!needRefresh) return null

  return (
    <button
      type="button"
      onClick={() => void updateServiceWorker(true)}
      style={{
        position: 'absolute',
        left: '50%',
        // Clears the bottom tab bar, whose own height tracks the same inset.
        bottom: 'calc(var(--aa-inset-bottom, 0px) + 78px)',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        padding: '0 18px',
        borderRadius: radius.pill,
        border: 'none',
        background: accent.base,
        color: neutral.surface,
        boxShadow: elevation.e3,
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
      New version ready · Tap to reload
    </button>
  )
}
