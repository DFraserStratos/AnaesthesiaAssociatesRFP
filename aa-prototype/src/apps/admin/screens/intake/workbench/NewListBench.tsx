/**
 * The bench for a new List, from any source (build plan Phase 70; D117, D118, D120; US-02.2.1, US-01.6.1, US-02.1.2's
 * placement half; the opened arrival's O1 in docs/explorations/intake-inbox-iterations.html). The document is the
 * rooms' PDF on the desk, each unsure value marked to check and lit where it sits on the page (a hospital's List has
 * no page: its rows show as received). The decision column holds the values read from it, each correctable before
 * the List is placed, a note for each patient with no NHI, and where to place the whole List (`usePlaceList`). The
 * footer places it as one change set (`store/intakePlace.ts`), or opens Reject, whose reason form then sits in the
 * column with its own confirm in the footer.
 *
 * Hooks: `data-shot="intake-bench-newList"`, `data-arrival-key`; `intake-newlist-reject` (the footer's Reject and,
 * while the form is open, the form), `intake-newlist-reject-confirm`, `intake-newlist-decided`, `intake-newlist-nhi`;
 * the parts' own (`intake-pdf-page`, `intake-pdf-values`, `intake-place-list`, `intake-place-list-submit`).
 */

import { useState } from 'react'
import { validateNhi } from '../../../../../domain/nhi'
import { effectiveIncoming } from '../../../../../domain/intake/matching'
import { pdfValueKey } from '../../../../../domain/intake/pdfLists'
import { pdfPageCount } from '../../../../../domain/intake/pdfRead'
import type { PdfReadField } from '../../../../../domain/types'
import { stampText } from '../../../../../shared/format'
import { Button, FormError, Notice, TextField } from '../../../../../shared/ui'
import { arrivalPlaced, rejectArrivalList, useAppStore } from '../../../../../store'
import { space } from '../../../../../theme/tokens'
import { AsReceived } from './ArrivalDocument'
import { BenchLayout } from './BenchLayout'
import type { BenchActions, BenchProps } from './benchProps'
import { NextArrivalButton } from './NextArrivalButton'
import { PdfPage, pdfPageBoxes } from './newList/PdfPage'
import { PdfValuesTable } from './newList/PdfValuesTable'
import { usePlaceList } from './newList/PlaceListCard'

export function NewListBench({ arrival, actor, onDone, onNext }: BenchProps) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const pdf = useAppStore((s) => (batch?.pdfListId !== undefined ? s.intake.pdfLists[batch.pdfListId] : undefined))
  const rows = useAppStore((s) => s.intake.rows)
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

  const place = usePlaceList({ arrival, actor, ...(invalidNhi ? { disabledReason: 'Correct the invalid NHI first.' } : {}), onPlaced: () => onDone() })

  const closeReject = () => {
    setRejecting(false)
    setReason('')
    setRefusal(null)
  }
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

  const document =
    pdf !== undefined ? (
      <PdfPage
        facsimile={pdf.file.facsimile}
        fileName={pdf.file.name}
        {...(pdf.file.pages !== undefined ? { pages: pdf.file.pages } : { pageCount: pdfPageCount(pdf.rows.length) })}
        boxes={boxes}
        {...(selectedKey !== undefined ? { selectedKey } : {})}
        onSelect={setSelectedKey}
      />
    ) : (
      <AsReceived arrival={arrival} />
    )

  const decision = (
    <>
      <PdfValuesTable arrival={arrival} actor={actor} {...(pdf !== undefined && selectedKey !== undefined ? { selectedKey } : {})} {...(pdf !== undefined ? { onSelect: setSelectedKey } : {})} locked={locked} />
      {locked ? (
        <Notice tone="success" title={placed && !arrival.decided ? 'Placed' : 'Decided'} shot="intake-newlist-decided">
          {placed && !arrival.decided
            ? 'This List has been placed. Its patients waiting for an NHI join it as stubs until their NHI arrives.'
            : `Every patient on this List has been decided. Received ${stampText(arrival.receivedAtISO)}.`}
        </Notice>
      ) : (
        <>
          {(place?.stubNames ?? []).map((name) => (
            <Notice key={name} tone="warning" icon={false} title={`${name} has no NHI.`} shot="intake-newlist-nhi">
              Goes on the List as a stub, and becomes a Booking once the NHI is added.
            </Notice>
          ))}
          {rejecting ? (
            <div data-shot="intake-newlist-reject" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
              <TextField label="Why reject this List?" value={reason} onChange={(v) => { setReason(v); setRefusal(null) }} size="compact" autoFocus />
              <FormError message={refusal} />
            </div>
          ) : (
            place?.node
          )}
        </>
      )}
    </>
  )

  const actions: BenchActions | undefined = locked
    ? onNext !== undefined
      ? { primary: <NextArrivalButton onNext={onNext} /> }
      : undefined
    : rejecting
      ? {
          note: 'Nothing on the schedule changes. The List leaves Intake with your reason.',
          secondary: (
            <Button variant="secondary" size="desktop" onClick={closeReject}>
              Cancel
            </Button>
          ),
          primary: (
            <Button variant="danger" size="desktop" onClick={reject} disabled={reason.trim() === ''} shot="intake-newlist-reject-confirm">
              Reject List
            </Button>
          ),
        }
      : {
          ...(place !== undefined ? { note: <span data-shot="intake-place-list-summary">{place.summary}</span> } : {}),
          secondary: (
            <Button variant="secondary" size="desktop" onClick={() => setRejecting(true)} shot="intake-newlist-reject">
              Reject this List
            </Button>
          ),
          ...(place !== undefined
            ? {
                primary: (
                  <Button variant="primary" size="desktop" onClick={place.submit} disabled={place.blockedBy !== undefined} disabledReason={place.blockedBy} shot="intake-place-list-submit">
                    {place.primaryLabel}
                  </Button>
                ),
              }
            : {}),
        }

  return <BenchLayout shot="intake-bench-newList" data-arrival-key={arrival.key} document={document} decision={decision} {...(actions !== undefined ? { actions } : {})} />
}
