/**
 * A module-level handle on the service-worker registration.
 *
 * `useRegisterSW` hands the registration to its `onRegisteredSW` callback and
 * nowhere else, but the More tab's manual "Check for updates" row needs it too,
 * and that row lives well outside the update pill's component tree. Stashing it
 * here is smaller than threading a context through the whole app for one
 * button.
 *
 * Everything is guarded: in the framed prototype, in a Vitest run, and over
 * plain http on a LAN IP there is no service worker at all, and every function
 * here has to degrade to a no-op rather than throw.
 */

let registration: ServiceWorkerRegistration | undefined

/** Called from `UpdatePrompt`'s `onRegisteredSW`. */
export function rememberRegistration(r: ServiceWorkerRegistration | undefined): void {
  registration = r
}

/**
 * Whether a worker actually registered (a secure context, and this build has
 * one). Asynchronous because `onRegisteredSW` fires some way after first paint,
 * so a synchronous read taken while the More tab renders would report "no" for
 * a perfectly healthy install. Asking the browser directly also back-fills the
 * handle, which makes "Check for updates" work even if that callback is missed.
 */
export async function serviceWorkerReady(): Promise<boolean> {
  if (registration !== undefined) return true
  if (!('serviceWorker' in navigator)) return false
  try {
    const found = await navigator.serviceWorker.getRegistration()
    if (found === undefined) return false
    registration = found
    return true
  } catch {
    return false
  }
}

export type UpdateCheck = 'unavailable' | 'checked' | 'failed'

/**
 * Ask the browser to re-fetch the worker script. If a new build is live this is
 * what makes the update pill appear; the pill's own 60-second poll does the
 * same thing unattended.
 *
 * Worth knowing before a workshop: once a service worker is installed,
 * pull-to-refresh does NOT get you the new build. The old worker answers from
 * its own precache. This, the poll, and the visible build id are the three
 * things that make a deploy observable on the phone.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!(await serviceWorkerReady()) || registration === undefined) return 'unavailable'
  try {
    await registration.update()
    return 'checked'
  } catch {
    return 'failed'
  }
}
