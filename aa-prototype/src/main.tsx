import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/global.css'
import App from './App.tsx'
import { useAppStore, wireArchiveJob, wireBillingRun, wireIntegrationRetry, wireReconciliationPoll } from './store'

// The billing engine's one integration point (RFP): authorising a List emits
// `listAuthorised`; the run consumes it (then hands its cases off to Xero).
// Wired once, here, for the singleton store — never in appStore.ts (mutate.ts
// runtime-imports it) and never per-store (tests drive the actions themselves).
wireBillingRun(useAppStore)
// Phase 10 `dayAdvanced` hooks, in order: the reconciliation poll (catches a
// missed Xero payment) runs BEFORE the nightly contact-archive job, so a
// payment the poll catches can make a contact fully-paid before it is archived.
wireReconciliationPoll(useAppStore)
wireArchiveJob(useAppStore)
// Phase 11: auto-retry `retrying` integration messages on a short timer (the
// transient message recovers on its own; the malformed one exhausts its budget
// into dead-letter). UI-layer only — tests drive retryMessage synchronously.
wireIntegrationRetry(useAppStore)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
