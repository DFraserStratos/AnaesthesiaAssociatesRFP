/**
 * The demo-ready browser storage every existing spec starts from (catch-up
 * Phase 43a). A fresh browser context would otherwise show the PWA's sign-in
 * screen (the installed app opens signed out). Presetting the session keeps
 * every existing flow and screenshot where it was. New specs that test that
 * state opt out with
 * `test.use({ storageState: { cookies: [], origins: [] } })`.
 *
 * Built from the live URLs, not a fixed JSON file, because AA_PROTO_PORT and
 * AA_PWA_PORT can move the ports and a storage state is keyed by exact origin.
 */

/** Must match `shared/session/anaesthetistSession.ts`'s `SESSION_KEY`. */
const SESSION_KEY = 'aa-anaesthetist-session'
const SIGNED_IN_SESSION = JSON.stringify({ signedIn: true, account: 'm.souter@aa-associates.example' })

type Origin = { origin: string; localStorage: { name: string; value: string }[] }

export function demoReadyStorageState(protoUrl: string, pwaUrl: string): { cookies: []; origins: Origin[] } {
  return {
    cookies: [],
    origins: [
      { origin: protoUrl, localStorage: [] },
      { origin: pwaUrl, localStorage: [{ name: SESSION_KEY, value: SIGNED_IN_SESSION }] },
    ],
  }
}

/**
 * An init script that re-seeds the PWA's signed-in session on every load
 * unless one is stored. Several PWA specs clear `localStorage` mid-test to
 * start from the pristine seed, which would otherwise sign the handset out.
 * Self-contained: Playwright serialises it into the page.
 */
export function keepSignedInScript(): void {
  try {
    if (window.localStorage.getItem('aa-anaesthetist-session') === null) {
      window.localStorage.setItem('aa-anaesthetist-session', JSON.stringify({ signedIn: true, account: 'm.souter@aa-associates.example' }))
    }
  } catch {
    /* storage blocked: nothing to seed */
  }
}
