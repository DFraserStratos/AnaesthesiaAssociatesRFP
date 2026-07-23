import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { editProcedure, useAppStore, type Actor } from '../../store'
import { TextArea } from '../ui'
import { CaptureSection, Caption } from './ui'

interface NotesCardProps {
  procedure: Procedure
  actor: Actor
  canCapture: boolean
  onError: (message: string) => void
}

/**
 * The legacy Outcome panel's Int Notes / Op Notes, committed on blur when
 * changed (free text never writes per keystroke — the capture-UX decision).
 */
export function NotesCard({ procedure, actor, canCapture, onError }: NotesCardProps) {
  const [intNotes, setIntNotes] = useState(procedure.intNotes ?? '')
  const [opNotes, setOpNotes] = useState(procedure.opNotes ?? '')

  useEffect(() => {
    setIntNotes(procedure.intNotes ?? '')
    setOpNotes(procedure.opNotes ?? '')
  }, [procedure.id, procedure.intNotes, procedure.opNotes])

  function commit(field: 'intNotes' | 'opNotes', value: string, stored: string | undefined) {
    if (value === (stored ?? '')) return
    const outcome = editProcedure(useAppStore, actor, procedure.id, {
      [field]: value.trim() === '' ? undefined : value,
    })
    if (!outcome.ok) onError(outcome.message)
  }

  if (!canCapture) {
    return (
      <CaptureSection label="Notes" gap={10}>
        <Caption color={procedure.intNotes !== undefined ? neutral.slate : neutral.mist}>
          Int notes: {procedure.intNotes ?? 'none'}
        </Caption>
        <Caption color={procedure.opNotes !== undefined ? neutral.slate : neutral.mist}>
          Op notes: {procedure.opNotes ?? 'none'}
        </Caption>
      </CaptureSection>
    )
  }

  return (
    <CaptureSection label="Notes" gap={12}>
      <TextArea
        label="Int notes"
        value={intNotes}
        onChange={setIntNotes}
        onBlur={() => commit('intNotes', intNotes, procedure.intNotes)}
        placeholder="Internal notes for AA"
      />
      <TextArea
        label="Op notes"
        value={opNotes}
        onChange={setOpNotes}
        onBlur={() => commit('opNotes', opNotes, procedure.opNotes)}
        placeholder="Operation notes"
      />
    </CaptureSection>
  )
}
