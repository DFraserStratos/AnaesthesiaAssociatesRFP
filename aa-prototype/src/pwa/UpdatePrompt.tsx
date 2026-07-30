import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { accent, elevation, neutral, radius } from '../theme/tokens'
import { rememberRegistration, rememberRegistrationError } from './swRegistration'

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
      //
      // The catch is not belt-and-braces: `navigator.onLine` only reports the
      // link layer, so behind a venue captive portal (or a 5xx from the host)
      // both guards pass and `update()` rejects. Without it that is an uncaught
      // rejection in the console every single minute of the workshop.
      window.setInterval(() => {
        if (document.visibilityState !== 'visible') return
        if (!navigator.onLine) return
        void registration.update().catch(() => undefined)
      }, POLL_MS)
    },
    // A failed `register()` is otherwise completely silent: `onRegisteredSW`
    // never fires, so nothing knows and the More tab's "Check for updates" row
    // cannot tell the presenter apart from a build that has no worker at all.
    onRegisterError: rememberRegistrationError,
  })

  // Check once the moment the app is brought back to the foreground, so
  // picking the phone up is enough to notice a deploy pushed while it slept.
  // Same rejection guard as the poll, for the same captive-portal reason.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!navigator.onLine) return
      void navigator.serviceWorker
        ?.getRegistration()
        .then((r) => r?.update())
        .catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    // The live region is mounted whether or not there is anything to say: a
    // screen reader only announces a region that was already in the DOM when
    // its content changed, and the pill arrives unbidden from a background
    // poll, so mounting it with the pill would announce nothing at all.
    // `pointerEvents: 'none'` matters, because this box spans the full width
    // over the tab bar even while empty.
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        // Clears whichever bottom chrome is on screen. At Lists depth 0 that is
        // the tab bar, and 78 covers it; at depth 1 and 2 the tab bar is gone
        // and a much taller commit dock takes its place, so `MobileCardLayout`
        // publishes its MEASURED height as `--aa-dock-height` on
        // `documentElement` (it has to inherit down to here) and `max()` takes
        // whichever is bigger. That measured height already carries the dock's
        // own bottom inset, so on an inset device this clears the dock by more
        // than 12px; over-clearing is the harmless direction.
        bottom: 'calc(var(--aa-inset-bottom, 0px) + max(78px, var(--aa-dock-height, 0px) + 12px))',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          style={{
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
            pointerEvents: 'auto',
          }}
        >
          <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
          New version ready · Tap to reload
        </button>
      )}
    </div>
  )
}
