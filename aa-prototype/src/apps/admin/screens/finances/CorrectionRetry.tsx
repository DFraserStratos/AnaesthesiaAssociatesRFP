/**
 * "Resolve and retry" on a Booking whose credit's Xero correction failed
 * (catch-up Phase 39; US-08.6.2 "Both sides move"), shown beside the Billing
 * tab's row while the correction waits after a failed attempt. Moved here from
 * the retired Billing monitor screen (build plan Phase 60).
 */

import { useMemo, useState } from 'react'
import { retryXeroItemNow, useAppStore, type Actor } from '../../../../store'
import { correctionQueuedFor } from '../../../../store/ledgerSelectors'
import type { XeroQueueItem } from '../../../../domain/types'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { Button, FormError } from '../../../../shared/ui'

/** A Booking's credit whose Xero correction waits in the sync queue after a failed attempt, if any. */
function useFailedCorrection(bookingId: string): { item: XeroQueueItem; creditNoteNumber: string } | undefined {
  const billing = useAppStore((s) => s.billing)
  return useMemo(() => {
    for (const cn of Object.values(billing.creditNotes).sort((a, b) => a.id.localeCompare(b.id))) {
      if (cn.bookingId !== bookingId) continue
      const item = correctionQueuedFor({ billing }, cn.id)
      if (item !== undefined) return { item, creditNoteNumber: cn.creditNoteNumber }
    }
    return undefined
  }, [billing, bookingId])
}

/**
 * Retries the correction's queue item now (`retryXeroItemNow`), which reverses
 * the original's Xero records and creates the new pairs together, or sets the
 * next try. Renders nothing while no correction waits.
 */
export function CorrectionRetry({ bookingId, actor }: { bookingId: string; actor: Actor }) {
  const failed = useFailedCorrection(bookingId)
  const [error, setError] = useState<string | null>(null)
  if (failed === undefined) return null
  function retryNow() {
    if (failed === undefined) return
    const out = retryXeroItemNow(useAppStore, actor, failed.item.id)
    setError(out.ok ? null : out.message)
  }
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <Button variant="primary" size="compact" onClick={retryNow} shot={`billing-correction-retry-${bookingId}`}>
        {CREDIT_LABELS.resolveAndRetry}
      </Button>
      <FormError message={error} />
    </span>
  )
}
