/**
 * The footer's primary once an arrival is decided (27 Nov 2026 rebuild; O1): opens the next arrival in the inbox's
 * order. Benches show it only when there is a next one; Back in the header still goes to the inbox.
 *
 * Hook: `intake-next-arrival`.
 */

import { ArrowRight } from 'lucide-react'
import { Button } from '../../../../../shared/ui'

export function NextArrivalButton({ onNext }: { onNext: () => void }) {
  return (
    <Button variant="primary" size="desktop" onClick={onNext} shot="intake-next-arrival">
      Next arrival <ArrowRight size={15} strokeWidth={2.2} aria-hidden />
    </Button>
  )
}
