/**
 * Component catalogue examples for the weekly payment cycle's documents and
 * cards (catch-up Phase 39a), on the live seed: Dr Souter's Week 29 backdrop
 * run (PRH13, paid, seeded).
 */

import { ANAE } from '../../../../domain/seed'
import { remittanceAdviceFor, useAppStore } from '../../../../store'
import { RemittanceAdviceDocument } from '../../../../shared/billing/RemittanceAdviceDocument'
import { LedgerPaymentRuns, StillToNetNotice } from '../../../admin/components/LedgerPaymentRuns'
import { RemittancesTab, StillToNetPanel } from '../../../web/screens/RemittancesTab'

/** Dr Souter's Week 29 remittance advice (the seed's newest backdrop run). */
export function RemittanceAdviceDocumentExample() {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const advice = remittanceAdviceFor({ billing, masters }, 'PRH13', ANAE.souter)
  return advice !== undefined ? <RemittanceAdviceDocument advice={advice} shot="catalogue-remittance-advice" /> : null
}

/** The Admin Ledger's per-anaesthetist Payment runs card and its still-to-net notice (shown only when a negative is open). */
export function LedgerPaymentRunsExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StillToNetNotice anaesthetistId={ANAE.souter} surname="Dr Souter" />
      <LedgerPaymentRuns anaesthetistId={ANAE.souter} />
    </div>
  )
}

/** Web Accounts · Remittances for Dr Souter: her backdrop weekly runs, a row opening its advice in a sheet. */
export function RemittancesTabExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StillToNetPanel anaesthetistId={ANAE.souter} />
      <RemittancesTab anaesthetistId={ANAE.souter} />
    </div>
  )
}
