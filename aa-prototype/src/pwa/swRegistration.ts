/**
 * A module-level handle on the service-worker registration, plus a latch for a
 * registration that failed.
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

/**
 * Latched by `rememberRegistrationError`, and read only when no registration
 * can be resolved at all, so a live worker can never be reported as a failure.
 */
let registerFailed = false

/** Called from `UpdatePrompt`'s `onRegisteredSW`. */
export function rememberRegistration(r: ServiceWorkerRegistration | undefined): void {
  registration = r
}

/**
 * Called from `UpdatePrompt`'s `onRegisterError`. Without it a failed
 * `register()` is entirely silent: `onRegisteredSW` never fires, so the More
 * tab's "Check for updates" row would say "nothing to check" and give the
 * presenter no way to tell "this build has no worker" from "this one could not
 * install". One warn, in the same swallow-and-log shape `persistStorage` uses,
 * because a phone has no console anyone can read mid-workshop.
 */
export function rememberRegistrationError(error: unknown): void {
  registerFailed = true
  console.warn('service worker registration failed', error)
}

/**
 * Resolve the handle, asking the browser and back-filling when `onRegisteredSW`
 * was never seen. `undefined` means there is genuinely no worker: the framed
 * prototype, a Vitest run, or plain http on a LAN IP.
 */
async function resolveRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (registration !== undefined) return registration
  if (!('serviceWorker' in navigator)) return undefined
  try {
    const found = await navigator.serviceWorker.getRegistration()
    if (found === undefined) return undefined
    registration = found
    return found
  } catch {
    return undefined
  }
}

/**
 * Whether a worker is ACTIVE, which is the only state that means the precache
 * finished and the app would actually survive airplane mode. Existence is not
 * enough, and that is the trap the More tab's "Offline ready" row fell into:
 * `onRegisteredSW` fires the moment `register()` resolves, while the new worker
 * is still installing a 700-odd KiB precache, and an install that fails
 * outright leaves that handle in place for the rest of the session with nothing
 * cached. Gating on `active` covers both, because both paths go through
 * `resolveRegistration` rather than answering "yes" from the bare handle.
 *
 * Asynchronous because `onRegisteredSW` fires some way after first paint, so a
 * synchronous read taken while the More tab renders would report "no" for a
 * perfectly healthy install.
 */
export async function serviceWorkerReady(): Promise<boolean> {
  const found = await resolveRegistration()
  return found !== undefined && found.active !== null
}

export type UpdateCheck = 'unavailable' | 'checked' | 'failed'

/**
 * Ask the browser to re-fetch the worker script. If a new build is live this is
 * what makes the update pill appear; the pill's own 60-second poll does the
 * same thing unattended.
 *
 * Deliberately NOT gated on `serviceWorkerReady()`: a worker that is still
 * installing, or one whose precache install failed, can still be asked to
 * re-check, and answering "nothing to check" for it would be wrong.
 *
 * Worth knowing before a workshop: once a service worker is installed,
 * pull-to-refresh does NOT get you the new build. The old worker answers from
 * its own precache. This, the poll, and the visible build id are the three
 * things that make a deploy observable on the phone.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  const found = await resolveRegistration()
  // A latched registration error reports as "failed" rather than
  // "unavailable": there IS a worker on this origin, it just could not install.
  if (found === undefined) return registerFailed ? 'failed' : 'unavailable'
  try {
    await found.update()
    return 'checked'
  } catch {
    return 'failed'
  }
}
