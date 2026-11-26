/**
 * The bench for a new List, from any source (build plan Phase 70; D117, D118, D120; US-02.2.1, US-01.6.1, US-02.1.2's
 * placement half; `docs/explorations/intake-ideas.html` `#idea1` mock B). Who sent it; for a rooms' PDF the page
 * beside the values read from it (each unsure value marked to check and lit where it sits on the page), for a
 * hospital List its rows; each row corrected before the List is placed; then where to place the whole List, as one
 * change set (`PlaceListCard`, `store/intakePlace.ts`), or Reject with a reason.
 *
 * Hooks: `data-shot="intake-bench-newList"`, `data-arrival-key`; `intake-newlist-sender`, `intake-newlist-reject`,
 * `intake-newlist-decided`; the parts' own (`intake-pdf-page`, `intake-pdf-values`, `intake-place-list`).
 */

import { useState } from 'react'
import { validateNhi } from '../../../../../domain/nhi'
import { effectiveIncoming } from '../../../../../domain/intake/matching'
import { pdfValueKey } from '../../../../../domain/intake/pdfLists'
import type { PdfReadField } from '../../../../../domain/types'
import { stampText } from '../../../../../shared/format'
import { Button, FormError, Notice, TextAction, TextField } from '../../../../../shared/ui'
import { arrivalPlaced, rejectArrivalList, useAppStore } from '../../../../../store'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import type { BenchProps } from './benchProps'
import { PdfPage, pdfPageBoxes } from './newList/PdfPage'
import { PdfValuesTable } from './newList/PdfValuesTable'
import { PlaceListCard } from './newList/PlaceListCard'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

/** Who sent it, in words: the email's address, the person who added it by hand, or the hospital's feed. */
function senderLine(source: { kind: string; senderEmail?: string; by?: string } | undefined, hospitalName: string): string {
  if (source === undefined) return ''
  if (source.kind === 'mailbox') return `From ${source.senderEmail ?? 'the rooms'}, by the rooms' mailbox`
  if (source.kind === 'byHand') return `From ${source.senderEmail ?? 'the rooms'}, added by hand by ${source.by ?? 'the office'}`
  return `From ${hospitalName}'s feed`
}

export function NewListBench({ arrival, actor, onDone }: BenchProps) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const pdf = useAppStore((s) => (batch?.pdfListId !== undefined ? s.intake.pdfLists[batch.pdfListId] : undefined))
  const rows = useAppStore((s) => s.intake.rows)
  const hospitalName = useAppStore((s) => s.masters.hospitals[arrival.hospitalId]?.name ?? arrival.hospitalId)
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  const arrivalRows = arrival.rowIds.flatMap((id) => (rows[id] !== undefined ? [rows[id]] : []))
  const pdfRowIds = new Set(arrivalRows.flatMap((r) => (r.pdfRowId !== undefined ? [r.pdfRowId] : [])))
  const invalidNhi = arrival.openRowIds.some((id) => {
    const row = rows[id]
    if (row === undefined) return false
    const nhi = effectiveIncoming(row).patient.nhi
    return nhi !== undefined && nhi.trim() !== '' && !validateNhi(nhi).valid
  })
  // Placed (its waiting patients still open) or decided: no more corrections, placing or rejecting here.
  const placed = useAppStore((s) => arrivalPlaced(s, arrival))
  const locked = arrival.decided || placed
  // A value the office has corrected is no longer one to check: its box goes quiet on the page.
  const corrected = new Set(
    arrivalRows.flatMap((r) =>
      r.pdfRowId === undefined ? [] : (r.correctionHistory ?? []).map((c) => pdfValueKey(r.pdfRowId!, c.field === 'patientName' ? 'name' : (c.field as PdfReadField))),
    ),
  )
  const boxes = pdf === undefined ? [] : pdfPageBoxes(pdf, pdfRowIds).map((b) => (b.unsure && corrected.has(b.key) ? { ...b, unsure: false } : b))

  const reject = () => {
    const out = rejectArrivalList(useAppStore, actor, arrival.key, reason)
    if (!out.ok) {
      setRefusal(out.message)
      return
    }
    setRefusal(null)
    setRejecting(false)
    onDone()
  }

  return (
    <div data-shot="intake-bench-newList" data-arrival-key={arrival.key} style={{ display: 'flex', flexDirection: 'column', gap: space[6], minWidth: 0 }}>
      <p data-shot="intake-newlist-sender" style={{ margin: 0, ...SMALL }}>
        {senderLine(batch?.arrivalSource as { kind: string; senderEmail?: string; by?: string } | undefined, hospitalName)}
      </p>

      {pdf !== undefined ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: space[6], alignItems: 'start' }}>
          <PdfPage
            facsimile={pdf.file.facsimile}
            fileName={pdf.file.name}
            boxes={boxes}
            {...(selectedKey !== undefined ? { selectedKey } : {})}
            onSelect={setSelectedKey}
          />
          <PdfValuesTable arrival={arrival} actor={actor} {...(selectedKey !== undefined ? { selectedKey } : {})} onSelect={setSelectedKey} locked={locked} />
        </div>
      ) : (
        <PdfValuesTable arrival={arrival} actor={actor} locked={locked} />
      )}

      {locked ? (
        <Notice tone="success" title={placed ? 'Placed' : 'Decided'} shot="intake-newlist-decided">
          {placed && !arrival.decided
            ? 'This List has been placed. Its patients waiting for an NHI join it as stubs until their NHI arrives.'
            : `Every patient on this List has been decided. Received ${stampText(arrival.receivedAtISO)}.`}
        </Notice>
      ) : (
        <>
          <PlaceListCard
            arrival={arrival}
            actor={actor}
            {...(invalidNhi ? { disabledReason: 'Correct the invalid NHI first.' } : {})}
            onPlaced={() => onDone()}
          />
          <div data-shot="intake-newlist-reject" style={{ display: 'flex', flexDirection: 'column', gap: space[2], alignItems: 'flex-start' }}>
            {rejecting ? (
              <>
                <TextField label="Why reject this List?" value={reason} onChange={setReason} size="compact" width={360} autoFocus />
                {refusal !== null && <FormError message={refusal} />}
                <div style={{ display: 'flex', gap: space[2] }}>
                  <Button variant="danger" size="compact" onClick={reject}>
                    Reject List
                  </Button>
                  <Button variant="secondary" size="compact" onClick={() => { setRejecting(false); setRefusal(null) }}>
                    Keep it
                  </Button>
                </div>
              </>
            ) : (
              <TextAction onClick={() => setRejecting(true)}>Reject this List</TextAction>
            )}
          </div>
        </>
      )}
    </div>
  )
}
