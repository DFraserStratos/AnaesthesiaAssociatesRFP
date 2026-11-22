/**
 * The Add NHI sheet (catch-up Phase 40, item 12; US-11.1.4, US-11.1.5): a
 * desktop dialog (convention 16) on a row waiting for an NHI. The NHI field
 * checks live (`validateNhi` through `nhiRowPreview`), the preview line says
 * whether a record already holds it, a read-only table shows how the row's
 * details differ from that record, and the teal Add NHI runs
 * `addNhiToWaitingRow` (33a's one resolve path). No second patient is made.
 */

import { useEffect, useMemo, useState } from 'react'
import { addNhiToWaitingRow, nhiRowPreview, useAppStore, type Actor, type AddNhiResult, type WaitingNhiRow } from '../../../../store'
import { useSurface } from '../../../../shared'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { Button, FieldHint, FormError, Notice, TextAction, TextField } from '../../../../shared/ui'
import { formatDob, plural, shortDay } from '../../../../shared/format'
import { sessionText } from '../../../../domain/outOfHours'
import { neutral } from '../../../../theme/tokens'
import { DetailChoiceTable } from './patientParts'
import { nhiFieldCheck } from '../../../../shared/flows/nhiCopy'
import { AA_OFFICE, NHI_LOOKUP_COPY, NhiLookupStatus, NhiPurposeNote, useNhiHubLookup } from '../../../../shared/nhiHub'
import { detailDifferences } from '../../../../domain/patients'
import { useDemoTriggerContextWhile } from '../../../../shared/demoTriggers/context'

/** The register's name or date of birth for a typed NHI differs from the row's (catch-up Phase 40a): a mild line, never a block. */
export const REGISTER_DIFFERS_LINE = 'The register has a different name or date of birth for this NHI. Check before adding.'


