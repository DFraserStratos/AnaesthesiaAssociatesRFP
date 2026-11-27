/**
 * End a pairing preference (catch-up Phase 17; US-13.6.3 "Remove a pairing").
 * Ending never deletes: the entry moves to "Ended entries" on both profiles
 * with who ended it, when and why, and the history is audited.
 */

import { useState } from 'react'
import { PAIRING_LABELS } from '../../../../domain/pairingPreferences'
import type { PairingPreference } from '../../../../domain/types'
import { neutral } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { endPairingPreference } from '../../../../store/officePrivate'
import { TextField, FormError } from '../../../../shared'
import { ConfirmSheet } from '../../../../shared/surface'
import { addedLine } from './pairingFormat'
import { Notice } from '../../../../shared/ui/Notice'

export function PairingEndSheet({ entry, sentence, actor, onClose }: { entry: PairingPreference; sentence: string; actor: Actor; onClose: () => void }) {
  const [endReason, setEndReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const trimmed = endReason.trim()
    const outcome = endPairingPreference(useAppStore, actor, entry.id, trimmed !== '' ? trimmed : undefined)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <ConfirmSheet open onClose={onClose} title="End this pairing" confirmLabel="End pairing" onConfirm={save} cancelLabel="Cancel" shot="pairing-end-sheet">
      <Notice tone="neutral">
        <div style={{ fontSize: 11, fontWeight: 600, color: neutral.slate }}>{PAIRING_LABELS.kind[entry.kind]}</div>
        <div style={{ fontSize: 14, color: neutral.ink }}>{sentence}</div>
        <div style={{ fontSize: 13, color: entry.reason !== undefined ? neutral.slate : neutral.mist }}>{entry.reason ?? PAIRING_LABELS.noReason}</div>
        <div style={{ fontSize: 12, color: neutral.mist }}>{addedLine(entry.addedBy, entry.addedAtISO)}</div>
      </Notice>
      <TextField label="Why it ended (optional)" value={endReason} onChange={setEndReason} placeholder="e.g. Resolved with the surgeon's rooms" hint={`The entry is kept under ${PAIRING_LABELS.ended} on both profiles.`} />
      <FormError message={error} />
    </ConfirmSheet>
  )
}
