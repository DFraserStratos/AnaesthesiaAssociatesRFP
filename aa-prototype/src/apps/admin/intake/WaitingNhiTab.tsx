/**
 * Intake · Waiting for NHI (`/admin/intake/waiting`; US-11.1.5, US-11.1.4,
 * US-02.1.4; D99): the intake rows waiting for an NHI, on their own tab beside
 * Matching. The view is Patients' Waiting for NHI moved here unchanged; the
 * rows count once, in Intake's attention count (`matchingAttentionCount`).
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, waitingNhiRows, type Actor } from '../../../store'
import { WaitingNhiView } from './WaitingNhiView'

/** The slices `waitingNhiRows` reads, picked one by one so a render only follows what changed. */
export function useWaitingNhiRows() {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const audit = useAppStore((s) => s.audit)
  return useMemo(() => waitingNhiRows({ intake, masters, schedule, clock, audit }), [intake, masters, schedule, clock, audit])
}

export function WaitingNhiTab({ actor, onOpenList }: { actor: Actor; onOpenList: (listId: string) => void }) {
  const rows = useWaitingNhiRows()
  const navigate = useNavigate()
  return (
    <WaitingNhiView
      rows={rows}
      actor={actor}
      onOpenList={onOpenList}
      onOpenMatching={(rowId) => navigate('/admin/intake/matching', { state: { selectRowId: rowId } })}
    />
  )
}
