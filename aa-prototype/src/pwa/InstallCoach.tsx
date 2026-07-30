import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'
import { accent, neutral, radius } from '../theme/tokens'

/**
 * Add-to-Home-Screen coaching, shown only while the app is running in a browser
 * tab. Once it is installed, `display-mode: standalone` matches and this never
 * renders again.
 *
 * The point is workshop logistics: the phone gets handed round a vendor panel,
 * and someone will open the link in Safari and see a browser tab rather than
 * the app. Two lines of platform-correct instructions save a minute of fumbling
 * each time.
 *
 * iOS gives no programmatic install path at all, so there the coaching IS the
 * mechanism. Android fires `beforeinstallprompt`, which can be captured and
 * replayed from a real button, so there it is a genuine one-tap install.
 */

const DISMISS_KEY = 'aa-install-coach-dismissed'

/** The captured Android install event. Not in lib.dom, so it is described here. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (window.matchMedia?.('(display-mode: standalone)').matches === true) return true
  // iOS Safari predates `display-mode` and reports standalone on the navigator.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIos(): boolean {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ reports a desktop UA; the touch count is the usual tell.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function rememberDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}

export function InstallCoach() {
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const capture = (e: Event) => {
      // Suppress Chrome's own mini-infobar so the install happens from our card.
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])

  if (dismissed || isStandalone()) return null

  const ios = isIos()

  function dismiss() {
    rememberDismissed()
    setDismissed(true)
  }

  async function install() {
    if (installEvent === null) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  return (
    <div
      style={{
        marginTop: 16,
        background: neutral.surface,
        border: `1px solid ${accent.base}`,
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Add to your home screen</span>
        <button
          type="button"
          aria-label="Dismiss the install tip"
          onClick={dismiss}
          style={{
            flex: 'none',
            width: 32,
            height: 32,
            margin: -6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            color: neutral.mist,
            cursor: 'pointer',
          }}
        >
          <X size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      {ios ? (
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', color: accent.base }} />
            Tap Share in the Safari toolbar
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SquarePlus size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', color: accent.base }} />
            Choose Add to Home Screen
          </span>
          <span style={{ fontSize: 13, color: neutral.mist }}>
            It then opens full screen, with no browser bars, and works with no connection.
          </span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
            Install it and it opens full screen, with no browser bars, and works with no connection.
          </div>
          {installEvent !== null ? (
            <button
              type="button"
              onClick={() => void install()}
              style={{
                minHeight: 44,
                borderRadius: radius.ctl,
                border: 'none',
                background: accent.base,
                color: neutral.surface,
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Install
            </button>
          ) : (
            <div style={{ fontSize: 13, color: neutral.mist }}>
              Open the browser menu and choose Install app, or Add to Home screen.
            </div>
          )}
        </>
      )}
    </div>
  )
}
