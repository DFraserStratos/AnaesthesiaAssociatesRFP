import { create } from 'zustand'

/**
 * First-run hints (catch-up Phase 43a; US-15.0.1): one welcome card per app,
 * dismissed per browser like the PWA's install coaching.
 *
 * Per-viewer browser state, never `AppState`, never audited, so
 * `PERSIST_VERSION` does not move. Pure TypeScript over zustand: imports
 * nothing from apps, shell or store (PWA closure). Every storage access is in
 * try/catch: blocked storage shows the hint and never throws.
 */

export type HintApp = 'mobile' | 'web' | 'admin'

export const HINT_APPS: readonly HintApp[] = ['mobile', 'web', 'admin']

/** The three storage keys: present means dismissed. */
export const HINT_KEYS: Readonly<Record<HintApp, string>> = {
  mobile: 'aa-first-run-hint-mobile',
  web: 'aa-first-run-hint-web',
  admin: 'aa-first-run-hint-admin',
}

type Dismissed = Record<HintApp, boolean>

function readDismissed(): Dismissed {
  const out: Dismissed = { mobile: false, web: false, admin: false }
  for (const app of HINT_APPS) {
    try {
      out[app] = window.localStorage.getItem(HINT_KEYS[app]) !== null
    } catch {
      out[app] = false
    }
  }
  return out
}

function writeDismissed(app: HintApp, dismissed: boolean): void {
  try {
    if (dismissed) window.localStorage.setItem(HINT_KEYS[app], '1')
    else window.localStorage.removeItem(HINT_KEYS[app])
  } catch {
    /* blocked storage: the dismissal lasts until a reload, and nothing throws */
  }
}

interface HintStore {
  dismissed: Dismissed
  dismiss: (app: HintApp) => void
  clearAll: () => void
  reload: () => void
}

/** A tiny non-persisted mirror of the three keys, so the cards and the trigger re-render on a change. */
export const useHintStore = create<HintStore>((set) => ({
  dismissed: readDismissed(),
  dismiss: (app) => {
    writeDismissed(app, true)
    set((s) => ({ dismissed: { ...s.dismissed, [app]: true } }))
  },
  clearAll: () => {
    for (const app of HINT_APPS) writeDismissed(app, false)
    set({ dismissed: { mobile: false, web: false, admin: false } })
  },
  reload: () => set({ dismissed: readDismissed() }),
}))

export function dismissHint(app: HintApp): void {
  useHintStore.getState().dismiss(app)
}

/** Bring every welcome card back (the two framed Resets, the PWA Reset, the demo trigger). */
export function clearFirstRunHintDismissals(): void {
  useHintStore.getState().clearAll()
}

export function anyHintDismissed(): boolean {
  const { dismissed } = useHintStore.getState()
  return HINT_APPS.some((app) => dismissed[app])
}

/** Whether this app's card shows now. */
export function useHintShown(app: HintApp): boolean {
  return useHintStore((s) => !s.dismissed[app])
}
