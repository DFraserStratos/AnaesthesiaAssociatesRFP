/**
 * The demo-ready browser storage every existing spec starts from (catch-up
 * Phase 43a). Two pieces of per-viewer state arrived with 43a that a fresh
 * browser context would otherwise show: the PWA's sign-in screen (the
 * installed app opens signed out) and, from 43a's second session, each app's
 * first-run welcome card. Presetting them keeps every existing flow and
 * screenshot where it was. New specs that test those states opt out with
 * `test.use({ storageState: { cookies: [], origins: [] } })`.
 *
 * Built from the live URLs, not a fixed JSON file, because a build lane runs on
 * its own ports (LANES.md) and a storage state is keyed by exact origin.
 */

/** Must match `shared/session/anaesthetistSession.ts`'s `SESSION_KEY`. */
export const SESSION_KEY = 'aa-anaesthetist-session'
export const SIGNED_IN_SESSION = JSON.stringify({ signedIn: true, account: 'm.souter@aa-associates.example' })

/** The first-run welcome cards' dismissal keys (catch-up Phase 43a, session 2). */
export const FIRST_RUN_HINT_KEYS = ['aa-first-run-hint-mobile', 'aa-first-run-hint-web', 'aa-first-run-hint-admin'] as const

type Origin = { origin: string; localStorage: { name: string; value: string }[] }

export function demoReadyStorageState(protoUrl: string, pwaUrl: string): { cookies: []; origins: Origin[] } {
  const hints = FIRST_RUN_HINT_KEYS.map((name) => ({ name, value: '1' }))
  return {
    cookies: [],
    origins: [
      { origin: protoUrl, localStorage: [...hints] },
      { origin: pwaUrl, localStorage: [...hints, { name: SESSION_KEY, value: SIGNED_IN_SESSION }] },
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

/**
 * An init script that re-seeds the three welcome-card dismissals on every load
 * unless set, for the specs that clear `localStorage` mid-test to start from
 * the pristine seed (catch-up Phase 43a). Self-contained, like the one above.
 */
export function keepHintsDismissedScript(): void {
  try {
    for (const key of ['aa-first-run-hint-mobile', 'aa-first-run-hint-web', 'aa-first-run-hint-admin']) {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, '1')
    }
  } catch {
    /* storage blocked: nothing to seed */
  }
}
