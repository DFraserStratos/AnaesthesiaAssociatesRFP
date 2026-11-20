/**
 * The raw hospital row, restricted (catch-up Phase 43; US-15.0.6): a record
 * side panel over Matching's row panel. It asks for a reason (three quick
 * reasons or free text), then shows the row as the hospital sent it with every
 * identifier masked by `RAW_ROW_MASKING`, and the line that the policy is for
 * AA to agree. Closing hides the payload; opening again asks again (each view
 * is a fresh, audited request). Teal only for the action.
 */

import { useState } from 'react'
import type { RawImportRow } from '../../../domain/types'
import { MASKING_POLICY_NOTE } from '../../../domain/privacy/mask'
import { RAW_ROW_REASONS, useAppStore, viewRawImportRow, type Actor } from '../../../store'
import { Button, FilterPills, FormError, Notice, TextField } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { SidePanel } from '../components/SidePanel'
import { neutral } from '../../../theme/tokens'

export function RawRowSheet({ rowId, patientName, actor, onClose }: { rowId: string; patientName: string; actor: Actor; onClose: () => void }) {
  const [quick, setQuick] = useState<string>('')
  const [text, setText] = useState('')
  const [shown, setShown] = useState<RawImportRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reason = text.trim() !== '' ? text.trim() : quick

  function view() {
    const out = viewRawImportRow(useAppStore, actor, rowId, reason)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    setShown(out.value)
  }

  return (
    <SidePanel
      open
      onClose={onClose}
      width="record"
      shot="matching-raw-row-sheet"
      testId="matching-raw-row-sheet"
      title="Raw hospital row"
      meta={<span>{patientName} · Restricted. Viewing is recorded with your reason.</span>}
      footer={
        shown === null ? (
          <>
            <Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="desktop" shot="matching-raw-row-view" disabled={reason === ''} disabledReason="Give a reason first." onClick={view}>
              View raw row
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="desktop" onClick={onClose}>Close</Button>
        )
      }
      footerLayout="end"
    >
      {shown === null ? (
        <div data-shot="matching-raw-row-reason" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 13, color: neutral.slate }}>Why do you need to see what the hospital sent?</span>
          <FilterPills
            ariaLabel="Quick reasons"
            value={quick}
            options={RAW_ROW_REASONS.map((r) => ({ value: r, label: r }))}
            onSelect={(v) => setQuick(v === quick ? '' : v)}
            style={{ flexWrap: 'wrap' }}
          />
          <TextField label="Or type a reason" value={text} onChange={setText} shot="matching-raw-row-reason-text" />
          <FormError message={error} />
        </div>
      ) : (
        <div data-shot="matching-raw-row-columns" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Notice tone="warning" shot="matching-raw-row-policy">{MASKING_POLICY_NOTE}. Identifiers are masked. The audit keeps your reason, never these values.</Notice>
          <TableShell label="Raw hospital row" density="dense">
            <thead>
              <tr>
                <Th>Column</Th>
                <Th>As sent (masked)</Th>
              </tr>
            </thead>
            <tbody>
              {shown.columns.map((c) => (
                <tr key={c.name} data-raw-column={c.name}>
                  <Td>{c.name}</Td>
                  <Td mono>{c.value === '' ? <span style={{ color: neutral.mist }}>Blank</span> : c.value}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </SidePanel>
  )
}
