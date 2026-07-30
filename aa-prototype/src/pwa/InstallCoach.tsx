import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'
import { accent, neutral, radius } from '../theme/tokens'
import {
  getInstallEvent,
  promptInstall,
  rememberCoachDismissed,
  subscribeInstallEvent,
  wasCoachDismissed,
  wasInstalled,
} from './installPrompt'

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
 * mechanism. Android fires `beforeinstallprompt`, which `installPrompt.ts`
 * captures from the entry (far earlier than this card mounts) and this card
 * replays from a real button, so there it is a genuine one-tap install. The
 * written fallback stays for every case where no event ever arrives: iOS, an
 * in-app WebView, or a Chrome that has not judged the app installable.
 */

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

export function InstallCoach() {
  const [dismissed, setDismissed] = useState(wasCoachDismissed)
  // Both read out of `installPrompt`'s module-level holder rather than owning
  // the listener, so a captured event survives this card unmounting when the
  // presenter leaves the More tab.
  const [canInstall, setCanInstall] = useState(() => getInstallEvent() !== null)
  const [installed, setInstalled] = useState(wasInstalled)

  useEffect(
    () =>
      subscribeInstallEvent(() => {
        setCanInstall(getInstallEvent() !== null)
        setInstalled(wasInstalled())
      }),
    [],
  )

  // `installed` is the Android case `isStandalone()` cannot see: the install
  // succeeded, but this tab is still a tab.
  if (dismissed || installed || isStandalone()) return null

  const ios = isIos()

  function dismiss() {
    rememberCoachDismissed()
    setDismissed(true)
  }

  async function install() {
    const outcome = await promptInstall()
    // Accepted: hide the card for good rather than leave it advertising an
    // install that has already happened. A refusal (or nothing to replay) falls
    // through to the written instructions, which are still true.
    if (outcome === 'accepted') dismiss()
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
            // A 44px target around an 18px glyph. The negative margin is what
            // keeps it looking identical to a 32px box: pulling 12px back on
            // every side leaves the icon exactly where it was and contributes
            // the same 20px to the row's height, so only the hit box grows.
            width: 44,
            height: 44,
            margin: -12,
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
            {/* Not "the Safari toolbar": the same two steps are right in Chrome
                and Edge on iOS, and a link opened from Teams or Outlook is in a
                WebView with no Safari toolbar on screen at all. */}
            Tap Share in the browser toolbar
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
          {canInstall ? (
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
            // Reached two ways: no event ever arrived, or the user closed
            // Chrome's own dialog. Phrased so it is true in both, rather than as
            // the primary instruction.
            <div style={{ fontSize: 13, color: neutral.mist }}>
              You can install it from the browser menu: choose Install app, or Add to Home screen.
            </div>
          )}
        </>
      )}
    </div>
  )
}
