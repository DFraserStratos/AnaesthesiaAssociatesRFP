import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Screen state the URL cannot carry, published for the demo triggers (catch-up
 * Phase 14): a local tab, a selected row, an edit draft. UI state only, never
 * domain state, and not persisted, so no `PERSIST_VERSION` change. Later phases
 * add keys here.
 */
export interface DemoContextValues {
  /** Admin · Integrations: the open tab. */
  'integrations.tab': 'messages' | 'feeds' | 'pdfs' | 'quality' | 'validators'
  /** Integrations simulator: the message selected in the library. */
  'integrationsSim.selectedMessageId': string
}

export type DemoContextKey = keyof DemoContextValues

interface DemoContextStore {
  values: Partial<DemoContextValues>
  publish: <K extends DemoContextKey>(key: K, value: DemoContextValues[K]) => void
  withdraw: (key: DemoContextKey) => void
}

/**
 * A small UI-only store of its own (not the app store: no domain state, no
 * audit, no persistence), written only through its two actions.
 */
export const useDemoContextStore = create<DemoContextStore>((set) => ({
  values: {},
  publish: (key, value) => set((s) => ({ values: { ...s.values, [key]: value } })),
  withdraw: (key) =>
    set((s) => {
      const { [key]: _removed, ...rest } = s.values
      return { values: rest }
    }),
}))

/** Publish `value` under `key` while the calling component is mounted. */
export function useDemoTriggerContext<K extends DemoContextKey>(key: K, value: DemoContextValues[K]): void {
  useEffect(() => {
    useDemoContextStore.getState().publish(key, value)
  }, [key, value])
  useEffect(() => () => useDemoContextStore.getState().withdraw(key), [key])
}

/** Everything currently published (read by the bar menu and the PWA sheet). */
export function useDemoTriggerPublished(): Partial<DemoContextValues> {
  return useDemoContextStore((s) => s.values)
}
