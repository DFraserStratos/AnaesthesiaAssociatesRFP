import { create } from 'zustand'

/**
 * The anaesthetist's sign-in session (catch-up Phase 43a; US-13.5.3, PWA first).
 *
 * Per-viewer browser state, never `AppState`: a handset signs in once and stays
 * signed in across reloads and relaunches, and a Reset of the demo data never
 * touches it. No identity provider, no password check: the demo account signs in
 * at once (OQ-83 is open, so how people really sign in is narrated).
 *
 * The default when nothing is stored belongs to the host: the framed prototype
 * opens signed in, so no workshop starts on a login; the installed PWA opens
 * signed out, so a fresh handset shows the sign-in screen.
 *
 * Pure TypeScript over zustand: imports nothing from apps, shell or store, so it
 * sits in the PWA closure (`pwaPurity.test.ts`). Every storage access is wrapped
 * in try/catch (the `installPrompt.ts` pattern), so blocked storage falls back
 * to the host's default and never throws.
 */

/** The one storage key, beside the other `aa-*` keys. */
export const SESSION_KEY = 'aa-anaesthetist-session'

export interface StoredSession {
  signedIn: boolean
  /** The email signed in with (or last signed in with, after a sign-out). */
  account: string
}

/** The one place the provisional reading lives (OQ-83, deferred to the end of discovery). */
export const SIGN_IN_PROVISIONAL = {
  oq: 'OQ-83',
  note: 'How anaesthetists sign in (two-step codes, single sign-on, Face ID) is still to be decided. This screen stands in for it.',
} as const

/** The one constant an OQ-83 answer changes. */
export const SIGN_IN_RULE = { platform: 'pwa', provider: 'simulated', preFilled: true } as const

export type SessionDefault = 'signed-in' | 'signed-out'

function readStored(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { signedIn, account } = parsed as Partial<StoredSession>
    if (typeof signedIn !== 'boolean') return null
    return { signedIn, account: typeof account === 'string' ? account : '' }
  } catch {
    return null
  }
}

function writeStored(session: StoredSession | null): void {
  try {
    if (session === null) window.localStorage.removeItem(SESSION_KEY)
    else window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* blocked storage: this session will not survive a reload, and nothing throws */
  }
}

interface SessionStore {
  /** What storage holds, or null when nothing is stored (the host's default applies). */
  stored: StoredSession | null
  /** Writes storage and the mirror together; the only writer. */
  store: (session: StoredSession | null) => void
  /** Re-reads storage. */
  reload: () => void
}

/** A tiny non-persisted mirror of the stored session (Phase 14's `memory.ts` idiom), so screens re-render on a change. */
export const useSessionStore = create<SessionStore>((set) => ({
  stored: readStored(),
  store: (session) => {
    writeStored(session)
    set({ stored: session })
  },
  reload: () => set({ stored: readStored() }),
}))

function setStored(session: StoredSession | null): void {
  useSessionStore.getState().store(session)
}

/** Signed in, for a host default, given what is stored. Pure. */
export function signedInFrom(stored: StoredSession | null, defaultSession: SessionDefault): boolean {
  return stored === null ? defaultSession === 'signed-in' : stored.signedIn
}

/** Whether the viewer is signed in now, for the host's default. */
export function isSignedIn(defaultSession: SessionDefault): boolean {
  return signedInFrom(useSessionStore.getState().stored, defaultSession)
}

/** The hook the mobile app's gate reads. */
export function useAnaesthetistSession(defaultSession: SessionDefault): { signedIn: boolean; account: string | null } {
  const stored = useSessionStore((s) => s.stored)
  return { signedIn: signedInFrom(stored, defaultSession), account: stored?.account ?? null }
}

export function signInSession(account: string): void {
  setStored({ signedIn: true, account: account.trim() })
}

export function signOutSession(): void {
  const account = useSessionStore.getState().stored?.account ?? ''
  setStored({ signedIn: false, account })
}

/** Forget the session, so the host's default applies again (the framed Reset). */
export function clearAnaesthetistSession(): void {
  setStored(null)
}

/** Re-read storage. Nothing listens for another tab's change yet: a second framed tab follows on its next reload. */
export function reloadAnaesthetistSession(): void {
  useSessionStore.getState().reload()
}
