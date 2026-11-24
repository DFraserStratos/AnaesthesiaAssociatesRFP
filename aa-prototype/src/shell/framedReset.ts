import { resetDemo, useAppStore } from '../store'
import { clearAnaesthetistSession } from '../shared/session/anaesthetistSession'

/**
 * The framed prototype's one reset (catch-up Phase 43a): the pristine seed,
 * then the anaesthetist's sign-in session forgotten, so the framed phone falls
 * back to its signed-in default and no Reset or scenario jump ever lands on a
 * login. Every framed reset path calls this; nothing under `src/apps/demo` or
 * `src/shell` calls `resetDemo(` itself (`framedReset.test.ts`). The PWA's own
 * Reset (`pwa/PwaDemoPanel.tsx`) does not come here: a handset stays signed in.
 */
export function resetFramedDemo(): void {
  resetDemo(useAppStore)
  clearAnaesthetistSession()
}
