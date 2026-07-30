/**
 * Module-scope capture of Chrome's `beforeinstallprompt`, so the More tab's
 * Add-to-Home-Screen card can replay it from a real button.
 *
 * WHY IT IS NOT IN THE CARD. Chrome fires `beforeinstallprompt` once per
 * document load, a second or two after the manifest and the worker qualify, and
 * a launch lands on `/mobile/lists`. `InstallCoach` reaches the tree only
 * through `PwaDemoPanel`, which `MoreScreen` renders only while `/mobile/more`
 * matches, so a listener owned by that component is attached seconds too late,
 * and Chrome does not re-fire on client-side navigation. Attaching here, at
 * module evaluation, from an import in `pwa/main.tsx` that runs before
 * `createRoot`, is what makes the Android one-tap install reachable at all, and
 * what makes `preventDefault()` early enough to suppress Chrome's own
 * mini-infobar. Same idiom, and the same reason, as `swRegistration.ts`'s
 * module-level registration handle: the thing arrives well outside the component
 * tree that needs it.
 *
 * WHY THE EVENT LIVES HERE TOO. Leaving the More tab unmounts the card, and
 * component state would take the captured event with it, so coming back would
 * show the written fallback for the rest of the session. The holder is
 * module-level and is cleared only once the event is genuinely spent (the user
 * answered Chrome's dialog) or the app is installed.
 *
 * PWA-ONLY, like the rest of this folder. Import it from `pwa/main.tsx` or
 * `src/pwa/*` and nowhere else: `beforeinstallprompt` means nothing in the
 * framed prototype, and `src/pwa/` is the boundary `pwaPurity.test.ts` argues
 * about.
 */

/** The captured Android install event. Not in lib.dom, so it is described here. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** The live event, or null when none has arrived or the one we had is spent. */
let captured: InstallPromptEvent | null = null

/** Set by `appinstalled`. See `wasInstalled`. */
let installed = false

const listeners = new Set<() => void>()

function announce(): void {
  // Copied, because a listener that unsubscribes on notify would otherwise
  // mutate the set mid-iteration.
  for (const listener of [...listeners]) listener()
}

function capture(event: Event): void {
  // Early enough to matter now: this suppresses Chrome's own mini-infobar, so
  // the install happens from our card rather than from a browser banner nobody
  // in the room can see on a handed-round phone.
  event.preventDefault()
  captured = event as InstallPromptEvent
  announce()
}

/** Drop a spent event. Chrome will not let the same one be replayed. */
function forget(): void {
  if (captured === null) return
  captured = null
  announce()
}

function onInstalled(): void {
  installed = true
  captured = null
  announce()
}

// jsdom is fine, a worker or SSR is not — guarded like `persistStorage`'s flush
// listeners, because this runs at import time rather than from a component.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', capture)
  window.addEventListener('appinstalled', onInstalled)
}

/**
 * The captured event, or null. Null is the ordinary case on iOS, in in-app
 * WebViews, and in a Chrome that has not (or not yet) decided the app is
 * installable, which is why the card keeps its written fallback.
 */
export function getInstallEvent(): InstallPromptEvent | null {
  return captured
}

/**
 * Whether the app was installed during this page's life. `display-mode:
 * standalone` cannot answer that: after an Android install the tab the user is
 * still looking at is a browser tab, so without this the card would sit there
 * telling them to install an app they have just installed.
 */
export function wasInstalled(): boolean {
  return installed
}

/**
 * Subscribe to arrivals and clearances. Returns an unsubscribe. The callback
 * takes no argument deliberately: subscribers re-read `getInstallEvent()` /
 * `wasInstalled()`, so there is one source of truth rather than a payload that
 * can go stale between notification and render.
 */
export function subscribeInstallEvent(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Replay the captured prompt. Resolves to the user's answer, or null when there
 * was nothing to replay (or Chrome refused the replay, which it does for an
 * event that has already been used). The event is dropped either way, so a
 * dismissed prompt falls back to the written instructions rather than leaving a
 * button that can only fail.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | null> {
  const event = captured
  if (event === null) return null
  try {
    await event.prompt()
    const { outcome } = await event.userChoice
    forget()
    return outcome
  } catch {
    forget()
    return null
  }
}

/**
 * Whether the coaching card has been dismissed, kept out of `InstallCoach` so
 * that file exports only its component (React Fast Refresh needs that, and it is
 * what oxlint's `only-export-components` is asking for).
 *
 * "Coach" rather than "dismissed" in every name here on purpose: this module also
 * deals in `promptInstall`'s `'dismissed'` OUTCOME, which is a different event
 * entirely — the user declining Chrome's dialog, not closing our card.
 *
 * The three are deliberately separate from the event holder above. This one
 * outlives the page: it is a `localStorage` key, so a dismissal is remembered
 * across launches, which is the whole point of a card the presenter can put away.
 */
const COACH_DISMISS_KEY = 'aa-install-coach-dismissed'

export function wasCoachDismissed(): boolean {
  try {
    return window.localStorage.getItem(COACH_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function rememberCoachDismissed(): void {
  try {
    window.localStorage.setItem(COACH_DISMISS_KEY, '1')
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}

/**
 * Forget the dismissal, so the card comes back. Called by "Reset demo data": the
 * phone is shared, the X is one tap, and without this a stray tap would hide the
 * install coaching for the rest of that handset's life.
 */
export function clearInstallCoachDismissal(): void {
  try {
    window.localStorage.removeItem(COACH_DISMISS_KEY)
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}
