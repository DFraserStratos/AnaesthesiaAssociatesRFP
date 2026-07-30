import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import '../src/theme/global.css'
import { MobileApp } from '../src/apps/mobile/MobileApp'
import {
  MobileAvailabilityRoute,
  MobileBalancesRoute,
  MobileListsRoute,
  MobileMoreRoute,
} from '../src/apps/mobile/routes'
import { MobileViewport } from '../src/pwa/MobileViewport'
import { PwaDemoPanel } from '../src/pwa/PwaDemoPanel'
import { wireOfficeSimulation } from '../src/pwa/officeSimulation'
import { markBootStart } from '../src/pwa/bootMetrics'
import { BootMark } from '../src/pwa/BootMark'
// Side-effect import: attaches the `beforeinstallprompt` listener at module
// evaluation. It has to be this early. Chrome fires the event once, seconds
// after load, and the card that replays it (`InstallCoach`, behind the More tab)
// does not exist yet — see `src/pwa/installPrompt.ts`.
import '../src/pwa/installPrompt'
import {
  useAppStore,
  wireArchiveJob,
  wireBillingRun,
  wireIntegrationRetry,
  wireReconciliationPoll,
} from '../src/store'

/**
 * The installable PWA's entry — the Anaesthetist Mobile App on its own, at the
 * device's full size.
 *
 * It shares 100% of `src/` with the prototype and differs in four ways: the host
 * is `MobileViewport` rather than `PhoneFrame`, there is no `AppShell`, the More
 * tab gets the presenter controls the harness bar would otherwise have carried,
 * and it wires `wireOfficeSimulation`, which `src/main.tsx` deliberately does not
 * (see `src/pwa/officeSimulation.ts`). The rest of what this file does is
 * device-only plumbing that changes no app behaviour: the cold-launch marks, and
 * the `beforeinstallprompt` capture the Android install button depends on.
 *
 * NO `AppShell` is the load-bearing omission. It is what drops the harness bar,
 * the two web apps, the admin app and the four demo surfaces from this bundle:
 * measured 2026-07-30, the all-apps build is 888 KiB raw / 235 KiB gzip and
 * this closure tree-shakes to 549 KiB / 158 KiB, so the PWA ships 38% less JS.
 * `src/pwa/pwaPurity.test.ts` is what stops that eroding.
 *
 * The URLs stay `/mobile/*` verbatim. `MOBILE_TAB_PATH`, `listsStackLocation`'s
 * `matchPath('/mobile/lists/:listId/cards/:cardId', …)` and every
 * `navigate('/mobile/…')` hard-code the prefix, and `basename="/mobile"` does
 * NOT fix that — under it, `navigate('/mobile/lists')` yields
 * `/mobile/mobile/lists`. Rebasing would mean parameterising a shared pure
 * module for cosmetic gain on URLs nobody sees in an installed app. So the
 * manifest starts at `/mobile/lists` and `/` redirects there.
 */

// The same four store jobs the prototype entry wires, for the same reasons
// (see `src/main.tsx`): the billing run consumes `listAuthorised`, then the
// `dayAdvanced` hooks in order, then the integration retry timer.
wireBillingRun(useAppStore)
wireReconciliationPoll(useAppStore)
wireArchiveJob(useAppStore)
wireIntegrationRetry(useAppStore)
// PWA-only, and on by default: with no Admin app on the phone there is nobody
// to play the office, so a submitted List would sit in Done forever and
// Balances would never move. Explicitly a simulation, not the RFP flow.
wireOfficeSimulation(useAppStore)

markBootStart()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/mobile" element={<MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel />} />}>
          <Route index element={<Navigate to="lists" replace />} />
          <Route path="lists/*" element={<MobileListsRoute />} />
          <Route path="availability" element={<MobileAvailabilityRoute />} />
          <Route path="balances" element={<MobileBalancesRoute />} />
          <Route path="more" element={<MobileMoreRoute />} />
          <Route path="*" element={<Navigate to="/mobile/lists" replace />} />
        </Route>
        {/* `/` and anything unrecognised land on the Lists tab. The manifest's
            `start_url` points straight at `/mobile/lists` so a launch from the
            home screen skips this hop entirely. */}
        <Route path="*" element={<Navigate to="/mobile/lists" replace />} />
      </Routes>
    </BrowserRouter>
    {/* Last, so its effect runs after the app's own: the number in the More tab
        then covers parse, module evaluation (the seed builds eagerly), React's
        first commit and the paint that follows it. */}
    <BootMark />
  </StrictMode>,
)