export function AddNhiSheet({
  row,
  actor,
  onClose,
  onOpenList,
  onOpenMatching,
}: {
  /** The row the sheet is open on; null closes it. */
  row: WaitingNhiRow | null
  actor: Actor
  onClose: () => void
  onOpenList: (listId: string) => void
  onOpenMatching: (rowId: string) => void
}) {
  const { Overlay } = useSurface()
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const [nhi, setNhi] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ result: AddNhiResult; row: WaitingNhiRow } | null>(null)
  const rowId = row?.rowId

  useEffect(() => {
    setNhi('')
    setError(null)
    setDone(null)
  }, [rowId])

  // Catch-up Phase 40a: a valid typed NHI is looked up on the register through the simulated Hub.
  const hub = useNhiHubLookup()
  useDemoTriggerContextWhile('nhiHub.inUse', true, row !== null && done === null)
  const check = nhiFieldCheck(nhi)
  const validNhi = check.valid ? nhi.trim().toUpperCase() : null
  const { lookup, reset } = hub
  useEffect(() => {
    if (validNhi !== null) lookup(validNhi)
    else reset()
  }, [validNhi, lookup, reset])

  const preview = useMemo(() => (rowId !== undefined && done === null ? nhiRowPreview({ intake, masters, schedule }, rowId, nhi) : null), [rowId, done, intake, masters, schedule, nhi])
  const typed = nhi.trim() !== ''
  const valid = typed && preview !== null && preview.invalidReason === undefined

  function add() {
    if (row === null) return
    const res = addNhiToWaitingRow(useAppStore, actor, row.rowId, nhi)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setError(null)
    setDone({ result: res.value, row })
  }

  const shown = done?.row ?? row
  return (
    <Overlay open={row !== null || done !== null} onClose={onClose}>
      <div data-shot="add-nhi-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={`Add the NHI for ${shown?.patientName ?? 'this patient'}`}
          description={shown !== null && shown !== undefined ? `${shortDay(shown.dateISO)} ${sessionText(shown.session)}, ${shown.hospital}${shown.surgeon !== undefined ? `, ${shown.surgeon}` : ''}` : undefined}
        />
        {done !== null ? (
          <AddedStep done={done} onOpenList={onOpenList} onOpenMatching={onOpenMatching} onClose={onClose} />
        ) : (
          <>
            <TextField
              label="NHI"
              mono
              autoFocus
              value={nhi}
              onChange={(v) => {
                setNhi(v)
                setError(null)
              }}
              shot="add-nhi-field"
              autoCapitalize="characters"
              spellCheck={false}
              autoComplete="off"
              invalid={check.invalid}
              {...(check.tone !== undefined ? { hintTone: check.tone } : {})}
              hint={check.hint}
            />
            {validNhi !== null && (
              <NhiLookupStatus
                state={hub.state}
                manualEntry={false}
                onStopWaiting={hub.cancel}
                onRetry={hub.retry}
                found={(s) => NHI_LOOKUP_COPY.onRegister(s.person.name, s.person.dobISO)}
              />
            )}
            {/* A mild caution, never a block: the register's name or DOB differs from the row's (Phase 40's comparison rules). */}
            {validNhi !== null &&
              hub.state.status === 'found' &&
              shown !== null &&
              shown !== undefined &&
              detailDifferences(
                { name: shown.patientName, ...(shown.dobISO !== undefined ? { dobISO: shown.dobISO } : {}) },
                { name: hub.state.person.name, dobISO: hub.state.person.dobISO },
              ).length > 0 && (
                <FieldHint tone="warning" shot="add-nhi-register-differs">{REGISTER_DIFFERS_LINE}</FieldHint>
              )}
            <NhiPurposeNote practitioner={AA_OFFICE} />
            {valid && preview !== null && (
              <p data-shot="add-nhi-preview" role="status" style={{ margin: 0, fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
                {preview.existing === undefined
                  ? 'No record holds this NHI: a new patient record is made when you decide this row.'
                  : (
                    <>
                      Matches {preview.existing.name}, born{' '}
                      {preview.existing.dobISO === '' ? formatDob('') : <span className="mono">{formatDob(preview.existing.dobISO)}</span>}, {plural(preview.existing.bookingCount, 'earlier Booking')}. The row uses this record; no second one is made.
                    </>
                  )}
              </p>
            )}
            {valid && preview !== null && preview.differences.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12.5, color: neutral.slate }}>The row's details differ from the record. They are held for review when the row is decided.</span>
                <DetailChoiceTable rows={preview.differences} recordHeader="On the record" incomingHeader="On the row" shot="add-nhi-differences" />
              </div>
            )}
            <FormError message={error} />
            <SheetActions
              secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
              primary={
                <Button variant="primary" size="desktop" block onClick={add} disabled={!valid} disabledReason={!valid ? 'Type a valid NHI to add it.' : undefined} shot="add-nhi-save">
                  Add NHI
                </Button>
              }
            />
          </>
        )}
      </div>
    </Overlay>
  )
}

function AddedStep({
  done,
  onOpenList,
  onOpenMatching,
  onClose,
}: {
  done: { result: AddNhiResult; row: WaitingNhiRow }
  onOpenList: (listId: string) => void
  onOpenMatching: (rowId: string) => void
  onClose: () => void
}) {
  const { result, row } = done
  if (result.kind === 'resolved') {
    return (
      <>
        <Notice tone="success" live="status" shot="add-nhi-done">
          Added. The Booking is on {row.surgeon !== undefined ? `${row.surgeon}'s` : 'its'} List in the stub's place.
        </Notice>
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Done</Button>}
          primary={<Button variant="primary" size="desktop" block onClick={() => onOpenList(result.listId)}>Open List</Button>}
        />
      </>
    )
  }
  return (
    <>
      <Notice tone="neutral" live="status">{result.kind === 'needsDecision' ? result.reason : 'The row is decided.'}</Notice>
      <span style={{ display: 'flex', gap: 14 }}>
        <TextAction size="md" flush onClick={() => onOpenMatching(row.rowId)}>Open on matching</TextAction>
        <TextAction size="md" flush onClick={onClose}>Close</TextAction>
      </span>
    </>
  )
}
