import type { Stub } from '../../domain/types'
import { BottomSheet } from '../surface/BottomSheet'
import { OverlayHeader } from '../surface/OverlayHeader'
import { StubDetails } from './StubParts'

/** The phone's stub sheet (catch-up Phase 33a; US-02.6.2): what was received, why it waits, who resolves it. Read only. */
export function StubSheet({ stub, onClose }: { stub: Stub | undefined; onClose: () => void }) {
  return (
    <BottomSheet open={stub !== undefined} onClose={onClose}>
      {stub !== undefined && (
        <div data-shot="stub-sheet" data-stub-id={stub.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title="Booking waiting at intake" description="A stub, not a Booking. It stays on this List until the office resolves it." />
          <StubDetails stub={stub} />
        </div>
      )}
    </BottomSheet>
  )
}
