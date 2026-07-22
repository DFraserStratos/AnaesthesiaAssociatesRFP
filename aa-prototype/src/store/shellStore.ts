import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppId } from '../shell/appConfig'

/**
 * Shell store — the only store state in Phase 00. Remembers which app is active
 * so a refresh returns to it (persisted to localStorage). The persona shown in
 * the top bar is derived from the active app via `APP_CONFIG`, so it lives in
 * the app registry rather than here.
 */
interface ShellState {
  currentApp: AppId
  setCurrentApp: (app: AppId) => void
}

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      currentApp: 'mobile',
      setCurrentApp: (app) => set({ currentApp: app }),
    }),
    { name: 'aa-shell' },
  ),
)
