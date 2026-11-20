/**
 * Component catalogue examples for catch-up Phase 40's shared pieces, used by
 * all three catalogues: the anaesthetist's `BalanceAlertChip` (as its pure
 * `BalanceAlertPill`, on the row and in the detail) and `SharedNotes` (as its
 * pure `SharedNotesPanel`, with local notes, so the catalogue never writes the
 * demo store).
 */

import { useState } from 'react'
import { BalanceAlertPill } from '../../../shared/patients'
import { StrengthPill, WarningPreviewRow } from '../../../shared/warnings'
import { TextAction } from '../../../shared/ui'
import { PATIENT_BALANCE_PREVIEW_CAPTION } from '../../../store'
import { SharedNotesPanel, type SharedNotesSize } from '../../../shared/notes'
import { NOTE_REQUIRED_MESSAGE } from '../../../store'
import { PATIENT_BALANCE_CREDIT_SHORT, PATIENT_BALANCE_OWES_SHORT } from '../../../domain/warnings'
import type { SharedNote } from '../../../domain/types'
import { neutral } from '../../../theme/tokens'

const ALERTS = [
  { label: 'Strong', alert: { strength: 'strong' as const, text: PATIENT_BALANCE_OWES_SHORT } },
  { label: 'Mild', alert: { strength: 'mild' as const, text: PATIENT_BALANCE_OWES_SHORT } },
  { label: 'Credit', alert: { strength: 'mild' as const, text: PATIENT_BALANCE_CREDIT_SHORT } },
]

export function BalanceAlertChipExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ALERTS.map((a) => (
        <div key={a.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600 }}>
            <span style={{ width: 56, fontSize: 12, fontWeight: 400, color: neutral.slate }}>{a.label}</span>
            Patient name <BalanceAlertPill alert={a.alert} />
          </span>
          <BalanceAlertPill alert={a.alert} placement="detail" />
        </div>
      ))}
    </div>
  )
}

/** The one strength pill: mild, strong, and a cleared strong one (neutral). */
export function StrengthPillExample() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <StrengthPill strength="mild" />
      <StrengthPill strength="strong" />
      <StrengthPill strength="strong" cleared />
      <StrengthPill strength="strong" size="sm" />
    </div>
  )
}

/** The balance warning a save will raise, mild and strong, with the caption and the record link (no Clear). */
export function WarningPreviewRowExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
      <WarningPreviewRow strength="mild" text="Losa Tuilagi owes $380.00 on 1 invoice, 30 days old.">
        <span>{PATIENT_BALANCE_PREVIEW_CAPTION}</span>
      </WarningPreviewRow>
      <WarningPreviewRow strength="strong" text="Sarah Mitchell owes $610.00 on 1 invoice, unpaid for 98 days.">
        <span>{PATIENT_BALANCE_PREVIEW_CAPTION}</span>
        <TextAction size="sm" flush onClick={() => {}}>Open patient record</TextAction>
      </WarningPreviewRow>
    </div>
  )
}

const SEED_NOTES: SharedNote[] = [
  { id: 'NTE-EX-2', text: 'Noted, the theatre knows.', atISO: '2026-07-21T09:40', by: 'Kirsty W.' },
  { id: 'NTE-EX-1', text: 'Patient 3 is latex allergic.', atISO: '2026-07-21T08:15', by: 'Dr Melanie Souter' },
]

export function SharedNotesExample({ size = 'desktop', by }: { size?: SharedNotesSize; by: string }) {
  const [notes, setNotes] = useState<SharedNote[]>(SEED_NOTES)
  return (
    <SharedNotesPanel
      notes={notes}
      what="List"
      size={size}
      onAdd={(text) => {
        if (text.trim() === '') return NOTE_REQUIRED_MESSAGE
        setNotes((n) => [{ id: `NTE-EX-${n.length + 1}`, text: text.trim(), atISO: '2026-07-21T10:05', by }, ...n])
        return null
      }}
    />
  )
}
