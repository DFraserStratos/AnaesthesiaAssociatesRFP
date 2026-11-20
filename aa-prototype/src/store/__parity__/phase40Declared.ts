/**
 * Catch-up Phase 40's one declared seed move: Dr Sharma's patient-billed
 * history (`SHARMA_PATIENT_ACCOUNTS`, the `HS` id namespace), appended after
 * every earlier seed record so no existing id, number, amount or Xero contact
 * id moves. The earlier phases' parity harnesses compare the seed as it was;
 * `withoutPhase40` takes exactly the `HS` records (and the Xero contacts only
 * they use) out, so everything else is compared with its baseline unchanged.
 * The seed-level half is `domain/seed/__fixtures__/phase40Declared.ts`.
 */

import { createAppStore, type AppState, type BoundAppStore } from '../appStore'
import { installDomainState, type DomainState } from '../mutate'
import { dropPhase40, isPhase40Id, seedWithoutPhase40 } from '../../domain/seed/__fixtures__/phase40Declared'

export { PHASE_40_REASON, isPhase40Id, seedWithoutPhase40 } from '../../domain/seed/__fixtures__/phase40Declared'

/** The state with the `HS` history taken out: every earlier phase's capture reads the seed it pinned. */
export function withoutPhase40<S extends AppState>(input: S): S {
  const state = seedWithoutPhase40(input)
  const xero = state.xero
  const accRecs = dropPhase40(xero.accRecs)
  const accPays = dropPhase40(xero.accPays)
  const used = new Set<string>()
  for (const r of Object.values(accRecs)) used.add(r.contactId)
  for (const p of Object.values(accPays)) used.add(p.contactId)
  const onlyHs = new Set<string>()
  for (const r of Object.values(xero.accRecs)) if (isPhase40Id(r.id) && !used.has(r.contactId)) onlyHs.add(r.contactId)
  for (const p of Object.values(xero.accPays)) if (isPhase40Id(p.id) && !used.has(p.contactId)) onlyHs.add(p.contactId)
  return {
    ...state,
    billing: {
      ...state.billing,
      invoices: dropPhase40(state.billing.invoices),
      invoiceLines: dropPhase40(state.billing.invoiceLines),
      ledger: dropPhase40(state.billing.ledger),
      receipts: dropPhase40(state.billing.receipts),
      disbursements: dropPhase40(state.billing.disbursements),
      contactIdCache: dropPhase40(state.billing.contactIdCache, (_k, v) => onlyHs.has(v)),
      creditNotes: dropPhase40(state.billing.creditNotes),
      negativeInvoices: dropPhase40(state.billing.negativeInvoices),
    },
    xero: {
      ...xero,
      accRecs,
      accPays,
      payments: dropPhase40(xero.payments),
      disbursements: dropPhase40(xero.disbursements),
      contacts: dropPhase40(xero.contacts, (id) => onlyHs.has(id)),
      creditNotes: dropPhase40(xero.creditNotes),
    },
  }
}

/** A fresh store holding the seed without the `HS` history (installed through mutate.ts's one wholesale path). */
export function storeWithoutPhase40(): BoundAppStore {
  const api = createAppStore()
  const { shell: _shell, ...domain } = withoutPhase40(api.getState())
  installDomainState(api, domain as unknown as DomainState)
  return api
}
