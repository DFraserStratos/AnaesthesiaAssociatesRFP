import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@proto/theme/global.css'
import './index.css'
import { App } from './App'
import { loadRegistry } from './rows/registry'

// Deliberately NOT wired: the prototype's background jobs (wireBillingRun, wireReconciliationPoll,
// wireArchiveJob, wireIntegrationRetry). The preview only renders catalogue rows.
// Replacement slices load first, each isolated (src/rows/registry.ts).
void loadRegistry().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
