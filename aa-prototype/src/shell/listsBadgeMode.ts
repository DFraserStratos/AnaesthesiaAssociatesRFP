import { create } from 'zustand'
import type { ListsBadgeMode } from '../apps/admin/screens/lists/listsCounts'

/**
 * How the Admin side nav's Lists badge counts (OQ-151, open): All (every List that needs something)
 * or Urgent (only Lists dated up to a week after the demo day, everything earlier included). A
 * demo-only switch in the harness bar so AA can compare the two live; UI state, never persisted, never
 * the app store's. All by default.
 */
interface ListsBadgeModeStore {
  mode: ListsBadgeMode
  setMode: (mode: ListsBadgeMode) => void
}

export const useListsBadgeMode = create<ListsBadgeModeStore>((set) => ({
  mode: 'all',
  setMode: (mode) => set({ mode }),
}))
