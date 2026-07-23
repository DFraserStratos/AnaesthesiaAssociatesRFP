import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/global.css'
import App from './App.tsx'
import { useAppStore, wireBillingRun } from './store'

// The billing engine's one integration point (RFP): authorising a List emits
// `listAuthorised`; the run consumes it. Wired once, here, for the singleton
// store — never in appStore.ts (mutate.ts runtime-imports it) and never
// per-store (tests drive `runBillingForList` themselves).
wireBillingRun(useAppStore)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
