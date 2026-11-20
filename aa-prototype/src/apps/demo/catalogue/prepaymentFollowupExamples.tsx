/**
 * Catalogue examples for the prepayment follow-up (catch-up Phase 41;
 * US-06.3.6, US-06.4.1): the letter preview, and the prepaid settlement block
 * on Nair's rhinoplasty once her List is authorised in the demo store.
 */

import { useState } from 'react'
import { Button } from '../../../shared'
import { LetterPreview } from '../../../shared/booking/PrepaymentLetterDialogs'
import { PrepaidSettlementBlock } from '../../../shared/booking/PrepaidSettlementBlock'
import { LETTER_PREVIEW_SAMPLE, renderPrepaymentLetter } from '../../../domain/billing/prepaymentLetter'
import { SEED_LETTER_TEMPLATES } from '../../../domain/seed/prepaymentLetters'
import { SEED_LIST_IDS } from '../../../domain/seed'
import { authoriseList, completeBooking, confirmNoModifiers, submitList, useAppStore } from '../../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../../store/demoActors'

/** The Standard prepayment letter rendered against the fictional sample. */
export function LetterPreviewExample() {
  return <LetterPreview body={renderPrepaymentLetter(SEED_LETTER_TEMPLATES[0]!, LETTER_PREVIEW_SAMPLE)} />
}

/** Nair's settlement block: a button authorises her List in the demo store first. */
export function PrepaidSettlementExample({ as = 'office' }: { as?: 'office' | 'anaesthetist' }) {
  const procedureId = useAppStore((s) => s.billing.invoices['INV0001']?.procedureIds?.[0])
  const authorised = useAppStore((s) => s.schedule.lists[SEED_LIST_IDS.prepaymentPaidList]?.state === 'AUTHORISED')
  const [error, setError] = useState<string | null>(null)
  function authorise() {
    const listId = SEED_LIST_IDS.prepaymentPaidList
    for (const b of Object.values(useAppStore.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) {
      for (const p of Object.values(useAppStore.getState().schedule.procedures)) if (p.bookingId === b.id && p.modifierClaims.length === 0) confirmNoModifiers(useAppStore, SOUTER_ACTOR, p.id)
      completeBooking(useAppStore, SOUTER_ACTOR, b.id)
    }
    if (useAppStore.getState().schedule.lists[listId]?.state === 'ACTIVE') submitList(useAppStore, SOUTER_ACTOR, listId)
    const out = authoriseList(useAppStore, OFFICE_ACTOR, listId)
    setError(out.ok ? null : out.message)
  }
  if (procedureId === undefined) return null
  if (!authorised) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <Button variant="secondary" size="compact" onClick={authorise}>Authorise Dr Souter&apos;s Fri 24 Jul PM List</Button>
        {error !== null && <span style={{ fontSize: 13 }}>{error}</span>}
      </div>
    )
  }
  return <PrepaidSettlementBlock procedureId={procedureId} actor={as === 'office' ? OFFICE_ACTOR : SOUTER_ACTOR} />
}
